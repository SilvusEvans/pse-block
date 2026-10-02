// Electron end-to-end smoke: boots the real main process with the file dialogs
// redirected to fixed paths, then drives the renderer through the same handlers
// the buttons and menu items use. Run with: npm run smoke
const path = require('node:path');
const fs = require('node:fs');
const {app, dialog, BrowserWindow, Menu} = require('electron');

// This run of assertions checks Simplified Chinese UI text (「通过」 (Passed), 「积木总数」 (total blocks),
// 「分组」 (group)…). The app default language is English, so the language is pinned here to decouple the
// assertions from the default; the default language itself + language switching are verified separately below.
process.env.PSB_LANG = 'zh-Hans';

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'out', 'smoke.sb3');
const SRC_FILE = path.join(ROOT, 'examples', 'hello-zh-Hans.pseudo');
const STALE = 'not-a-zip';
const LOOP_SRC = '舞台:\n  绿旗:\n    重复 永远:\n      移动(10)\n';
const BAD_SRC = '舞台:\n  绿旗:\n    未知量 ← 1\n';

dialog.showSaveDialog = async () => ({canceled: false, filePath: OUT_FILE});
dialog.showOpenDialog = async () => ({canceled: false, filePaths: [SRC_FILE]});
dialog.showMessageBoxSync = () => 0;
dialog.showMessageBox = async () => ({response: 0});

require('../electron/main.cjs');

const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = 0;
function check(cond, label, extra) {
  if (cond) console.log('ok - ' + label);
  else { failed++; console.error('NOT OK - ' + label + (extra === undefined ? '' : ' :: ' + extra)); }
}
async function until(label, fn, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    let value;
    try { value = await fn(); } catch (err) { throw new Error(`${label}: ${err.message}`); }
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`${label}: timed out`);
    await sleep(100);
  }
}
async function shot(win, name) {
  fs.mkdirSync(path.join(ROOT, 'out'), {recursive: true});
  const file = path.join(ROOT, 'out', name);
  fs.writeFileSync(file, (await win.capturePage()).toPNG());
  console.log('screenshot -> ' + path.relative(ROOT, file));
}

