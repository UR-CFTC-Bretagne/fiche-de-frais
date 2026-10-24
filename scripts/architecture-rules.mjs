import { posix } from 'node:path';

const googleApi = /\b(?:SpreadsheetApp|DriveApp|GmailApp|MailApp|CalendarApp|PropertiesService|Session|LockService)\b|GoogleAppsScript\./;
const staticImports = /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;

/** Inspecte les dépendances d'un ensemble de sources TypeScript, sans exécuter leur contenu. */
export function analyzeArchitecture(files) {
  const violations = [];
  const paths = new Set(Object.keys(files));
  const graph = new Map([...paths].map(path => [path, []]));
  for (const [file, source] of Object.entries(files)) {
    const layer = file.split('/')[0];
    if (['domain', 'application'].includes(layer) && googleApi.test(source)) {
      violations.push(file + ' : API Google interdite dans ' + layer);
    }
    for (const [, specifier] of source.matchAll(staticImports)) {
      if (!specifier.startsWith('.')) {
        if (layer === 'domain') violations.push(file + ' : dépendance externe interdite (' + specifier + ')');
        continue;
      }
      const base = posix.normalize(posix.join(posix.dirname(file), specifier));
      const resolved = [base, base + '.ts', base + '.tsx', posix.join(base, 'index.ts')].find(path => paths.has(path));
      if (!resolved) {
        violations.push(file + ' : import introuvable (' + specifier + ')');
        continue;
      }
      graph.get(file).push(resolved);
      const target = resolved.split('/')[0];
      if (layer === 'domain' && target !== 'domain') violations.push(file + ' : domain dépend de ' + target);
      if (layer === 'application' && !['application', 'domain'].includes(target)) {
        violations.push(file + ' : application dépend de ' + target);
      }
      if (layer === 'infrastructure' && target === 'interface') violations.push(file + ' : infrastructure dépend de interface');
    }
  }
  const visited = new Set();
  const active = new Set();
  function visit(node, trail) {
    if (active.has(node)) {
      violations.push('Dépendance circulaire : ' + [...trail.slice(trail.indexOf(node)), node].join(' -> '));
      return;
    }
    if (visited.has(node)) return;
    active.add(node);
    for (const next of graph.get(node) ?? []) visit(next, [...trail, next]);
    active.delete(node);
    visited.add(node);
  }
  for (const node of graph.keys()) visit(node, [node]);
  return [...new Set(violations)];
}
