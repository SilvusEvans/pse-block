import {verifyCatalog} from '../src/core/catalog.js';
const problems = verifyCatalog();
if (problems.length) {
  console.error(`catalog self-check failed (${problems.length}):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('catalog OK');