app.whenReady().then(async () => {
  const win = await until('window', () => BrowserWindow.getAllWindows()[0]);
  const js = code => win.webContents.executeJavaScript(code, true);
  const setCode = src => js(`(function(){
    const el = document.getElementById('code');
    el.value = ${JSON.stringify(src)};
    el.dispatchEvent(new Event('input'));
  })()`);
  const click = id => js(`document.getElementById(${JSON.stringify(id)}).click()`);
  const text = id => js(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const errors = [];
  win.webContents.on('console-message', (e, level, message) => { if (level >= 3) errors.push(message); });
  win.on('preload-error', (e, p, err) => errors.push(`preload ${p}: ${err.message}`));

  await until('page load', () => js('document.readyState === "complete"'));
  await sleep(300);

  check(await js('typeof window.psb === "object"'), 'preload injects window.psb');
  for (const key of ['compile', 'exportSb3', 'openSource', 'saveSource', 'example', 'pickMedia', 'syntax', 'onMenu']) {
    check(await js(`typeof window.psb.${key} === "function"`), `psb.${key} available`);
  }

  await click('btn-example');
  await until('example compiled', () => text('status-badge').then(t => t !== '待编译'));
  const badge = await text('status-badge');
  const blockTotal = await js(`(function(){
    for (const r of document.querySelectorAll('#stats table tr'))
      if (r.children[0].textContent === '积木总数') return r.children[1].textContent;
    return '';
  })()`);
  const chips = await js('document.querySelectorAll("#stats .chip").length');
  const gutterLines = await js('document.getElementById("gutter").textContent.trim().split("\\n").length');
  const codeLines = await js('document.getElementById("code").value.split("\\n").length');
  check(badge === '通过', 'example compile status is passed', badge);
  if (badge !== '通过') console.error('  example error:', (await text('problems')).trim().slice(0, 200), '| fatal:', (await text('fatal')).slice(0, 200), '| first line:', await js('document.getElementById("code").value.split("\\n")[0]'));
  check(await text('problem-count') === '0', 'structural problem count is 0');
  check(Number(blockTotal) > 25, 'stats panel shows the total block count', blockTotal);
  check(chips >= 3, 'sprite/extension chips rendered', chips);
  check(gutterLines === codeLines, 'gutter line count matches code line count', `${gutterLines}/${codeLines}`);
  const layout = await js(`(function(){
    const c = document.getElementById('code').getBoundingClientRect();
    const g = document.getElementById('gutter').getBoundingClientRect();
    const r = document.querySelector('.result-pane').getBoundingClientRect();
    return JSON.stringify({code: Math.round(c.width), gutter: Math.round(g.width), result: Math.round(r.width), h: Math.round(c.height)});
  })()`);
  const box = JSON.parse(layout);
  check(box.code > 300 && box.gutter < 80 && box.result > 300 && box.h > 400, 'three-pane layout widths look right', layout);
  await shot(win, 'ui-example.png');

  const exampleItems = (Menu.getApplicationMenu()?.items.find(i => i.label === '编译')?.submenu?.items || [])
    .find(i => i.label === '载入示例')?.submenu?.items || [];
  const onDisk = fs.readdirSync(path.join(ROOT, 'examples')).filter(f => /\.(pseudo|psb)$/i.test(f));
  check(exampleItems.length === onDisk.length, 'menu automatically lists the examples under examples/', `${exampleItems.length}/${onDisk.length}`);
  // The example menu labels come from the "#" comment on the first line of each .pseudo file; examples/
  // now has Chinese/English/Japanese examples at the same time, so only "a non-empty label" is required,
  // no longer that it must be Chinese.
  check(exampleItems.every(i => typeof i.label === 'string' && i.label.trim().length > 0), 'every example menu item has a label', exampleItems.map(i => i.label).join(','));

  const penEx = await js(`window.psb.example('pen-zh-Hans.pseudo').then(r => JSON.stringify(r))`);
  check(/"ok":true/.test(penEx) && penEx.includes('清空画笔'), 'load the second example by name', penEx.slice(0, 60));
  const guarded = await js(`window.psb.example('../../package.json').then(r => JSON.stringify(r))`);
  check(/"ok":false/.test(guarded), 'example name with a traversal path is rejected', guarded.slice(0, 120));
  // The legacy .psb extension is still accepted: the name check passes, it is just that examples/ no
  // longer has any .psb file, so the reported error is 「找不到示例」 (example not found) rather than
  // 「示例名不合法」 (invalid example name).
  const legacy = await js(`window.psb.example('hello.psb').then(r => JSON.stringify(r))`);
  check(/找不到示例/.test(legacy), 'legacy .psb extension is still accepted (the file was just renamed)', legacy.slice(0, 120));

  await js(`document.getElementById('status-badge').textContent = '待编译'`);
  win.webContents.send('menu', 'example:pen-zh-Hans.pseudo');
  await until('pen example loaded', () => js(`document.getElementById('code').value.includes('清空画笔')`));
  await until('pen example compiled', () => text('status-badge').then(t => t === '通过' || t === '有问题'));
  const penBadge = await text('status-badge');
  if (penBadge !== '通过') console.error('  pen example error:', await text('problems'), '| fatal:', await text('fatal'));
  check(penBadge === '通过', 'pen example compiles', penBadge);
  const penChips = await js('[].map.call(document.querySelectorAll("#stats .chip"), c => c.textContent).join("|")');
  check(/扩展: pen/.test(penChips) && /扩展: stretch/.test(penChips), 'stats panel lists the pen and stretch extensions', penChips);
  await shot(win, 'ui-pen.png');

  // Media example: real files must resolve in the main process relative to the examples directory, and the costume/sound counts must show on the panel.
  await js(`document.getElementById('status-badge').textContent = '待编译'`);
  win.webContents.send('menu', 'example:media-zh-Hans.pseudo');
  await until('media example loaded', () => js(`document.getElementById('code').value.includes('造型 "assets/星星.svg"')`));
  await until('media example compiled', () => text('status-badge').then(t => t === '通过' || t === '有问题'));
  const mediaBadge = await text('status-badge');
  if (mediaBadge !== '通过') console.error('  media example error:', await text('problems'), '| fatal:', await text('fatal'));
  check(mediaBadge === '通过', 'media example compiles', mediaBadge);
  const mediaChips = await js('[].map.call(document.querySelectorAll("#stats .chip"), c => c.textContent).join("|")');
  check(/流星 · .*造型 2 · 声音 1/.test(mediaChips), 'stats panel shows the imported costumes and sounds', mediaChips);
  await shot(win, 'ui-media.png');

  // Logic of the insert-media button (the native dialog cannot be automated, so verify its insertion point and wording here)
  const doc = '角色 球:\n  变量 n = 1\n  绿旗:\n    显示\n\n舞台:\n  绿旗:\n    显示\n';
  const inSprite = await js(`(function(){const ta=document.getElementById('code');ta.value=${JSON.stringify(doc)};ta.selectionStart=ta.value.indexOf('变量')+2;return window.psbTest.applyMedia([{rel:'assets/球.png',kind:'costume',name:'球'},{rel:'assets/喵.wav',kind:'sound',name:'喵'}])+'@@'+ta.value;})()`);
  check(inSprite.startsWith('2@@') && /角色 球:\n {2}造型 "assets\/球\.png"\n {2}声音 "assets\/喵\.wav"\n {2}变量 n = 1/.test(inSprite), 'inserted media lands under the sprite at the cursor', inSprite.slice(0, 90));
  const inStage = await js(`(function(){const ta=document.getElementById('code');ta.value=${JSON.stringify(doc)};ta.selectionStart=ta.value.indexOf('舞台')+4;return window.psbTest.applyMedia([{rel:'assets/背景.png',kind:'costume',name:'背景'}])+'@@'+ta.value;})()`);
  check(/舞台:\n {2}背景 "assets\/背景\.png"/.test(inStage), 'the stage gets a 背景 (backdrop), not a 造型 (costume)', inStage.slice(-80));
  const dedup = await js(`window.psbTest.mediaLines([{rel:'a.png',kind:'costume'},{rel:'a.png',kind:'costume'},{rel:'a.wav',kind:'sound'}], false, '  ').join('|')`);
  check(dedup === '  造型 "a.png"|  声音 "a.wav"', 'the same file is not inserted twice', dedup);
  await js(`(function(){const ta=document.getElementById('code');ta.value=${JSON.stringify(doc)};})()`);

  await js(`document.querySelector('#vocab summary').click()`);
  await until('alias table loaded', () => js(`document.querySelectorAll('#vocab-table tr').length > 50`));
  const vocabRows = Number(await js('document.querySelectorAll("#vocab-table tr").length'));
  const vocabCount = await text('vocab-count');
  const vocabHead = await js('document.querySelector("#vocab-table tr").children[0].textContent');
  check(vocabRows > 50, 'block alias table renders rows', String(vocabRows));
  check(vocabHead === '分组', 'alias table has a header', vocabHead);
  check(Number(vocabCount) === vocabRows - 1, 'count matches the row count', `${vocabCount}/${vocabRows - 1}`);
  await js(`(function(){const el=document.getElementById('vocab-filter');el.value='小军鼓';el.dispatchEvent(new Event('input'));})()`);
  const drumRow = await js('[].map.call(document.querySelectorAll("#vocab-table tr td:nth-child(5)"), c => c.textContent)');
  check(drumRow.length === 1 && drumRow[0].includes('小军鼓'), 'generated menu options are searchable in the alias table', JSON.stringify(drumRow));
  await js(`(function(){const el=document.getElementById('vocab-filter');el.value='pen_';el.dispatchEvent(new Event('input'));})()`);
  const penRows = await js('[].map.call(document.querySelectorAll("#vocab-table tr td:first-child"), c => c.textContent)');
  check(penRows.length >= 10 && penRows.every(g => g === '画笔'), 'filtering pen_ leaves only the pen group', `${penRows.length}:${penRows.slice(0,3).join(',')}`);
  check(await text('vocab-count') === String(penRows.length), 'count syncs after filtering', await text('vocab-count'));
  await shot(win, 'ui-vocab.png');
  await js(`(function(){const el=document.getElementById('vocab-filter');el.value='';el.dispatchEvent(new Event('input'));document.querySelector('#vocab summary').click();})()`);

  await click('btn-example');
  await until('back to the default example', () => js(`document.getElementById('code').value.includes('弹球示例')`));

  fs.rmSync(OUT_FILE, {force: true});
  await click('btn-export');
  await until('export file created', () => fs.existsSync(OUT_FILE) && fs.statSync(OUT_FILE).size > 0);
  check(fs.readFileSync(OUT_FILE).subarray(0, 2).toString('latin1') === 'PK', 'the export is a zip container (.sb3)');
  check(await text('status-badge') === '已导出', 'status hint after export', await text('status-badge'));

  fs.writeFileSync(OUT_FILE, STALE);
  await click('btn-open');
  await until('file name filled in after open', () => text('file-label').then(t => t.includes('hello')));
  check(await js(`document.getElementById('code').value.includes('弹球示例')`), 'open button loads the file from disk');
  await click('btn-save');
  await until('save written to disk', () => fs.statSync(SRC_FILE).size > 100 && fs.readFileSync(SRC_FILE, 'utf8').includes('弹球示例'));
  check(true, 'save button writes back to the source file');

  await setCode(LOOP_SRC);
  await click('btn-compile');
  await until('clean compile', () => text('status-badge').then(t => t === '通过' || t === '有问题'));
  const loopBadge = await text('status-badge');
  if (loopBadge !== '通过') console.error('  loop script error:', await text('problems'), '| fatal:', await text('fatal'));
  check(loopBadge === '通过', 'loop script compiles', loopBadge);
  await js(`window.psb.exportSb3(${JSON.stringify(LOOP_SRC)}, {}, 'clean')`);
  await until('clean source exported', () => fs.readFileSync(OUT_FILE, 'utf8') !== STALE);
  check(fs.readFileSync(OUT_FILE).subarray(0, 2).toString('latin1') === 'PK', 'main process exports the clean source directly');

  fs.writeFileSync(OUT_FILE, STALE);
  await setCode(BAD_SRC);
  await click('btn-compile');
  await until('error captured', () => js(`document.getElementById('problems').children.length > 0`));
  const errBadge = await text('status-badge');
  const errText = await text('problems');
  check(errBadge === '有问题', 'invalid source status is 「有问题」 (Problems)', errBadge);
  check(/第 3 行/.test(errText), 'error carries the line number', errText.trim().slice(0, 80));
  await click('btn-export');
  await sleep(600);
  check(fs.readFileSync(OUT_FILE, 'utf8') === STALE, 'renderer blocks export when validation fails');
  await js(`document.getElementById('problems').children[0].click()`);
  const sel = await js('[document.getElementById("code").selectionStart, document.getElementById("code").selectionEnd]');
  check(sel[0] > 0 && sel[1] > sel[0], 'clicking a problem jumps to and selects the error line', JSON.stringify(sel));

  await setCode('舞台:\n  绿旗:\n    如果 (5):\n      显示\n');
  await click('btn-compile');
  await until('type error captured', () => text('problems').then(t => /布尔/.test(t)));
  check(/布尔/.test(await text('problems')), 'the number-in-boolean-slot error is shown');

  const empty = await js(`window.psb.compile('舞台:\\n').then(r => JSON.stringify(r))`);
  check(/"ok":true/.test(empty), 'empty stage IPC returns ok', empty.slice(0, 140));

  await setCode('= 3\n');
  await click('btn-compile');
  await until('fatal error shown', () => js(`!document.getElementById('fatal').hidden`));
  check(await js(`document.getElementById('fatal').textContent.length > 0`), 'unparseable source shows the fatal panel');
  await shot(win, 'ui-error.png');

  await js(`document.getElementById('status-badge').textContent = '待编译'`);
  await js(`(function(){
    const el = document.getElementById('code');
    el.focus();
    el.value = '舞台:\\n  绿旗:\\n    显示';
    el.selectionStart = el.selectionEnd = el.value.length;
    el.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', ctrlKey: true, bubbles: true}));
  })()`);
  await until('Ctrl+Enter works', () => text('status-badge').then(t => t === '通过' || t === '有问题'));
  const hotBadge = await text('status-badge');
  if (hotBadge !== '通过') console.error('  Ctrl+Enter error:', await text('problems'), '| fatal:', await text('fatal'));
  check(hotBadge === '通过', 'Ctrl+Enter triggers a compile', hotBadge);

  // Language switching: the dropdown order is fixed with English/Japanese first and the two Chinese variants last; after switching to English the UI text must change too.
  const langOrder = await js('JSON.stringify([].map.call(document.getElementById("lang-select").options, o => o.value))');
  check(langOrder === '["en","ja","zh-Hans","zh-Hant"]', 'language dropdown order: English/Japanese first, Chinese last', langOrder);
  await js(`(function(){const el=document.getElementById('lang-select');el.value='en';el.dispatchEvent(new Event('change'));})()`);
  await until('switched to English', () => text('status-badge').then(t => t === 'Passed' || t === 'Problems'));
  check(await text('status-badge') === 'Passed', 'status badge is English after switching', await text('status-badge'));
  check(await text('btn-save') === 'Save', 'button text is English after switching', await text('btn-save'));

  // In English mode the "example" button must give the English example (examples/hello-en.pseudo),
  // not the Chinese one. The default example is chosen by UI language:
  // hello-zh-Hans.pseudo (Simplified) / hello-zh-Hant / hello-en / hello-ja.
  // Set the badge to a sentinel first, otherwise "wait for the badge to become Passed" is already
  // satisfied by the previous compile's result.
  await js(`document.getElementById('status-badge').textContent = 'pending-sentinel'`);
  await click('btn-example');
  await until('English example loaded', () => js(`document.getElementById('code').value.includes('English example')`));
  const enExample = await js(`document.getElementById('code').value`);
  check(!enExample.includes('弹球示例'), 'English mode does not load the Chinese example');
  check(/^hello-en\.pseudo/.test(String(await text('file-label')).trim()),
      'title shows which example was loaded', await text('file-label'));
  await until('English example compiled', () => text('status-badge').then(t => t === 'Passed' || t === 'Problems'));
  const enExBadge = await text('status-badge');
  if (enExBadge !== 'Passed') console.error('  English example error:', await text('problems'), '| fatal:', await text('fatal'));
  check(enExBadge === 'Passed', 'English example compiles', enExBadge);
  await shot(win, 'ui-en.png');
  await js(`(function(){const el=document.getElementById('lang-select');el.value='zh-Hans';el.dispatchEvent(new Event('change'));})()`);
  await until('switched back to Simplified Chinese', () => text('status-badge').then(t => t === '通过' || t === '有问题'));
  check(await text('status-badge') === '通过', 'switched back to Simplified Chinese', await text('status-badge'));

  check(errors.length === 0, 'renderer has no console errors', errors.join(' | '));

  console.log(failed === 0 ? 'SMOKE PASS' : `SMOKE FAIL (${failed})`);
  process.exitCode = failed === 0 ? 0 : 1;
  app.quit();
}).catch(err => {
  console.error('SMOKE FAIL:', err && err.message);
  process.exit(1);
});
