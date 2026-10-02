// i18n layer: pseudocode aliases, structural keywords, menu labels and error messages for four languages.
// This layer is the most prone to "silent errors" — miss one word in the alias table and the user writes
// a variable name instead of a block; it compiles without error but the semantics change completely,
// so here "a synonymous rewrite must produce the same shape" is pinned down as an assertion.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile, PsError} from '../src/core/compiler.js';
import {aliasReference} from '../src/core/catalog.js';
import {LANGS, LANG_MENU_ORDER, uiDict, tIn, translateMessage, setLang, getLang, normalizeLang} from '../src/core/i18n.js';

// The language at module load is the default language when the app has no saved setting (later cases call setLang, so capture it first)
const BOOT_LANG = getLang();

test('the default language is English', () => {
  assert.equal(BOOT_LANG, 'en');
  assert.equal(setLang(null), 'en', 'setLang should keep the current language when given an invalid value');
  setLang(BOOT_LANG);
});

const EX = new URL('../examples/', import.meta.url);
const read = f => fs.readFileSync(new URL(f, EX), 'utf8');

function blocksOf (src, lang) {
  const out = compile(src, {lang});
  const byOp = {};
  for (const target of out.targets) {
    for (const b of Object.values(target.blocks)) byOp[b.opcode] = (byOp[b.opcode] || 0) + 1;
  }
  return {out, byOp};
}

test('the same logic written in four languages compiles to exactly the same block shapes', () => {
  const files = {
    'zh-Hans': 'hello-zh-Hans.pseudo',
    'zh-Hant': 'hello-zh-Hant.pseudo',
    en: 'hello-en.pseudo',
    ja: 'hello-ja.pseudo'
  };
  const seen = {};
  for (const [lang, file] of Object.entries(files)) {
    const {out, byOp} = blocksOf(read(file), lang);
    assert.equal(out.totalBlocks, 50, `${file} should have 50 blocks, got ${out.totalBlocks}`);
    seen[lang] = JSON.stringify(Object.entries(byOp).sort());
  }
  const base = seen['zh-Hans'];
  for (const [lang, shape] of Object.entries(seen)) {
    assert.equal(shape, base, `${lang} opcode histogram differs from Simplified Chinese`);
  }
});

// Fields that carry identifiers: their values change with the language (分数 / score), so mask them when comparing.
const ID_FIELDS = new Set(['VARIABLE', 'LIST', 'BROADCAST_OPTION', 'COSTUME', 'BACKDROP', 'SOUND_MENU']);

// Structural fingerprint: keep only opcodes, raw menu values, numeric literals and subtree shapes;
// identifiers are always written as <id>. Raw menu values (front / last / abs / up arrow / all…) are
// language-independent, so they must be strictly equal here; the moment an alias maps to a different
// value under some language, the fingerprint immediately differs.
function fingerprint (out) {
  const lines = [];
  for (const t of out.targets) {
    const blocks = t.blocks;
    const expr = v => {
      if (v == null) return '<empty>';
      if (typeof v === 'number') return String(v);
      if (typeof v === 'string') return '<str>';
      if (!Array.isArray(v)) return '<obj>';
      // Variable/list primitives like [12, name, id] / [13, name, id]
      if (typeof v[0] === 'number' && v[0] >= 10 && v[0] <= 13) return '<id>';
      if (v.length === 2 && typeof v[0] === 'number') return expr(v[1]);
      return v.map(expr).join(',');
    };
    const block = (id, depth) => {
      const b = blocks[id];
      if (!b) return ' '.repeat(depth) + `<missing ${id}>`;
      const parts = [' '.repeat(depth) + b.opcode];
      for (const [k, f] of Object.entries(b.fields || {})) {
        parts.push(ID_FIELDS.has(k) ? `${k}=<id>` : `${k}=${JSON.stringify(f[0])}`);
      }
      for (const [k, inp] of Object.entries(b.inputs || {})) {
        const ref = inp[1];
        const shadow = inp[0] === 1 ? inp[1] : inp[0] === 3 ? inp[2] : null;
        if (typeof ref === 'string' && blocks[ref]) {
          parts.push(`\n${' '.repeat(depth + 2)}${k}:`);
          parts.push(block(ref, depth + 4));
        } else if (Array.isArray(ref)) {
          parts.push(`${k}=${expr(ref)}`);
        } else {
          parts.push(`${k}=${shadow === null ? '<none>' : expr(shadow)}`);
        }
      }
      const mu = b.mutation;
      if (mu) {
        // Block names change with the language; keep only the argument type codes (%n / %s / %b) and the warp flag
        if (mu.proccode) parts.push(`proccode=<${String(mu.proccode).split(' ').slice(1).join(' ')}>`);
        if (mu.warp !== undefined) parts.push(`warp=${mu.warp}`);
        if (mu.argumentdefaults) parts.push(`argdefaults=${mu.argumentdefaults}`);
      }
      if (b.shadow) parts.push('<shadow>');
      return b.next ? parts.join(' ') + '\n' + block(b.next, depth) : parts.join(' ');
    };
    lines.push(`# target ${t.isStage ? 'stage' : 'sprite'} costumes=${t.costumes.length} vars=${Object.keys(t.variables).length}`);
    lines.push(...Object.keys(blocks).filter(id => blocks[id].topLevel).map(id => block(id, 1)).sort());
  }
  return lines.join('\n');
}

