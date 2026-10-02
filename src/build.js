// Shared pipeline: source -> compiled targets -> assets -> project -> .sb3 buffer.
// Used by both the CLI and the Electron main process.
import fs from 'node:fs';
import path from 'node:path';
import {compile, PsError} from './core/compiler.js';
import {translateMessage, setLang, getLang} from './core/i18n.js';
import {EXTENSION_URLS} from './core/catalog.js';
import {discPng, solidPng, costumeFromPng, costumeFromFile, soundFromFile, packSb3, makeProject} from './core/project.js';
import {validateProject} from './core/validate.js';

const PALETTE = [
  [96, 148, 255, 255], [255, 120, 117, 255], [102, 187, 106, 255],
  [255, 183, 77, 255], [171, 71, 188, 255], [38, 198, 218, 255]
];

function colorFor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const labelOf = ref => path.basename(ref.path).replace(/\.[^.]+$/, '');

// Media paths are relative to the .pseudo that declares them, so an example folder
// and a user project folder both work without a path setting.
function readMedia(ref, baseDir, kind) {
  const abs = path.resolve(baseDir, ref.path);
  let buf;
  try {
    buf = fs.readFileSync(abs);
  } catch (e) {
    const why = e.code === 'ENOENT' ? '找不到文件' : e.code === 'EISDIR' ? '是目录不是文件' : e.message;
    throw new PsError(`${kind === 'sound' ? '声音' : '造型'}素材${why}：${ref.path}（相对 ${baseDir}）`, ref.line);
  }
  if (!buf.length) throw new PsError(`${kind === 'sound' ? '声音' : '造型'}素材是空文件：${ref.path}`, ref.line);
  try {
    return kind === 'sound' ? soundFromFile(labelOf(ref), buf) : costumeFromFile(labelOf(ref), buf);
  } catch (e) {
    throw new PsError(e.message, ref.line);
  }
}

function mediaFor(out, baseDir) {
  const byTarget = new Map();
  for (const spec of out.assetSpecs || []) {
    const list = byTarget.get(spec.index) || {costume: [], sound: []};
    list[spec.kind].push(...spec.files);
    byTarget.set(spec.index, list);
  }
  const assets = new Map();
  const used = [];
  out.targets.forEach((t, index) => {
    const refs = byTarget.get(index) || {costume: [], sound: []};
    const costumes = refs.costume.map(ref => readMedia(ref, baseDir, 'costume'));
    if (!costumes.length) {
      costumes.push(t.isStage
        ? costumeFromPng('backdrop1', solidPng(480, 360))
        : costumeFromPng('造型1', discPng(32, colorFor(t.name))));
    }
    const sounds = refs.sound.map(ref => readMedia(ref, baseDir, 'sound'));
    t.costumes = costumes.map(c => c.costume);
    t.sounds = sounds.map(s => s.sound);
    t.currentCostume = 0;
    for (const c of costumes) assets.set(c.costume.md5ext, c.buffer);
    for (const s of sounds) assets.set(s.sound.md5ext, s.buffer);
    used.push({name: t.name, isStage: t.isStage, costumes: t.costumes.map(c => c.name), sounds: t.sounds.map(s => s.name)});
  });
  return {assets, used};
}

export async function buildFromSource(src, opts = {}) {
  if (opts.lang) setLang(opts.lang);
  const lang = getLang();
  const out = compile(src, opts);
  const {assets, used} = mediaFor(out, opts.baseDir ? path.resolve(opts.baseDir) : process.cwd());
  const project = makeProject({targets: out.targets, extensions: out.extensions, extensionURLs: EXTENSION_URLS});
  // The structural self-check problem strings are written in Simplified Chinese in validate.js; translate them all once here.
  const problems = (opts.skipValidate ? [] : validateProject(project, new Set(assets.keys())))
    .map(p => translateMessage(lang, p));
  const buffer = await packSb3(project, assets);
  return {
    project,
    assets,
    buffer,
    stats: out.stats,
    totalBlocks: out.totalBlocks,
    warnings: out.warnings,
    problems,
    extensions: out.extensions,
    media: used,
    assetSpecs: out.assetSpecs,
    targets: out.targets.map((t, i) => ({name: t.name, isStage: t.isStage, scripts: Object.values(t.blocks).filter(b => b.topLevel).length, costumes: used[i].costumes.length, sounds: used[i].sounds.length}))
  };
}

export {PsError, compile, validateProject};
