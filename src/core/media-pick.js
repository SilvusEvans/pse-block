// Turns files picked in the native dialog into paths the compiler can read later:
// relative to the .pseudo folder, copied into ./assets when they live outside it.
// Kept out of electron/main.cjs so it can be tested without a dialog.
import fs from 'node:fs';
import path from 'node:path';

const EXT = /\.(png|svg|wav)$/i;

export function stageMedia (picked, baseDir) {
  const base = path.resolve(baseDir);
  const items = [];
  const errors = [];
  for (const p of picked) {
    const abs = path.resolve(p);
    const label = path.basename(abs);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) { errors.push(`${label}: 文件不存在`); continue; }
    if (!EXT.test(label)) { errors.push(`${label}: 只支持 png / svg 造型与 wav 声音`); continue; }
    let rel = path.relative(base, abs).split(path.sep).join('/');
    let copied = false;
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      // Assets living outside the .pseudo folder would not be found on another machine, so copy them into assets/
      const dest = path.join(base, 'assets', label);
      try {
        fs.mkdirSync(path.dirname(dest), {recursive: true});
        if (dest.toLowerCase() !== abs.toLowerCase()) fs.copyFileSync(abs, dest);
        rel = 'assets/' + label;
        copied = true;
      } catch (err) {
        errors.push(`${label}: 复制到 assets/ 失败（${err.message}）`);
        continue;
      }
    }
    items.push({
      rel,
      copied,
      kind: /\.wav$/i.test(rel) ? 'sound' : 'costume',
      name: label.replace(/\.[^.]+$/, '')
    });
  }
  return {baseDir: base, items, errors};
}
