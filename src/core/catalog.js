// Opcode/slot data validated against generated-catalog.json (from scratch-blocks source),
// plus the pseudocode alias table. Alias typos fail loudly at load, not silently at emit.
import fs from 'node:fs';
import {augmentCatalog, menuLabelsFor, groupLabel, kindLabel} from './aliases-i18n.js';

const gen = JSON.parse(fs.readFileSync(new URL('./generated-catalog.json', import.meta.url), 'utf8'));
export const GEN = gen.blocks;

// Extension blocks (pen, music, TurboWarp Stretch, ...) are machine-generated from the
// scratch-vm extension sources and the cached official TurboWarp extension files, so the
// opcodes/slots here cannot drift from what a real editor writes.
const genExt = JSON.parse(fs.readFileSync(new URL('./generated-extensions.json', import.meta.url), 'utf8'));
export const GENEXT = genExt.blocks;
export const EXT_META = genExt.extensions;
// Dropdown options scraped from the extension sources plus Scratch's own Chinese labels.
const GENEXT_MENUS = genExt.menus || {};

export const EXT = Object.fromEntries(Object.entries(GENEXT).map(([op, b]) => [
  op,
  {kind: b.kind, inputs: b.inputs.map(i => ({name: i.name})), fields: b.fields.map(f => ({name: f.name}))}
]));

export const EXTENSION_FOR_OPCODE = op => {
  let b = GENEXT[op];
  if (!b) {
    // The dropdown block of an extension menu (e.g. music_menu_DRUM) is built on the fly
    // by the editor as <extension>_menu_<menu>; the source does not declare it, but it
    // still belongs to that extension, otherwise the extension will not be loaded.
    const m = /^([a-z0-9]+)_menu_/.exec(op);
    if (!m || !GENEXT_MENUS[m[1]]) return null;
    b = {ext: m[1]};
  }
  const meta = EXT_META[b.ext];
  return {id: b.ext, url: meta ? meta.url : null};
};

export const EXTENSION_URLS = Object.fromEntries(
  Object.entries(EXT_META).filter(([, m]) => m.url).map(([id, m]) => [id, m.url])
);

