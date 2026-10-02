// Electron main process: window, menus, and the compile/export IPC.
// Compiled with CommonJS on purpose (package.json sets "type":"module").
const {app, BrowserWindow, dialog, Menu, ipcMain} = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// src/*.js is ESM (package.json sets "type":"module"), so load it with import().
// Both loaders cache the *resolved* module (not the promise) so the sync helpers
// below (T) can read from it after the first await.
let buildModule = null;
const loadBuild = async () => (buildModule || (buildModule = await import('../src/build.js')));

// i18n is ESM too. Everything user-facing (window title, menus, dialogs) reads from it,
// so switching language is one setLang() call plus a menu rebuild.
let i18nModule = null;
const loadI18n = async () => (i18nModule || (i18nModule = await import('../src/core/i18n.js')));

const DEFAULT_DIR = path.join(app.getPath('documents'), 'pseudo2sb3');
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
// Extensions for pseudocode source files: .pseudo is the official extension; .psb is the legacy
// one, still accepted so old projects need no rename (open/save dialogs and example loading accept both).
const SOURCE_EXTS = ['.pseudo', '.psb'];
const SOURCE_EXT_RE = /\.(pseudo|psb)$/i;
const isSourceFile = f => SOURCE_EXTS.some(e => String(f).toLowerCase().endsWith(e));
let projectDir = DEFAULT_DIR;
// Directory that relative 造型/背景/声音 paths are resolved against: the folder of the
// .pseudo that was opened, saved or loaded as an example.
let sourceBaseDir = null;
// Current UI / message language. Default is English; the user's pick is persisted
// next to the app's user data (PSB_LANG overrides both, for tests).
let lang = 'en';

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function readSettings () {
  try {
    const j = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    if (j && j.lang) lang = j.lang;
  } catch {
    // first run: keep the default
  }
  // An explicit override wins (the smoke test pins the language this way).
  if (process.env.PSB_LANG) lang = process.env.PSB_LANG;
}

function writeSettings () {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), {recursive: true});
    fs.writeFileSync(settingsFile(), JSON.stringify({lang}, null, 2), 'utf8');
  } catch {
    // a read-only profile must not break the app
  }
}

const T = key => i18nModule.t(key);

function exampleFiles () {
  try {
    return fs.readdirSync(EXAMPLES_DIR).filter(isSourceFile).sort();
  } catch {
    return [];
  }
}

// Label = the file's leading "#" comment, so adding an example needs no menu edit.
function exampleLabel (file) {
  const name = file.replace(SOURCE_EXT_RE, '');
  try {
    const first = fs.readFileSync(path.join(EXAMPLES_DIR, file), 'utf8').split('\n', 1)[0].trim();
    if (first.startsWith('#')) return (first.slice(1).trim().split(/[：:—-]/)[0] || '').trim() || name;
  } catch {
    // fall through to the file name
  }
  return name;
}

// The default example (the Examples button / an `example` action with no name) follows
// the UI language. Every example file is named <english-name>-<lang>.pseudo — no language
// gets a bare name — so 简体中文 is hello-zh-Hans.pseudo, alongside hello-zh-Hant.pseudo /
// hello-en.pseudo / hello-ja.pseudo. A missing variant falls back to English, the
// project's primary language, so the button never lands on nothing.
const DEFAULT_EXAMPLE = 'hello';

function defaultExampleFile (langCode) {
  const file = `${DEFAULT_EXAMPLE}-${langCode}.pseudo`;
  return fs.existsSync(path.join(EXAMPLES_DIR, file)) ? file : `${DEFAULT_EXAMPLE}-en.pseudo`;
}

