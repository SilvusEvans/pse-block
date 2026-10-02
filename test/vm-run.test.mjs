import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {buildFromSource} from '../src/build.js';
import {packSb3} from '../src/core/project.js';
import {EXT_META} from '../src/core/catalog.js';

const require = createRequire(import.meta.url);
const VM = require('scratch-vm').default || require('scratch-vm');
const EXAMPLES_DIR = fileURLToPath(new URL('../examples/', import.meta.url));

// Load a compiled project into the real Scratch VM and run it headlessly.
// currentStepTime must be set by hand: without vm.start() it stays 0, which
// gives the sequencer a zero-length work budget and nothing ever executes.
// Keep workMs small for projects with a forever hat, or one _step() burns the
// whole budget spinning.
async function runProject (src, {steps = 60, workMs = 10000, baseDir} = {}) {
  const r = await buildFromSource(src, baseDir ? {baseDir} : {});
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  let buffer = r.buffer;
  const remote = r.project.extensions.filter(id => !(EXT_META[id] && EXT_META[id].builtin));
  if (remote.length) {
    // scratch-vm derives extension ids from opcode prefixes and tries to fetch them,
    // which the node build cannot do (no Worker, no network storage). Swap those blocks
    // for core control_noop so the rest of the project still runs; the extension blocks
    // themselves are checked against ground truth in extensions.test.mjs.
    for (const t of r.project.targets) {
      for (const b of Object.values(t.blocks)) {
        if (remote.some(id => b.opcode.startsWith(id + '_'))) {
          b.opcode = 'control_noop';
          b.inputs = {};
          b.fields = {};
        }
      }
    }
    r.project.extensions = r.project.extensions.filter(id => !remote.includes(id));
    delete r.project.extensionURLs;
    buffer = await packSb3(r.project, r.assets);
  }
  const vm = new VM();
  await vm.loadProject(buffer);
  vm.runtime.currentStepTime = workMs;
  const errors = [];
  vm.runtime.on('PROJECT_RUN_ERROR', e => errors.push(e && (e.message || String(e))));
  vm.greenFlag();
  for (let i = 0; i < steps; i++) vm.runtime._step();
  const stage = vm.runtime.getTargetForStage();
  // scratch-vm 5 keeps lists in the same map as variables, distinguished by value shape.
  const data = name => Object.values(stage.variables).find(x => x.name === name);
  const variable = name => { const v = data(name); return v && v.value; };
  const list = name => { const v = data(name); return v && v.value; };
  const sprite = name => vm.runtime.targets.map(t => t.getName()).includes(name);
  return {vm, stage, variable, list, sprite, errors, targetCount: vm.runtime.targets.length};
}

test('VM execution: repeat + arithmetic + global variable', async () => {
  const {variable, errors} = await runProject('全局 计数 = 0\n\n角色 主:\n  绿旗:\n    重复 (3):\n      计数 ← 计数 + 2\n');
  assert.deepEqual(errors, []);
  assert.equal(Number(variable('计数')), 6);
});

test('VM execution: broadcast triggers a hat in another sprite', async () => {
  const src = '全局 计数 = 0\n\n角色 主:\n  绿旗:\n    重复 (3):\n      计数 ← 计数 + 2\n    广播("完成")\n\n角色 从:\n  当收到("完成"):\n    计数 ← 计数 + 100\n';
  const {variable, errors} = await runProject(src);
  assert.deepEqual(errors, []);
  assert.equal(Number(variable('计数')), 106, 'the receiving hat was not triggered');
});

test('VM execution: custom block with arguments is really invoked', async () => {
  const src = '全局 结果 = 0\n\n角色 主:\n  定义 平方(n: 数):\n    结果 ← n * n\n  绿旗:\n    平方(7)\n';
  const {variable, errors} = await runProject(src);
  assert.deepEqual(errors, []);
  assert.equal(Number(variable('结果')), 49);
});

test('VM execution: clone hat starts and accumulates', async () => {
  const src = '全局 克隆数 = 0\n\n角色 主:\n  变量 私有计数 = 0\n  绿旗:\n    重复 (3):\n      克隆自己\n\n  当作为克隆体启动时:\n    克隆数 ← 克隆数 + 1\n';
  const r = await runProject(src, {steps: 120});
  assert.deepEqual(r.errors, []);
  assert.equal(Number(r.variable('克隆数')), 3, 'all three clones should start');
  assert.ok(r.targetCount >= 4, `clones should become runtime targets: ${r.targetCount}`);
});