// Slot type vocabulary. 'in' = value input, 'field' = Blockly dropdown/label field.
// params entries: [name, type] where a leading '@' marks a field.
// type 'menu:key' etc. means a value input filled by a menu shadow block.
export const OPS = {
  // ---- motion ----
  motion_movesteps: {zh: ['移动步', '移动'], en: ['move steps', 'movesteps'], params: [['STEPS', 'num']]},
  motion_gotoxy: {zh: ['移到坐标', '移到'], en: ['goto xy'], params: [['X', 'num'], ['Y', 'num']]},
  motion_glidesecstoxy: {zh: ['滑行到'], en: ['glide to'], params: [['SECS', 'num'], ['X', 'num'], ['Y', 'num']]},
  motion_changexby: {zh: ['x增加'], en: ['change x by'], params: [['DX', 'num']]},
  motion_changeyby: {zh: ['y增加'], en: ['change y by'], params: [['DY', 'num']]},
  motion_setx: {zh: ['x设为'], en: ['set x'], params: [['X', 'num']]},
  motion_sety: {zh: ['y设为'], en: ['set y'], params: [['Y', 'num']]},
  motion_turnright: {zh: ['右转'], en: ['turn right'], params: [['DEGREES', 'num']]},
  motion_turnleft: {zh: ['左转'], en: ['turn left'], params: [['DEGREES', 'num']]},
  motion_pointindirection: {zh: ['指向'], en: ['point in direction'], params: [['DIRECTION', 'num']]},
  motion_pointtowards: {zh: ['面向'], en: ['point towards'], params: [['TOWARDS', 'menu:towards']]},
  motion_goto: {zh: ['移到对象'], en: ['goto object'], params: [['TO', 'menu:destination']]},
  motion_glideto: {zh: ['滑行到对象'], en: ['glideto object'], params: [['SECS', 'num'], ['TO', 'menu:glideto']]},
  motion_setrotationstyle: {zh: ['旋转方式'], en: ['set rotation style'], params: [['@STYLE', 'menu:rotation']]},
  motion_align_scene: {zh: ['场景对齐'], en: ['align scene'], params: [['@ALIGNMENT', 'menu:alignment']]},
  motion_scroll_right: {zh: ['镜头横移'], en: ['scroll right'], params: [['DISTANCE', 'num']]},
  motion_scroll_up: {zh: ['镜头纵移'], en: ['scroll up'], params: [['DISTANCE', 'num']]},
  motion_xscroll: {zh: ['镜头x'], en: ['x scroll'], kind: 'reporter', out: 'num', params: []},
  motion_yscroll: {zh: ['镜头y'], en: ['y scroll'], kind: 'reporter', out: 'num', params: []},
  motion_ifonedgebounce: {zh: ['碰到边缘就反弹'], en: ['if on edge bounce'], params: []},
  motion_xposition: {zh: ['x坐标'], en: ['x position'], kind: 'reporter', out: 'num', params: []},
  motion_yposition: {zh: ['y坐标'], en: ['y position'], kind: 'reporter', out: 'num', params: []},
  motion_direction: {zh: ['方向'], en: ['direction'], kind: 'reporter', out: 'num', params: []},

  // ---- looks ----
  looks_show: {zh: ['显示'], en: ['show'], params: []},
  looks_hide: {zh: ['隐藏'], en: ['hide'], params: []},
  looks_say: {zh: ['说'], en: ['say'], params: [['MESSAGE', 'str']]},
  looks_sayforsecs: {zh: ['说等待'], en: ['say for'], params: [['MESSAGE', 'str'], ['SECS', 'num']]},
  looks_think: {zh: ['思考'], en: ['think'], params: [['MESSAGE', 'str']]},
  looks_setsizeto: {zh: ['大小设为'], en: ['set size'], params: [['SIZE', 'num']]},
  looks_changesizeby: {zh: ['大小增加'], en: ['change size by'], params: [['CHANGE', 'num']]},
  looks_nextcostume: {zh: ['下一个造型'], en: ['next costume'], params: []},
  looks_switchcostumeto: {zh: ['换成造型'], en: ['switch costume'], params: [['COSTUME', 'menu:costume']]},
  looks_nextbackdrop: {zh: ['下一个背景'], en: ['next backdrop'], params: []},
  looks_switchbackdropto: {zh: ['换成背景'], en: ['switch backdrop'], params: [['BACKDROP', 'menu:backdrop']]},
  looks_switchbackdroptoandwait: {zh: ['换成背景并等待'], en: ['switch backdrop and wait'], params: [['BACKDROP', 'menu:backdrop']]},
  looks_size: {zh: ['大小'], en: ['size'], kind: 'reporter', out: 'num', params: []},
  looks_cleargraphiceffects: {zh: ['清除图形特效'], en: ['clear graphic effects'], params: []},
  looks_thinkforsecs: {zh: ['思考等待'], en: ['think for'], params: [['MESSAGE', 'str'], ['SECS', 'num']]},
  looks_hideallsprites: {zh: ['隐藏全部'], en: ['hide all sprites'], params: []},
  looks_gotofrontback: {zh: ['图层位置'], en: ['go to front back'], params: [['@FRONT_BACK', 'menu:frontback']]},
  looks_goforwardbackwardlayers: {zh: ['移动层级'], en: ['go layers'], params: [['@FORWARD_BACKWARD', 'menu:forwardback'], ['NUM', 'num']]},
  looks_costumenumbername: {zh: ['造型信息'], en: ['costume number name'], kind: 'reporter', out: 'any', params: [['@NUMBER_NAME', 'menu:numbername']]},
  looks_backdropnumbername: {zh: ['背景信息'], en: ['backdrop number name'], kind: 'reporter', out: 'any', params: [['@NUMBER_NAME', 'menu:numbername']]},
  looks_seteffectto: {zh: ['特效设为'], en: ['set effect'], params: [['@EFFECT', 'menu:effect'], ['VALUE', 'num']]},
  looks_changeeffectby: {zh: ['特效增加'], en: ['change effect'], params: [['@EFFECT', 'menu:effect'], ['CHANGE', 'num']]},
  looks_setstretchto: {zh: ['伸缩设为'], en: ['set stretch'], params: [['STRETCH', 'num']]},
  looks_changestretchby: {zh: ['伸缩增加'], en: ['change stretch'], params: [['CHANGE', 'num']]},

  // ---- sound ----
  sound_play: {zh: ['播放声音'], en: ['start sound'], params: [['SOUND_MENU', 'menu:soundname']]},
  sound_playuntildone: {zh: ['播放声音并等待'], en: ['play sound until done'], params: [['SOUND_MENU', 'menu:soundname']]},
  sound_stopallsounds: {zh: ['停止全部声音'], en: ['stop all sounds'], params: []},
  sound_setvolto: {zh: ['音量设为'], en: ['set volume'], params: [['VOLUME', 'num']], op: 'sound_setvolumeto'},
  sound_changevolumeby: {zh: ['音量增加'], en: ['change volume by'], params: [['VOLUME', 'num']]},
  sound_volume: {zh: ['音量'], en: ['volume'], kind: 'reporter', out: 'num', params: []},
  sound_seteffectto: {zh: ['音效设为'], en: ['set sound effect'], params: [['@EFFECT', 'menu:soundeffect'], ['VALUE', 'num']]},
  sound_changeeffectby: {zh: ['音效增加'], en: ['change sound effect'], params: [['@EFFECT', 'menu:soundeffect'], ['VALUE', 'num']]},
  sound_cleareffects: {zh: ['清除音效'], en: ['clear sound effects'], params: []},

  // ---- control ----
  control_wait: {zh: ['等待'], en: ['wait'], params: [['DURATION', 'num']]},
  control_waituntil: {zh: ['等待直到'], en: ['wait until'], params: [['CONDITION', 'bool']], op: 'control_wait_until'},
  control_repeat: {zh: ['重复'], en: ['repeat'], cblock: true, params: [['TIMES', 'num']], sub: 'SUBSTACK'},
  control_while: {zh: ['当满足'], en: ['while'], cblock: true, params: [['CONDITION', 'bool']], sub: 'SUBSTACK'},
  control_forever_each: {zh: ['循环计数', '对于每个'], en: ['for each'], op: 'control_for_each', cblock: true, params: [['@VARIABLE', 'var'], ['VALUE', 'num']], sub: 'SUBSTACK'},
  control_all_at_once: {zh: ['并发执行', '同时执行'], en: ['all at once'], cblock: true, kw: true, params: [], sub: 'SUBSTACK'},
  control_get_counter: {zh: ['计数器'], en: ['counter'], kind: 'reporter', out: 'num', params: []},
  control_incr_counter: {zh: ['计数器增加'], en: ['increment counter'], params: []},
  control_clear_counter: {zh: ['计数器清零'], en: ['clear counter'], params: []},
  control_forever: {zh: ['重复永远', '永远'], en: ['forever'], cblock: true, kw: true, params: [], sub: 'SUBSTACK'},
  control_repeat_until: {zh: ['重复直到'], en: ['repeat until'], cblock: true, params: [['CONDITION', 'bool']], sub: 'SUBSTACK'},
  control_if: {zh: ['如果', '若'], en: ['if'], cblock: true, params: [['CONDITION', 'bool']], sub: 'SUBSTACK'},
  control_if_else: {zh: ['如果否则'], en: ['if else'], cblock: true, hidden: true, params: [['CONDITION', 'bool']], sub: 'SUBSTACK'},
  control_stop: {zh: ['停止'], en: ['stop'], cap: true, params: [['@STOP_OPTION', 'menu:stop']], defaultArgs: [{t: 'name', v: '全部'}]},
  control_create_clone_of: {zh: ['克隆'], en: ['create clone of'], params: [['CLONE_OPTION', 'menu:clone']]},
  clone_self: {zh: ['克隆自己'], en: ['create clone myself'], hidden: true, op: 'control_create_clone_of', params: [['CLONE_OPTION', 'menu:clone']], defaultArgs: [{t: 'name', v: '自己'}]},
  control_delete_this_clone: {zh: ['删除克隆体'], en: ['delete this clone'], cap: true, params: []},
  control_start_as_clone: {zh: ['当作为克隆体启动时', '克隆开始'], en: ['when start as clone'], hat: true, params: []},

  // ---- event ----
  event_broadcast: {zh: ['广播'], en: ['broadcast'], params: [['BROADCAST_INPUT', 'menu:broadcast']]},
  event_broadcastandwait: {zh: ['广播并等待'], en: ['broadcast and wait'], params: [['BROADCAST_INPUT', 'menu:broadcast']]},

  // ---- sensing ----
  sensing_resettimer: {zh: ['重置计时器'], en: ['reset timer'], params: []},
  sensing_loudness: {zh: ['响度'], en: ['loudness'], kind: 'reporter', out: 'num', params: []},
  sensing_username: {zh: ['用户名'], en: ['username'], kind: 'reporter', out: 'str', params: []},
  sensing_dayssince2000: {zh: ['2000年以来的天数'], en: ['days since 2000'], kind: 'reporter', out: 'num', params: []},
  sensing_current: {zh: ['目前的', '当前时间'], en: ['current'], kind: 'reporter', out: 'num', params: [['@CURRENTMENU', 'menu:currentmenu']]},
  sensing_coloristouchingcolor: {zh: ['颜色碰到颜色'], en: ['color touching color'], kind: 'boolean', out: 'bool', params: [['COLOR', 'color'], ['COLOR2', 'color']]},
  sensing_loud: {zh: ['很吵'], en: ['loud'], kind: 'boolean', out: 'bool', params: []},
  sensing_userid: {zh: ['用户ID'], en: ['user id'], kind: 'reporter', out: 'str', params: []},
  sensing_setdragmode: {zh: ['拖拽模式'], en: ['set drag mode'], params: [['@DRAG_MODE', 'menu:dragmode']]},
  sensing_askandwait: {zh: ['询问'], en: ['ask and wait'], params: [['QUESTION', 'str']]},
  sensing_timer: {zh: ['计时器'], en: ['timer'], kind: 'reporter', out: 'num', params: []},
  sensing_answer: {zh: ['答案'], en: ['answer'], kind: 'reporter', out: 'str', params: []},
  sensing_mousedown: {zh: ['鼠标按下'], en: ['mouse down'], kind: 'boolean', out: 'bool', params: []},
  sensing_mousex: {zh: ['鼠标x'], en: ['mouse x'], kind: 'reporter', out: 'num', params: []},
  sensing_mousey: {zh: ['鼠标y'], en: ['mouse y'], kind: 'reporter', out: 'num', params: []},
  sensing_keypressed: {zh: ['按键按下', '按键'], en: ['key pressed'], kind: 'boolean', out: 'bool', params: [['KEY_OPTION', 'menu:key']]},
  sensing_touchingobject: {zh: ['碰到'], en: ['touching'], kind: 'boolean', out: 'bool', params: [['TOUCHINGOBJECTMENU', 'menu:touching']]},
  sensing_touchingcolor: {zh: ['碰到颜色'], en: ['touching color'], kind: 'boolean', out: 'bool', params: [['COLOR', 'color']]},
  sensing_distanceto: {zh: ['距离'], en: ['distance to'], kind: 'reporter', out: 'num', params: [['DISTANCETOMENU', 'menu:sprite']]},
  sensing_online: {zh: ['在线', '联网'], en: ['online'], kind: 'boolean', out: 'bool', params: []},

  // ---- data ----
  data_showvariable: {zh: ['显示变量'], en: ['show variable'], params: [['@VARIABLE', 'var']]},
  data_hidevariable: {zh: ['隐藏变量'], en: ['hide variable'], params: [['@VARIABLE', 'var']]},
  data_showlist: {zh: ['显示列表'], en: ['show list'], params: [['@LIST', 'list']]},
  data_hidelist: {zh: ['隐藏列表'], en: ['hide list'], params: [['@LIST', 'list']]},
  data_addtolist: {zh: ['加入列表'], en: ['add to list'], params: [['ITEM', 'any'], ['@LIST', 'list']]},
  data_deleteoflist: {zh: ['删除列表第项'], en: ['delete of list'], params: [['INDEX', 'menu:listindexall'], ['@LIST', 'list']]},
  data_deletealloflist: {zh: ['清空列表'], en: ['delete all of'], params: [['@LIST', 'list']]},
  data_insertatlist: {zh: ['插入列表'], en: ['insert at of list'], params: [['INDEX', 'menu:listindexrandom'], ['ITEM', 'any'], ['@LIST', 'list']]},
  data_replaceitemoflist: {zh: ['替换列表'], en: ['replace item of list'], params: [['INDEX', 'menu:listindexrandom'], ['ITEM', 'any'], ['@LIST', 'list']]},
  data_lengthoflist: {zh: ['列表长度'], en: ['length of list'], kind: 'reporter', out: 'num', params: [['@LIST', 'list']]},
  data_itemoflist: {zh: ['列表第项'], en: ['item of list'], kind: 'reporter', out: 'any', params: [['INDEX', 'menu:listindexrandom'], ['@LIST', 'list']]},
  data_listcontents: {zh: ['列表内容'], en: ['list contents'], kind: 'reporter', out: 'str', params: [['@LIST', 'list']]},
  data_itemnumoflist: {zh: ['列表项位置'], en: ['item num of list'], kind: 'reporter', out: 'num', params: [['ITEM', 'any'], ['@LIST', 'list']]},
  data_listcontainsitem: {zh: ['列表包含'], en: ['list contains'], kind: 'boolean', out: 'bool', params: [['@LIST', 'list'], ['ITEM', 'any']]},

  // ---- operators / math ----
  operator_length: {zh: ['长度'], en: ['length of'], kind: 'reporter', out: 'num', params: [['STRING', 'any']]},
  operator_letter_of: {zh: ['字符'], en: ['letter of'], kind: 'reporter', out: 'str', params: [['LETTER', 'num'], ['STRING', 'any']]},
  operator_join: {zh: ['连接'], en: ['join'], kind: 'reporter', out: 'str', params: [['STRING1', 'any'], ['STRING2', 'any']]},
  operator_contains: {zh: ['文本包含'], en: ['contains'], kind: 'boolean', out: 'bool', params: [['STRING1', 'any'], ['STRING2', 'any']]},
  operator_mod: {zh: ['取余'], en: ['mod'], kind: 'reporter', out: 'num', params: [['NUM1', 'num'], ['NUM2', 'num']], infix: '%'},
  operator_round: {zh: ['取整', '四舍五入'], en: ['round'], kind: 'reporter', out: 'num', params: [['NUM', 'num']]},
  operator_mathop: {zh: ['数学'], en: ['mathop'], kind: 'reporter', out: 'num', params: [['@OPERATOR', 'menu:mathop'], ['NUM', 'num']]},
  operator_random: {zh: ['随机'], en: ['pick random'], kind: 'reporter', out: 'num', params: [['FROM', 'num'], ['TO', 'num']]},
  operator_not: {zh: ['非'], en: ['not'], kind: 'boolean', out: 'bool', prefix: true, params: [['OPERAND', 'bool']]},
  operator_and: {zh: ['与'], en: ['and'], kind: 'boolean', out: 'bool', infix: '与', params: [['OPERAND1', 'bool'], ['OPERAND2', 'bool']]},
  operator_or: {zh: ['或'], en: ['or'], kind: 'boolean', out: 'bool', infix: '或', params: [['OPERAND1', 'bool'], ['OPERAND2', 'bool']]},

  // ---- extension: pen ----
  pen_penDown: {zh: ['落笔', '下笔'], en: ['pen down'], params: []},
  pen_penUp: {zh: ['抬笔', '上笔'], en: ['pen up'], params: []},
  pen_clear: {zh: ['清空画笔'], en: ['erase all'], params: []},
  pen_stamp: {zh: ['图章'], en: ['stamp'], params: []},
  pen_setPenSizeTo: {zh: ['画笔大小设为'], en: ['set pen size'], params: [['SIZE', 'num']]},
  pen_changePenSizeBy: {zh: ['画笔大小增加'], en: ['change pen size by'], params: [['SIZE', 'num']]},
  pen_setPenColorToColor: {zh: ['画笔颜色设为'], en: ['set pen color to'], params: [['COLOR', 'color']]},
  pen_setPenHueToNumber: {zh: ['画笔色相设为'], en: ['set pen hue to'], params: [['HUE', 'num']]},
  pen_changePenHueBy: {zh: ['画笔色相增加'], en: ['change pen hue by'], params: [['HUE', 'num']]},
  pen_setPenShadeToNumber: {zh: ['画笔亮度设为'], en: ['set pen shade to'], params: [['SHADE', 'num']]},
  pen_changePenShadeBy: {zh: ['画笔亮度增加'], en: ['change pen shade by'], params: [['SHADE', 'num']]},

  // ---- extension: TurboWarp Stretch ----
  stretch_setStretchX: {zh: ['横向拉伸设为', '拉伸x设为'], en: ['set stretch x to'], params: [['X', 'num']]},
  stretch_setStretchY: {zh: ['纵向拉伸设为', '拉伸y设为'], en: ['set stretch y to'], params: [['Y', 'num']]},
  stretch_setStretch: {zh: ['拉伸设为'], en: ['set stretch to'], params: [['X', 'num'], ['Y', 'num']]},
  stretch_changeStretch: {zh: ['拉伸增加'], en: ['change stretch by'], params: [['DX', 'num'], ['DY', 'num']]},
  stretch_changeStretchX: {zh: ['横向拉伸增加'], en: ['change stretch x by'], params: [['DX', 'num']]},
  stretch_changeStretchY: {zh: ['纵向拉伸增加'], en: ['change stretch y by'], params: [['DY', 'num']]},
  stretch_getX: {zh: ['横向拉伸', '拉伸x'], en: ['x stretch'], kind: 'reporter', out: 'num', params: []},
  stretch_getY: {zh: ['纵向拉伸', '拉伸y'], en: ['y stretch'], kind: 'reporter', out: 'num', params: []},

  // ---- extension: built-in Scratch music (drum/instrument menu items come from generated data) ----
  music_playNoteForBeats: {zh: ['播放音符', '弹奏'], en: ['play note'], params: [['NOTE', 'any'], ['BEATS', 'num']]},
  music_playDrumForBeats: {zh: ['击鼓', '敲鼓', '击打'], en: ['play drum'], params: [['DRUM', 'menu:drum'], ['BEATS', 'num']]},
  music_setInstrument: {zh: ['乐器设为', '换乐器'], en: ['set instrument'], params: [['INSTRUMENT', 'menu:instrument']]},
  music_restForBeats: {zh: ['休止', '休息'], en: ['rest for'], params: [['BEATS', 'num']]},
  music_setTempo: {zh: ['节拍速度设为'], en: ['set tempo to'], params: [['TEMPO', 'num']]},
  music_changeTempo: {zh: ['节拍速度增加'], en: ['change tempo by'], params: [['TEMPO', 'num']]},
  music_getTempo: {zh: ['节拍速度'], en: ['tempo'], kind: 'reporter', out: 'num', params: []},
  music_midiSetInstrument: {zh: ['乐器编号设为'], en: ['set midi instrument'], params: [['INSTRUMENT', 'num']]}
};

