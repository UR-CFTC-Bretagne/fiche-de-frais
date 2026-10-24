import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const paths = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) paths.push(full);
  }
}
await collect(root);
const violations = [];
for (const file of paths) {
  const path = relative(root, file).split(sep).join('/');
  const content = await readFile(file, 'utf8');
  const imports = [...content.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)].map(x => x[1]);
  const forbiddenExternal = /\b(?:SpreadsheetApp|DriveApp|GmailApp|MailApp|CalendarApp|PropertiesService|Session|LockService)\b/;
  if (path.startsWith('domain/')) {
    if (imports.some(x => x.startsWith('.') && !/^[./]+(?:domain\/)?/.test(x))) violations.push(path + ': import relatif invalide');
    if (imports.some(x => !x.startsWith('.'))) violations.push(path + ': dépendance externe interdite');
    if (forbiddenExternal.test(content) || /GoogleAppsScript\./.test(content)) violations.push(path + ': appel Google interdit dans domain');
    if (imports.some(x => x.includes('application/') || x.includes('infrastructure/') || x.includes('interface/'))) violations.push(path + ': dépendance vers une couche externe');
  }
  if (path.startsWith('application/')) {
    if (imports.some(x => x.includes('infrastructure/') || x.includes('interface/'))) violations.push(path + ': dépendance vers une couche externe');
    if (forbiddenExternal.test(content) || /GoogleAppsScript\./.test(content)) violations.push(path + ': API Google interdite dans application');
  }
  if (path.startsWith('infrastructure/') && imports.some(x => x.includes('interface/'))) violations.push(path + ': infrastructure ne dépend pas de interface');
}
if (violations.length) {
  console.error('Frontières architecturales non respectées:\n' + violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Architecture : ' + paths.length + ' fichiers TypeScript analysés, aucune violation détectée.');
}