function windowTitle () {
  return `${T('app.title')} (SilvusEvans)`;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    show: false,
    title: windowTitle(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  return win;
}

function errorInfo (err) {
  if (err && typeof err.line === 'number' && err.line > 0) return {message: err.message, line: err.line};
  return {message: (err && err.message) || String(err), line: 0};
}

function buildOpts (opts) {
  const o = {...(opts || {})};
  o.lang = lang;
  if (!o.baseDir) o.baseDir = sourceBaseDir || projectDir;
  return o;
}

ipcMain.handle('compile', async (event, source, opts) => {
  const {buildFromSource} = await loadBuild();
  try {
    const result = await buildFromSource(String(source || ''), buildOpts(opts));
    return {
      ok: result.problems.length === 0,
      problems: result.problems,
      warnings: result.warnings,
      stats: result.stats,
      totalBlocks: result.totalBlocks,
      targets: result.targets,
      extensions: result.extensions,
      media: result.media,
      size: result.buffer.length
    };
  } catch (err) {
    return {ok: false, fatal: errorInfo(err), problems: [], warnings: []};
  }
});

ipcMain.handle('export-sb3', async (event, source, opts, suggestedName) => {
  const {buildFromSource} = await loadBuild();
  let result;
  try {
    result = await buildFromSource(String(source || ''), buildOpts(opts));
  } catch (err) {
    dialog.showMessageBox({type: 'error', title: T('dlg.compileFailed'), message: errorInfo(err).message});
    return {ok: false, error: errorInfo(err)};
  }
  if (result.problems.length) {
    const choice = dialog.showMessageBoxSync({
      type: 'warning',
      title: T('dlg.selfCheck'),
      message: T('dlg.selfCheck.msg', result.problems.length),
      detail: result.problems.slice(0, 8).join('\n'),
      buttons: [T('dlg.exportAnyway'), T('dlg.cancel')]
    });
    if (choice !== 0) return {ok: false, cancelled: true};
  }
  const safe = (suggestedName || 'project').replace(/[\\/:*?"<>|]/g, '_');
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: path.join(projectDir, safe + '.sb3'),
    filters: [{name: T('dlg.filter.scratch'), extensions: ['sb3']}]
  });
  if (canceled) return {ok: false, cancelled: true};
  projectDir = path.dirname(filePath);
  fs.writeFileSync(filePath, result.buffer);
  return {ok: true, filePath, totalBlocks: result.totalBlocks, size: result.buffer.length};
});

ipcMain.handle('open-source', async () => {
  const {canceled, filePaths} = await dialog.showOpenDialog({
    defaultPath: projectDir,
    filters: [{name: T('dlg.filter.pseudo'), extensions: ['pseudo', 'psb', 'txt']}, {name: T('dlg.filter.all'), extensions: ['*']}],
    properties: ['openFile']
  });
  if (canceled || !filePaths.length) return {ok: false, cancelled: true};
  projectDir = path.dirname(filePaths[0]);
  sourceBaseDir = projectDir;
  return {ok: true, filePath: filePaths[0], baseDir: sourceBaseDir, text: fs.readFileSync(filePaths[0], 'utf8')};
});

ipcMain.handle('example', async (event, name) => {
  // Only source files that live in examples/ can be loaded (.pseudo, or the legacy .psb).
  // No name = the default example, which follows the UI language (see defaultExampleFile).
  const i18n = await loadI18n();
  const wanted = name ? String(name) : defaultExampleFile(i18n.normalizeLang(lang) || i18n.getLang());
  const file = path.basename(wanted);
  if (!isSourceFile(file)) return {ok: false, error: {message: T('err.badExampleName'), line: 0}};
  const full = path.join(EXAMPLES_DIR, file);
  if (!fs.existsSync(full)) return {ok: false, error: {message: T('err.exampleNotFound', file), line: 0}};
  sourceBaseDir = EXAMPLES_DIR;
  try {
    // `file` goes back to the renderer so the title bar can show which example is loaded.
    return {ok: true, file, text: fs.readFileSync(full, 'utf8'), baseDir: sourceBaseDir};
  } catch (err) {
    return {ok: false, error: errorInfo(err)};
  }
});

ipcMain.handle('syntax', async (event, wanted) => {
  const catalog = await import('../src/core/catalog.js');
  const i18n = await loadI18n();
  return {ok: true, rows: catalog.aliasReference(i18n.normalizeLang(wanted) || i18n.getLang())};
});

ipcMain.handle('i18n', async () => {
  const i18n = await loadI18n();
  return {
    lang: i18n.getLang(),
    langs: i18n.LANG_MENU_ORDER,
    labels: i18n.LANG_LABELS,
    strings: i18n.uiDict(i18n.getLang())
  };
});

ipcMain.handle('set-lang', async (event, next) => {
  const i18n = await loadI18n();
  i18n.setLang(next);
  lang = i18n.getLang();
  writeSettings();
  for (const w of BrowserWindow.getAllWindows()) {
    w.setTitle(windowTitle());
    buildMenu(w);
  }
  return {
    lang: i18n.getLang(),
    langs: i18n.LANG_MENU_ORDER,
    labels: i18n.LANG_LABELS,
    strings: i18n.uiDict(i18n.getLang())
  };
});

// Pick real media in the native dialog. Paths come back relative to the .pseudo's folder,
// because that is what the 造型/背景/声音 statements resolve against at compile time.
ipcMain.handle('pick-media', async () => {
  const {stageMedia} = await import('../src/core/media-pick.js');
  const base = sourceBaseDir || projectDir;
  const {canceled, filePaths} = await dialog.showOpenDialog({
    defaultPath: base,
    filters: [{name: T('dlg.filter.media'), extensions: ['png', 'svg', 'wav']}],
    properties: ['openFile', 'multiSelections']
  });
  if (canceled || !filePaths.length) return {ok: false, cancelled: true};
  const {items, errors} = stageMedia(filePaths, base);
  return {ok: true, baseDir: base, items, errors};
});

ipcMain.handle('save-source', async (event, text, currentPath) => {
  if (currentPath) {
    fs.writeFileSync(currentPath, String(text || ''), 'utf8');
    sourceBaseDir = path.dirname(currentPath);
    return {ok: true, filePath: currentPath, baseDir: sourceBaseDir};
  }
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: path.join(projectDir, T('file.untitled')),
    filters: [{name: T('dlg.filter.pseudo'), extensions: ['pseudo', 'psb']}]
  });
  if (canceled) return {ok: false, cancelled: true};
  projectDir = path.dirname(filePath);
  sourceBaseDir = projectDir;
  fs.writeFileSync(filePath, String(text || ''), 'utf8');
  return {ok: true, filePath, baseDir: sourceBaseDir};
});