// Infix operators that map straight onto a two-operand block.
export const INFIX_OPS = {
  '+': {op: 'operator_add', out: 'num', prec: 10},
  '-': {op: 'operator_subtract', out: 'num', prec: 10},
  '*': {op: 'operator_multiply', out: 'num', prec: 20},
  '/': {op: 'operator_divide', out: 'num', prec: 20},
  '%': {op: 'operator_mod', out: 'num', prec: 20},
  '<': {op: 'operator_lt', out: 'bool', prec: 5},
  '>': {op: 'operator_gt', out: 'bool', prec: 5},
  '=': {op: 'operator_equals', out: 'bool', prec: 5},
  '==': {op: 'operator_equals', out: 'bool', prec: 5},
  '!=': {op: 'operator_equals', negate: 'operator_not', out: 'bool', prec: 5},
  // Scratch has no "less than or equal / greater than or equal" blocks, so they are
  // assembled from not(a > b) / not(a < b).
  // op is the base block, negate is the wrapper around it — swap them and operands are
  // silently dropped, just like with '!='.
  '<=': {op: 'operator_gt', negate: 'operator_not', out: 'bool', prec: 5},
  '>=': {op: 'operator_lt', negate: 'operator_not', out: 'bool', prec: 5}
};

// Menu-typed value inputs: which shadow block + field carries the value.
function menuTable(extId, menuName) {
  const items = (GENEXT_MENUS[extId] || {})[menuName] || [];
  const bare = s => String(s).replace(/^\(\d+\)\s*/, '');
  const values = {};
  const labels = [];
  for (const it of items) {
    for (const label of [it.zh, it.en]) {
      if (!label) continue;
      values[label] = it.value;
      values[bare(label)] = it.value;
    }
    values[it.value] = it.value;
    labels.push(bare(it.zh || it.en));
  }
  // The shadow opcode is taken from the generated extension data (which records what the
  // editor really builds), never spelled out here.
  const decl = Object.values(GENEXT).flatMap(b => b.inputs || [])
    .find(i => i.menu === menuName && i.shadow && i.shadow.startsWith(`${extId}_menu_`));
  return {
    block: decl && decl.shadow, field: decl && decl.shadowField,
    strict: true, from: {ext: extId, menu: menuName}, values, labels
  };
}

