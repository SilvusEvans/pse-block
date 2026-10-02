// Generate src/core/generated-extensions.json so extension block opcodes, inputs
// and ids are machine-verified instead of remembered. Three sources:
//   .ref/package/src/extensions  - scratch-vm built-ins (pen, music, ...)
//   .ref/turbowarp/*.js          - official TurboWarp extensions, cached by URL
//   .ref/l10n/zh-cn.json         - Scratch's own Chinese labels for menu options.
//     Refresh with: curl -L https://cdn.npmmirror.com/packages/scratch-l10n/<ver>/<tarball>
//     and take package/editor/extensions/zh-cn.json out of it.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VM_EXT_DIR = path.join(ROOT, '.ref', 'package', 'src', 'extensions');
const MANAGER = path.join(ROOT, '.ref', 'package', 'src', 'extension-support', 'extension-manager.js');
const TW_DIR = path.join(ROOT, '.ref', 'turbowarp');
const L10N = path.join(ROOT, '.ref', 'l10n', 'zh-cn.json');
const OUT = path.join(ROOT, 'src', 'core', 'generated-extensions.json');

const KIND = {COMMAND: 'statement', BOOLEAN: 'boolean', REPORTER: 'reporter', HAT: 'hat', C: 'c-block', SCOPED_C: 'c-block'};
const ARG_TYPE = {NUMBER: 'num', STRING: 'str', BOOLEAN: 'bool', COLOR: 'color', MATRIX: 'any', IMAGE: 'any', ANGLE: 'angle'};

function builtinIds () {
  const src = fs.readFileSync(MANAGER, 'utf8');
  const body = src.slice(src.indexOf('const builtinExtensions = {'));
  const ids = {};
  for (const m of body.matchAll(/^\s{4}([A-Za-z0-9_]+): \(\) => require\('\.\.\/extensions\/([a-z0-9_]+)'\),?$/gm)) {
    ids[m[2].replace(/^scratch3_/, '')] = m[1];
  }
  return ids;
}

// Pull the getInfo() object literal out of a scratch-vm extension module.
function getInfoBody (src) {
  const start = src.indexOf('getInfo (');
  if (start < 0) return null;
  const open = src.indexOf('{', src.indexOf('return {', start));
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(open, i + 1);
  }
  return null;
}