test('VM execution: conditionals, boolean blocks and lists', async () => {
  const src = '全局 分数 = 0\n列表 轨迹\n\n角色 主:\n  绿旗:\n    重复 (4):\n      分数 ← 分数 + 1\n      如果 (分数 > 2):\n        加入列表(分数, 轨迹)\n';
  const r = await runProject(src);
  assert.deepEqual(r.errors, []);
  assert.equal(Number(r.variable('分数')), 4);
  assert.deepEqual(r.list('轨迹').map(Number), [3, 4], 'only the two rounds meeting the condition should enter the list');
});

test('hello-zh-Hans.pseudo runs the green flag in a real VM without errors', async () => {
  const src = fs.readFileSync(new URL('../examples/hello-zh-Hans.pseudo', import.meta.url), 'utf8');
  const r = await runProject(src, {steps: 3, workMs: 16});
  assert.deepEqual(r.errors, []);
  assert.equal(r.sprite('球'), true);
  assert.equal(r.sprite('影子'), true);
});

test('every example under examples/ passes self-check + schema and runs the green flag without errors where runnable', async () => {
  const dir = new URL('../examples/', import.meta.url);
  const files = fs.readdirSync(dir).filter(f => /\.(pseudo|psb)$/i.test(f));
  assert.ok(files.length >= 3, `too few examples: ${files.join(',')}`);
  const parse = require('scratch-parser');
  const fn = parse.default || parse;
  for (const f of files) {
    const src = fs.readFileSync(new URL(f, dir), 'utf8');
    const built = await buildFromSource(src, {baseDir: EXAMPLES_DIR});
    assert.deepEqual(built.problems, [], `${f}: ${built.problems.join('; ')}`);
    await new Promise((resolve, reject) => {
      fn(built.buffer, false, err => err ? reject(new Error(`${f}: ${err.message}`)) : resolve());
    });
    // Loading the music extension immediately creates an AudioContext; node has no Web Audio,
    // which turns into an async rejection after the test ends, so only its artifacts are checked
    // here; the block shapes are compared against the generated extension table in extensions.test.mjs.
    if (built.extensions.includes('music')) continue;
    const r = await runProject(src, {steps: 3, workMs: 16, baseDir: EXAMPLES_DIR});
    assert.deepEqual(r.errors, [], `${f} green-flag run error: ${r.errors.join('; ')}`);
  }
});

test('VM loads real assets: costumes and sounds are accepted by the runtime', async () => {
  const src = fs.readFileSync(new URL('../examples/media-zh-Hans.pseudo', import.meta.url), 'utf8');
  const built = await buildFromSource(src, {baseDir: EXAMPLES_DIR});
  const vm = new VM();
  await vm.loadProject(built.buffer);
  const meteor = vm.runtime.targets.find(t => t.getName() === '流星');
  assert.ok(meteor, 'the sprite was not loaded');
  // node has no storage module, so asset contents cannot be fetched (the VM warns); only verify that the metadata is fully accepted by the runtime.
  const costumes = meteor.getCostumes();
  assert.deepEqual(costumes.map(c => c.name), ['星星', '小球']);
  assert.deepEqual(costumes.map(c => c.dataFormat), ['svg', 'png']);
  assert.equal(costumes[0].rotationCenterX, 48, 'a 96-wide svg should have its rotation center in the middle');
  const json = JSON.parse(vm.toJSON());
  const stored = json.targets.find(t => t.name === '流星');
  assert.deepEqual(stored.costumes.map(c => c.md5ext), built.project.targets.find(t => t.name === '流星').costumes.map(c => c.md5ext));
  assert.equal(stored.sounds.length, 1);
  assert.equal(stored.sounds[0].name, '音效');
  // Missing rate/sampleCount makes the VM play at the wrong sample rate; require that they were really read from the wav header.
  assert.equal(stored.sounds[0].rate, 22050);
  assert.ok(stored.sounds[0].sampleCount > 0, 'sampleCount should be greater than 0');
});

const PEN_SRC = '角色 笔:\n  绿旗:\n    清空画笔()\n    落笔()\n    画笔大小设为(5)\n    画笔颜色设为("#00ff00")\n    画笔色相增加(10)\n    图章()\n    重复 (4):\n      移动 (20)\n    抬笔()\n';