// Static dropdowns whose options live in the scratch-blocks source: the option *values*
// are read from generated-catalog (a wrong value silently becomes 0 in the VM), only the
// Chinese aliases are authored here, and verifyCatalog re-checks them against the source.
function staticMenu(block, field, zh) {
  const decl = ((GEN[block] || {}).fields || []).find(f => f.name === field);
  const options = (decl && decl.options) || [];
  const values = {};
  const labels = [];
  for (const o of options) {
    values[o.value] = o.value;
    if (o.en) values[o.en] = o.value;
    const z = zh && zh[o.value];
    values[z || o.en || o.value] = o.value;
    labels.push(z || o.en || o.value);
  }
  return {isField: true, strict: true, from: {block, field}, values, labels};
}

export const MENU_SHADOW = {
  // The key menu appears both as a hat field and as a value input on sensing_keypressed, so
  // it must not be marked isField: the value input has to be filled by the
  // sensing_keyoptions dropdown, otherwise the editor shows only the raw English value.
  key: {...staticMenu('sensing_keyoptions', 'KEY_OPTION',
      {space: '空格', any: '任意', 'up arrow': '上', 'down arrow': '下', 'left arrow': '左', 'right arrow': '右'}),
    block: 'sensing_keyoptions', field: 'KEY_OPTION', isField: false},
  broadcast: {block: 'event_broadcast_menu', field: 'BROADCAST_OPTION'},
  // The option tables of the menus below are filled in at runtime by scratch-gui (the source
  // only has the empty shell Blockly.Blocks.x = {}, which generated-catalog records as
  // dynamic-menu), so here we register only the shadow block and field name, plus a few fixed values.
  touching: {block: 'sensing_touchingobjectmenu', field: 'TOUCHINGOBJECTMENU', values: {'鼠标指针': '_mouse_', '边缘': '_edge_'}},
  sprite: {block: 'sensing_distancetomenu', field: 'DISTANCETOMENU', values: {'鼠标指针': '_mouse_'}},
  clone: {block: 'control_create_clone_of_menu', field: 'CLONE_OPTION', values: {'自己': '_myself_'}},
  costume: {block: 'looks_costume', field: 'COSTUME', quoted: true},
  backdrop: {block: 'looks_backdrops', field: 'BACKDROP', quoted: true},
  soundname: {block: 'sound_sounds_menu', field: 'SOUND_MENU', quoted: true},
  towards: {block: 'motion_pointtowards_menu', field: 'TOWARDS', values: {'鼠标指针': '_mouse_', '随机位置': '_random_'}},
  destination: {block: 'motion_goto_menu', field: 'TO', values: {'鼠标指针': '_mouse_', '随机位置': '_random_'}},
  glideto: {block: 'motion_glideto_menu', field: 'TO', values: {'鼠标指针': '_mouse_', '随机位置': '_random_'}},
  current: {isField: true, field: 'WHENGREATERTHANMENU', values: {'计时器': 'TIMER', '音量': 'LOUDNESS'}},
  // The 「当碰到」 hat uses a different dropdown block; in the source its options are the
  // static two entries, and the sprite names are added by the editor at runtime.
  touchinghat: {...staticMenu('event_touchingobjectmenu', 'TOUCHINGOBJECTMENU', {_mouse_: '鼠标指针', _edge_: '边缘'}),
    block: 'event_touchingobjectmenu', field: 'TOUCHINGOBJECTMENU', isField: false},
  // List index dropdowns: the INDEX slot is filled by these two dropdown blocks. The values
  // 1/last/all and 1/last/random come from the scratch-blocks source; the Chinese TurboWarp UI
  // displays 1/末尾/全部 and 1/末尾/随机. At runtime Cast.toListIndex accepts all only in
  // 「删除」 (delete) and random in the other three places, so the two menus are registered separately.
  listindexall: {...staticMenu('data_listindexall', 'INDEX', {last: '末尾', all: '全部'}),
    block: 'data_listindexall', field: 'INDEX', isField: false, quoted: true},
  listindexrandom: {...staticMenu('data_listindexrandom', 'INDEX', {last: '末尾', random: '随机'}),
    block: 'data_listindexrandom', field: 'INDEX', isField: false, quoted: true},
  stop: {isField: true, values: {'全部': 'all', '此脚本': 'this script', '其他脚本': 'other scripts in sprite'}},
  mathop: staticMenu('operator_mathop', 'OPERATOR',
    {abs: '绝对值', floor: '向下取整', ceiling: '向上取整', sqrt: '平方根', ln: '自然对数', 'e ^': 'e的幂', '10 ^': '10的幂'}),
  frontback: staticMenu('looks_gotofrontback', 'FRONT_BACK', {front: '最前', back: '最后'}),
  forwardback: staticMenu('looks_goforwardbackwardlayers', 'FORWARD_BACKWARD', {forward: '前', backward: '后'}),
  numbername: staticMenu('looks_costumenumbername', 'NUMBER_NAME', {number: '编号', name: '名称'}),
  currentmenu: staticMenu('sensing_current', 'CURRENTMENU',
    {YEAR: '年', MONTH: '月', DATE: '日', DAYOFWEEK: '星期', HOUR: '时', MINUTE: '分', SECOND: '秒'}),
  dragmode: staticMenu('sensing_setdragmode', 'DRAG_MODE', {draggable: '允许拖拽', 'not draggable': '禁止拖拽'}),
  // The Chinese effect names match the TurboWarp UI (颜色/鱼眼/…); the values still come from the generated catalog
  effect: staticMenu('looks_seteffectto', 'EFFECT',
    {COLOR: '颜色', FISHEYE: '鱼眼', WHIRL: '漩涡', PIXELATE: '像素化', MOSAIC: '马赛克', BRIGHTNESS: '亮度', GHOST: '虚像'}),
  soundeffect: staticMenu('sound_changeeffectby', 'EFFECT', {PITCH: '音调', PAN: '左右平衡'}),
  rotation: staticMenu('motion_setrotationstyle', 'STYLE',
    {'left-right': '左右翻转', "don't rotate": '不可旋转', 'all around': '任意旋转'}),
  alignment: staticMenu('motion_align_scene', 'ALIGNMENT',
    {'bottom-left': '左下角', 'bottom-right': '右下角', middle: '中间', 'top-left': '左上角', 'top-right': '右上角'}),
  drum: menuTable('music', 'DRUM'),
  instrument: menuTable('music', 'INSTRUMENT')
};

