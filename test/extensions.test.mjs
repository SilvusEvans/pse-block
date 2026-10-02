// Extension blocks must match ground truth from the vendors, not our memory:
// - Scratch's own pen: the opcodes have to be the ones scratch-vm registers.
// - TurboWarp's Stretch: shape compared against the official Stretch.sb3 sample.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import JSZip from 'jszip';
import {buildFromSource} from '../src/build.js';
import {EXT, EXT_META, EXTENSION_URLS, GENEXT, OPS, MENU_SHADOW, aliasReference} from '../src/core/catalog.js';
import {setLang} from '../src/core/i18n.js';

// The menu-error assertions use Simplified Chinese text verbatim; the app's default language is English, so pin Simplified Chinese here.
setLang('zh-Hans');

const require = createRequire(import.meta.url);

const SAMPLE = new URL('../.ref/turbowarp/Stretch.sb3', import.meta.url);

async function sampleProject () {
  const zip = await JSZip.loadAsync(fs.readFileSync(SAMPLE));
  return JSON.parse(await zip.file('project.json').async('string'));
}

test('the generated extension table covers every block and slot used by the official Stretch sample', async () => {
  const pj = await sampleProject();
  const used = new Map();
  for (const t of pj.targets) {
    for (const b of Object.values(t.blocks)) {
      if (!String(b.opcode).startsWith('stretch_')) continue;
      if (!used.has(b.opcode)) used.set(b.opcode, new Set(Object.keys(b.inputs || {})));
      else for (const k of Object.keys(b.inputs || {})) used.get(b.opcode).add(k);
    }
  }
  assert.ok(used.size >= 3, `the sample should use several stretch blocks, actually ${used.size}`);
  for (const [op, slots] of used) {
    const cat = EXT[op];
    assert.ok(cat, `catalog is missing ${op}, which the official sample uses`);
    const mine = new Set(cat.inputs.map(i => i.name));
    assert.deepEqual([...slots].sort(), [...mine].sort(), `${op}'s input slot names do not match the official sample`);
  }
});

test('the stretch project header extensions / extensionURLs match the official sample', async () => {
  const pj = await sampleProject();
  const r = await buildFromSource('角色 主:\n  绿旗:\n    横向拉伸设为(100)\n    纵向拉伸增加(10)\n    拉伸设为(80, 120)\n');
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  assert.deepEqual(r.project.extensions, pj.extensions);
  assert.deepEqual(r.project.extensionURLs, pj.extensionURLs);
});

test('stretch blocks emit the same slot names and numeric primitives as the official sample', async () => {
  const pj = await sampleProject();
  const official = {};
  for (const t of pj.targets) for (const b of Object.values(t.blocks)) if (String(b.opcode).startsWith('stretch_')) official[b.opcode] = official[b.opcode] || Object.keys(b.inputs || {});
  const r = await buildFromSource('角色 主:\n  绿旗:\n    横向拉伸设为(100)\n    纵向拉伸增加(10)\n    拉伸设为(80, 120)\n');
  const mine = {};
  for (const b of Object.values(r.project.targets[1].blocks)) if (b.opcode.startsWith('stretch_')) mine[b.opcode] = Object.keys(b.inputs || {});
  for (const op of Object.keys(mine)) {
    if (!(op in official)) continue;
    assert.deepEqual(mine[op], official[op], `${op} slot names differ from the sample`);
  }
  const set = Object.values(r.project.targets[1].blocks).find(b => b.opcode === 'stretch_setStretch');
  assert.deepEqual(set.inputs, {X: [1, [4, 80]], Y: [1, [4, 120]]});
  assert.ok(EXT['stretch_getX'] && EXT['stretch_getY'], 'the horizontal/vertical stretch readers should be in the table');
});

test('shapes accepted by the official schema: a pen project with a color input is accepted by scratch-parser', async () => {
  const r = await buildFromSource('角色 笔:\n  绿旗:\n    画笔颜色设为("#12ab34")\n    横向拉伸设为(120)\n');
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  const parse = require('scratch-parser');
  const fn = parse.default || parse;
  const [json] = await new Promise((resolve, reject) => {
    fn(r.buffer, false, (err, pair) => err ? reject(err) : resolve(pair));
  });
  const color = Object.values(json.targets[1].blocks).find(b => b.opcode === 'pen_setPenColorToColor');
  assert.deepEqual(color.inputs.COLOR, [1, [9, '#12ab34']], 'the color primitive must be head 9');
  assert.deepEqual(json.extensions, ['pen', 'stretch']);
});

test('music extension block slot names match the generated table, and carry no URL', async () => {
  const r = await buildFromSource('全局 曲速 = 0.3\n\n角色 琴:\n  变量 音高 = 60\n  绿旗:\n    乐器编号设为(1)\n    节拍速度设为(132)\n    播放音符(音高, 曲速)\n    休止(1)\n    节拍速度增加(-20)\n    说(连接("速度 ", 节拍速度))\n');
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  assert.deepEqual(r.project.extensions, ['music']);
  assert.equal(r.project.extensionURLs, undefined);
  const blocks = r.project.targets[1].blocks;
  const mine = Object.values(blocks).filter(b => b.opcode.startsWith('music_'));
  assert.deepEqual(mine.map(b => b.opcode).sort(), [
    'music_changeTempo', 'music_getTempo', 'music_midiSetInstrument', 'music_playNoteForBeats', 'music_restForBeats', 'music_setTempo'
  ].sort());
  for (const b of mine) {
    assert.deepEqual(Object.keys(b.inputs).sort(), (GENEXT[b.opcode].inputs || []).map(i => i.name).sort(), `${b.opcode} slot names do not match`);
  }
});