function buildMenu(win) {
  const template = [
    {
      label: T('menu.file'),
      submenu: [
        {label: T('menu.open'), accelerator: 'CmdOrCtrl+O', click: () => win.webContents.send('menu', 'open')},
        {label: T('menu.save'), accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('menu', 'save')},
        {type: 'separator'},
        {label: T('menu.export'), accelerator: 'CmdOrCtrl+E', click: () => win.webContents.send('menu', 'export')},
        {type: 'separator'},
        {role: 'quit', label: T('menu.quit')}
      ]
    },
    {
      label: T('menu.compile'),
      submenu: [
        {label: T('menu.check'), accelerator: 'CmdOrCtrl+B', click: () => win.webContents.send('menu', 'compile')},
        {
          label: T('menu.examples'),
          submenu: exampleFiles().map(f => ({
            label: exampleLabel(f),
            click: () => win.webContents.send('menu', 'example:' + f)
          }))
        }
      ]
    },
    {
      label: T('menu.view'),
      submenu: [{role: 'reload', label: T('menu.reload')}, {role: 'toggleDevTools', label: T('menu.devtools')}]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// On remote sessions / machines without a GPU, Chromium's GPU process crashes repeatedly
// (exit_code=0xC0000005) and after 10 retries goes straight to FATAL:
// "GPU process isn't usable. Goodbye.". This app is text-only and has no use for hardware
// acceleration, so the whole GPU chain is disabled by default; set PSB_GPU=1 to enable it.
if (process.env.PSB_GPU !== '1') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

app.whenReady().then(async () => {
  const i18n = await loadI18n();
  readSettings();
  i18n.setLang(lang);
  lang = i18n.getLang();
  const win = createWindow();
  buildMenu(win);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
