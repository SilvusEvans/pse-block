const codeEl = document.getElementById('code');
const gutterEl = document.getElementById('gutter');
const fileLabel = document.getElementById('file-label');
const badge = document.getElementById('status-badge');
const fatalEl = document.getElementById('fatal');
const problemsEl = document.getElementById('problems');
const warningsEl = document.getElementById('warnings');
const problemCount = document.getElementById('problem-count');
const warningCount = document.getElementById('warning-count');
const statsEl = document.getElementById('stats');
const langSelect = document.getElementById('lang-select');

// Current language and UI copy. All interface text comes from here; switching language swaps only this one table.
const state = {lang: 'en', strings: {}};
let currentPath = null;
let lastResult = null;
let exampleLoaded = false;
// File name of the currently loaded example (used for the title when there is no file on disk).
// Examples are chosen by UI language, so the title bar must show the file name: users need to know
// whether they are looking at hello-zh-Hans.pseudo or hello-en.pseudo.
let exampleFile = null;
let badgeKey = 'badge.pending';

function t (key, ...args) {
  const tpl = state.strings[key];
  if (tpl === undefined) return key;
  let i = 0;
  return String(tpl).replace(/\{\}/g, () => (args[i] === undefined || args[i] === null ? '' : String(args[i++])));
}

function setBadge (key, cls) {
  badgeKey = key;
  badge.textContent = t(key);
  badge.className = 'badge ' + (cls || (key === 'badge.ok' || key === 'badge.exported' ? 'ok' : key === 'badge.err' ? 'err' : ''));
}

function fileName () {
  if (!currentPath) return exampleFile || t('file.untitled');
  const parts = currentPath.split(/[\\/]/);
  return parts[parts.length - 1];
}

function refreshFileLabel () {
  fileLabel.textContent = fileName() + (exampleLoaded ? t('file.exampleSuffix') : '');
}

function renderGutter () {
  const lines = codeEl.value.split('\n').length;
  let text = '';
  for (let i = 1; i <= lines; i++) text += i + '\n';
  gutterEl.textContent = text;
  syncScroll();
}

function syncScroll () {
  gutterEl.scrollTop = codeEl.scrollTop;
}

// The line-number prefix varies by language: [第 3 行] / [3 行目] / [line 3]
function extractLine (message) {
  const s = String(message || '');
  const m = /第 (\d+) 行/.exec(s) || /(\d+) 行目/.exec(s) || /line (\d+)/i.exec(s);
  return m ? Number(m[1]) : 0;
}

function fillList (el, items, cls) {
  el.textContent = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = cls;
    const line = extractLine(item);
    const span = document.createElement('span');
    span.className = 'ln';
    span.textContent = line ? 'L' + line : '—';
    li.appendChild(span);
    li.appendChild(document.createTextNode(String(item)));
    if (line) li.addEventListener('click', () => jumpToLine(line));
    el.appendChild(li);
  }
}

function jumpToLine (line) {
  const lines = codeEl.value.split('\n');
  let pos = 0;
  for (let i = 0; i < line - 1 && i < lines.length; i++) pos += lines[i].length + 1;
  codeEl.focus();
  codeEl.setSelectionRange(pos, pos + (lines[line - 1] || '').length);
  const lineHeight = 22;
  codeEl.scrollTop = Math.max(0, (line - 3) * lineHeight);
  syncScroll();
}

function renderStats (result) {
  statsEl.textContent = '';
  if (!result || result.fatal) {
    if (result && result.fatal) {
      fatalEl.hidden = false;
      fatalEl.textContent = result.fatal.message;
    }
    return;
  }
  fatalEl.hidden = true;
  const table = document.createElement('table');
  const rows = [
    [t('stats.blocks'), result.totalBlocks],
    [t('stats.targets'), (result.targets || []).length],
    [t('stats.size'), ((result.size || 0) / 1024).toFixed(1) + ' KB']
  ];
  for (const [k, v] of rows) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = k;
    const td2 = document.createElement('td');
    td2.className = 'num';
    td2.textContent = String(v);
    tr.append(td1, td2);
    table.appendChild(tr);
  }
  statsEl.appendChild(table);

  const chips = document.createElement('div');
  chips.className = 'chips';
  for (const target of result.targets || []) {
    const c = document.createElement('span');
    c.className = 'chip';
    c.textContent = t('stats.chip', target.isStage ? t('stats.stage') : target.name, target.scripts, target.costumes || 0, target.sounds || 0);
    chips.appendChild(c);
  }
  for (const ext of result.extensions || []) {
    const c = document.createElement('span');
    c.className = 'chip';
    c.textContent = t('stats.ext', ext);
    chips.appendChild(c);
  }
  statsEl.appendChild(chips);
}