test('the English snake example and the Chinese example compile to isomorphic block trees', () => {
  const a = compile(read('snake-zh-Hans.pseudo'), {lang: 'zh-Hans'});
  const b = compile(read('snake-en.pseudo'), {lang: 'en'});
  assert.equal(b.totalBlocks, a.totalBlocks, 'both examples should have the same block count');
  assert.equal(fingerprint(b), fingerprint(a), 'the English example structural fingerprint differs from the Chinese example');
});

test('the in-app syntax cheat sheet compiles in all four languages', () => {
  // The cheat sheet is documentation users copy verbatim, so it has to survive the
  // compiler. It once carried three bugs at once: trailing `#` comments (the lexer only
  // accepts whole-line comments), a variable used without being declared, and an
  // English `<-` assignment operator that does not exist. This pins all three down.
  const counts = {};
  for (const lang of LANGS) {
    const out = compile(uiDict(lang)['ref.syntax.text'], {lang});
    assert.deepEqual(out.warnings, [], `${lang}: the syntax cheat sheet should compile without warnings`);
    counts[lang] = out.totalBlocks;
  }
  const base = counts[LANGS[0]];
  for (const [lang, n] of Object.entries(counts)) {
    assert.equal(n, base, `${lang} compiles to ${n} blocks, ${LANGS[0]} to ${base}`);
  }
});

test('aliases from the four languages can be mixed (aliases are additive)', () => {
  const src = [
    'スプライト ボール:',      // Japanese header
    '  变量 高さ = 180',        // Simplified declaration
    '  緑の旗:',                // Japanese hat
    '    如果 (高さ < 0):',     // Simplified C-shape
    '      隠す',               // Japanese statement
    '  當按鍵("空格"):',        // Traditional hat
    '    複製自己'              // Traditional statement
  ].join('\n');
  const {byOp} = blocksOf(src, 'zh-Hans');
  assert.equal(byOp.event_whenflagclicked, 1);
  assert.equal(byOp.control_if, 1);
  assert.equal(byOp.looks_hide, 1);
  assert.equal(byOp.event_whenkeypressed, 1);
  assert.equal(byOp.control_create_clone_of, 1);
});

test('dynamic menu: English edge / Japanese 端 both emit the editor-recognized _edge_', () => {
  for (const [lang, src] of [
    ['en', 'stage:\n  when green flag clicked:\n    if (touching("edge")):\n      hide\n'],
    ['ja', 'ステージ:\n  緑の旗:\n    もし (に触れた("端")):\n      隠す\n'],
    ['zh-Hant', '舞台:\n  綠旗:\n    如果 (碰到("邊緣")):\n      隱藏\n']
  ]) {
    const {out} = blocksOf(src, lang);
    const shadow = Object.values(out.targets[0].blocks).find(b => b.opcode === 'sensing_touchingobjectmenu');
    assert.ok(shadow, `${lang}: no dropdown block emitted`);
    assert.deepEqual(shadow.fields.TOUCHINGOBJECTMENU, ['_edge_'], `${lang}: menu value should be _edge_`);
  }
});