test('VM execution: pen blocks all resolve to primitives in the real VM', async () => {
  const r = await buildFromSource(PEN_SRC);
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  const emitted = Object.values(r.project.targets[1].blocks).filter(b => b.opcode.startsWith('pen_')).map(b => b.opcode);
  assert.ok(emitted.length >= 7, `expected more than 7 pen blocks, got ${emitted.length}`);
  const vm = new VM();
  await vm.loadProject(r.buffer);
  const missing = emitted.filter(op => typeof vm.runtime._primitives[op] !== 'function');
  assert.deepEqual(missing, [], 'these pen opcodes are not blocks the real VM knows');
  // Scratch's pen is a built-in extension: write only the id, not the URL (writing the URL makes Scratch error instead).
  assert.deepEqual(r.project.extensions, ['pen']);
  assert.equal(r.project.extensionURLs, undefined);
  // The color primitive must use head 9 (scratch-parser schema: [9, "#rrggbb"]); head 10 is treated as text.
  const color = emitted.map(op => Object.values(r.project.targets[1].blocks).find(b => b.opcode === op))
    .find(b => b.opcode === 'pen_setPenColorToColor');
  assert.deepEqual(color.inputs.COLOR, [1, [9, '#00ff00']]);
  vm.runtime.currentStepTime = 10000;
  const errors = [];
  vm.runtime.on('PROJECT_RUN_ERROR', e => errors.push(e && (e.message || String(e))));
  vm.greenFlag();
  for (let i = 0; i < 40; i++) vm.runtime._step();
  assert.deepEqual(errors, []);
});

test('VM execution: list index dropdown and list contents', async () => {
  const src = [
    '全局 头 = ""',
    '全局 末 = ""',
    '全局 随机 = ""',
    '全局 全文 = ""',
    '全局 长度 = 0',
    '全局 清空后 = 9',
    '',
    '角色 列表:',
    '  列表 队列',
    '  绿旗:',
    '    加入列表("甲", 队列)',
    '    加入列表("乙", 队列)',
    '    头 ← 列表第项(1, 队列)',
    '    末 ← 列表第项("末尾", 队列)',
    '    随机 ← 列表第项("随机", 队列)',
    '    全文 ← 列表内容(队列)',
    '    长度 ← 列表长度(队列)',
    '    替换列表("末尾", "丙", 队列)',
    '    插入列表(1, "丁", 队列)',
    '    删除列表第项("全部", 队列)',
    '    清空后 ← 列表长度(队列)',
    ''
  ].join('\n');
  const {variable, list, errors} = await runProject(src);
  assert.deepEqual(errors, []);
  assert.equal(variable('头'), '甲');
  assert.equal(variable('末'), '乙');
  assert.ok(['甲', '乙'].includes(variable('随机')), `random index picked ${variable('随机')}`);
  assert.equal(variable('长度'), 2);
  // In the VM data_listcontents concatenates directly, without space separators
  assert.equal(variable('全文'), '甲乙');
  // 「全部」 (all) is only valid in delete; it goes through the data_listindexall value
  assert.equal(variable('清空后'), 0);
  assert.deepEqual(list('队列'), [], 'the list should be empty after deleting all');
});

test('VM execution: infix != really compares (used to silently drop the right operand)', async () => {
  const src = [
    '全局 命中 = 0',
    '全局 零也成立 = 0',
    '',
    '角色 主:',
    '  变量 n = 1',
    '  绿旗:',
    '    重复 (4):',
    '      如果 (n != 3):',
    '        命中 ← 命中 + 1',
    '      n ← n + 1',
    '    如果 (0 != 5):',
    '      零也成立 ← 1',
    ''
  ].join('\n');
  const {variable, errors} = await runProject(src);
  assert.deepEqual(errors, []);
  // n takes 1/2/3/4; only the n = 3 round should not hit
  assert.equal(Number(variable('命中')), 3, '!= was compiled as "left operand is truthy"');
  // It must also be true when the left operand is 0: the old shape not(not(0)) evaluated to false
  assert.equal(Number(variable('零也成立')), 1);
});