export const FIELD_MENUS = {
  stop: {'全部': 'all', '全部脚本': 'all', '此脚本': 'this script', '其他脚本': 'other scripts in sprite'},
  soundname: {}
};

export const HATS = {
  event_whenflagclicked: {zh: ['当绿旗被点击', '绿旗'], en: ['when green flag clicked'], params: []},
  event_whenbroadcastreceived: {zh: ['当收到'], en: ['when I receive'], params: [['@BROADCAST_OPTION', 'broadcast']]},
  event_whenkeypressed: {zh: ['当按键按下', '当按键', '按键'], en: ['when key pressed'], params: [['@KEY_OPTION', 'menu:key']]},
  event_whenthisspriteclicked: {zh: ['当角色被点击'], en: ['when this sprite clicked'], params: []},
  event_whenstageclicked: {zh: ['当舞台被点击'], en: ['when stage clicked'], params: []},
  event_whenbackdropswitchesto: {zh: ['当背景换成'], en: ['when backdrop switches'], params: [['BACKDROP', 'menu:backdrop']]},
  event_whengreaterthan: {zh: ['当大于'], en: ['when timer greater than'], params: [['@WHENGREATERTHANMENU', 'menu:current'], ['VALUE', 'num']]},
  event_whentouchingobject: {zh: ['当碰到'], en: ['when touching object'], params: [['TOUCHINGOBJECTMENU', 'menu:touchinghat']]}
};

