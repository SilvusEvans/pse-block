// Pseudocode -> Scratch 3 block graph.  lexer + parser + emitter in one module.
import crypto from 'node:crypto';
import {OPS, HATS, GEN, EXT, MENU_SHADOW, FIELD_MENUS, INFIX_OPS, EXTENSION_FOR_OPCODE, matchAlias, aliasCandidates, verifyCatalog} from './catalog.js';
import {setLang, getLang, formatError, t} from './i18n.js';
import {KEYWORDS_I18N} from './aliases-i18n.js';

// Messages are written in Simplified Chinese throughout the compiler (that is the pseudocode
// language's native tongue and the existing tests' baseline); PsError translates them once at
// the exit according to the current language, so under Simplified Chinese they stay byte-for-byte.
export class PsError extends Error {
  constructor(msg, line) {
    super(formatError(getLang(), msg, line));
    this.name = 'PsError';
    this.line = line || 0;
    this.zhMessage = msg;
  }
}

const md5 = s => crypto.createHash('md5').update(String(s)).digest('hex');
const makeId = key => md5('pb:' + key).slice(0, 20);
const makeVarId = key => md5('vr:' + key).slice(0, 10);

/* ------------------------------- lexer ------------------------------- */

const PUNCT3 = ['...'];
const PUNCT2 = ['<=', '>=', '!=', '==', '←', '->', '::'];
const PUNCT1 = list => `(),.:[]<>+-*/%=<>{}!|&`.includes(list);
const WORD = /[\p{L}\p{N}_][\p{L}\p{N}_'.]*/yu;

export function lex(src) {
  const toks = [];
  const indents = [0];
  const lines = src.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (/^\s*(#|\/\/)/.test(raw) || !raw.trim()) return;
    const m = /^([ \t]*)/.exec(raw)[1];
    let col = 0;
    for (const ch of m) col += ch === '\t' ? 4 : 1;
    while (indents.length > 1 && col < indents[indents.length - 1]) {
      indents.pop();
      toks.push({t: 'dedent', line});
    }
    if (col > indents[indents.length - 1]) {
      indents.push(col);
      toks.push({t: 'indent', line});
    }
    let p = raw.length - 1;
    while (p >= 0 && /\s/.test(raw[p])) p--;
    let s = col;
    while (s <= p) {
      const c = raw[s];
      if (/\s/.test(c)) { s++; continue; }
      if (c === '"' || c === "'") {
        const q = c;
        let j = s + 1;
        let val = '';
        while (j <= p && raw[j] !== q) { val += raw[j]; j++; }
        if (j > p) throw new PsError(`字符串引号未闭合`, line);
        toks.push({t: 'str', v: val, line});
        s = j + 1;
        continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(raw[s + 1] || ''))) {
        const mm = /^[0-9]*\.?[0-9]*(e[-+]?[0-9]+)?/i.exec(raw.slice(s));
        toks.push({t: 'num', v: parseFloat(mm[0]), line});
        s += mm[0].length;
        continue;
      }
      WORD.lastIndex = s;
      const wm = WORD.exec(raw);
      if (wm && (/[a-zA-Z]/.test(wm[0][0]) || wm[0][0].charCodeAt(0) > 127)) {
        const w = wm[0].replace(/[.']+$/, '');
        toks.push({t: 'name', v: w, line});
        s += w.length;
        continue;
      }
      const three = PUNCT3.find(x => raw.startsWith(x, s));
      const two = three ? null : PUNCT2.find(x => raw.startsWith(x, s));
      const one = three || two ? null : raw[s];
      if (one && !PUNCT1(one)) throw new PsError(`无法识别的字符 "${one}"`, line);
      toks.push({t: 'punct', v: three || two || one, line});
      s += (three || two || one).length;
    }
    toks.push({t: 'nl', line});
  });
  toks.push({t: 'eof', line: lines.length});
  return toks;
}

/* ------------------------------- parser ------------------------------ */

class Reader {
  constructor(toks) {
    this.t = toks;
    this.i = 0;
  }
  get cur() { return this.t[this.i]; }
  next() { return this.t[this.i++]; }
  is(t, v) { const c = this.cur; return c.t === t && (v === undefined || c.v === v); }
  eat(t, v) { if (this.is(t, v)) { return this.next(); } return null; }
  expect(t, v, what) {
    const c = this.cur;
    if (c.t !== t || (v !== undefined && c.v !== v)) throw new PsError(`期望 ${what || v || t}，实际得到 ${describe(c)}`, c.line);
    return this.next();
  }
  skipNl() { while (this.is('nl')) this.next(); }
}

const describe = c => c.t === 'eof' ? '文件结尾' : c.t === 'nl' ? '换行'
  : c.t === 'indent' ? '缩进' : c.t === 'dedent' ? '退格' : `"${c.v}"`;

// Structural keywords: Simplified / Traditional / English / Japanese are all usable (additive, same as block aliases).
const HEAD_ALIASES = new Set(['角色', 'sprite', '舞台', 'stage', ...KEYWORDS_I18N.head]);
const VAR_ALIASES = new Set(['变量', 'var', '局部', '私有', 'private', ...KEYWORDS_I18N.var]);
const GLOBAL_ALIASES = new Set(['全局', 'global', ...KEYWORDS_I18N.global]);
const LIST_ALIASES = new Set(['列表', 'list', ...KEYWORDS_I18N.list]);
const DEF_ALIASES = new Set(['定义', 'def', ...KEYWORDS_I18N.def]);
// The 不刷新 (run without screen refresh / warp) modifier: written after the block name (and param list), before the colon.
const WARP_WORDS = new Set(['不刷新', '不刷新屏幕', '无刷新', 'warp', ...KEYWORDS_I18N.warp]);
const ELSE_ALIASES = new Set(['否则', 'else', ...KEYWORDS_I18N.else]);
const RETURNISH = new Set(['返回', 'return', ...KEYWORDS_I18N.returnish]);
// The genuinely-local declaration words (everything else is emitted as a stage-shared variable)
const LOCAL_WORDS = new Set(['局部', '私有', 'private', '區域', 'ローカル', 'プライベート']);
// Stage detection: 舞台 / stage / ステージ
const STAGE_RE = /舞台|ステージ|stage/i;
// The change-variable verbs (增加/减少/…) and the 减少 (decrease) side test
const CHANGE_VERBS = /增加|减少|減少|増やす|増加|減らす|減る|change/;
const NEG_VERBS = /减少|減少|減らす|減る/;
// Asset declarations. They belong at the target level, are not statements, and never enter the block graph.
const ASSET_ALIASES = new Map([
  ['造型', 'costume'], ['costume', 'costume'],
  ['背景', 'backdrop'], ['backdrop', 'backdrop'],
  ['声音', 'sound'], ['sound', 'sound'],
  ...Object.entries(KEYWORDS_I18N.assets)
]);

function parseProgram(toks) {
  const r = new Reader(toks);
  const doc = {targets: [], globals: [], lists: [], broadcasts: [], options: {}};
  const implicitStage = {name: 'Stage', isStage: true, items: []};
  let current = null;

  const ensureTarget = () => {
    if (!current) {
      current = implicitStage;
      doc.targets.push(implicitStage);
    }
    return current;
  };

  while (!r.is('eof')) {
    r.skipNl();
    if (r.is('eof')) break;
    const c = r.cur;
    if (c.t === 'name' && HEAD_ALIASES.has(c.v)) {
      const isStage = STAGE_RE.test(c.v);
      r.next();
      let name = isStage ? 'Stage' : 'Sprite1';
      if (r.is('name')) name = r.next().v;
      if (!isStage && !r.eat('punct', ':')) throw new PsError(`角色声明后需要冒号`, c.line);
      if (isStage) r.eat('punct', ':');
      current = {name, isStage, items: []};
      doc.targets.push(current);
      parseTargetBody(r, current, doc);
      continue;
    }
    if (c.t === 'name' && (GLOBAL_ALIASES.has(c.v))) {
      r.next();
      do {
        const nm = r.expect('name', undefined, '变量名').v;
        let init = null;
        if (r.eat('punct', '=') || r.eat('punct', '←')) init = parseExpr(r);
        doc.globals.push({name: nm, init, line: c.line});
      } while (r.eat('punct', ','));
      continue;
    }
    if (c.t === 'name' && c.v === '#meta') { r.next(); continue; }
    const body = parseBodyItem(r, ensureTarget(), doc);
    if (!body) throw new PsError(`无法开始的语句 ${describe(c)}`, c.line);
  }
  if (!doc.targets.length) {
    doc.targets.push(implicitStage);
  }
  return doc;
}

function parseTargetBody(r, target, doc) {
  r.skipNl();
  if (r.is('indent')) {
    r.next();
    for (;;) {
      r.skipNl();
      if (r.is('dedent') || r.is('eof')) break;
      if (r.is('indent')) throw new PsError(`上一行不是块语句，下面不应有缩进`, r.cur.line);
      if (!parseBodyItem(r, target, doc)) throw new PsError(`无法开始的语句 ${describe(r.cur)}`, r.cur.line);
    }
    r.eat('dedent');
  }
  r.skipNl();
}

function parseBodyItem(r, target, doc) {
  const c = r.cur;
  if (c.t !== 'name') {
    if (c.t === 'punct' && c.v === ':') { r.next(); return true; }
    return null;
  }
  const word = c.v;
  if (VAR_ALIASES.has(word) || LIST_ALIASES.has(word)) {
    r.next();
    const isList = LIST_ALIASES.has(word);
    const items = [];
    do {
      const nm = r.expect('name', undefined, '变量名').v;
      let init = '';
      if (!isList && (r.eat('punct', '=') || r.eat('punct', '←'))) init = parseExpr(r);
      items.push({name: nm, init, scope: LOCAL_WORDS.has(word) ? 'local' : 'global-ish', line: c.line, isList});
    } while (r.eat('punct', ','));
    for (const it of items) {
      if (isList) target.items.push({t: 'list', ...it});
      else target.items.push({t: 'var', ...it});
    }
    r.skipNl();
    return true;
  }
  if (ASSET_ALIASES.has(word)) {
    const kind = ASSET_ALIASES.get(word);
    r.next();
    const files = [];
    for (;;) {
      const s = r.cur;
      if (s.t !== 'str') break;
      r.next();
      if (!s.v.trim()) throw new PsError(`${word} 的路径不能为空`, s.line);
      files.push({path: s.v.trim(), line: s.line});
      if (!r.eat('punct', ',')) break;
    }
    if (!files.length) throw new PsError(`${word} 后面需要引号里的文件路径，例如 ${word} "assets/cat.svg"`, c.line);
    if (kind === 'backdrop' && !target.isStage) throw new PsError(`背景 只能用在舞台里，角色请用 造型`, c.line);
    target.items.push({t: 'asset', kind, files, line: c.line});
    r.skipNl();
    return true;
  }
  if (DEF_ALIASES.has(word)) {
    r.next();
    const name = r.expect('name', undefined, '自定义块名').v;
    const params = [];
    if (r.eat('punct', '(')) {
      if (!r.is('punct', ')')) {
        do {
          const pn = r.expect('name', undefined, '参数名').v;
          let ptype = 'num';
          if (r.eat('punct', ':')) {
            const tn = r.expect('name', undefined, '参数类型').v;
            ptype = /布尔|bool/i.test(tn) ? 'bool' : /文本|str|text/i.test(tn) ? 'str' : 'num';
          }
          params.push({name: pn, type: ptype});
        } while (r.eat('punct', ','));
      }
      r.expect('punct', ')', ')');
    }
    // 不刷新 (warp): the whole block runs to completion within a single frame, with no render
    // and no yield in between. Batch-stamp and list-rebuild operations — the ones that either
    // finish entirely or look broken — must enable it.
    let warp = false;
    if (r.is('name') && WARP_WORDS.has(r.cur.v)) {
      warp = true;
      r.next();
    }
    r.expect('punct', ':', ':');
    const body = parseBlock(r, {procName: name, params, doc, target});
    target.items.push({t: 'proc', name, params, warp, body, line: c.line});
    return true;
  }
  // hats: alias from HATS table, longest match over name tokens
  const hat = matchHat(r);
  if (hat) {
    const spec = hat.spec;
    const args = hat.args;
    r.expect('punct', ':', ':');
    const body = parseBlock(r, {doc, target});
    target.items.push({t: 'hat', op: spec.op || hat.key, spec, args, body, line: c.line});
    return true;
  }
  const stmt = parseStmt(r, {doc, target});
  if (stmt) { target.items.push(stmt); return true; }
  return null;
}

function matchHat(r) {
  const start = r.i;
  if (!r.is('name')) return null;
  for (let words = 5; words >= 1; words--) {
    const slice = [];
    let j = start;
    let ok = true;
    for (let k = 0; k < words; k++) {
      if (r.t[j] && r.t[j].t === 'name') slice.push(r.t[j].v);
      else { ok = false; break; }
      j++;
    }
    if (!ok) continue;
    const m = matchAlias('hat', slice);
    if (m) {
      r.i = j;
      const args = parseHatArgs(r, m.spec);
      return {...m, args};
    }
  }
  return null;
}

// Argument positions align 1:1 with spec.params (field slots included), so
// `当收到("消息1"):` lands the name in the BROADCAST_OPTION field.
function parseHatArgs(r, spec) {
  const params = spec.params || [];
  const args = new Array(params.length).fill(null);
  if (r.is('punct', '(')) {
    r.next();
    let i = 0;
    if (!r.is('punct', ')')) {
      do {
        const a = parseExpr(r);
        const ptype = String((params[i] || [])[1] || '');
        // Quoted hat arguments get flattened into names, but menus like 造型/背景/声音
        // (costume/backdrop/sound) only accept the quoted name; bare words must be left for
        // variable/reporter resolution, so str is preserved here.
        const quotedMenu = ptype.startsWith('menu:') && MENU_SHADOW[ptype.slice(5)] && MENU_SHADOW[ptype.slice(5)].quoted;
        args[i++] = a.t === 'str' && !quotedMenu ? {t: 'name', v: a.v} : a;
      } while (i < params.length && r.eat('punct', ','));
    }
    r.expect('punct', ')', ')');
    if (i !== params.length) throw new PsError(`事件帽子需要 ${params.length} 个参数，实际给了 ${i}`, r.cur.line);
    return args;
  }
  params.forEach((p, i) => {
    if (p[0].startsWith('@')) throw new PsError(`${spec.op || '事件'} 的 ${p[0]} 必须写在括号里`, r.cur.line);
    args[i] = parseExpr(r);
  });
  return args;
}

// Extract a bare identifier-ish value from a parsed argument (for fields/menus).
function nameOf(arg) {
  if (!arg) return null;
  if (arg.t === 'name' || arg.t === 'str' || arg.t === 'ident') return arg.v;
  if (arg.t === 'num') return String(arg.v);
  if (arg.t === 'rep' && arg.args.length === 0 && arg.spec.params.length === 0) return null;
  return null;
}

// Strict menus (the ones whose options came from the extension sources) reject unknown names:
// writing them through would land a bogus value in the field, which the VM casts to 0.
function menuValue(menuKind, raw, slotName, line) {
  const menu = MENU_SHADOW[menuKind];
  if (!menu) throw new PsError(`未知菜单类型 ${menuKind}`, line);
  if (raw === null) throw new PsError(`${slotName} 处应为菜单选项名称`, line);
  if (menu.values && Object.prototype.hasOwnProperty.call(menu.values, raw)) return menu.values[raw];
  if (menu.strict) throw new PsError(`${slotName} 没有选项 "${raw}"，可选：${menu.labels.join('、')}`, line);
  return raw;
}

function parseBlock(r, ctx) {
  r.expect('nl', undefined, '换行');
  if (!r.is('indent')) throw new PsError(`块内容需要缩进`, r.cur.line);
  r.next();
  const list = [];
  for (;;) {
    r.skipNl();
    if (r.is('dedent') || r.is('eof')) break;
    const item = parseStmt(r, ctx);
    if (!item) throw new PsError(`无法解析的语句 ${describe(r.cur)}`, r.cur.line);
    list.push(item);
  }
  r.eat('dedent');
  return list;
}

const ELSE_OR_END = t => t.t === 'name' && ELSE_ALIASES.has(t.v);

function parseStmt(r, ctx) {
  const c = r.cur;
  if (c.t !== 'name') {
    throw new PsError(`语句应以名称开始，实际是 ${describe(c)}`, c.line);
  }
  const startLine = c.line;

  // multi-word alias, longest first
  const tryAlias = kind => {
    const save = r.i;
    for (let words = 5; words >= 1; words--) {
      const slice = [];
      let j = r.i;
      let ok = true;
      for (let k = 0; k < words; k++) {
        if (r.t[j] && r.t[j].t === 'name') slice.push(r.t[j].v);
        else { ok = false; break; }
        j++;
      }
      if (!ok) continue;
      const m = matchAlias(kind, slice);
      if (m) { r.i = j; return m; }
      r.i = save;
    }
    return null;
  };

  // assignment:  NAME (←|=) expr
  const n1 = r.t[r.i + 1];
  const n2 = r.t[r.i + 2];
  if (n1 && n1.t === 'punct' && (n1.v === '←' || (n1.v === '=' && !(n2 && n2.t === 'punct' && n2.v === '=')))) {
    const name = r.next().v;
    r.next();
    const value = parseExpr(r);
    return {t: 'setvar', name, value, line: startLine};
  }
  if (r.t[r.i + 1] && r.t[r.i + 1].t === 'name' && CHANGE_VERBS.test(r.t[r.i + 1].v)) {
    const name = r.next().v;
    const op = r.next().v;
    if (r.t[r.i] && r.t[r.i].t === 'name' && /^(by|按|だけ|ずつ)$/i.test(r.t[r.i].v)) r.next();
    const value = parseExpr(r);
    return {t: 'changevar', name, value, negative: NEG_VERBS.test(op), line: startLine};
  }

  // c-blocks and simple statements via alias table
  const cb = tryAlias('c');
  if (cb) {
    const spec = cb.spec;
    const args = parseArgList(r, spec);
    r.expect('punct', ':', ':');
    const body = parseBlock(r, ctx);
    let body2 = null;
    const saveI = r.i;
    r.skipNl();
    if (ELSE_OR_END(r.cur)) {
      r.next();
      r.expect('punct', ':', ':');
      body2 = parseBlock(r, ctx);
    } else {
      r.i = saveI;
    }
    const op = body2 ? 'control_if_else' : (spec.op || cb.key);
    return {t: 'cblock', op, spec: OPS[op] ? {...OPS[op], op} : spec, args, body, body2, line: startLine, forever: /永远|永遠|ずっと/.test(cb.alias)};
  }

  const st = tryAlias('stmt');
  if (st && !(r.is('punct', '←') || r.is('punct', '='))) {
    const spec = st.spec;
    if (r.is('punct', '(')) {
      const args = parseArgList(r, spec);
      return {t: 'stmt', op: spec.op || st.key, spec, args, line: startLine};
    }
    if ((spec.params || []).length === 0) return {t: 'stmt', op: spec.op || st.key, spec, args: [], line: startLine};
    if (spec.defaultArgs) return {t: 'stmt', op: spec.op || st.key, spec, args: spec.defaultArgs.slice(), line: startLine};
    // statement with a menu/field argument written without parens: 显示变量 高度 (show variable height)
    const args = [];
    for (const p of spec.params || []) {
      if (r.is('name')) args.push({t: 'name', v: r.next().v});
      else if (r.is('str')) args.push({t: 'name', v: r.next().v});
    }
    return {t: 'stmt', op: spec.op || st.key, spec, args, line: startLine};
  }

  // procedure call:  名字 (name)(ARGS)
  if (r.t[r.i + 1] && r.t[r.i + 1].t === 'punct' && r.t[r.i + 1].v === '(') {
    const name = r.next().v;
    const args = [];
    r.next();
    if (!r.is('punct', ')')) {
      do { args.push(parseExpr(r)); } while (r.eat('punct', ','));
    }
    r.expect('punct', ')', ')');
    return {t: 'call', name, args, line: startLine};
  }
  if (r.t[r.i + 1] && r.t[r.i + 1].t === 'punct' && r.t[r.i + 1].v === ':') {
    throw new PsError(`"${r.cur.v}" 不是可用的块名，也不是事件帽子或控制积木`, startLine);
  }

  // bare-word statement already covered; nothing matched
  return null;
}

function parseArgList(r, spec) {
  if (!r.is('punct', '(')) {
    if (spec.infix) return [];
    // allow "重复 永远" style without parens: no args
    return [];
  }
  r.next();
  const args = [];
  if (!r.is('punct', ')')) {
    do {
      args.push(parseExpr(r));
    } while (r.eat('punct', ','));
  }
  r.expect('punct', ')', ')');
  return args;
}

/* --------------------------- expression parser --------------------------- */

// 与/或 (and/or): Simplified 与·或, Traditional 與·或, English and·or, Japanese かつ·または
const KW_INFIX = {'与': 'and', '與': 'and', 'かつ': 'and', and: 'and', '或': 'or', 'または': 'or', or: 'or'};

function parseExpr(r) {
  return parseOr(r);
}
function parseOr(r) {
  let left = parseAnd(r);
  // The name forms of and/or are already consumed in parseAnd; only `|` is left here.
  while (r.is('punct', '|')) {
    r.next();
    left = {t: 'binop', op: '或', left, right: parseAnd(r)};
  }
  return left;
}
function parseAnd(r) {
  let left = parseCmp(r);
  while (r.is('name') && KW_INFIX[r.cur.v]) {
    const op = KW_INFIX[r.next().v] === 'or' ? '或' : '与';
    left = {t: 'binop', op, left, right: parseCmp(r)};
  }
  return left;
}
function parseCmp(r) {
  let left = parseAdd(r);
  if (r.is('punct') && ['<', '>', '=', '==', '!=', '<=', '>='].includes(r.cur.v)) {
    const op = r.next().v;
    left = {t: 'binop', op, left, right: parseAdd(r)};
    if (r.is('punct') && ['<', '>', '='].includes(r.cur.v)) throw new PsError(`不支持连续比较`, r.cur.line);
  }
  return left;
}
function parseAdd(r) {
  let left = parseMul(r);
  while (r.is('punct') && (r.cur.v === '+' || r.cur.v === '-')) {
    const op = r.next().v;
    left = {t: 'binop', op, left, right: parseMul(r)};
  }
  return left;
}
function parseMul(r) {
  let left = parseUnary(r);
  while (r.is('punct') && (r.cur.v === '*' || r.cur.v === '/' || r.cur.v === '%')) {
    const op = r.next().v;
    left = {t: 'binop', op, left, right: parseUnary(r)};
  }
  return left;
}
function parseUnary(r) {
  if (r.is('name') && /非|not|否定|ではない/.test(r.cur.v)) {
    r.next();
    return {t: 'not', operand: parseUnary(r)};
  }
  if (r.is('punct', '-')) {
    r.next();
    const inner = parseUnary(r);
    if (inner.t === 'num') return {t: 'num', v: -inner.v};
    return {t: 'binop', op: '-', left: {t: 'num', v: 0}, right: inner};
  }
  return parsePrimary(r);
}

const NO_ARG_REPORTERS = new Set([
  '计时器', 'timer', '答案', 'answer', '鼠标按下', '大小', 'size', '方向', 'x坐标', 'y坐标', '鼠标x', '鼠标y',
  '計時器', '滑鼠按下', '滑鼠x', '滑鼠y', 'x座標', 'y座標',
  'タイマー', '答え', 'マウスが押された', '大きさ', '向き', 'マウスのx座標', 'マウスのy座標'
]);

// Longest-alias match from the current position; mergeNum allows the first word to be a digit
// glued to a word (e.g. 2000年以来的天数 / days since 2000). On a failed match the read position
// is restored and the caller continues with ordinary tokens.
function tryReporter(r, mergeNum) {
  const save = r.i;
  const line = r.t[save].line;
  for (let words = 4; words >= 1; words--) {
    const slice = [];
    let j = save;
    let ok = true;
    for (let k = 0; k < words; k++) {
      const a = r.t[j];
      if (a && a.t === 'name') { slice.push(a.v); j++; continue; }
      const b = r.t[j + 1];
      if (k === 0 && mergeNum && a && a.t === 'num' && b && b.t === 'name') {
        slice.push(String(a.v) + b.v); j += 2; continue;
      }
      ok = false; break;
    }
    if (!ok) continue;
    const m = matchAlias('rep', slice);
    if (!m) continue;
    const after = r.t[j];
    const wantsArgs = (m.spec.params || []).length > 0;
    if (after && after.t === 'punct' && after.v === '(') {
      const args = [];
      r.i = j + 1;
      if (!r.is('punct', ')')) {
        do { args.push(parseExpr(r)); } while (r.eat('punct', ','));
      }
      r.expect('punct', ')', ')');
      return {t: 'rep', name: m.alias, key: m.key, spec: m.spec, args, line};
    }
    if (wantsArgs && !NO_ARG_REPORTERS.has(m.alias)) continue; // looks more like a bare variable
    r.i = j;
    return {t: 'rep', name: m.alias, key: m.key, spec: m.spec, args: [], line};
  }
  r.i = save;
  return null;
}

function parsePrimary(r) {
  const c = r.cur;
  if (c.t === 'num') {
    // Some Scratch labels start with a digit ("2000 年以来的天数" / days since 2000); the lexer splits them into num + name, so try to stitch them back together first.
    const nxt = r.t[r.i + 1];
    if (nxt && nxt.t === 'name') {
      const rep = tryReporter(r, true);
      if (rep) return rep;
    }
    r.next();
    return {t: 'num', v: c.v, line: c.line};
  }
  if (c.t === 'str') { r.next(); return {t: 'str', v: c.v, line: c.line}; }
  if (r.eat('punct', '(')) {
    const e = parseExpr(r);
    r.expect('punct', ')', ')');
    return e;
  }
  if (c.t === 'name') {
    const rep = tryReporter(r, false);
    if (rep) return rep;
    r.next();
    return {t: 'ident', v: c.v, line: c.line};
  }
  throw new PsError(`表达式位置不对，遇到 ${describe(c)}`, c.line);
}

/* ------------------------------- emitter ------------------------------- */

const PRIMITIVE = {num: 4, str: 10, color: 9, varv: 12, listv: 13, bcast: 11};

class TargetBuilder {
  constructor(decl, ctx) {
    this.decl = decl;
    this.ctx = ctx;
    this.blocks = {};
    this.variables = {};
    this.lists = {};
    this.broadcasts = {};
    this.procs = {};
    this.seq = 0;
    this.x = 80 + ctx.index * 420;
    this.y = 60;
  }
  addBlock(op, {inputs = {}, fields = {}, parent = null, topLevel = false, shadow = false, mutation = null, line = 0, key = ''}) {
    const id = makeId(`${this.decl.name}|${op}|${key}|${this.seq++}`);
    const b = {
      opcode: op,
      next: null,
      parent: topLevel ? null : parent,
      inputs,
      fields,
      shadow
    };
    if (topLevel) {
      b.topLevel = true;
      b.x = this.x;
      b.y = this.y;
      this.y += scriptHeight(op, inputs, this);
    } else {
      b.topLevel = false;
    }
    if (mutation) b.mutation = mutation;
    this.blocks[id] = b;
    this.ctx.stats[op] = (this.ctx.stats[op] || 0) + 1;
    const ext = extensionFor(op);
    if (ext) this.ctx.extensions.add(ext);
    return id;
  }
}

function scriptHeight() {
  return 400;
}

function extensionFor(op) {
  const ext = EXTENSION_FOR_OPCODE(op);
  return ext ? ext.id : null;
}

function catalogOf(op) {
  return GEN[op] || EXT[op] || null;
}

class Compiler {
  constructor(doc, opts = {}) {
    this.doc = doc;
    this.opts = opts;
    this.stats = {};
    this.extensions = new Set();
    this.warnings = [];
    this.errors = [];
    this.builders = [];
    this.globals = {};
    this.seq = 0;
  }

  run() {
    const problems = verifyCatalog();
    if (problems.length) throw new PsError('catalog 自检失败:\n  ' + problems.join('\n  '));
    const ctx = {index: 0, stats: this.stats, extensions: this.extensions, warnings: this.warnings};
    // Scratch requires targets[0] to be the stage, and it is the owner of globals/broadcasts.
    const decls = this.doc.targets;
    const stageAt = decls.findIndex(t => t.isStage);
    if (decls.filter(t => t.isStage).length > 1) throw new PsError(`只能有一个舞台`);
    if (stageAt > 0) decls.unshift(decls.splice(stageAt, 1)[0]);
    else if (stageAt < 0) decls.unshift({name: 'Stage', isStage: true, items: []});
    for (const decl of this.doc.targets) {
      ctx.index++;
      const tb = new TargetBuilder(decl, ctx);
      this.builders.push(tb);
      tb.decl = decl;
      tb.builder = tb;
      // declare data first so later scripts can reference them.
      // Scratch stores "for all sprites" data on the stage; 私有/局部 stays in the sprite.
      for (const it of decl.items) {
        if (it.t === 'var') this.declareVar(tb, it.name, it.init, it.scope !== 'local', it.line);
        if (it.t === 'list') this.declareList(tb, it.name, it.scope === 'local');
        if (it.t === 'proc') tb.procs[it.name] = {name: it.name, params: it.params, warp: it.warp, body: it.body, line: it.line, id: makeVarId(`${decl.name}:proc:${it.name}`)};
      }
      if (ctx.index === 1) {
        for (const g of this.doc.globals) this.declareVar(this.builders[0], g.name, g.init, true, g.line);
      }
    }
    // second pass: emit scripts
    for (let i = 0; i < this.doc.targets.length; i++) {
      const decl = this.doc.targets[i];
      const tb = this.builders[i];
      this.scopeTarget = tb;
      this.scopeDecl = decl;
      for (const it of decl.items) {
        if (it.t === 'hat') this.emitHat(tb, it);
        if (it.t === 'proc') this.emitProc(tb, it);
      }
    }
    return this.finish();
  }

  declareVar(tb, name, init, isGlobal, line) {
    const owner = isGlobal ? this.builders[0] : tb;
    const key = `${owner.decl.name}:${name}`;
    if (owner.variables[name]) {
      this.warnings.push(new PsError(`变量 "${name}" 重复声明`, line).message);
      return;
    }
    const id = makeVarId(key);
    owner.variables[name] = [id, name, isGlobal];
    this.globals[name] = {target: owner.decl.name, id, name};
    if (init && init.t) {
      owner.pendingInit = owner.pendingInit || [];
      owner.pendingInit.push({name, init, line, via: tb});
    }
  }
  declareList(tb, name, isLocal) {
    const owner = isLocal ? tb : this.builders[0];
    if (owner.lists[name]) {
      this.warnings.push(new PsError(`列表 "${name}" 重复声明`, 0).message);
      return;
    }
    const id = makeVarId(`${owner.decl.name}:${name}`);
    owner.lists[name] = [id, name, []];
  }
  findList(name) {
    const tb = this.scopeTarget;
    return (tb && tb.lists[name]) || this.builders[0].lists[name] || null;
  }

  resolveVar(name) {
    const tb = this.scopeTarget;
    if (tb.variables[name]) return tb.variables[name];
    const stage = this.builders[0];
    if (stage.variables[name]) return stage.variables[name];
    for (const b of this.builders) if (b.lists[name]) return b.lists[name];
    if (tb.lists[name]) return tb.lists[name];
    if (stage.lists[name]) return stage.lists[name];
    return null;
  }

  emitHat(tb, it) {
    const fields = {};
    const inputs = {};
    const params = it.spec.params || [];
    params.forEach((p, i) => {
      const isField = p[0].startsWith('@');
      const fname = isField ? p[0].slice(1) : p[0];
      const arg = it.args ? it.args[i] : null;
      if (isField) fields[fname] = this.fieldValue(tb, p, fname, arg, it.line);
      else inputs[fname] = this.emitSlot(tb, p, arg, null, it.line);
    });
    const id = tb.addBlock(it.op, {inputs, fields, topLevel: true, key: 'hat' + it.line, line: it.line});
    this.linkChildren(tb, id, inputs);
    const first = this.emitSeq(tb, it.body, id, {});
    tb.blocks[id].next = first;
  }

  fieldValue(tb, p, fname, arg, line) {
    const raw = nameOf(arg);
    if (raw === null) throw new PsError(`字段 ${fname} 需要名称或文本`, line);
    if (p[1] === 'broadcast') return [raw, this.ensureBroadcast(tb, raw)];
    if (p[1] === 'var') {
      const v = this.resolveVar(raw);
      if (!v) throw new PsError(`未声明的变量 "${raw}"`, line);
      return [v[1], v[0]];
    }
    if (p[1] === 'list') {
      const l = tb.lists[raw] || this.builders[0].lists[raw];
      if (!l) throw new PsError(`未声明的列表 "${raw}"`, line);
      return [l[1], l[0]];
    }
    if (String(p[1]).startsWith('menu:')) {
      const menuKind = String(p[1]).slice(5);
      const menu = MENU_SHADOW[menuKind];
      if (menu && menu.field !== fname && !menu.isField) throw new PsError(`菜单字段名不匹配: ${fname} vs ${menu.field}`, line);
      return [menuValue(menuKind, raw, fname, line)];
    }
    const map = FIELD_MENUS[p[1]];
    return [map ? map[raw] ?? raw : raw];
  }

  ensureBroadcast(tb, name) {
    const stage = this.builders[0];
    for (const b of this.builders) {
      for (const [id, nm] of Object.entries(b.broadcasts)) if (nm === name) return id;
    }
    const id = makeVarId('bc:' + name);
    stage.broadcasts[id] = name;
    return id;
  }

  emitProc(tb, it) {
    const proc = tb.procs[it.name];
    // mutation.warp is the string 'true'/'false': the sequencer JSON.parse()s it.
    const warp = it.warp ? 'true' : 'false';
    const argIds = proc.params.map((p, i) => makeVarId(`${tb.decl.name}:proc:${it.name}:a${i}`));
    proc.argIds = argIds;
    proc.argByName = {};
    proc.params.forEach((p, i) => { proc.argByName[p.name] = {name: p.name, type: p.type, id: argIds[i]}; });
    proc.proccode = `${it.name}${proc.params.map(p => ' ' + (p.type === 'bool' ? '%b' : p.type === 'str' ? '%s' : '%n')).join('')}`;
    const protoInputs = {};
    // prototype block, then definition hat, then body
    const protoId = tb.addBlock('procedures_prototype', {
      shadow: true,
      key: 'proto:' + it.name,
      mutation: {
        tagName: 'mutation',
        children: [],
        proccode: proc.proccode,
        argumentnames: JSON.stringify(proc.params.map(p => p.name)),
        argumentids: JSON.stringify(argIds),
        argumentdefaults: JSON.stringify(proc.params.map(() => '')),
        warp
      }
    });
    tb.blocks[protoId].topLevel = false;
    const defId = tb.addBlock('procedures_definition', {
      inputs: {custom_block: [1, protoId]},
      topLevel: true,
      key: 'def:' + it.name,
      mutation: {
        tagName: 'mutation',
        children: [],
        proccode: proc.proccode,
        argumentnames: JSON.stringify(proc.params.map(p => p.name)),
        argumentids: JSON.stringify(argIds),
        argumentdefaults: JSON.stringify(proc.params.map(() => '')),
        warp
      }
    });
    tb.blocks[protoId].parent = defId;
    proc.defId = defId;
    const scope = {proc, argIds};
    const first = this.emitSeq(tb, it.body, defId, scope);
    tb.blocks[defId].next = first;
  }

  emitSeq(tb, list, consumerId, scope) {
    let first = null;
    let prev = null;
    let afterCap = false;
    for (const it of list) {
      const id = this.emitOne(tb, it, scope);
      if (id === null) continue;
      const b = tb.blocks[id];
      if (prev) {
        // Blockly parents a statement to the block above it, so a stack hangs off
        // its predecessor and only its head points at the hat / C-block.
        tb.blocks[prev].next = id;
        b.parent = prev;
        b.topLevel = false;
        delete b.x;
        delete b.y;
      } else if (!afterCap) {
        b.parent = consumerId;
        b.topLevel = false;
        delete b.x;
        delete b.y;
        if (first === null) first = id;
      } else {
        // A cap block (永远/停止/删除克隆体) ends the stack; Scratch starts a new
        // script for whatever follows it, so the leftovers need their own position.
        b.topLevel = true;
        b.parent = null;
        b.x = tb.x;
        b.y = tb.y;
        tb.y += scriptHeight(b.opcode);
      }
      prev = id;
      if (isCap(b)) {
        prev = null;
        afterCap = true;
      }
    }
    return first;
  }

  emitOne(tb, it, scope) {
    const line = it.line || 0;
    const proc = scope && scope.proc || null;
    switch (it.t) {
      case 'setvar': {
        const v = this.resolveVar(it.name);
        if (!v) throw new PsError(`未声明的变量 "${it.name}"`, line);
        if (this.findList(it.name)) throw new PsError(`"${it.name}" 是列表，请用列表积木`, line);
        const id = tb.addBlock('data_setvariableto', {
          fields: {VARIABLE: [v[1], v[0]]},
          inputs: {VALUE: this.emitSlot(tb, ['VALUE', 'any'], it.value, proc, line)},
          key: 'set' + line,
          line
        });
        return this.linkChildren(tb, id, tb.blocks[id].inputs);
      }
      case 'changevar': {
        const v = this.resolveVar(it.name);
        if (!v) throw new PsError(`未声明的变量 "${it.name}"`, line);
        let payload = this.emitSlot(tb, ['VALUE', 'num'], it.value, proc, line);
        if (it.negative) {
          const negId = tb.addBlock('operator_subtract', {
            inputs: {NUM1: [1, [PRIMITIVE.num, 0]], NUM2: payload},
            key: 'neg' + line, line
          });
          this.linkChildren(tb, negId, tb.blocks[negId].inputs);
          payload = [2, negId];
        }
        const id = tb.addBlock('data_changevariableby', {
          fields: {VARIABLE: [v[1], v[0]]},
          inputs: {VALUE: payload},
          key: 'chg' + line, line
        });
        return this.linkChildren(tb, id, tb.blocks[id].inputs);
      }
      case 'stmt':
      case 'cblock':
      case 'call':
        return this.emitCall(tb, it, scope, line);
      default:
        throw new PsError(`内部错误: 未知语句类型 ${it.t}`, line);
    }
  }

  emitCall(tb, it, scope, line) {
    if (it.t === 'call') {
      const proc = this.findProc(tb, it.name);
      if (!proc) throw new PsError(`未定义的自定义块 "${it.name}"`, line);
      return this.emitProcCall(tb, proc, it.args, scope, line);
    }
    const op = it.op;
    const spec = it.spec;
    const proc = scope && scope.proc || null;
    const params = (spec.params || []);
    const inputs = {};
    const fields = {};
    let positional = 0;
    for (const p of params) {
      if (p[0].startsWith('@')) {
        const fname = p[0].slice(1);
        fields[fname] = this.fieldValue(tb, p, fname, it.args[positional], line);
        positional++;
        continue;
      }
      const arg = it.args[positional];
      if (arg === undefined && !spec.cblock && p[1] !== 'stop') {
        // missing argument tolerated only for zero-arity menu slots handled above
      }
      inputs[p[0]] = this.emitSlot(tb, p, arg, proc, line);
      positional++;
    }
    if (spec.sub) {
      const first = it.body ? this.emitSeq(tb, it.body, null, scope) : null;
      if (first) inputs[spec.sub] = [2, first];
    }
    if (it.body2) {
      const first2 = this.emitSeq(tb, it.body2, null, scope);
      if (first2) inputs.SUBSTACK2 = [2, first2];
    }
    const id = tb.addBlock(op, {inputs, fields, key: op + line, line});
    return this.linkChildren(tb, id, inputs);
  }

  // Point every block plugged into `inputs` back at its consumer.
  linkChildren(tb, id, inputs) {
    for (const slot of Object.values(inputs || {})) {
      if (slot && typeof slot[1] === 'string') this.reparent(tb, slot[1], id);
    }
    return id;
  }

  reparent(tb, id, parent) {    const b = tb.blocks[id];
    if (!b) return;
    b.parent = parent;
    if (b.topLevel) {
      b.topLevel = false;
      delete b.x;
      delete b.y;
    }
  }

  findProc(tb, name) {
    return tb.procs[name] || this.builders[0].procs[name] || null;
  }

  emitProcCall(tb, proc, args, scope, line) {
    if (args.length !== proc.params.length) throw new PsError(`"${proc.name}" 需要 ${proc.params.length} 个参数，实际 ${args.length}`, line);
    const inputs = {};
    proc.argIds.forEach((aid, i) => {
      inputs[aid] = this.emitSlot(tb, ['arg', proc.params[i].type], args[i], proc, line);
    });
    const id = tb.addBlock('procedures_call', {
      inputs,
      key: 'call:' + proc.name + line,
      line,
      mutation: {
        tagName: 'mutation',
        children: [],
        proccode: proc.proccode,
        argumentids: JSON.stringify(proc.argIds)
      }
    });
    for (const aid of Object.keys(inputs)) {
      const slot = inputs[aid];
      if (slot && typeof slot[1] === 'string') this.reparent(tb, slot[1], id);
    }
    return id;
  }
  // Build one serialized input slot from a slot spec + parsed arg.
  // Names the editor would show in the costume/sound menus: the file name without extension.
  mediaNames(tb, kind) {
    const names = [];
    for (const it of tb.decl.items) {
      if (it.t !== 'asset') continue;
      if ((it.kind === 'backdrop' ? 'costume' : it.kind) !== kind) continue;
      for (const f of it.files) names.push(String(f.path).split(/[\\/]/).pop().replace(/\.[^.]+$/, ''));
    }
    return names;
  }

  checkMediaName(tb, kind, value, line) {
    // Labels stay in Simplified Chinese (the message-template baseline); translation happens at the PsError exit.
    const label = kind === 'sound' ? '声音' : '造型';
    const names = this.mediaNames(tb, kind);
    if (names.length) {
      if (!names.includes(value)) {
        throw new PsError(`${label} "${value}" 没有被 ${label} 语句导入，可选：${[...new Set(names)].join('、')}`, line);
      }
      return;
    }
    const placeholder = kind === 'costume' ? (tb.decl.isStage ? 'backdrop1' : '造型1') : null;
    if (kind === 'costume' && value === placeholder) return;
    // Not importing the asset is not an error (a bare index may be intended), but the project really has no such name; a reminder beats staying silent.
    this.warnings.push(new PsError(kind === 'sound'
      ? `${tb.decl.name} 没有用 声音 导入素材，"${value}" 放不出来`
      : `${tb.decl.name} 没有用 造型 导入素材，工程里只有占位造型 ${placeholder}，没有 "${value}"`, line).message);
  }

  emitSlot(tb, [ /* name */ slotName, type], arg, proc, line) {
    const def = defaultSlotFor(type);
    if (arg === undefined || arg === null) return def;
    // name-valued slots (var/list/broadcast) come as {t:'name'} or quoted strings
    if (type === 'var' || type === 'list' || type === 'broadcast') {
      const raw = nameOf(arg);
      if (raw === null) throw new PsError(`${slotName} 处应为名称`, line);
      if (type === 'list') {
        const l = tb.lists[raw] || this.builders[0].lists[raw];
        if (!l) throw new PsError(`未声明的列表 "${raw}"`, line);
        return [1, [PRIMITIVE.listv, l[1], l[0]]];
      }
      if (type === 'broadcast') return [1, [PRIMITIVE.bcast, raw, this.ensureBroadcast(tb, raw)]];
      const v = this.resolveVar(raw);
      if (!v) throw new PsError(`未声明的变量 "${raw}"`, line);
      return [1, [PRIMITIVE.varv, v[1], v[0]]];
    }
    // Costume/sound/backdrop menus hold plain names: an unknown name compiles fine and then
    // silently matches nothing at run time, so compare it with what this target imports.
    if (slotName === 'COSTUME' || slotName === 'SOUND_MENU' || slotName === 'BACKDROP') {
      if (arg.t === 'str') {
        this.checkMediaName(tb, slotName === 'SOUND_MENU' ? 'sound' : 'costume', String(arg.v), line);
      }
    }
    if (type.startsWith('menu:')) {
      const menuKind = type.slice(5);
      const menu = MENU_SHADOW[menuKind];
      const raw = nameOf(arg);
      // 造型/背景/声音 (costume/backdrop/sound) menu options are file names; only the quoted
      // name belongs in the dropdown, while bare words (variables) and reporters are emitted as
      // ordinary expressions (the Scratch runtime accepts numbers too). Other menus (including
      // strict extension menus) have no expression form, so an unresolved option name is an error.
      const asExpr = menu.quoted ? arg.t !== 'str' : raw === null && !menu.strict;
      if (!asExpr) {
        const value = menuValue(menuKind, raw, slotName, line);
        // Menus whose shadow opcode has no definition in the sources we scanned are
        // emitted as a plain text input; the VM resolves args.<NAME> the same way.
        if (menu.isField || !menu.block) return [1, [PRIMITIVE.str, value]];
        // A broadcast menu field is [名字 (name), broadcast id], and the id must be registered in
        // stage.broadcasts for the editor to treat the message as pre-existing.
        const fieldValue = menuKind === 'broadcast' ? [value, this.ensureBroadcast(tb, value)] : [value];
        const shadowId = tb.addBlock(menu.block, {fields: {[menu.field]: fieldValue}, key: 'menu:' + menuKind + raw + line, line, shadow: true});
        return [1, shadowId];
      }
    }
    if (type === 'color' && arg.t === 'str') {
      const v = String(arg.v);
      if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new PsError(`${slotName} 处颜色需为 #RRGGBB 形式，实际 "${v}"`, line);
      return [1, [PRIMITIVE.color, v]];
    }
    const {payload, inferred} = this.emitExpr(tb, arg, proc, line);
    checkSlotType(slotName, type, inferred, line);
    if (payload === null) return def;
    if (Array.isArray(payload)) return [1, payload];
    return [2, payload];
  }

  emitExpr(tb, ast, proc, line) {
    switch (ast.t) {
      case 'num': return {payload: [PRIMITIVE.num, ast.v], inferred: 'num'};
      case 'str': return {payload: [PRIMITIVE.str, ast.v], inferred: 'str'};
      case 'not': {
        const {payload, inferred} = this.emitExpr(tb, ast.operand, proc, line);
        checkSlotType('OPERAND', 'bool', inferred, line);
        const id = tb.addBlock('operator_not', {
          inputs: {OPERAND: Array.isArray(payload) ? [1, payload] : [2, payload]},
          key: 'not' + line, line
        });
        if (typeof payload === 'string') this.reparent(tb, payload, id);
        return {payload: id, inferred: 'bool'};
      }
      case 'binop': {
        const info = INFIX_OPS[ast.op];
        if (!info) throw new PsError(`不支持的运算符 ${ast.op}`, line);
        const L = this.emitExpr(tb, ast.left, proc, line);
        const R = this.emitExpr(tb, ast.right, proc, line);
        const cat = catalogOf(info.op) || GEN.operator_add;
        const names = (cat && cat.inputs || []).filter(i => !i.stmt && i.name).map(i => i.name);
        if (info.op === 'operator_and' || info.op === 'operator_or') {
          checkSlotType(names[0], 'bool', L.inferred, line);
          checkSlotType(names[1], 'bool', R.inferred, line);
        }
        const inputs = {};
        names.slice(0, 2).forEach((n, i) => {
          const p = i === 0 ? L.payload : R.payload;
          inputs[n] = p === null ? defaultSlotFor('any') : Array.isArray(p) ? [1, p] : [2, p];
          if (typeof p === 'string') this.reparent(tb, p, 'pending');
        });
        const id = tb.addBlock(info.op, {inputs, key: 'bin' + line, line});
        for (const n of Object.keys(inputs)) {
          const slot = inputs[n];
          if (slot && typeof slot[1] === 'string' && slot[1] !== 'pending') this.reparent(tb, slot[1], id);
        }
        if (info.negate) {
          const nid = tb.addBlock('operator_not', {inputs: {OPERAND: [2, id]}, key: 'negwrap' + line, line});
          this.reparent(tb, id, nid);
          return {payload: nid, inferred: 'bool'};
        }
        return {payload: id, inferred: info.out};
      }
      case 'rep': {
        const spec = ast.spec;
        const op = spec.op || ast.key;
        const params = spec.params || [];
        const inputs = {};
        const fields = {};
        params.forEach((p, i) => {
          const arg = ast.args[i];
          if (p[0].startsWith('@')) {
            const fname = p[0].slice(1);
            // Fields always go through fieldValue: variables/lists need their id and menus need
            // the value from the sources; copying a shortcut here would emit 列表长度(...)
            // (length of list) as an id-less shape like ["队列"] (["queue"]).
            fields[fname] = this.fieldValue(tb, p, fname, arg, line);
            return;
          }
          const slot = this.emitSlot(tb, p, arg, proc, line);
          inputs[p[0]] = slot;
        });
        if (op === 'procedures_call' || op === 'procedures_callreturn') throw new PsError(`自定义块只能作为语句调用`, line);
        const id = tb.addBlock(op, {inputs, fields, key: 'rep' + line, line});
        for (const n of Object.keys(inputs)) {
          const slot = inputs[n];
          if (slot && typeof slot[1] === 'string') this.reparent(tb, slot[1], id);
        }
        return {payload: id, inferred: spec.out || 'any'};
      }
      case 'ident': {
        if (proc && proc.argByName[ast.v]) {
          const p = proc.argByName[ast.v];
          const id = tb.addBlock(p.type === 'bool' ? 'argument_reporter_boolean' : 'argument_reporter_string_number', {
            fields: {VALUE: [p.name, p.id]},
            key: 'arg:' + p.name + line, line
          });
          return {payload: id, inferred: p.type === 'bool' ? 'bool' : 'any'};
        }
        const v = this.resolveVar(ast.v);
        if (v) {
          const isList = !!(tb.lists[ast.v] || this.builders[0].lists[ast.v]);
          if (isList) return {payload: [PRIMITIVE.listv, v[1], v[0]], inferred: 'str'};
          return {payload: [PRIMITIVE.varv, v[1], v[0]], inferred: 'any'};
        }
        if (/^计时器$|^計時器$|^timer$|^タイマー$/i.test(ast.v)) return this.emitExpr(tb, {t: 'rep', name: '计时器', key: 'sensing_timer', spec: OPS.sensing_timer, args: []}, proc, line);
        throw new PsError(`未声明的变量 "${ast.v}"`, line);
      }
      default:
        throw new PsError(`内部错误：未知表达式 ${ast.t}`, line || ast.v);
    }
  }

  finish() {
    const targets = [];
    const stage = this.builders[0];
    const costume = this.opts.costumes || {};
    const assetSpecs = [];
    let order = 0;
    for (const tb of this.builders) {
      const isStage = tb.decl.isStage;
      for (const it of tb.decl.items) {
        if (it.t !== 'asset') continue;
        // kind 'backdrop' is just a costume on the stage; Scratch stores both in costumes[]
        assetSpecs.push({index: order, name: tb.decl.name, kind: it.kind === 'backdrop' ? 'costume' : it.kind, files: it.files, line: it.line});
      }
      const varsObj = {};
      for (const [name, [id]] of Object.entries(tb.variables)) varsObj[id] = [name, initValue(tb, name)];
      const listsObj = {};
      for (const [name, [id, nm, items]] of Object.entries(tb.lists)) listsObj[id] = [name, items];
      const bcObj = {};
      for (const [id, nm] of Object.entries(tb.broadcasts)) bcObj[id] = nm;
      // patch argument reporters' parent links to the procedure definition
      const target = {
        isStage,
        name: tb.decl.name,
        variables: varsObj,
        lists: listsObj,
        broadcasts: bcObj,
        blocks: tb.blocks,
        comments: {},
        currentCostume: 0,
        costumes: [],
        sounds: [],
        volume: 100,
        layerOrder: order++
      };
      if (isStage) Object.assign(target, {tempo: 60, videoTransparency: 50, videoState: 'on', textToSpeechLanguage: null});
      else Object.assign(target, {visible: true, x: tb.decl.x ?? 0, y: tb.decl.y ?? 0, size: 100, direction: 90, draggable: false, rotationStyle: 'all around'});
      targets.push(target);
    }
    return {
      targets,
      extensions: [...this.extensions],
      stats: this.stats,
      warnings: this.warnings,
      assetSpecs,
      totalBlocks: Object.values(this.stats).reduce((a, b) => a + b, 0)
    };
  }
}

function initValue(tb, name) {
  const [id, nm, isGlobal] = tb.variables[name];
  for (const t of tb.pendingInit || []) {
    if (t.name === name) {
      if (t.init.t === 'num') return t.init.v;
      if (t.init.t === 'str') return t.init.v;
    }
  }
  return isGlobal ? 0 : 0;
}

function defaultSlotFor(type) {
  if (type === 'num') return [1, [PRIMITIVE.num, 0]];
  if (type === 'str' || type === 'any' || type === 'soundname') return [1, [PRIMITIVE.str, '']];
  if (type === 'color') return [1, [PRIMITIVE.color, '#FF0000']];
  return null;
}

function checkSlotType(slotName, expected, inferred, line) {
  if (expected === 'bool') {
    if (inferred === 'num' || inferred === 'str') throw new PsError(`条件槽 ${slotName} 需要布尔(六边形)积木，但得到${inferred === 'num' ? '数字' : '文本'}`, line);
    return;
  }
  if (expected === 'num') {
    if (inferred === 'bool') throw new PsError(`数值槽 ${slotName} 不能插入布尔积木`, line);
    return;
  }
  if (expected === 'str') {
    if (inferred === 'bool') throw new PsError(`文本槽 ${slotName} 不能插入布尔积木`, line);
  }
}

function isCap(b) {
  return b.opcode === 'control_stop' || b.opcode === 'control_delete_this_clone' || b.opcode === 'control_forever';
}

export function compile(source, opts = {}) {
  // Message language: opts.lang wins, otherwise the current language is kept (the CLI/desktop sets it further out).
  if (opts.lang) setLang(opts.lang);
  const toks = lex(source);
  const doc = parseProgram(toks);
  // attach parameter name->id maps for emitExpr
  for (const t of doc.targets) for (const it of t.items) if (it.t === 'proc') it.argByName = Object.fromEntries(it.params.map(p => [p.name, p]));
  const c = new Compiler(doc, opts);
  const out = c.run();
  return {...out, doc};
}

export {verifyCatalog};