// The Chinese and English snake examples are the same program (the English one is
// examples/snake-en.pseudo), so the same "really playable" assertions run on both builds:
// breaking either side turns red immediately, and it also proves that a project written with
// English aliases runs just like the Chinese one.
const SNAKE_CASES = [
  {
    file: 'snake-zh-Hans.pseudo',
    n: {body: '蛇身', headX: '头x', headY: '头y', score: '分数', speed: '速度', foodX: '食物x', foodY: '食物y',
      dx: 'dx', dy: 'dy', nextDx: '新dx', nextDy: '新dy', part: '蛇身段'}
  },
  {
    file: 'snake-en.pseudo',
    n: {body: 'body', headX: 'headX', headY: 'headY', score: 'score', speed: 'speed', foodX: 'foodX', foodY: 'foodY',
      dx: 'dx', dy: 'dy', nextDx: 'nextDx', nextDy: 'nextDy', part: 'bodyPart'}
  }
];

for (const c of SNAKE_CASES) {
  test(`VM execution: ${c.file} is really playable (clones draw the body / eating food grows it / keys turn / biting itself ends)`, async () => {
    const src = fs.readFileSync(new URL(`../examples/${c.file}`, import.meta.url), 'utf8');
    const built = await buildFromSource(src, {baseDir: EXAMPLES_DIR});
    assert.deepEqual(built.problems, [], built.problems.join('\n'));
    // The body is drawn with clones and should no longer depend on the pen extension (the pen layer is a bitmap, and stamping rasterizes vector costumes)
    assert.deepEqual(built.extensions, [], `should not pull in extensions, got ${built.extensions}`);
    const vm = new VM();
    await vm.loadProject(built.buffer);
    // Control waits run in real time, so sleep between steps; keep the budget small, otherwise one _step burns 500ms.
    vm.runtime.currentStepTime = 32;
    const errors = [];
    vm.runtime.on('PROJECT_RUN_ERROR', e => errors.push(e && (e.message || String(e))));
    const stage = vm.runtime.getTargetForStage();
    const data = n => Object.values(stage.variables).find(x => x.name === n);
    const num = n => Number(data(n).value);
    const cells = () => data(c.n.body).value.map(Number);
    const code = (x, y) => (x + 20) * 100 + (y + 20);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const until = async (pred, limitMs) => {
      const t0 = Date.now();
      while (Date.now() - t0 < limitMs && !pred()) { vm.runtime._step(); await sleep(8); }
      return pred();
    };
    const parts = () => vm.runtime.targets.filter(t => t.getName() === c.n.part);
    const shown = () => parts().filter(t => !t.isOriginal && t.visible);

    vm.greenFlag();
    // The opening 说等待(1.2) (say-wait) runs in real time, so wait for the snake to start moving
    assert.ok(await until(() => num(c.n.headX) !== 0, 4000), 'the snake did not start moving after the green flag');
    const hx0 = num(c.n.headX);
    assert.equal(num(c.n.headY), 0, 'it should start off moving horizontally');
    assert.deepEqual(cells(), [code(hx0, 0), code(hx0 - 1, 0), code(hx0 - 2, 0)],
        'the initial body should be three cells in a row with the head at list item 1');

    // Body = clone pool: the original is hidden, visible clones = snake length - 1 (item 1 is occupied by the head sprite itself)
    assert.ok(await until(() => shown().length === 2, 3000), `expected 2 visible clones, got ${shown().length}`);
    assert.equal(parts().filter(t => t.isOriginal).every(t => t.visible === false), true, 'the original body segment should stay hidden');
    const want = [code(hx0 - 1, 0), code(hx0 - 2, 0)]
        .map(cc => [(Math.floor(cc / 100) - 20) * 24, (cc % 100 - 20) * 24]).sort((a, b) => a[0] - b[0]);
    const got = shown().map(t => [t.x, t.y]).sort((a, b) => a[0] - b[0]);
    assert.deepEqual(got, want, 'clones should stand on body segments 2 and 3');

    data(c.n.speed).value = 0.02; // speed up the tick in the test to save real time

    // Eat food: place the food one cell in front of the head
    const len0 = cells().length;
    const score0 = num(c.n.score);
    data(c.n.foodX).value = num(c.n.headX) + 1;
    data(c.n.foodY).value = num(c.n.headY);
    assert.ok(await until(() => num(c.n.score) === score0 + 1, 2000), 'the food is right in front of the head but was not eaten');
    assert.equal(cells().length, len0 + 1, 'the body should grow after eating food');
    assert.equal(cells()[0], code(num(c.n.headX), num(c.n.headY)), 'list item 1 should be the new head');
    assert.ok(await until(() => shown().length === cells().length - 1, 3000), 'growing one segment should add one more clone');

    // Key turning: pressing up while moving horizontally must be able to turn.
    // The guard is written 如果 (dy != -1) (if), and != used to silently drop the right operand
    // (not(not(dy))) — that made the guard always equal "dy is not 0", so it could never turn
    // while moving horizontally.
    vm.postIOData('keyboard', {key: 'ArrowUp', isDown: true});
    await sleep(60);
    vm.postIOData('keyboard', {key: 'ArrowUp', isDown: false});
    assert.ok(await until(() => num(c.n.headY) > 0, 2000), 'the snake did not go up after pressing up (the != guard failed)');
    const xAfterTurn = num(c.n.headX);
    const yAfterTurn = num(c.n.headY);
    assert.ok(await until(() => num(c.n.headY) > yAfterTurn, 2000), 'the snake did not keep going up after pressing up');
    assert.equal(num(c.n.headX), xAfterTurn, 'x should no longer change after turning upward');

    // Bite itself: set up a 2x2 box and drive the head right into its own body
    data(c.n.body).value = [code(0, 0), code(1, 0), code(1, 1), code(0, 1)];
    data(c.n.headX).value = 0;
    data(c.n.headY).value = 0;
    data(c.n.dx).value = 1;
    data(c.n.dy).value = 0;
    data(c.n.nextDx).value = 1;
    data(c.n.nextDy).value = 0;
    data(c.n.foodX).value = -8;
    data(c.n.foodY).value = 5;
    assert.ok(await until(() => vm.runtime.threads.length === 0, 6000), 'the game did not end after biting itself');
    assert.deepEqual(errors, []);
  });
}