// Merge the 繁體中文 / 日本語 aliases and menu labels into the tables above (append only; zh/en/labels untouched).
augmentCatalog(OPS, HATS, MENU_SHADOW);

/* ---------------- index + self-verification ---------------- */

export function specOf(op) {
  return OPS[op] || GEN[op] && {auto: true, op} || EXT[op] || null;
}

function catalogEntry(op) {
  return GEN[op] || EXT[op] || null;
}

// The valid values of a static dropdown can only come from the options recorded in the scratch-blocks source.
function checkStaticMenu(problems, label, menu) {
  const cat = GEN[menu.from.block];
  const decl = cat && (cat.fields || []).find(f => f.name === menu.from.field);
  const options = (decl && decl.options) || [];
  if (!options.length) {
    problems.push(`${label} 在 ${menu.from.block}.${menu.from.field} 里取不到选项`);
    return;
  }
  for (const v of new Set(Object.values(menu.values))) {
    if (!options.some(o => o.value === v)) problems.push(`${label} 的值 "${v}" 不是 ${menu.from.block} 的选项`);
  }
  if (menu.labels.length !== options.length) {
    problems.push(`${label} 只登记了 ${menu.labels.length} 个名称，源码有 ${options.length} 个选项`);
  }
}

// Returns list of human-readable problems. Empty means the alias table matches reality.
export function verifyCatalog() {
  const problems = [];
  for (const [op, cat] of Object.entries(GEN)) {
    if (cat.kind === 'unknown') problems.push(`${op}: generated catalog 未能判定形状 (kind=unknown)`);
  }
  const seenAliases = new Map();
  const all = Object.assign({}, OPS, HATS);
  for (const [key, spec] of Object.entries(all)) {
    const op = spec.op || (key.startsWith('event_') || key.startsWith('control_start') ? key : key);
    const cat = catalogEntry(op);
    if (!cat) {
      problems.push(`${key}: opcode "${op}" 不存在于 generated catalog 或 EXT 表`);
      continue;
    }
    // hidden only means it does not appear in the in-app cheat sheet (like control_if_else,
    // assembled from 如果/否则); its shape must still be checked: earlier this spot just did
    // `continue`, so if_else could omit CONDITION/SUBSTACK without any alarm, and at compile
    // time the condition and the whole then branch were silently dropped.
    const wantInputs = (cat.inputs || []).filter(i => i.name && !i.dummy && !i.stmt).map(i => i.name);
    const wantStmts = (cat.inputs || []).filter(i => i.stmt).map(i => i.name);
    const wantFields = (cat.fields || []).filter(f => f.name).map(f => f.name);
    const gotInputs = (spec.params || []).filter(p => !p[0].startsWith('@')).map(p => p[0]);
    const gotFields = (spec.params || []).filter(p => p[0].startsWith('@')).map(p => p[0].slice(1));
    // Dynamic menu blocks (including hats such as event_whenbackdropswitchesto) are empty
    // shells in the source, so there is no shape to compare against.
    if (!cat.dynamic) {
      for (const n of wantInputs) if (!gotInputs.includes(n)) problems.push(`${key}: 缺少值输入槽 ${n} (${wantInputs.join(',')})`);
      for (const n of gotInputs) if (!wantInputs.includes(n)) problems.push(`${key}: 未知输入槽 ${n}，实为 ${wantInputs.join(',') || '无'}`);
      for (const n of gotFields) if (!wantFields.includes(n)) problems.push(`${key}: 字段 ${n} 不在定义中 (${wantFields.join(',') || '无'})`);
    }
    for (const [pname, ptype] of (spec.params || [])) {
      if (!String(ptype).startsWith('menu:')) continue;
      const kind = String(ptype).slice(5);
      const menu = MENU_SHADOW[kind];
      if (!menu) {
        problems.push(`${key}: 菜单类型 ${kind} 没有定义`);
        continue;
      }
      const fname = pname.startsWith('@') ? pname.slice(1) : pname;
      // A runtime-filled menu block has no shape in the source; the only thing that can be
      // checked mechanically is "input slot name == menu field name".
      const shadowCat = menu.block ? GEN[menu.block] : null;
      if (shadowCat && shadowCat.dynamic && !pname.startsWith('@') && menu.field !== pname) {
        problems.push(`${key}: 动态菜单 ${kind} 的输入槽 ${pname} 应为 ${menu.field}`);
      }
      if (!menu.strict) continue;
      if (menu.from.block) {
        checkStaticMenu(problems, `${key}: 静态菜单 ${kind}`, menu);
        continue;
      }
      const g = GENEXT[op];
      const decl = g && (g.inputs || []).find(i => i.name === fname);
      if (!decl || !decl.menu) {
        problems.push(`${key}: 输入槽 ${fname} 在扩展源码里不是菜单`);
      } else if (menu.from.ext !== g.ext || menu.from.menu !== decl.menu) {
        problems.push(`${key}: 菜单 ${kind} 取自 ${menu.from.ext}/${menu.from.menu}，与源码 ${g.ext}/${decl.menu} 不符`);
      } else if (menu.block !== decl.shadow || menu.field !== decl.shadowField) {
        problems.push(`${key}: 菜单 ${kind} 的 shadow 应为 ${decl.shadow}/${decl.shadowField}，实际记录 ${menu.block}/${menu.field}`);
      }
      if (!Object.keys(menu.values).length) problems.push(`${key}: 菜单 ${kind} 没有从扩展源码取到任何选项`);
    }
    if (spec.cblock && wantStmts.length && !wantStmts.includes(spec.sub)) problems.push(`${key}: SUBSTACK 名 ${spec.sub} 与定义不符 (${wantStmts.join(',')})`);
    for (const a of [...(spec.zh || []), ...(spec.zhHant || []), ...(spec.en || []), ...(spec.ja || [])]) {
      const norm = a.toLowerCase();
      const owner = spec.hat || spec.hats ? 'hat' : spec.kind === 'reporter' || spec.out === 'bool' || spec.kind === 'boolean' ? 'rep' : spec.cblock ? 'c' : 'stmt';
      const prev = seenAliases.get(owner + ':' + norm);
      // Registering the same alias twice within one op is harmless (it happens when
      // Traditional and Simplified Chinese share a spelling); only a cross-op duplicate is a conflict.
      if (prev && prev !== key) problems.push(`别名冲突: "${a}" 同时属于 ${prev} 和 ${key}`);
      else seenAliases.set(owner + ':' + norm, key);
    }
  }
  for (const [kind, menu] of Object.entries(MENU_SHADOW)) {
    if (menu.from && menu.from.block) {
      checkStaticMenu(problems, `菜单 ${kind}`, menu);
      continue;
    }
    if (menu.isField || !menu.block) continue;
    // An extension's menu dropdown block is built on the fly by the editor as
    // `<extension id>_menu_<menu name>`; the extension source declares only the menu itself,
    // so what is compared here is the shadow/field name recorded in the generated data.
    const genMenu = /^([a-z0-9]+)_menu_(.+)$/.exec(menu.block);
    if (genMenu && GENEXT_MENUS[genMenu[1]] && GENEXT_MENUS[genMenu[1]][genMenu[2]]) {
      if (menu.field !== genMenu[2]) problems.push(`菜单 ${kind} 的字段 ${menu.field} 应为 ${genMenu[2]}`);
      if (!Object.keys(menu.values || {}).length) problems.push(`菜单 ${kind} 没有选项`);
      continue;
    }
    const cat = catalogEntry(menu.block);
    if (!cat) problems.push(`菜单 ${kind} 的 shadow 块 "${menu.block}" 不存在于 catalog`);
    else if (!cat.dynamic && !menu.field) problems.push(`菜单 ${kind} 没有记录字段名`);
    else if (!cat.dynamic && cat.fields.length && !cat.fields.some(f => f.name === menu.field)) {
      problems.push(`菜单 ${kind} 的字段 ${menu.field} 不在 ${menu.block} 的定义里 (${cat.fields.map(f => f.name).join(',')})`);
    }
  }
  return problems;
}

