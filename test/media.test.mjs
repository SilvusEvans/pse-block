import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildFromSource, PsError, validateProject} from '../src/build.js';
import {compile} from '../src/core/compiler.js';
import {costumeFromFile, soundFromFile, sniffFormat} from '../src/core/project.js';
import {stageMedia} from '../src/core/media-pick.js';
import {setLang} from '../src/core/i18n.js';

// The media-related error assertions use Simplified Chinese text verbatim; the app's default language is English, so pin Simplified Chinese here.
setLang('zh-Hans');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ASSETS = path.join(ROOT, 'examples', 'assets');
const BASE = path.dirname(ASSETS);
const ROOT_DIR = ROOT.replace(/[\\/]+$/, '');
const MD5 = /^[0-9a-f]{32}\.(png|svg|wav)$/;

// The demo assets are generated (scripts/make-demo-assets.mjs); on a clean checkout create them first so the test does not fail immediately with a missing file.
if (!fs.existsSync(path.join(ASSETS, '音效.wav'))) await import('../scripts/make-demo-assets.mjs');

test('costume/backdrop/sound: real files are read into the project, the name comes from the filename, md5ext matches the asset', async () => {
  const built = await buildFromSource(
    '角色 流星:\n  造型 "assets/星星.svg", "assets/小球.png"\n  声音 "assets/音效.wav"\n  绿旗:\n    显示\n\n舞台:\n  背景 "assets/背景480.png"\n',
    {baseDir: BASE});
  assert.deepEqual(built.problems, [], built.problems.join('\n'));
  const meteor = built.project.targets.find(t => t.name === '流星');
  assert.deepEqual(meteor.costumes.map(c => c.name), ['星星', '小球']);
  assert.deepEqual(meteor.costumes.map(c => c.dataFormat), ['svg', 'png']);
  for (const c of meteor.costumes) {
    assert.match(c.md5ext, MD5);
    assert.equal(c.fileName, c.md5ext);
    assert.equal(c.assetId, c.md5ext.split('.')[0]);
    assert.equal(c.rotationCenterX, c.width / 2, 'the rotation center must be the costume center');
    assert.equal(c.rotationCenterY, c.height / 2);
    assert.ok(built.assets.has(c.md5ext), `missing from zip: ${c.md5ext}`);
  }
  assert.equal(meteor.costumes[0].width, 96, 'svg width/height must be read from width/viewBox');
  assert.equal(meteor.costumes[1].width, 64, 'png width/height must be read from the IHDR');
  const stage = built.project.targets[0];
  assert.equal(stage.costumes.length, 1);
  assert.equal(stage.costumes[0].name, '背景480');
  assert.equal(stage.costumes[0].width, 480);
  assert.deepEqual(meteor.sounds.map(s => s.name), ['音效']);
  assert.ok(built.assets.has(meteor.sounds[0].md5ext), 'the wav must be packed into the zip');
  assert.deepEqual(built.media.map(m => ({name: m.name, costumes: m.costumes.length, sounds: m.sounds.length})),
    [{name: 'Stage', costumes: 1, sounds: 0}, {name: '流星', costumes: 2, sounds: 1}]);
});

test('assets land under the right target: the same file enters the zip only once', async () => {
  const built = await buildFromSource('角色 甲:\n  造型 "assets/小球.png"\n\n角色 乙:\n  造型 "assets/小球.png"\n', {baseDir: BASE});
  const a = built.project.targets.find(t => t.name === '甲').costumes[0];
  const b = built.project.targets.find(t => t.name === '乙').costumes[0];
  assert.equal(a.md5ext, b.md5ext, 'identical content should be the same asset id');
  assert.equal([...built.assets.keys()].filter(k => k === a.md5ext).length, 1);
  assert.equal(built.assets.get(a.md5ext).readUInt32BE(16), 64, 'the buffer must still read back the original image IHDR');
});