function blockChunks (body) {
  const start = body.indexOf('blocks: [');
  if (start < 0) return [];
  const region = body.slice(start);
  const hits = [];
  for (const m of region.matchAll(/opcode: (["'])([A-Za-z0-9_]+)\1/g)) hits.push({name: m[2], index: m.index});
  const chunks = [];
  for (let i = 0; i < hits.length; i++) {
    const next = i + 1 < hits.length ? region.indexOf('opcode:', hits[i + 1].index) : -1;
    chunks.push({opcode: hits[i].name, src: region.slice(hits[i].index, next < 0 ? region.length : next)});
  }
  return chunks;
}

function braceSpan (text, from) {
  const open = text.indexOf('{', from);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  return null;
}

function parseBlock (extId, opcode, chunk) {
  const blockType = /blockType: (?:Scratch\.)?BlockType\.([A-Z_]+)/.exec(chunk);
  const textMatch = /text: formatMessage\(\{\s*id: '[^']+',\s*default: '([^']*)'/.exec(chunk) ||
    /text: Scratch\.translate\("([^"]*)"/.exec(chunk);
  const args = [];
  const argStart = chunk.indexOf('arguments: {');
  const inner = argStart >= 0 ? braceSpan(chunk, argStart) : null;
  if (inner) {
    for (const m of inner.matchAll(/([A-Z][A-Z0-9_]*)\s*:\s*\{([^{}]*)\}/g)) {
      const type = /type: (?:Scratch\.)?ArgumentType\.([A-Z_]+)/.exec(m[2]);
      const menu = /menu: (["'])([A-Za-z0-9_]+)\1/.exec(m[2]);
      args.push({name: m[1], type: type ? ARG_TYPE[type[1]] || 'any' : 'any', menu: menu ? menu[2] : null});
    }
  }
  const order = textMatch ? [...textMatch[1].matchAll(/\[([A-Z][A-Z0-9_]*)\]/g)].map(m => m[1]) : args.map(a => a.name);
  const byName = new Map(args.map(a => [a.name, a]));
  const listed = [...order.map(n => byName.get(n)).filter(Boolean), ...args.filter(a => !order.includes(a.name))];
  return {
    ext: extId,
    opcode: `${extId}_${opcode}`,
    kind: (blockType && KIND[blockType[1]]) || 'statement',
    // A menu argument is NOT a field: the editor (checked against a running TurboWarp)
    // makes it a value input named after the argument, filled by a shadow block named
    // `<ext>_menu_<menuKey>` whose dropdown field is also named `<menuKey>`.
    inputs: listed.map(a => a.menu
      ? {name: a.name, type: a.type, menu: a.menu, shadow: `${extId}_menu_${a.menu}`, shadowField: a.menu}
      : {name: a.name, type: a.type}),
    fields: [],
    text: textMatch ? textMatch[1] : null
  };
}

const blocks = {};
const menus = {};
const skippedMenus = {};
const extMeta = {};
const warnings = [];

function zhLabels () {
  try { return JSON.parse(fs.readFileSync(L10N, 'utf8')); } catch { warnings.push('missing .ref/l10n/zh-cn.json, menu options only have English names'); return {}; }
}

// getInfo().menus declares the dropdowns; the option values are exactly what a real
// editor writes into the block field, so they cannot be guessed either.
function menuChunks (body) {
  const at = body.search(/^[ \t]+menus: \{$/m);
  if (at < 0) return [];
  const region = braceSpan(body, at);
  if (!region) return [];
  const hits = [];
  const lines = region.split('\n');
  let offset = 0;
  for (const line of lines) {
    const m = /^[ \t]+([A-Za-z_][A-Za-z0-9_]*): \{$/.exec(line);
    if (m) hits.push({name: m[1], start: offset});
    offset += line.length + 1;
  }
  return hits.map((h, i) => ({
    name: h.name,
    src: region.slice(h.start, i + 1 < hits.length ? hits[i + 1].start : region.length)
  }));
}

// `_buildMenu(this.X_INFO)` numbers the entries from 1, in source order.
function infoItems (src, getterName) {
  const start = src.indexOf(`get ${getterName} (`);
  if (start < 0) return null;
  const rest = src.slice(start);
  const end = rest.indexOf('\n    get ', 1);
  const items = [];
  for (const m of (end < 0 ? rest : rest.slice(0, end)).matchAll(/id: '([^']+)',\s*\n\s*default: '([^']*)'/g)) {
    items.push({id: m[1], en: m[2], value: String(items.length + 1)});
  }
  return items.length ? items : null;
}

function readMenus (extId, body, src, l10n) {
  const chunks = menuChunks(body);
  if (!chunks.length) return;
  const table = {};
  let skipped = 0;
  for (const c of chunks) {
    const built = /items: this\._buildMenu\(this\.([A-Z_]+)\)/.exec(c.src);
    // Other extensions build their dropdowns from device lists or async services, which a
    // static scan cannot resolve; those menus stay unwired rather than guessed.
    if (!built) { skipped++; continue; }
    const items = infoItems(src, built[1]);
    if (!items) { warnings.push(`${extId}: menu ${c.name}'s ${built[1]} could not be resolved`); continue; }
    table[c.name] = items.map(it => ({value: it.value, id: it.id, en: it.en, zh: l10n[it.id] || null}));
  }
  if (Object.keys(table).length) menus[extId] = table;
  if (skipped) skippedMenus[extId] = skipped;
}

const ids = builtinIds();
const l10n = zhLabels();
for (const dir of fs.readdirSync(VM_EXT_DIR).sort()) {
  const file = path.join(VM_EXT_DIR, dir, 'index.js');
  if (!fs.existsSync(file)) continue;
  const dirName = dir.replace(/^scratch3_/, '');
  const extId = ids[dirName] || dirName;
  const src = fs.readFileSync(file, 'utf8');
  const body = getInfoBody(src);
  if (!body) { warnings.push(`${dirName}: getInfo() not found`); continue; }
  extMeta[extId] = {url: null, builtin: Object.values(ids).includes(extId)};
  for (const c of blockChunks(body)) {
    const b = parseBlock(extId, c.opcode, c.src);
    if (!b.kind) warnings.push(`${b.opcode}: cannot determine blockType`);
    blocks[b.opcode] = b;
  }
  readMenus(extId, body, src, l10n);
}

if (fs.existsSync(TW_DIR)) {
  for (const f of fs.readdirSync(TW_DIR).sort()) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(TW_DIR, f), 'utf8');
    const extId = /\/\/ ID: (\S+)/.exec(src);
    if (!extId) { warnings.push(`${f}: missing // ID: header`); continue; }
    extMeta[extId[1]] = {url: `https://extensions.turbowarp.org/${f}`, builtin: false};
    for (const c of blockChunks(src)) {
      const b = parseBlock(extId[1], c.opcode, c.src);
      blocks[b.opcode] = b;
    }
  }
}

const payload = {
  note: '由 scripts/extract-extensions.mjs 生成，请勿手改',
  extensions: extMeta,
  menus,
  skippedMenus,
  blocks
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 1) + '\n');
const menuCount = Object.values(menus).reduce((n, t) => n + Object.keys(t).length, 0);
const optionCount = Object.values(menus).reduce((n, t) => n + Object.values(t).reduce((k, o) => k + o.length, 0), 0);
console.log(`extension blocks ${Object.keys(blocks).length} · extensions ${Object.keys(extMeta).sort().join(', ')} · menus ${menuCount} (${optionCount} options) -> ${path.relative(ROOT, OUT)}`);
if (warnings.length) console.log('Warnings:\n  ' + warnings.join('\n  '));
