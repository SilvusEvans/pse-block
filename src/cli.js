#!/usr/bin/env node
// pseudo2sb3 CLI:  node src/cli.js input.pseudo [-o out.sb3] [--json] [--parse-check] [--lang ja]
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {buildFromSource, PsError} from './build.js';
import {setLang, getLang, normalizeLang, t} from './core/i18n.js';

const require = createRequire(import.meta.url);

function usage (msg) {
  if (msg) console.error('\n' + msg);
  console.log(t('cli.usage'));
  console.log(t('cli.mediaHint'));
  process.exit(msg ? 1 : 0);
}

const argv = process.argv.slice(2);
let input = null;
let output = null;
let asJson = false;
let parseCheck = false;
let skipValidate = false;
let baseDir = null;
let lang = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-o' || a === '--out') output = argv[++i];
  else if (a === '--json') asJson = true;
  else if (a === '--parse-check') parseCheck = true;
  else if (a === '--no-validate') skipValidate = true;
  else if (a === '--base-dir') baseDir = argv[++i];
  else if (a === '--lang') lang = argv[++i];
  else if (a === '-h' || a === '--help') usage();
  else if (a.startsWith('-')) { setLang('en'); usage(t('cli.unknownArg', a)); }
  else input = a;
}
if (lang) {
  const n = normalizeLang(lang);
  if (!n) usage(t('cli.unknownArg', lang));
  setLang(n);
}
if (!input) usage();

const source = fs.readFileSync(input, 'utf8');
try {
  const result = await buildFromSource(source, {skipValidate, lang: getLang(), baseDir: baseDir || path.dirname(path.resolve(input))});
  if (result.problems.length) {
    console.error(t('cli.selfCheckFailed', result.problems.length));
    for (const p of result.problems.slice(0, 40)) console.error('  - ' + p);
    process.exit(2);
  }
  const dest = output || path.join(path.dirname(input), path.basename(input, path.extname(input)) + '.sb3');
  fs.mkdirSync(path.dirname(path.resolve(dest)), {recursive: true});
  fs.writeFileSync(dest, result.buffer);
  console.log(t('cli.wrote', path.relative(process.cwd(), dest), (result.buffer.length / 1024).toFixed(1)));
  console.log(t('cli.summary', result.totalBlocks, result.targets.length, result.extensions.join(',') || t('cli.none')));
  for (const target of result.targets) {
    console.log(t('cli.targetLine', target.isStage ? t('cli.stageTag') : t('cli.spriteTag'), target.name, target.scripts, target.costumes, target.sounds));
  }
  if (asJson) fs.writeFileSync(dest.replace(/\.sb3$/, '.json'), JSON.stringify(result.project, null, 1));
  if (parseCheck) {
    const parse = require('scratch-parser');
    const fn = parse.default || parse;
    const [json, meta] = await new Promise((resolve, reject) => {
      fn(result.buffer, false, (err, pair) => err ? reject(err) : resolve(pair));
    });
    const names = Object.keys(meta.files || {});
    console.log(t('cli.parseOk', json.meta.semver, names.length, names.filter(n => n !== 'project.json').length));
  }
} catch (e) {
  if (e instanceof PsError) {
    console.error(t('cli.compileFailed') + e.message);
    process.exit(1);
  }
  console.error(t('cli.internalError'), e && e.stack || e);
  process.exit(3);
}