async function compile () {
  lastResult = await window.psb.compile(codeEl.value, {lang: state.lang});
  const result = lastResult;
  const problems = result.problems || [];
  const warnings = (result.warnings || []).map(w => (w && w.message) || String(w));
  if (result.fatal) problems.unshift(result.fatal.message);
  fillList(problemsEl, problems, 'error');
  fillList(warningsEl, warnings, 'warn');
  problemCount.textContent = String(problems.length);
  warningCount.textContent = String(warnings.length);
  setBadge(result.ok && !result.fatal ? 'badge.ok' : 'badge.err');
  renderStats(result);
  return problems.length === 0 && !result.fatal;
}

async function exportSb3 () {
  const good = await compile();
  if (!good) {
    setBadge('badge.fixFirst', 'err');
    return;
  }
  const suggested = fileName().replace(/\.(pseudo|psb|txt)$/i, '');
  const res = await window.psb.exportSb3(codeEl.value, {lang: state.lang}, suggested);
  if (res.ok) {
    setBadge('badge.exported', 'ok');
    fatalEl.hidden = true;
  }
}

async function openFile () {
  const res = await window.psb.openSource();
  if (res.ok) {
    codeEl.value = res.text;
    currentPath = res.filePath;
    exampleLoaded = false;
    exampleFile = null;
    refreshFileLabel();
    renderGutter();
  }
}

// Media declarations must sit directly under their 角色/舞台 (sprite/stage) header, so walk up from
// the cursor to the nearest header and reuse the indentation of the line below it.
// Chinese has no \b word boundary, so only a keyword at the start of the line counts, and it must
// not be immediately followed by a Latin letter or digit.
// Header keywords cover four languages: 角色/舞台/sprite/stage/スプライト/ステージ.
const HEAD_RE = /^([ \t]*)(角色|舞台|sprite|stage|スプライト|ステージ)/i;
const STAGE_HEAD_RE = /舞台|stage|ステージ/i;

function headLine (line) {
  const m = HEAD_RE.exec(line);
  if (!m) return null;
  if (/^[A-Za-z0-9_]/.test(line.slice(m[0].length))) return null;
  return {isStage: STAGE_HEAD_RE.test(m[2]), indent: m[1]};
}

function targetAnchor (text, cursor) {
  const lines = text.split('\n');
  const at = text.slice(0, cursor).split('\n').length - 1;
  for (let i = at; i >= 0; i--) {
    const head = headLine(lines[i]);
    if (!head) continue;
    let indent = head.indent + '  ';
    for (let k = i + 1; k < lines.length && k <= i + 12; k++) {
      const m = /^([ \t]+)\S/.exec(lines[k]);
      if (m) { indent = m[1]; break; }
    }
    return {line: i + 1, indent, isStage: head.isStage};
  }
  return null;
}

function mediaLines (items, isStage, indent) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (seen.has(it.kind + '|' + it.rel)) continue;
    seen.add(it.kind + '|' + it.rel);
    const word = it.kind === 'sound' ? t('word.sound') : (isStage ? t('word.backdrop') : t('word.costume'));
    out.push(indent + word + ' "' + it.rel + '"');
  }
  return out;
}

function applyMedia (items) {
  const anchor = targetAnchor(codeEl.value, codeEl.selectionStart) || {line: 0, indent: '  ', isStage: true, fresh: true};
  const body = mediaLines(items, anchor.isStage, anchor.indent);
  if (!body.length) return 0;
  const lines = codeEl.value.split('\n');
  if (anchor.fresh) lines.unshift(t('word.stage') + ':', ...body);
  else lines.splice(anchor.line, 0, ...body);
  codeEl.value = lines.join('\n');
  const through = anchor.fresh ? body.length + 1 : anchor.line + body.length;
  const pos = lines.slice(0, through).join('\n').length + 1;
  codeEl.setSelectionRange(pos, pos);
  renderGutter();
  return body.length;
}

async function insertMedia () {
  const res = await window.psb.pickMedia();
  if (!res || !res.ok) return;
  if (res.errors && res.errors.length) {
    fatalEl.hidden = false;
    fatalEl.textContent = t('err.mediaCopy') + res.errors.join('；');
  }
  if (applyMedia(res.items)) compile();
}

// The smoke test must be able to exercise the insert logic without a native dialog.
window.psbTest = {targetAnchor, mediaLines, applyMedia};

async function saveFile () {
  const res = await window.psb.saveSource(codeEl.value, currentPath);
  if (res.ok) {
    currentPath = res.filePath;
    exampleLoaded = false;
    exampleFile = null;
    refreshFileLabel();
  }
}

document.getElementById('btn-compile').addEventListener('click', compile);
document.getElementById('btn-export').addEventListener('click', exportSb3);
document.getElementById('btn-open').addEventListener('click', openFile);
document.getElementById('btn-save').addEventListener('click', saveFile);
document.getElementById('btn-example').addEventListener('click', () => loadExample());
document.getElementById('btn-media').addEventListener('click', insertMedia);