test('without media declarations the placeholder costume is kept, behaviour identical to the old version', async () => {
  const built = await buildFromSource('全局 计数 = 0\n\n角色 主:\n  绿旗:\n    显示\n');
  assert.equal(built.project.targets[0].costumes[0].name, 'backdrop1');
  assert.equal(built.project.targets[0].costumes[0].width, 480);
  assert.equal(built.project.targets[1].costumes[0].name, '造型1');
  assert.deepEqual(built.project.targets[1].sounds, []);
  assert.deepEqual(built.assetSpecs, []);
});

test('a missing file reports a line number and the relative directory instead of producing an empty costume', async () => {
  await assert.rejects(() => buildFromSource('角色 主:\n  造型 "assets/没有.png"\n', {baseDir: BASE}),
    e => e instanceof PsError && /找不到文件/.test(e.message) && /assets[\\/]没有\.png/.test(e.message) && e.line === 2);
  await assert.rejects(() => buildFromSource('角色 主:\n  绿旗:\n    显示\n\n角色 乙:\n  声音 "缺.wav"\n', {baseDir: BASE}),
    e => e instanceof PsError && /声音素材找不到文件/.test(e.message) && e.line === 6);
  // A wrong directory must also make clear what it was resolved relative to
  await assert.rejects(() => buildFromSource('角色 主:\n  造型 "assets/小球.png"\n', {baseDir: ROOT}),
    e => e instanceof PsError && e.message.includes(ROOT_DIR));
});

test('syntax check: a path must be a quoted string, a backdrop can only be written on the stage', () => {
  assert.throws(() => compile('角色 主:\n  造型 assets/cat.svg\n'), e => e instanceof PsError && /引号里的文件路径/.test(e.message));
  assert.throws(() => compile('角色 主:\n  造型 ""\n'), e => e instanceof PsError && /不能为空/.test(e.message));
  assert.throws(() => compile('角色 主:\n  背景 "assets/背景480.png"\n'), e => e instanceof PsError && /只能用在舞台/.test(e.message));
  assert.doesNotThrow(() => compile('舞台:\n  造型 "assets/背景480.png"\n'));
});

test('media declarations do not leak into project.json', async () => {
  const built = await buildFromSource('角色 主:\n  造型 "assets/小球.png"\n  声音 "assets/音效.wav"\n', {baseDir: BASE});
  const json = JSON.stringify(built.project);
  assert.ok(!json.includes('assets/'), 'the path must not appear in the project');
  assert.ok(!('buffer' in built.project.targets[1].costumes[0]), 'a costume entry keeps only the md5ext reference');
  assert.ok(!('buffer' in built.project.targets[1].sounds[0]), 'a sound entry keeps only the md5ext reference');
});

test('the format is detected from the file header, not the extension', () => {
  const png = fs.readFileSync(path.join(ASSETS, '小球.png'));
  const wav = fs.readFileSync(path.join(ASSETS, '音效.wav'));
  assert.equal(sniffFormat(png), 'png');
  assert.equal(sniffFormat(wav), 'wav');
  assert.equal(sniffFormat(Buffer.from('<svg xmlns="x" width="10" height="10"/>')), 'svg');
  assert.equal(sniffFormat(Buffer.from('hello')), null);
  assert.throws(() => costumeFromFile('a.png', wav), /是音频/);
  assert.throws(() => soundFromFile('a.wav', png), /只支持 wav/);
  const s = soundFromFile('a.wav', wav).sound;
  assert.equal(s.rate, 22050);
  assert.equal(s.sampleCount, 7717, '0.35s × 22050Hz mono');
  assert.equal(s.md5ext, `${s.assetId}.wav`);
});

