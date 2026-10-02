// Generate src/core/generated-catalog.json from scratch-blocks block definitions.
// Source of truth: .ref/sb/package/src/blocks/*.ts (Blockly.Blocks.<opcode>.jsonInit)
// plus .ref/sb/package/msg/json/en.json for block wording used to derive aliases.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const BLOCKS_DIR = path.join(root, '.ref/sb/package/src/blocks');
const MSG_EN = path.join(root, '.ref/sb/package/msg/json/en.json');

function sliceBalanced(text, start, open, close) {
  if (text[start] !== open) return null;
  let depth = 0;
  let i = start;
  let inStr = null;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// Split an array literal body into its top-level element sources.
function splitElements(body) {
  const out = [];
  let i = 0;
  while (i < body.length) {
    const c = body[i];
    if (c !== '{' && c !== '[') { i++; continue; }
    const seg = sliceBalanced(body, i, c, c === '{' ? '}' : ']');
    if (!seg) break;
    out.push(seg);
    i += seg.length;
  }
  return out;
}

const str = (src, key) => {
  const m = new RegExp(`${key}:\\s*'([^']*)'`).exec(src);
  return m ? m[1] : null;
};

function parseArgs0(arrBody) {
  return splitElements(arrBody).map(seg => {
    const type = str(seg, 'type');
    if (!type) return null;
    const e = {type};
    const name = str(seg, 'name');
    if (name) e.name = name;
    const check = /check:\s*'([^']*)'/.exec(seg) || /check:\s*\[([^\]]*)\]/.exec(seg);
    if (check) e.check = check[1].replace(/"/g, '').trim();
    if (/type:\s*'input_statement'/.test(seg)) {
      const cs = /connect\w*:\s*\[([^\]]*)\]/.exec(seg);
      if (cs) e.connect = cs[1].replace(/["']/g, '').trim();
    }
    // Static dropdowns declare their options right here; the value (not the label) is what
    // a real project.json writes into the field, so it cannot be remembered by hand.
    const optArr = /options:\s*\[([\s\S]*)\]\s*$/.exec(seg) || /options:\s*\[([\s\S]*)\]/.exec(seg);
    if (optArr) {
      const opts = [];
      // Both the value and the label can be single- or double-quoted ("don't rotate" has to use
      // double quotes because of the apostrophe); missing one form drops an option, and a missing
      // option is silent in the editor.
      const RE = /\[\s*(?:Blockly\.Msg\.([A-Z0-9_]+)|ScratchBlocks\.Msg\.([A-Z0-9_]+)|'([^']*)'|"([^"]*)")\s*,\s*(?:'([^']*)'|"([^"]*)")\s*\]/g;
      for (const om of optArr[1].matchAll(RE)) {
        opts.push({
          msgKey: om[1] || om[2] || null,
          label: om[3] || om[4] || null,
          value: om[5] ?? om[6]
        });
      }
      if (opts.length) e.options = opts;
    }
    return e;
  }).filter(Boolean);
}

function extractImperative(opcode, body) {
  // Some blocks are built with the Blockly imperative API (appendValueInput /
  // appendField / setOutput) instead of jsonInit. Recover the same info.
  const inputs = [...body.matchAll(/appendValueInput\(\s*'([A-Z_0-9]+)'/g)].map(m => ({type: 'input_value', name: m[1], check: null}));
  const fields = [...body.matchAll(/appendField\([^,)]+,\s*'([A-Z_0-9]+)'\s*\)/g)].map(m => ({type: 'field_dropdown', name: m[1]}));
  const stmts = [...body.matchAll(/appendStatementInput\(\s*'([A-Z_0-9]+)'/g)].map(m => ({type: 'input_statement', name: m[1], stmt: true}));
  const out = /setOutput\(\s*(null|'Boolean'|'Number'|'String')/.exec(body);
  const kind = /setHatStyle|hatStyle/.test(body) ? 'hat'
    : out && out[1] === "'Boolean'" ? 'boolean'
      : out && out[1] !== 'null' ? 'reporter'
        : inputs.length + stmts.length + fields.length > 0 || /setPreviousStatement/.test(body) ? (stmts.length ? 'c-block' : 'statement') : 'unknown';
  return {
    opcode,
    msgKey: null,
    args0: [...inputs, ...stmts, ...fields],
    output: out ? out[1].replace(/'/g, '') : undefined,
    previousStatement: /setPreviousStatement\(\s*true/.test(body) ? '' : undefined,
    extensions: [],
    hasStatementInput: stmts.length > 0,
    kind,
    imperative: true
  };
}

// Comments contain apostrophes ("the sprite's volume"), which would otherwise open an
// unterminated string in the brace matcher below and silently skip whole block entries.
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function extractBlocks(fileText) {
  const src = stripComments(fileText);
  const found = [];
  const re = /Blockly\.Blocks\.([a-zA-Z0-9_]+)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const opcode = m[1];
    const body = sliceBalanced(src, re.lastIndex - 1, '{', '}');
    if (!body) continue;
    // Empty stubs (`Blockly.Blocks.foo = {}`) are menus scratch-gui fills in at run time.
    // They have no shape in source, but the opcode is real, so record them as such.
    if (/^\{\s*\}$/.test(body)) {
      found.push({opcode, dynamicMenu: true, args0: [], extensions: []});
      continue;
    }
    const ji = body.indexOf('jsonInit(');
    if (ji < 0) {
      const imp = extractImperative(opcode, body);
      if (imp.args0.length || imp.kind !== 'unknown') found.push(imp);
      continue;
    }
    const argObjStart = body.indexOf('{', body.indexOf('(', ji));
    const argObj = argObjStart < 0 ? null : sliceBalanced(body, argObjStart, '{', '}');
    if (!argObj) continue;
    const args0Idx = argObj.indexOf('args0:');
    let args = [];
    // C-blocks declare their substacks in args1/args2, not args0.
    for (const key of ['args0', 'args1', 'args2']) {
      const at = argObj.indexOf(`${key}:`);
      if (at < 0) continue;
      const arrStart = argObj.indexOf('[', at);
      const arr = sliceBalanced(argObj, arrStart, '[', ']');
      if (arr) args = args.concat(parseArgs0(arr.slice(1, -1)));
    }
    if (args0Idx < 0 && args.length === 0) {
      // no args array at all: keep empty
    }
    const msgKeyM = /message0:\s*Blockly\.Msg\.([A-Z0-9_]+)/.exec(argObj);
    const outM = /output:\s*(null|'[^']*')/.exec(argObj);
    const prevM = /previousStatement:\s*(null|'[^']*')/.exec(argObj);
    const exts = (() => {
      const ei = argObj.indexOf('extensions:');
      if (ei < 0) return [];
      const arr = sliceBalanced(argObj, argObj.indexOf('[', ei), '[', ']');
      return arr ? arr.slice(1, -1).match(/'[^']*'/g)?.map(x => x.slice(1, -1)) ?? [] : [];
    })();
    found.push({
      opcode,
      msgKey: msgKeyM ? msgKeyM[1] : null,
      args0: args,
      output: outM ? outM[1].replace(/'/g, '') : undefined,
      previousStatement: prevM ? prevM[1].replace(/'/g, '') : undefined,
      extensions: exts,
      hasStatementInput: args.some(a => a.type === 'input_statement')
    });
  }
  return found;
}

function classify(b) {
  const ext = b.extensions.join(' ');
  if (/shape_hat|shape_bowler_hat/.test(ext)) return 'hat';
  if (/shape_end/.test(ext)) return b.hasStatementInput ? 'c-block-end' : 'cap';
  if (/output_boolean/.test(ext) || b.output === 'Boolean') return 'boolean';
  if (/output_number|output_string/.test(ext) || b.output !== undefined) return 'reporter';
  if (/shape_statement/.test(ext) && b.hasStatementInput) return 'c-block';
  if (/shape_statement/.test(ext)) return 'statement';
  if (b.hasStatementInput) return 'c-block';
  if (b.previousStatement) return 'statement';
  return 'unknown';
}

const files = fs.readdirSync(BLOCKS_DIR).filter(f => /\.(ts|js)$/.test(f) && f !== 'matrix.ts' && f !== 'note.ts' && f !== 'text.ts' && f !== 'colour.ts' && !f.includes('vertical'));
const en = JSON.parse(fs.readFileSync(MSG_EN, 'utf8'));
const catalog = {};
let unknown = 0;
for (const f of files) {
  for (const b of extractBlocks(fs.readFileSync(path.join(BLOCKS_DIR, f), 'utf8'))) {
    if (b.dynamicMenu) {
      catalog[b.opcode] = {
        kind: 'dynamic-menu',
        category: f.replace(/\.(ts|js)$/, ''),
        inputs: [],
        fields: [],
        msgKey: null,
        enText: null,
        aliases: [],
        extensions: [],
        dynamic: true
      };
      continue;
    }
    const kind = b.kind || classify(b);
    if (kind === 'unknown') unknown++;
    const inputs = b.args0.filter(a => a.type === 'input_value' || a.type === 'input_statement' || a.type === 'input_dummy' || a.stmt);
    const fields = b.args0.filter(a => a.type && a.type.startsWith('field_'));
    const text = b.msgKey ? en[b.msgKey] ?? null : null;
    catalog[b.opcode] = {
      kind,
      category: f.replace(/\.(ts|js)$/, ''),
      inputs: inputs.map(i => ({name: i.name, check: i.check ?? null, stmt: i.type === 'input_statement', dummy: i.type === 'input_dummy'})),
      fields: fields.map(fd => ({
        name: fd.name,
        fieldType: fd.type.replace('field_', ''),
        options: (fd.options || []).map(o => ({
          value: o.value,
          msgKey: o.msgKey,
          en: o.msgKey ? en[o.msgKey] ?? null : o.label
        }))
      })),
      msgKey: b.msgKey,
      enText: text,
      aliases: aliasesFromText(text),
      extensions: b.extensions,
      output: b.output,
      previousStatement: b.previousStatement
    };
  }
}

function aliasesFromText(text) {
  if (!text) return [];
  return text
    .replace(/%\d/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

for (const [op, c] of Object.entries(catalog)) c.aliases = aliasesFromText(c.enText);

const aliasesByOpcodeFromZh = null;
const out = {
  generatedAt: new Date().toISOString(),
  source: 'scratch-blocks@' + JSON.parse(fs.readFileSync(path.join(root, '.ref/sb/package/package.json'), 'utf8')).version,
  counts: {},
  blocks: catalog
};
for (const c of Object.values(catalog)) out.counts[c.kind] = (out.counts[c.kind] ?? 0) + 1;
const dest = path.join(root, 'src/core/generated-catalog.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
console.log('wrote', dest);
console.log('blocks:', Object.keys(catalog).length, 'unknown kind:', unknown, 'aliases:', aliasesByOpcodeFromZh);
console.log(out.counts);