function norm(s) {
  return s.toLowerCase().replace(/\s+/g, '');
}

// Aliases from all four languages go into the same index: they can be mixed when writing
// .pseudo (consistent with the long-standing zh + en rule).
export const ALIAS_LANGS = ['zh', 'zhHant', 'en', 'ja'];

export const ALIAS_INDEX = (() => {
  const idx = {stmt: [], c: [], rep: [], hat: []};
  const aliasesOf = spec => ALIAS_LANGS.flatMap(l => spec[l] || []);
  for (const [key, spec] of Object.entries(OPS)) {
    const kind = spec.hat ? 'hat' : spec.cblock ? 'c' : spec.kind === 'reporter' || spec.kind === 'boolean' ? 'rep' : 'stmt';
    for (const a of aliasesOf(spec)) idx[kind].push({alias: a, words: a.split(/ /).length, key, spec: {...spec, op: spec.op || key}});
    if (spec.infix) idx.rep.push({alias: spec.infix, words: 1, key, spec: {...spec, op: spec.op || key}});
  }
  for (const [key, spec] of Object.entries(HATS)) {
    for (const a of aliasesOf(spec)) idx.hat.push({alias: a, words: a.split(/ /).length, key, spec: {...spec, op: key}});
  }
  for (const list of Object.values(idx)) list.sort((x, y) => y.alias.length - x.alias.length);
  return idx;
})();