codeEl.addEventListener('input', renderGutter);
codeEl.addEventListener('scroll', syncScroll);
codeEl.addEventListener('keydown', event => {
  if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); compile(); }
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = codeEl.selectionStart;
    codeEl.setRangeText('  ', start, codeEl.selectionEnd, 'end');
    renderGutter();
  }
});

window.addEventListener('keydown', event => {
  if (!(event.ctrlKey || event.metaKey)) return;
  const k = event.key.toLowerCase();
  if (k === 'b') { event.preventDefault(); compile(); }
  if (k === 'e') { event.preventDefault(); exportSb3(); }
  if (k === 'o') { event.preventDefault(); openFile(); }
  if (k === 's') { event.preventDefault(); saveFile(); }
});

window.psb.onMenu(async action => {
  if (action === 'compile') compile();
  if (action === 'export') exportSb3();
  if (action === 'open') openFile();
  if (action === 'save') saveFile();
  if (action === 'example' || String(action).startsWith('example:')) loadExample(String(action).split(':')[1]);
});

async function loadExample (name) {
  const res = await window.psb.example(name);
  if (res && res.ok) {
    codeEl.value = res.text;
    currentPath = null;
    exampleLoaded = true;
    exampleFile = res.file || null;
    refreshFileLabel();
    renderGutter();
    compile();
  } else if (res && res.error) {
    fatalEl.hidden = false;
    fatalEl.textContent = t('err.exampleLoad') + res.error.message;
    setBadge('badge.err', 'err');
  }
}

/* ------------------------------ block alias table ------------------------------ */

const vocabEl = document.getElementById('vocab');
const vocabTable = document.getElementById('vocab-table');
const vocabFilter = document.getElementById('vocab-filter');
const vocabCount = document.getElementById('vocab-count');
let vocabRows = null;

function vocabRow (tag, cells) {
  const row = document.createElement('tr');
  for (const c of cells) {
    const cell = document.createElement(tag);
    cell.textContent = c;
    row.appendChild(cell);
  }
  return row;
}

function renderVocab () {
  if (!vocabRows) return;
  const q = vocabFilter.value.toLowerCase().replace(/\s+/g, '');
  const rows = q ? vocabRows.filter(r =>
    [r.group, r.groupLabel, r.kind, r.kindLabel, r.op, ...(r.aliases || []), ...(r.zh || []), ...(r.en || []), ...(r.ja || []), ...(r.slots || [])]
      .join(' ').toLowerCase().replace(/\s+/g, '').includes(q)) : vocabRows;
  vocabCount.textContent = String(rows.length);
  vocabTable.replaceChildren(
    vocabRow('th', [t('vocab.th.group'), t('vocab.th.kind'), t('vocab.th.alias'), t('vocab.th.en'), t('vocab.th.slots')]),
    ...rows.map(r => vocabRow('td', [
      r.groupLabel || r.group,
      r.kindLabel || r.kind,
      (r.aliases || r.zh || []).join(' / '),
      (r.en || []).join(' / '),
      (r.slots || []).join(' ')
    ]))
  );
}

async function loadVocab () {
  const res = await window.psb.syntax(state.lang);
  vocabRows = (res && res.rows) || [];
  renderVocab();
}

vocabEl.addEventListener('toggle', () => {
  if (!vocabEl.open || vocabRows) return;
  loadVocab();
});
vocabFilter.addEventListener('input', renderVocab);

/* ------------------------------- language switch ------------------------------- */

function applyStrings (payload) {
  if (!payload) return;
  state.lang = payload.lang || 'zh-Hans';
  state.strings = payload.strings || {};
  document.documentElement.lang = state.lang;
  document.title = t('app.title');

  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  const pre = document.getElementById('syntax-pre');
  if (pre) pre.textContent = state.strings['ref.syntax.text'] || '';
  const hint = document.getElementById('syntax-hint');
  if (hint) hint.textContent = t('ref.hint');

  if (langSelect) {
    langSelect.replaceChildren(...(payload.langs || []).map(code => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = (payload.labels || {})[code] || code;
      return opt;
    }));
    langSelect.value = state.lang;
  }

  vocabRows = null;
  vocabCount.textContent = t('ref.vocab.loading');
  if (vocabEl.open) loadVocab();

  setBadge(badgeKey);
  refreshFileLabel();
  if (lastResult) renderStats(lastResult);
}

if (langSelect) {
  langSelect.addEventListener('change', async () => {
    const payload = await window.psb.setLang(langSelect.value);
    applyStrings(payload);
  });
}

async function boot () {
  renderGutter();
  try {
    applyStrings(await window.psb.i18n());
  } catch (err) {
    // If the UI copy cannot be fetched, keep the default Simplified Chinese from the HTML
  }
}

boot();
