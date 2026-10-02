import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {compile, PsError, verifyCatalog} from '../src/core/compiler.js';
import {aliasReference, GEN, EXT} from '../src/core/catalog.js';
import {buildFromSource} from '../src/build.js';
import {validateProject} from '../src/core/validate.js';
import {setLang} from '../src/core/i18n.js';

const require = createRequire(import.meta.url);

// The assertions below use Simplified Chinese message text verbatim. The app's
// default language is now English, so pin Simplified Chinese explicitly here
// (the message templates themselves still use Simplified Chinese as their baseline).
setLang('zh-Hans');

test('alias table matches scratch-blocks definitions', () => {
  const problems = verifyCatalog();
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('block alias table (for UI quick reference) matches catalog', () => {
  const rows = aliasReference();
  assert.ok(rows.length >= 90, `too few alias table entries: ${rows.length}`);
  const kinds = new Set();
  for (const r of rows) {
    assert.ok(GEN[r.op] || EXT[r.op], `${r.op} is in no catalog`);
    assert.ok(r.zh.length || r.en.length, `${r.op} has no writable alias`);
    assert.ok(r.group && r.group !== '其他', `${r.op} has no group`);
    kinds.add(r.kind);
  }
  assert.ok(kinds.has('帽子') && kinds.has('C形') && kinds.has('报值') && kinds.has('布尔'), `incomplete shapes: ${[...kinds].join(',')}`);
  const pen = rows.filter(r => r.group === '画笔');
  assert.ok(pen.length >= 10 && pen.every(r => r.op.startsWith('pen_')), 'the 画笔 (pen) group should stand on its own');
});

test('hello-zh-Hans.pseudo compiles + structural self-check', async () => {
  const src = fs.readFileSync(new URL('../examples/hello-zh-Hans.pseudo', import.meta.url), 'utf8');
  const r = await buildFromSource(src);
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  assert.ok(r.totalBlocks > 25, `too few blocks: ${r.totalBlocks}`);
  const names = r.targets.map(t => t.name);
  assert.deepEqual(names, ['Stage', '球', '影子'], 'multi-sprite order');
  const ball = r.project.targets.find(t => t.name === '球');
  const ops = Object.values(ball.blocks).map(b => b.opcode);
  assert.ok(ops.includes('event_whenflagclicked'), 'green-flag hat');
  assert.ok(ops.includes('procedures_definition'), 'custom block definition');
  assert.ok(ops.includes('procedures_call'), 'custom block call');
  assert.ok(ops.includes('control_create_clone_of'), 'clone');
  assert.ok(ops.includes('data_addtolist'), 'list');
  assert.ok(ops.includes('event_broadcast'), 'broadcast');
  const shadow = r.project.targets.find(t => t.name === '影子');
  const shadowOps = Object.values(shadow.blocks).map(b => b.opcode);
  assert.ok(shadowOps.includes('sensing_touchingobject'), 'boolean block');
  assert.ok(shadowOps.includes('control_start_as_clone'), 'clone hat');
});

test('the artifact is a valid zip and is accepted by scratch-parser', async () => {
  const src = fs.readFileSync(new URL('../examples/hello-zh-Hans.pseudo', import.meta.url), 'utf8');
  const r = await buildFromSource(src);
  assert.equal(r.buffer.slice(0, 2).toString('latin1'), 'PK');
  const parse = require('scratch-parser');
  const fn = parse.default || parse;
  const [json, unpacked] = await new Promise((resolve, reject) => {
    fn(r.buffer, false, (err, pair) => err ? reject(err) : resolve(pair));
  });
  assert.equal(json.targets[0].isStage, true, 'the stage must be targets[0]');
  assert.ok(json.targets.length >= 3);
  assert.match(json.meta.semver, /^3\./);
  assert.ok(unpacked.files['project.json'], 'project.json is inside the zip');
});

test('type error: a number stuffed into a boolean slot', () => {
  assert.throws(() => compile('舞台:\n  绿旗:\n    如果 (5):\n      显示\n'), e => e instanceof PsError && /布尔/.test(e.message));
});

test('undeclared variable error carries a line number', () => {
  assert.throws(() => compile('舞台:\n  绿旗:\n    未知量 ← 1\n'), e => e instanceof PsError && /第 3 行/.test(e.message));
});

test('custom block argument count is checked', () => {
  const src = '角色 A:\n  定义 加(a: 数, b: 数):\n    显示\n  绿旗:\n    加(1)\n';
  assert.throws(() => compile(src), e => e instanceof PsError && /需要 2 个参数/.test(e.message));
});

test('a boolean block cannot be inserted into a numeric slot', () => {
  assert.throws(() => compile('舞台:\n  绿旗:\n    移动到(1, 鼠标按下)\n'), e => e instanceof PsError);
});

test('an empty stage still yields a valid project', async () => {
  const r = await buildFromSource('舞台:\n');
  assert.deepEqual(r.problems, [], r.problems.join('\n'));
  assert.equal(r.project.targets[0].isStage, true);
});

const MENU_SRC = [
  '角色 A:',
  '  造型 "a.png"',
  '  声音 "b.wav"',
  '  变量 n = 1',
  '',
  '  绿旗:',
  '    换成造型("a")',
  '    播放声音("b")',
  '    如果 (碰到("边缘")):',
  '      克隆("自己")',
  '      移动 (距离("鼠标指针"))',
  '',
  '舞台:',
  '  背景 "c.png"',
  '',
  '  绿旗:',
  '    换成背景("c")',
  '    下一个背景',
  '',
  '  当背景换成("c"):',
  '    说("好")',
  ''
].join('\n');

function slotBlock (out, targetName, parentOp, slot) {
  const t = out.targets.find(x => x.name === targetName);
  assert.ok(t, `no target ${targetName}`);
  const parent = Object.values(t.blocks).find(b => b.opcode === parentOp);
  assert.ok(parent, `${parentOp} not found`);
  const ref = parent.inputs[slot];
  assert.ok(Array.isArray(ref) && typeof ref[1] === 'string', `${parentOp}.${slot} should point at a block, actually ${JSON.stringify(ref)}`);
  return {block: t.blocks[ref[1]], parentId: parent.id || Object.keys(t.blocks).find(k => t.blocks[k] === parent)};
}

test('touching/clone/costume/sound/backdrop menus become editor-native dropdown blocks', () => {
  const out = compile(MENU_SRC);
  const want = [
    ['A', 'looks_switchcostumeto', 'COSTUME', 'looks_costume', 'COSTUME', 'a'],
    ['A', 'sound_play', 'SOUND_MENU', 'sound_sounds_menu', 'SOUND_MENU', 'b'],
    ['A', 'sensing_touchingobject', 'TOUCHINGOBJECTMENU', 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', '_edge_'],
    ['A', 'control_create_clone_of', 'CLONE_OPTION', 'control_create_clone_of_menu', 'CLONE_OPTION', '_myself_'],
    ['A', 'sensing_distanceto', 'DISTANCETOMENU', 'sensing_distancetomenu', 'DISTANCETOMENU', '_mouse_'],
    ['Stage', 'looks_switchbackdropto', 'BACKDROP', 'looks_backdrops', 'BACKDROP', 'c'],
    ['Stage', 'event_whenbackdropswitchesto', 'BACKDROP', 'looks_backdrops', 'BACKDROP', 'c']
  ];
  for (const [target, op, slot, menuOp, field, value] of want) {
    const {block, parentId} = slotBlock(out, target, op, slot);
    assert.equal(block.opcode, menuOp, `${op}.${slot} dropdown block`);
    assert.equal(block.shadow, true, `${menuOp} should be marked as a shadow`);
    assert.equal(block.parent, parentId, `${menuOp} parent should point back at the host block`);
    assert.deepEqual(block.fields[field], [value], `${menuOp} field ${field}`);
  }
});

test('a costume slot filled by a variable or number does not get a forced dropdown block', () => {
  const out = compile('角色 A:\n  造型 "a.png"\n  变量 n = 1\n  绿旗:\n    换成造型(n)\n    换成造型(2)\n');
  const t = out.targets.find(x => x.name === 'A');
  const slots = Object.values(t.blocks).filter(b => b.opcode === 'looks_switchcostumeto').map(b => b.inputs.COSTUME);
  assert.equal(slots.length, 2);
  assert.match(JSON.stringify(slots[0]), /^\[1,\[12,"n",/, `a variable should be emitted as a variable block: ${JSON.stringify(slots[0])}`);
  assert.ok(Array.isArray(slots[1][1]), `a number should be emitted as a primitive: ${JSON.stringify(slots[1])}`);
  assert.equal(Object.values(t.blocks).some(b => b.opcode === 'looks_costume'), false, 'no dropdown block should appear');
});

test('hat quoted arguments are still handled by name: broadcast and key menus are unaffected by the costume menu rules', () => {
  const out = compile('角色 A:\n  绿旗:\n    广播("开始")\n  当收到("开始"):\n    显示\n  当按键("空格"):\n    显示\n');
  const t = out.targets.find(x => x.name === 'A');
  const bc = Object.values(t.blocks).find(b => b.opcode === 'event_broadcast');
  const shadow = t.blocks[bc.inputs.BROADCAST_INPUT[1]];
  assert.equal(shadow.opcode, 'event_broadcast_menu');
  assert.equal(shadow.fields.BROADCAST_OPTION[0], '开始');
  assert.equal(out.targets[0].broadcasts[shadow.fields.BROADCAST_OPTION[1]], '开始', 'the broadcast must be registered in stage.broadcasts');
  const hat = Object.values(t.blocks).find(b => b.opcode === 'event_whenbroadcastreceived');
  assert.deepEqual(hat.fields.BROADCAST_OPTION[0], '开始');
  const key = Object.values(t.blocks).find(b => b.opcode === 'event_whenkeypressed');
  assert.deepEqual(key.fields.KEY_OPTION, ['space']);
});

test('verifyCatalog catches a misspelled dynamic menu field name', () => {
  const {MENU_SHADOW} = require('../src/core/catalog.js');
  const original = MENU_SHADOW.costume.field;
  MENU_SHADOW.costume.field = 'COSTUMES';
  try {
    const problems = verifyCatalog();
    assert.ok(problems.some(p => /looks_switchcostumeto.*COSTUMES/.test(p)), problems.join('\n'));
  } finally {
    MENU_SHADOW.costume.field = original;
    assert.deepEqual(verifyCatalog(), []);
  }
});

test('verifyCatalog catches a misspelled extension menu shadow block name', () => {
  const {MENU_SHADOW} = require('../src/core/catalog.js');
  const original = MENU_SHADOW.drum.block;
  MENU_SHADOW.drum.block = 'music_drum';
  try {
    const problems = verifyCatalog();
    assert.ok(problems.some(p => /music_playDrumForBeats.*music_menu_DRUM/.test(p)), problems.join('\n'));
  } finally {
    MENU_SHADOW.drum.block = original;
    assert.deepEqual(verifyCatalog(), []);
  }
});

test('verifyCatalog catches an illegal value in a static dropdown', () => {
  const {MENU_SHADOW} = require('../src/core/catalog.js');
  const m = MENU_SHADOW.mathop;
  const original = m.values['向上取整'];
  m.values['向上取整'] = 'ceil';
  try {
    const problems = verifyCatalog();
    assert.ok(problems.some(p => /ceil/.test(p) && /mathop/.test(p)), problems.join('\n'));
  } finally {
    m.values['向上取整'] = original;
    assert.deepEqual(verifyCatalog(), []);
  }
});

test('static dropdowns become field values, dynamic menus become shadow dropdown blocks', () => {
  const out = compile([
    '角色 猫:',
    '  绿旗:',
    '    图层位置(最前)',
    '    移动层级(前, 2)',
    '    拖拽模式(允许拖拽)',
    '    特效设为(虚像, 40)',
    '    特效增加(亮度, 5)',
    '    音效设为(左右平衡, 0)',
    '    音效增加(音调, 10)',
    '    清除音效',
    '    面向(鼠标指针)',
    '    移到对象(随机位置)',
    '    滑行到对象(1, 鼠标指针)',
    '    说(造型信息(编号))',
    '    说(背景信息(名称))',
    '    说(目前的(星期))',
    '    说(2000年以来的天数)',
    '    音量增加(10)',
    '    说(音量)',
    '    说(响度)',
    '    说(用户名)',
    '    思考等待("想一下", 1)',
    '    隐藏全部'
  ].join('\n'));
  const t = out.targets.find(x => x.name === '猫');
  const byOp = op => Object.values(t.blocks).find(b => b.opcode === op);
  const field = (op, f) => byOp(op).fields[f];
  assert.deepEqual(field('looks_gotofrontback', 'FRONT_BACK'), ['front']);
  assert.deepEqual(field('looks_goforwardbackwardlayers', 'FORWARD_BACKWARD'), ['forward']);
  assert.deepEqual(field('sensing_setdragmode', 'DRAG_MODE'), ['draggable']);
  assert.deepEqual(field('looks_costumenumbername', 'NUMBER_NAME'), ['number']);
  assert.deepEqual(field('looks_backdropnumbername', 'NUMBER_NAME'), ['name']);
  assert.deepEqual(field('sensing_current', 'CURRENTMENU'), ['DAYOFWEEK']);
  assert.deepEqual(field('looks_seteffectto', 'EFFECT'), ['GHOST']);
  assert.deepEqual(field('looks_changeeffectby', 'EFFECT'), ['BRIGHTNESS']);
  assert.deepEqual(field('sound_seteffectto', 'EFFECT'), ['PAN']);
  assert.deepEqual(field('sound_changeeffectby', 'EFFECT'), ['PITCH']);
  assert.ok(byOp('sound_cleareffects'));
  const menu = (op, slot) => {
    const sh = t.blocks[byOp(op).inputs[slot][1]];
    assert.equal(sh.shadow, true, `${op}.${slot} dropdown block must be marked as a shadow`);
    return sh;
  };
  assert.equal(menu('motion_pointtowards', 'TOWARDS').opcode, 'motion_pointtowards_menu');
  assert.deepEqual(menu('motion_pointtowards', 'TOWARDS').fields.TOWARDS, ['_mouse_']);
  assert.equal(menu('motion_goto', 'TO').opcode, 'motion_goto_menu');
  assert.deepEqual(menu('motion_goto', 'TO').fields.TO, ['_random_']);
  assert.equal(menu('motion_glideto', 'TO').opcode, 'motion_glideto_menu');
  assert.ok(byOp('sensing_dayssince2000'), 'an alias starting with a digit must also be writable');
  assert.ok(byOp('sound_volume') && byOp('sensing_loudness') && byOp('sensing_username'));
  assert.deepEqual(byOp('looks_thinkforsecs').inputs.MESSAGE[1][1], '想一下');
  assert.ok(byOp('looks_hideallsprites'));
});

test('TurboWarp extra blocks: rotation/scene/camera/stretch/counter/loop/concurrency', async () => {
  const src = [
    '角色 猫:',
    '  变量 i = 0',
    '  列表 队列',
    '  绿旗:',
    '    旋转方式(不可旋转)',
    '    场景对齐(左下角)',
    '    镜头横移(40)',
    '    镜头纵移(-10)',
    '    说(镜头x)',
    '    伸缩设为(30)',
    '    伸缩增加(5)',
    '    显示列表(队列)',
    '    隐藏列表(队列)',
    '    计数器增加',
    '    说(计数器)',
    '    计数器清零',
    '    循环计数(i, 10):',
    '      说(连接("第 ", i))',
    '    当满足(颜色碰到颜色("#ff0000", "#00ff00")):',
    '      显示',
    '    并发执行:',
    '      如果 (很吵):',
    '        说(用户ID)',
    '    如果 (在线):',
    '      说("联网了")',
    '    横向拉伸设为(2)',
    '    拉伸增加(1, -1)',
    '',
    '  当碰到(边缘):',
    '    说("碰到了")'
  ].join('\n');
  const built = await buildFromSource(src);
  assert.deepEqual(built.problems, [], built.problems.join('\n'));
  const out = built.project;
  assert.deepEqual(validateProject(out), [], validateProject(out).join('\n'));
  const t = out.targets.find(x => x.name === '猫');
  const byOp = op => Object.values(t.blocks).find(b => b.opcode === op);
  // The static dropdown value contains an apostrophe, "don't rotate"; the earlier regex dropped this whole entry
  assert.deepEqual(byOp('motion_setrotationstyle').fields.STYLE, ["don't rotate"]);
  assert.deepEqual(byOp('motion_align_scene').fields.ALIGNMENT, ['bottom-left']);
  assert.deepEqual(byOp('motion_scroll_right').inputs.DISTANCE[1], [4, 40]);
  assert.ok(byOp('motion_xscroll') && byOp('looks_setstretchto') && byOp('looks_changestretchby'));
  // Variables/lists declared in a sprite body default to global (written on the Stage); only private ones stay in the sprite
  const varReg = Object.assign({}, ...out.targets.map(x => x.variables));
  const listReg = Object.assign({}, ...out.targets.map(x => x.lists));
  const listEntry = Object.entries(listReg).find(([, v]) => v[0] === '队列');
  assert.ok(listEntry, 'the list must be registered in target.lists');
  assert.deepEqual(byOp('data_showlist').fields.LIST, ['队列', listEntry[0]], 'the list field must be written as [name, id]');
  assert.deepEqual(byOp('data_hidelist').fields.LIST, ['队列', listEntry[0]]);
  assert.ok(byOp('control_incr_counter') && byOp('control_get_counter') && byOp('control_clear_counter'));
  const each = byOp('control_for_each');
  const vid = each.fields.VARIABLE[1];
  assert.deepEqual(each.fields.VARIABLE, ['i', vid]);
  assert.equal(varReg[vid][0], 'i', 'the loop variable reuses the same-named variable instead of creating another');
  // A C-shaped block's substack is [2, first child block id]; like a value slot's [type, ...] it must be read from index 1
  const sayInLoop = t.blocks[each.inputs.SUBSTACK[1]];
  const join = t.blocks[sayInLoop.inputs.MESSAGE[1]];
  assert.deepEqual(join.inputs.STRING2[1], [12, 'i', vid], 'the loop body sees the very same variable');
  assert.equal(sayInLoop.opcode, 'looks_say');
  const while_ = byOp('control_while');
  assert.equal(t.blocks[while_.inputs.CONDITION[1]].opcode, 'sensing_coloristouchingcolor');
  assert.deepEqual(t.blocks[while_.inputs.CONDITION[1]].inputs.COLOR[1], [9, '#ff0000'], 'the color slot uses primitive number 9');
  assert.equal(t.blocks[byOp('control_all_at_once').inputs.SUBSTACK[1]].opcode, 'control_if');
  assert.ok(byOp('sensing_loud') && byOp('sensing_userid'));
  assert.ok(byOp('sensing_online'), 'online-status block');
  assert.ok(byOp('stretch_setStretchX') && byOp('stretch_changeStretch'));
  // The hat's touching menu is a separate shadow block; the options are the two static ones in the source
  const hat = byOp('event_whentouchingobject');
  const hatShadowId = hat.inputs.TOUCHINGOBJECTMENU[1];
  const hatShadow = t.blocks[hatShadowId];
  assert.equal(hatShadow.opcode, 'event_touchingobjectmenu');
  assert.equal(hatShadow.shadow, true);
  assert.deepEqual(hatShadow.fields.TOUCHINGOBJECTMENU, ['_edge_']);
  assert.equal(hat.topLevel, true);
});

test('if/else emits a complete control_if_else', async () => {
  const src = [
    '角色 猫:',
    '  列表 名单',
    '  绿旗:',
    '    加入列表("小明", 名单)',
    '    如果 (列表包含(名单, "小明")):',
    '      说("在")',
    '    否则:',
    '      说("不在")',
    '    重复 (2):',
    '      如果 (很吵):',
    '        显示',
    '      否则:',
    '        隐藏',
    ''
  ].join('\n');
  const built = await buildFromSource(src);
  assert.deepEqual(built.problems, [], built.problems.join('\n'));
  assert.deepEqual(validateProject(built.project), [], validateProject(built.project).join('\n'));
  const t = built.project.targets.find(x => x.name === '猫');
  const ifs = Object.entries(t.blocks).filter(([, b]) => b.opcode === 'control_if_else');
  assert.equal(ifs.length, 2);
  for (const [id, b] of ifs) {
    // Earlier control_if_else registered no inputs, so CONDITION and SUBSTACK vanished and only the else branch remained
    for (const slot of ['CONDITION', 'SUBSTACK', 'SUBSTACK2']) {
      assert.ok(b.inputs[slot], `${id} is missing ${slot}`);
      assert.equal(t.blocks[b.inputs[slot][1]].parent, id, `${slot}'s child block must point back at if_else`);
    }
    assert.equal(t.blocks[b.inputs.SUBSTACK[1]].next, null);
    assert.equal(t.blocks[b.inputs.SUBSTACK2[1]].next, null);
  }
  const [condId, cond] = ifs[0];
  assert.equal(t.blocks[cond.inputs.CONDITION[1]].opcode, 'data_listcontainsitem');
  assert.equal(t.blocks[cond.inputs.SUBSTACK[1]].opcode, 'looks_say');
  assert.deepEqual(t.blocks[cond.inputs.SUBSTACK[1]].inputs.MESSAGE[1][1], '在');
  assert.deepEqual(t.blocks[cond.inputs.SUBSTACK2[1]].inputs.MESSAGE[1][1], '不在');
  assert.equal(ifs[1][1].inputs.CONDITION[1], Object.entries(t.blocks).find(([, b]) => b.opcode === 'sensing_loud')?.[0], 'the boolean slot is fed by sensing_loud');
});

test('list index dropdowns and list-content reporters', async () => {  const src = [
    '角色 猫:',
    '  列表 队列',
    '  变量 i = 2',
    '  绿旗:',
    '    加入列表("甲", 队列)',
    '    说(列表第项("随机", 队列))',
    '    说(列表第项(i, 队列))',
    '    替换列表("末尾", "乙", 队列)',
    '    插入列表(1, "丙", 队列)',
    '    删除列表第项("全部", 队列)',
    '    说(列表内容(队列))',
    '    说(列表长度(队列))',
    '    说(列表项位置("甲", 队列))',
    ''
  ].join('\n');
  const built = await buildFromSource(src);
  assert.deepEqual(built.problems, [], built.problems.join('\n'));
  const out = built.project;
  assert.deepEqual(validateProject(out), [], validateProject(out).join('\n'));
  const t = out.targets.find(x => x.name === '猫');
  // A serialized block object has no id field; the map key is needed to verify parent pointers
  const findId = opcode => Object.entries(t.blocks).find(([, b]) => b.opcode === opcode);
  const listReg = Object.assign({}, ...out.targets.map(x => x.lists));
  const varReg = Object.assign({}, ...out.targets.map(x => x.variables));
  const lid = Object.entries(listReg).find(([, v]) => v[0] === '队列')[0];
  const iid = Object.entries(varReg).find(([, v]) => v[0] === 'i')[0];

  // A dropdown is a "value input slot + shadow block"; the slot must not hold bare text, or the editor shows the raw English value
  const [itemId, item] = findId('data_itemoflist');
  const rnd = t.blocks[item.inputs.INDEX[1]];
  assert.equal(rnd.opcode, 'data_listindexrandom');
  assert.equal(rnd.shadow, true);
  assert.deepEqual(rnd.fields.INDEX, ['random']);
  assert.equal(rnd.parent, itemId, 'the shadow block parent points at the parent block');
  assert.deepEqual(item.fields.LIST, ['队列', lid]);
  const item2 = Object.entries(t.blocks).filter(([, b]) => b.opcode === 'data_itemoflist')[1][1];
  assert.deepEqual(item2.inputs.INDEX[1], [12, 'i', iid], 'a variable used as an index still goes through an expression');

  const [, del] = findId('data_deleteoflist');
  const all = t.blocks[del.inputs.INDEX[1]];
  assert.equal(all.opcode, 'data_listindexall');
  assert.deepEqual(all.fields.INDEX, ['all']);

  const [, rep] = findId('data_replaceitemoflist');
  assert.equal(t.blocks[rep.inputs.INDEX[1]].opcode, 'data_listindexrandom');
  assert.deepEqual(t.blocks[rep.inputs.INDEX[1]].fields.INDEX, ['last']);
  // Beyond the index menu, the list itself can also be read out in full
  const [, contents] = findId('data_listcontents');
  assert.deepEqual(contents.fields.LIST, ['队列', lid]);
  assert.equal(contents.topLevel, false);
  // A reporter block's list field used to emit only the name; without the id the VM cannot find the list
  for (const op of ['data_lengthoflist', 'data_itemnumoflist']) {
    const [, b] = Object.entries(t.blocks).find(([, x]) => x.opcode === op);
    assert.deepEqual(b.fields.LIST, ['队列', lid], `${op}'s LIST field`);
  }

  // "全部" (all) is a valid index only in delete; it cannot be chosen when reading a list
  assert.throws(() => compile('角色 猫:\n  列表 队列\n  绿旗:\n    说(列表第项("全部", 队列))\n'),
      e => e instanceof PsError && /没有选项/.test(e.message));
});

test('the infix != emits not(a == b), and neither operand may be dropped', () => {
  const out = compile('全局 甲 = 1\n\n角色 A:\n  绿旗:\n    如果 (甲 != 2):\n      显示\n');
  const t = out.targets.find(x => x.name === 'A');
  const blocks = Object.values(t.blocks);
  const nots = blocks.filter(b => b.opcode === 'operator_not');
  // Earlier INFIX_OPS['!='] had op / negate swapped: it first emitted operator_not as the comparison block (dropping
  // the right operand on the spot), then wrapped another operator_not around it, so the result was always "left operand is truthy"
  // and compilation never reported an error.
  assert.equal(nots.length, 1, `!= should be wrapped in exactly one not, actually ${nots.length} levels`);
  const innerId = nots[0].inputs.OPERAND[1];
  assert.equal(typeof innerId, 'string', 'OPERAND should point at the inner comparison block');
  const inner = t.blocks[innerId];
  assert.equal(inner.opcode, 'operator_equals', `the inner block should be operator_equals, actually ${inner.opcode}`);
  assert.ok(inner.inputs.OPERAND1, 'the left operand was dropped');
  assert.deepEqual(inner.inputs.OPERAND2, [1, [4, 2]], 'the right operand was dropped');
});

test('custom block "no refresh" emits warp="true" (on both definition and prototype)', () => {
  const out = compile([
    '角色 A:',
    '  定义 画(n: 数) 不刷新:',
    '    显示',
    '  定义 普通:',
    '    显示',
    '  定义 换个写法 warp:',
    '    显示',
    '  绿旗:',
    '    画(1)',
    '    普通()',
    '    换个写法()',
    ''
  ].join('\n'));
  const t = out.targets.find(x => x.name === 'A');
  const defs = Object.values(t.blocks).filter(b => b.opcode === 'procedures_definition');
  const protos = Object.values(t.blocks).filter(b => b.opcode === 'procedures_prototype');
  assert.equal(defs.length, 3);
  const find = (list, code) => {
    const b = list.find(x => x.mutation.proccode === code);
    assert.ok(b, `proccode ${code} not found`);
    return b;
  };
  // The syntax with parameters + modifier: the modifier comes after the parameter list and before the colon
  assert.equal(find(defs, '画 %n').mutation.warp, 'true');
  assert.equal(find(defs, '普通').mutation.warp, 'false');
  assert.equal(find(defs, '换个写法').mutation.warp, 'true');
  // The sequencer reads the mutation on the prototype; the two places must agree
  assert.equal(find(protos, '画 %n').mutation.warp, 'true');
  assert.equal(find(protos, '普通').mutation.warp, 'false');
  assert.equal(find(protos, '换个写法').mutation.warp, 'true');
  // warp must be a string; a boolean makes the VM take the other branch
  assert.equal(typeof find(defs, '普通').mutation.warp, 'string');
});

test('the infix <= and >= emit not(a > b) / not(a < b), and neither operand may be dropped', () => {
  const out = compile('全局 甲 = 1\n\n角色 A:\n  绿旗:\n    如果 (甲 <= 2):\n      显示\n    如果 (甲 >= 2):\n      显示\n');
  const t = out.targets.find(x => x.name === 'A');
  const blocks = Object.values(t.blocks);
  const nots = blocks.filter(b => b.opcode === 'operator_not');
  assert.equal(nots.length, 2, `each comparison is wrapped in one not, actually ${nots.length} levels`);
  const inner = nots.map(n => t.blocks[n.inputs.OPERAND[1]]);
  // Scratch has no <= / >= blocks, so they must be assembled: a <= b == not(a > b), a >= b == not(a < b)
  assert.deepEqual(inner.map(b => b.opcode).sort(), ['operator_gt', 'operator_lt']);
  for (const b of inner) {
    assert.ok(b.inputs.OPERAND1, `${b.opcode}'s left operand was dropped`);
    assert.deepEqual(b.inputs.OPERAND2, [1, [4, 2]], `${b.opcode}'s right operand was dropped`);
  }
});
