// Build the target/project JSON and pack it into a .sb3 (zip) with generated assets.
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import JSZip from 'jszip';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function raster(w, h, draw) {
  const raw = Buffer.alloc(h * (1 + w * 4));
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = draw(x, y);
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, {level: 9})),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

export function solidPng(w = 480, h = 360, rgba = [235, 238, 245, 255]) {
  return raster(w, h, () => rgba);
}

// Solid disc costume, RGBA, no external image deps.
export function discPng(size = 32, rgba = [96, 148, 255, 255]) {
  const r0 = (size - 1) / 2;
  const rad = size / 2 - 1;
  return raster(size, size, (x, y) => (Math.hypot(x - r0, y - r0) <= rad ? rgba : [0, 0, 0, 0]));
}

export const md5hex = buf => crypto.createHash('md5').update(buf).digest('hex');

// Identify real media by magic bytes, not by the file name the user typed.
export function sniffFormat(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') return 'wav';
  if (buf.length > 3 && buf.toString('ascii', 0, 3) === 'ID3') return 'mp3';
  const head = buf.toString('utf8', 0, Math.min(buf.length, 512)).trimStart();
  if (head.startsWith('<') && /<svg[\s>]/i.test(head)) return 'svg';
  return null;
}

function svgSize(text) {
  const root = /<svg\b[^>]*>/i.exec(text);
  const tag = root ? root[0] : '';
  const num = s => Number(s);
  const w = /(?<![\w-])width\s*=\s*"([\d.]+)(?:px)?"/i.exec(tag);
  const h = /(?<![\w-])height\s*=\s*"([\d.]+)(?:px)?"/i.exec(tag);
  if (w && h && num(w[1]) > 0 && num(h[1]) > 0) return [num(w[1]), num(h[1])];
  const vb = /viewBox\s*=\s*"?\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(tag);
  if (vb && num(vb[3]) > 0 && num(vb[4]) > 0) return [num(vb[3]), num(vb[4])];
  return [480, 360];
}

// Minimal RIFF parser: Scratch needs the sample rate and count up front, and a wav
// without them plays at the wrong speed.
function wavInfo(buf) {
  let rate = 44100, channels = 1, bits = 16, dataBytes = 0;
  for (let p = 12; p + 8 <= buf.length; ) {
    const id = buf.toString('ascii', p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    const body = p + 8;
    if (id === 'fmt ' && size >= 16) {
      channels = buf.readUInt16LE(body);
      rate = buf.readUInt32LE(body + 4);
      bits = buf.readUInt16LE(body + 14);
    } else if (id === 'data') dataBytes = size;
    if (size <= 0) break;
    p = body + size + (size % 2);
  }
  const frameBytes = Math.max(1, channels * Math.floor(bits / 8));
  return {rate, sampleCount: Math.max(0, Math.floor(dataBytes / frameBytes))};
}

export function costumeFromFile(name, buf) {
  const format = sniffFormat(buf);
  if (!format) throw new Error(`无法识别的素材文件（支持 png/jpg/svg）：${name}`);
  if (format === 'wav' || format === 'mp3') throw new Error(`${name} 是音频，不能用 造型/背景 载入`);
  const md5 = md5hex(buf);
  let width, height;
  if (format === 'png') {
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  } else if (format === 'jpg') {
    throw new Error(`暂不支持 jpg 造型（无法稳定取出宽高）：${name}`);
  } else {
    [width, height] = svgSize(buf.toString('utf8'));
  }
  return {
    costume: {
      name,
      fileName: `${md5}.${format}`,
      md5ext: `${md5}.${format}`,
      assetId: md5,
      dataFormat: format,
      bitmapResolution: 1,
      width,
      height,
      rotationCenterX: width / 2,
      rotationCenterY: height / 2
    },
    buffer: buf
  };
}

export function soundFromFile(name, buf) {
  const format = sniffFormat(buf);
  if (format !== 'wav') throw new Error(`声音暂只支持 wav（实际识别为 ${format || '未知'}）：${name}`);
  const md5 = md5hex(buf);
  const {rate, sampleCount} = wavInfo(buf);
  return {
    sound: {name, assetId: md5, md5ext: `${md5}.wav`, dataFormat: 'wav', format: '', rate, sampleCount},
    buffer: buf
  };
}

export function costumeFromPng(name, buf) {
  const md5 = md5hex(buf);
  // IHDR is at byte 16 of a PNG: width, height as BE u32.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return {
    costume: {
      name,
      fileName: `${md5}.png`,
      md5ext: `${md5}.png`,
      assetId: md5,
      dataFormat: 'png',
      bitmapResolution: 1,
      width,
      height,
      rotationCenterX: width / 2,
      rotationCenterY: height / 2
    },
    buffer: buf
  };
}

export function makeStage({name = 'Stage', costume, backdropName = 'backdrop1'} = {}) {
  return {
    isStage: true,
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [{...costume.costume, name: backdropName, rotationCenterX: 240, rotationCenterY: 180}],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: 'on',
    textToSpeechLanguage: null
  };
}

export function makeSprite({name, costume, x = 0, y = 0, size = 100, visible = true, layerOrder = 1}) {
  return {
    isStage: false,
    name,
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {},
    comments: {},
    currentCostume: 0,
    costumes: [costume.costume],
    sounds: [],
    volume: 100,
    layerOrder,
    visible,
    x,
    y,
    size,
    direction: 90,
    draggable: false,
    rotationStyle: 'all around'
  };
}

export function makeProject({targets, monitors = [], extensions = [], extensionURLs = {}, semver = '3.0.1'}) {
  const project = {targets, monitors, extensions};
  // TurboWarp loads its own extensions by URL; Scratch's built-ins are named by id only.
  const urls = {};
  for (const id of extensions) if (extensionURLs[id]) urls[id] = extensionURLs[id];
  if (Object.keys(urls).length) project.extensionURLs = urls;
  project.meta = {semver, vm: '1.5.0', agent: 'pseudo2sb3/0.1.0'};
  return project;
}

// assets: Map<md5ext, Buffer>
export async function packSb3(project, assets) {
  const zip = new JSZip();
  zip.file('project.json', JSON.stringify(project));
  for (const [md5ext, buf] of assets) zip.file(md5ext, buf, {compression: 'DEFLATE', compressionOptions: {level: 6}});
  return zip.generateAsync({type: 'nodebuffer', compression: 'STORE', mimeType: 'application/zip'});
}