test('compiler messages are translated per language, Simplified Chinese is byte-for-byte unchanged (baseline of existing tests)', () => {
  const bad = '舞台:\n  绿旗:\n    未知量 ← 1\n';
  const zh = (() => { try { compile(bad, {lang: 'zh-Hans'}); } catch (e) { return e.message; } })();
  assert.equal(zh, '[第 3 行] 未声明的变量 "未知量"');

  const expect = {
    'zh-Hant': '[第 3 行] 未宣告的變數 "未知量"',
    en: '[line 3] Undeclared variable "未知量"',
    ja: '[3 行目] 宣言されていない変数 "未知量"'
  };
  for (const [lang, want] of Object.entries(expect)) {
    let msg = null;
    try { compile(bad, {lang}); } catch (e) { assert.ok(e instanceof PsError); msg = e.message; }
    assert.equal(msg, want, `${lang} message is wrong`);
  }
});

test('structural self-check problems are translated too', () => {
  const zh = translateMessage('zh-Hans', 'a: 没有造型');
  assert.equal(zh, 'a: 没有造型');
  assert.equal(translateMessage('en', 'a: 没有造型'), 'a: no costumes');
  assert.equal(translateMessage('ja', 'a: 没有造型'), 'a: コスチュームがありません');
  assert.equal(translateMessage('zh-Hant', 'a: 声音 喵 缺 rate'), 'a: 聲音 喵 缺少 rate');
});

test('the alias reference switches with the language and has no missing group/shape names', () => {
  for (const lang of LANGS) {
    const rows = aliasReference(lang);
    assert.ok(rows.length >= 90, `${lang}: too few entries`);
    for (const r of rows) {
      assert.ok(r.groupLabel && r.groupLabel !== '其他', `${lang}: ${r.op} has no group name`);
      assert.ok(r.kindLabel, `${lang}: ${r.op} has no shape name`);
      assert.ok(r.aliases.length, `${lang}: ${r.op} has no aliases in this language`);
    }
  }
  const zh = aliasReference('zh-Hans');
  assert.ok(zh.some(r => r.groupLabel === '画笔'), 'Simplified Chinese group names should stay Chinese');
  const ja = aliasReference('ja');
  assert.ok(ja.some(r => r.groupLabel === 'ペン'), 'Japanese group names should be Japanese');
  const en = aliasReference('en');
  assert.ok(en.some(r => r.groupLabel === 'Pen'), 'English group names should be English');
  // Group names never fall back to English (that would make "Pen" show up in the Simplified UI)
  assert.equal(zh.find(r => r.op === 'pen_stamp').groupLabel, '画笔');
});

test('UI strings are complete in all four languages with no missing keys', () => {
  const dicts = LANGS.map(l => uiDict(l));
  const keys = Object.keys(dicts[0]);
  for (let i = 1; i < dicts.length; i++) {
    for (const k of keys) {
      assert.ok(dicts[i][k] !== undefined && dicts[i][k] !== '', `${LANGS[i]} is missing string ${k}`);
    }
  }
  assert.equal(tIn('en', 'btn.save'), 'Save');
  assert.equal(tIn('ja', 'btn.save'), '保存');
  assert.equal(tIn('zh-Hant', 'btn.save'), '儲存');
  assert.ok(uiDict('ja')['ref.syntax.text'].includes('繰り返す'), 'the Japanese syntax reference should use Japanese wording');
});

test('language dropdown order: English/Japanese first, the two Chinese variants last', () => {
  assert.deepEqual(LANG_MENU_ORDER, ['en', 'ja', 'zh-Hans', 'zh-Hant']);
  // Must be a permutation of LANGS: no missing and no extra languages
  assert.deepEqual([...LANG_MENU_ORDER].sort(), [...LANGS].sort());
});

test('language code normalization', () => {
  assert.equal(normalizeLang('zh-TW'), 'zh-Hant');
  assert.equal(normalizeLang('zh_CN'), 'zh-Hans');
  assert.equal(normalizeLang('ja-JP'), 'ja');
  assert.equal(normalizeLang('en-US'), 'en');
  assert.equal(normalizeLang('xx'), null);
  assert.equal(setLang('ja'), 'ja');
  setLang('zh-Hans');
});