export function matchAlias(kind, words) {
  const joined = norm(words.join(''));
  for (const e of ALIAS_INDEX[kind]) {
    if (norm(e.alias) === joined) return e;
  }
  return null;
}

export function aliasCandidates(kind) {
  return ALIAS_INDEX[kind].map(e => e.alias);
}

const GROUP_ZH = {
  motion: '运动', looks: '外观', sound: '声音', event: '事件', events: '事件', control: '控制',
  sensing: '侦测', operators: '运算', data: '变量与列表', procedures: '自制积木',
  pen: '画笔', music: '音乐', stretch: 'Stretch'
};

// The whole supported vocabulary, derived from the same tables the compiler reads so
// the in-app reference can never drift away from what actually compiles.
export function aliasReference(lang = 'zh-Hans') {
  const rows = [];
  const aliasFor = spec => {
    const list = spec[lang === 'zh-Hans' ? 'zh' : lang === 'zh-Hant' ? 'zhHant' : lang];
    if (list && list.length) return list;
    return spec.zh || spec.en || [];
  };
  const add = (key, spec) => {
    if (spec.hidden) return;
    const op = spec.op || key;
    const cat = catalogEntry(op);
    const group = (cat && cat.category) || (GENEXT[op] && GENEXT[op].ext) || '其他';
    const kind = spec.hat || spec.hats ? '帽子' : spec.cblock ? 'C形'
      : spec.kind === 'reporter' ? '报值' : spec.kind === 'boolean' ? '布尔' : '执行';
    const zhGroup = GROUP_ZH[group] || group;
    rows.push({
      op,
      group: zhGroup,
      // The internal category key ('motion', 'events', …). `group` / `groupLabel` are
      // already localised, so anything that needs to recognise a group name in *any*
      // language (scripts/vocab.mjs --group) has to start from the key.
      groupKey: group,
      kind,
      zh: spec.zh || [],
      zhHant: spec.zhHant || [],
      en: spec.en || [],
      ja: spec.ja || [],
      aliases: aliasFor(spec),
      // Simplified Chinese uses the Chinese name from the base table; other languages use the i18n table. Missing entries fall back to Chinese, never to English.
      groupLabel: lang === 'zh-Hans' ? zhGroup : (groupLabel(group, lang) || zhGroup),
      kindLabel: lang === 'zh-Hans' ? kind : (kindLabel(kind, lang) || kind),
      slots: (spec.params || []).map(p => {
        const isField = p[0].startsWith('@');
        const kind = String(p[1]).startsWith('menu:') ? String(p[1]).slice(5) : null;
        const menu = kind && MENU_SHADOW[kind];
        const name = isField ? '@' + p[0].slice(1) : p[0];
        const labels = menu ? menuLabelsFor(menu, lang) : [];
        if (labels && labels.length) return `${name}(${labels.join('、')})`;
        return isField ? name : `${name}:${p[1]}`;
      })
    });
  };
  for (const [key, spec] of Object.entries(HATS)) add(key, spec);
  for (const [key, spec] of Object.entries(OPS)) add(key, spec);
  const KIND_ORDER = ['帽子', '执行', 'C形', '报值', '布尔'];
  const rank = r => KIND_ORDER.indexOf(r.kind);
  rows.sort((a, b) => a.group.localeCompare(b.group, 'zh') || rank(a) - rank(b) ||
    (a.zh[0] || a.op).localeCompare(b.zh[0] || b.op, 'zh'));
  return rows;
}