test('costume/sound names are validated: the name comes from the imported filename', () => {
  const withMedia = '角色 流星:\n  造型 "assets/星星.svg", "assets/小球.png"\n  声音 "assets/音效.wav"\n';
  assert.doesNotThrow(() => compile(withMedia + '  绿旗:\n    换成造型("星星")\n    播放声音("音效")\n'));
  assert.throws(() => compile(withMedia + '  绿旗:\n    换成造型("月亮")\n'),
    e => e instanceof PsError && /造型 "月亮" 没有被 造型 语句导入/.test(e.message) && /可选：星星、小球/.test(e.message));
  assert.throws(() => compile(withMedia + '  绿旗:\n    播放声音并等待("喵")\n'),
    e => e instanceof PsError && /声音 "喵" 没有被 声音 语句导入/.test(e.message) && /音效/.test(e.message));
  // An index and a variable are determined only at runtime, so they must not be pinned by the name table
  assert.doesNotThrow(() => compile(withMedia + '  变量 序号 = 1\n  绿旗:\n    换成造型(2)\n    换成造型(序号)\n'));
  // A backdrop statement likewise enters the costume name table (on the stage)
  assert.doesNotThrow(() => compile('舞台:\n  背景 "assets/背景480.png"\n  绿旗:\n    换成造型("背景480")\n'));
});

test('without imported media only a warning is given, compilation is not blocked', () => {
  const out = compile('角色 猫:\n  绿旗:\n    换成造型("造型1")\n    播放声音("喵")\n');
  assert.deepEqual(out.warnings.filter(w => /造型/.test(w)), [], 'a placeholder costume name should not raise a warning');
  assert.equal(out.warnings.length, 1, out.warnings.join('\n'));
  assert.match(out.warnings[0], /没有用 声音 导入素材，"喵" 放不出来/);
});

test('files picked in the dialog: a relative path inside the directory, copied into assets/ outside it', async () => {
  const tmp = path.join(ROOT_DIR, 'out', 'tmp-pick');
  fs.rmSync(tmp, {recursive: true, force: true});
  const base = path.join(tmp, 'proj');
  fs.mkdirSync(path.join(base, 'img'), {recursive: true});
  const inside = path.join(base, 'img', '球.png');
  fs.copyFileSync(path.join(ASSETS, '小球.png'), inside);
  const outside = path.join(tmp, '音效2.wav');
  fs.copyFileSync(path.join(ASSETS, '音效.wav'), outside);
  const bad = path.join(tmp, 'note.txt');
  fs.writeFileSync(bad, 'hello');
  const r = stageMedia([inside, outside, bad, path.join(tmp, '没有.png')], base);
  assert.deepEqual(r.items.map(i => [i.rel, i.copied, i.kind, i.name]),
    [['img/球.png', false, 'costume', '球'], ['assets/音效2.wav', true, 'sound', '音效2']], JSON.stringify(r.items));
  assert.deepEqual(r.errors, ['note.txt: 只支持 png / svg 造型与 wav 声音', '没有.png: 文件不存在'], JSON.stringify(r.errors));
  assert.ok(fs.existsSync(path.join(base, 'assets', '音效2.wav')), 'the asset must be copied into the project directory');
  // The relative path after copying must be directly consumable by the compiler
  const built = await buildFromSource(
    '角色 主:\n  声音 "assets/音效2.wav"\n  造型 "img/球.png"\n  绿旗:\n    播放声音("音效2")\n    换成造型("球")\n',
    {baseDir: base});
  assert.deepEqual(built.problems, [], built.problems.join('\n'));
  assert.deepEqual(built.warnings, []);
  fs.rmSync(tmp, {recursive: true, force: true});
});

test('self-check catches bad assets: illegal md5ext, missing file, sound missing rate', async () => {
  const built = await buildFromSource('角色 主:\n  造型 "assets/小球.png"\n  声音 "assets/音效.wav"\n', {baseDir: BASE});
  assert.deepEqual(built.problems, [], 'the original project should have no self-check problems');
  const p = JSON.parse(JSON.stringify(built.project));
  const t = p.targets[1];
  t.costumes[0].md5ext = 'zzz.png';
  t.sounds[0].rate = 0;
  const problems = validateProject(p, new Set([...built.assets.keys()].filter(k => k !== t.sounds[0].md5ext)));
  assert.ok(problems.some(x => /造型 md5ext 非法/.test(x)), problems.join('\n'));
  assert.ok(problems.some(x => /声音.*缺 rate/.test(x)), problems.join('\n'));
  assert.ok(problems.some(x => /声音文件缺失/.test(x)), problems.join('\n'));
});
