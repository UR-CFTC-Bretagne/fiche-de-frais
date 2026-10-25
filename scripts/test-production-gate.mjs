import { spawnSync } from 'node:child_process';
const revision = 'a'.repeat(40);
const result = spawnSync(process.execPath, ['scripts/check-production-readiness.mjs'], {
  env: { ...process.env, REQUESTED_SHA: revision },
  encoding: 'utf8',
});
if (result.status !== 1 || !result.stderr.includes('MVP NON AUTORISÉ')) {
  throw new Error('Le verrou de production doit refuser le dossier MVP incomplet');
}
console.log('Refus de mise en production vérifié sur dossier non validé.');
