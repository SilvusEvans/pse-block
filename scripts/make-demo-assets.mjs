// Generates the media files that examples/media-zh-Hans.pseudo and examples/snake-zh-Hans.pseudo import,
// so the demos need no downloaded assets and stay reproducible.
//   node scripts/make-demo-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {discPng, solidPng} from '../src/core/project.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIR = path.join(ROOT, 'examples', 'assets');

// 16-bit mono PCM wav, one sine tone with a short fade so it has no click.
function wav(rate, seconds, freq) {
  const n = Math.round(rate * seconds);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const fade = Math.min(1, i / (rate * 0.01), (n - i) / (rate * 0.02));
    const s = Math.round(Math.sin(2 * Math.PI * freq * i / rate) * 12000 * fade);
    data.writeInt16LE(s, i * 2);
  }
  const head = Buffer.alloc(12);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVE', 8);
  const fmt = Buffer.alloc(24);
  fmt.write('fmt ', 0);
  fmt.writeUInt32LE(16, 4);
  fmt.writeUInt16LE(1, 8);
  fmt.writeUInt16LE(1, 10);
  fmt.writeUInt32LE(rate, 12);
  fmt.writeUInt32LE(rate * 2, 16);
  fmt.writeUInt16LE(2, 20);
  fmt.writeUInt16LE(16, 22);
  const body = Buffer.alloc(8);
  body.write('data', 0);
  body.writeUInt32LE(data.length, 4);
  return Buffer.concat([head, fmt, body, data]);
}

const svg = (size, color) => `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <polygon points="${size / 2},${size * 0.05} ${size * 0.82},${size * 0.9} ${size * 0.05},${size * 0.38} ${size * 0.95},${size * 0.38} ${size * 0.18},${size * 0.9}" fill="${color}" stroke="#ffffff" stroke-width="${size * 0.03}" stroke-linejoin="round"/>
</svg>`;

// ---- Snake example (examples/snake-zh-Hans.pseudo) ----
// The field is a 17×11 grid with a cell size of 24: cell coordinates (gx,gy) are drawn on the
// stage at (gx*24, gy*24), with gx from -8..8 and gy from -5..5, so cell centres land exactly on
// 48..432 / 60..300 pixels. The empty band at the top, 0..48, is left for the score variable monitor.
const CELL = 24;
const COLS = 17;
const ROWS = 11;
const AREA_W = COLS * CELL;
const AREA_H = ROWS * CELL;
const AREA_X = (480 - AREA_W) / 2;
const AREA_Y = (360 - AREA_H) / 2;

const cell = inner => `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${CELL}" height="${CELL}" viewBox="0 0 ${CELL} ${CELL}">
${inner}
</svg>`;

const snakeHead = cell(`  <rect x="1" y="1" width="22" height="22" rx="7" fill="#7ee787" stroke="#2ea043" stroke-width="1.5"/>
  <circle cx="8.5" cy="9.5" r="2.3" fill="#0b1117"/>
  <circle cx="15.5" cy="9.5" r="2.3" fill="#0b1117"/>`);

const snakeBody = cell(`  <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#3fb950" stroke="#1f7a34" stroke-width="1.5"/>`);

const snakeFood = cell(`  <circle cx="12" cy="12" r="9.5" fill="#f85149" stroke="#ff9d95" stroke-width="1.5"/>`);

// The grid lines are written out explicitly: scratch-svg-renderer's handling of <pattern>/<defs>
// references is unreliable, so the grid cannot be tiled with a pattern.
const grid = [];
for (let k = 0; k <= COLS; k++) {
  const x = AREA_X + k * CELL;
  grid.push(`  <line x1="${x}" y1="${AREA_Y}" x2="${x}" y2="${AREA_Y + AREA_H}" stroke="#22303f" stroke-width="1"/>`);
}
for (let k = 0; k <= ROWS; k++) {
  const y = AREA_Y + k * CELL;
  grid.push(`  <line x1="${AREA_X}" y1="${y}" x2="${AREA_X + AREA_W}" y2="${y}" stroke="#22303f" stroke-width="1"/>`);
}
const field = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#0d1117"/>
  <rect x="0" y="0" width="480" height="36" fill="#161b22"/>
  <rect x="${AREA_X}" y="${AREA_Y}" width="${AREA_W}" height="${AREA_H}" fill="#131a22"/>
${grid.join('\n')}
  <rect x="${AREA_X - 1.5}" y="${AREA_Y - 1.5}" width="${AREA_W + 3}" height="${AREA_H + 3}" fill="none" stroke="#30475e" stroke-width="3"/>
</svg>`;

fs.mkdirSync(DIR, {recursive: true});

// The snake's four assets are written once under each of the Chinese and English names:
// examples/snake-zh-Hans.pseudo uses the Chinese names, examples/snake-en.pseudo the English ones.
// The two copies are byte-identical => the same md5ext, so the zip stores only one; it just adds
// four file entries and does not make the output any bigger.
const snakeAlias = {'蛇头.svg': 'head.svg', '身体.svg': 'body.svg', '食物.svg': 'food.svg', '场地.svg': 'field.svg'};

const sources = [
  ['背景480.png', solidPng(480, 360, [34, 62, 110, 255])],
  ['小球.png', discPng(64, [255, 120, 117, 255])],
  ['星星.svg', Buffer.from(svg(96, '#ffd54f'), 'utf8')],
  ['音效.wav', wav(22050, 0.35, 880)],
  ['蛇头.svg', Buffer.from(snakeHead, 'utf8')],
  ['身体.svg', Buffer.from(snakeBody, 'utf8')],
  ['食物.svg', Buffer.from(snakeFood, 'utf8')],
  ['场地.svg', Buffer.from(field, 'utf8')]
];

const files = [];
for (const [name, buf] of sources) {
  files.push([name, buf]);
  if (snakeAlias[name]) files.push([snakeAlias[name], buf]);
}
for (const [name, buf] of files) fs.writeFileSync(path.join(DIR, name), buf);
console.log(`generated ${files.length} demo assets -> ${path.relative(ROOT, DIR)}`);
for (const [name, buf] of files) console.log(`  ${name}  ${buf.length} B`);