test('VM execution: a non-refresh custom block runs to completion before yielding control', async () => {
  const src = [
    '全局 快 = 0',
    '全局 慢 = 0',
    '',
    '角色 主:',
    '  定义 加速 不刷新:',
    '    重复 (500):',
    '      快 ← 快 + 1',
    '  定义 常速:',
    '    重复 (500):',
    '      慢 ← 慢 + 1',
    '  绿旗:',
    '    加速()',
    '    常速()',
    ''
  ].join('\n');
  // The budget must be squeezed to 1ms. stepThreads keeps rescheduling all threads within the
  // currentStepTime budget; with a large budget (the default 10000), even a normal block can run
  // all 500 rounds in a single "step", so whether it is warp or not is invisible. At 1ms: a warp
  // block ignores the budget and finishes in one go, while a normal block yields each loop round
  // and only advances one or two rounds per step.
  const r = await runProject(src, {steps: 1, workMs: 1});
  assert.deepEqual(r.errors, []);
  assert.equal(Number(r.variable('快')), 500, 'the non-refresh block did not finish 500 rounds in one frame');
  assert.ok(Number(r.variable('慢')) < 500, `a normal block should not finish in one step, got ${r.variable('慢')}`);
  // Give it enough steps and the normal block still finishes, just slowly
  for (let i = 0; i < 100; i++) r.vm.runtime._step();
  assert.equal(Number(r.variable('慢')), 500, 'the normal block should eventually finish too');
});

test('VM execution: infix <= / >= really compares (built from pieces in Scratch)', async () => {
  const src = [
    '全局 甲 = 0',
    '全局 乙 = 0',
    '全局 丙 = 0',
    '全局 丁 = 0',
    '',
    '角色 主:',
    '  绿旗:',
    '    如果 (3 <= 3):',
    '      甲 ← 1',
    '    如果 (4 <= 3):',
    '      乙 ← 1',
    '    如果 (3 >= 3):',
    '      丙 ← 1',
    '    如果 (2 >= 3):',
    '      丁 ← 1',
    ''
  ].join('\n');
  const {variable, errors} = await runProject(src);
  assert.deepEqual(errors, []);
  assert.equal(Number(variable('甲')), 1, '3 <= 3 should be true');
  assert.equal(Number(variable('乙')), 0, '4 <= 3 should be false');
  assert.equal(Number(variable('丙')), 1, '3 >= 3 should be true');
  assert.equal(Number(variable('丁')), 0, '2 >= 3 should be false');
});
