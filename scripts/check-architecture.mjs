import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeArchitecture } from './architecture-rules.mjs';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = {};
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files[relative(root, full).split(sep).join('/')] = await readFile(full, 'utf8');
    }
  }
}
await collect(root);
const violations = analyzeArchitecture(files);
if (violations.length) {
  console.error('Frontières architecturales non respectées:\n' + violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Architecture : ' + Object.keys(files).length + ' fichiers analysés, aucune violation.');
}