test('built-in pen writes only the id, third-party extensions write the URL', () => {
  assert.equal(EXT_META.pen.url, null);
  assert.match(EXTENSION_URLS.stretch, /^https:\/\/extensions\.turbowarp\.org\/stretch\.js$/);
  assert.equal(EXTENSION_URLS.pen, undefined);
  for (const op of Object.keys(EXT)) {
    if (!op.startsWith('pen_')) continue;
    const b = GENEXT[op];
    assert.equal(b.ext, 'pen', `${op}'s extension id should be pen`);
    assert.ok(['statement', 'boolean', 'reporter', 'hat', 'c-block'].includes(b.kind), `${op} kind=${b.kind}`);
  }
  const penAliases = Object.entries(OPS).filter(([key, s]) => String(s.op || key).startsWith('pen_'));
  assert.ok(penAliases.length >= 10, `Chinese aliases should cover more than 10 pen blocks, actually ${penAliases.length}`);
  for (const [key, s] of penAliases) {
    const op = s.op || key;
    assert.ok(EXT[op], `alias ${key} points at ${op}, which does not exist in the catalog`);
  }
});

test('menu options come from the extension source and the official Scratch Chinese table', () => {
  const menus = require('../src/core/generated-extensions.json').menus.music;
  assert.equal(menus.DRUM.length, 18);
  assert.equal(menus.INSTRUMENT.length, 21);
  assert.deepEqual(menus.DRUM.map(d => d.value), Array.from({length: 18}, (_, i) => String(i + 1)),
    '_buildMenu uses the 1-based index as the field value');
  for (const it of [...menus.DRUM, ...menus.INSTRUMENT]) {
    assert.match(it.en, new RegExp(`^\\(${it.value}\\) `), `${it.id}'s English name does not match its index`);
    assert.ok(it.zh, `${it.id} is missing the official Chinese name`);
    assert.equal(MENU_SHADOW.drum.values[it.zh] || MENU_SHADOW.instrument.values[it.zh], it.value, `${it.id}'s Chinese name is unusable`);
  }
  for (const [kind, menu] of [['drum', MENU_SHADOW.drum], ['instrument', MENU_SHADOW.instrument]]) {
    assert.ok(menu.strict && menu.from.ext === 'music', `${kind} should be a strict menu coming from music`);
    assert.ok(Object.keys(menu.values).length >= 3 * menu.labels.length, `${kind} should accept the full name/bare name/index at once`);
  }
});

test('play drum / set instrument: Chinese name, index and quoted English name all become editor-recognized menu dropdown blocks', async () => {
  const r = await buildFromSource('舞台:\n  绿旗:\n    乐器设为(钢琴)\n    击鼓(小军鼓, 0.5)\n    换乐器("Electric Guitar")\n    击鼓(10, 1)');
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  const blocks = r.project.targets[0].blocks;
  const menuValues = (op, slot, shadow) => Object.entries(blocks).filter(([, b]) => b.opcode === op).map(([pid, b]) => {
    const id = b.inputs[slot][1];
    const sh = blocks[id];
    assert.equal(sh.opcode, shadow, `the ${slot} slot should be filled by the ${shadow} dropdown block`);
    assert.equal(sh.shadow, true, 'the menu block must be marked as a shadow');
    assert.equal(sh.parent, pid, 'the menu block must hang under its parent block');
    return sh.fields[slot][0];
  }).sort();
  assert.deepEqual(menuValues('music_playDrumForBeats', 'DRUM', 'music_menu_DRUM'), ['1', '10']);
  assert.deepEqual(menuValues('music_setInstrument', 'INSTRUMENT', 'music_menu_INSTRUMENT'), ['1', '5']);
  for (const b of Object.values(blocks).filter(b => b.opcode === 'music_playDrumForBeats')) {
    assert.deepEqual(Object.keys(b.inputs).sort(), ['BEATS', 'DRUM'], 'the menu slot is a value input, not a field');
    assert.equal(b.fields.DRUM, undefined);
  }
  assert.ok(r.project.extensions.includes('music'));
  assert.equal(r.project.extensionURLs, undefined, 'music is a Scratch built-in extension');
});

test('a wrong menu option errors immediately and lists the available options', async () => {
  await assert.rejects(() => buildFromSource('舞台:\n  绿旗:\n    乐器设为(电子琴)'),
    e => /INSTRUMENT 没有选项 "电子琴"/.test(e.message) && /钢琴/.test(e.message) && /合成柔音/.test(e.message));
  await assert.rejects(() => buildFromSource('舞台:\n  绿旗:\n    击鼓(沙锤)'),
    e => /DRUM 没有选项 "沙锤"/.test(e.message));
  const row = aliasReference().find(x => x.op === 'music_playDrumForBeats');
  assert.ok(row && row.slots.join(' ').includes('小军鼓'), 'the quick-reference table should list the menu options');
});
