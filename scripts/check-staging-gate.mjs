import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function mustRefuse(env) {
  const result = spawnSync(process.execPath, ['scripts/prepare-staging-clasp.mjs'], {
    cwd: process.cwd(),
    env: { PATH: process.env.PATH ?? '', ...env },
    encoding: 'utf8',
    timeout: 3000,
  });
  if (result.status === 0) throw new Error('Le déploiement recette aurait dû être refusé');
  if (existsSync('.clasp.json')) throw new Error('Fichier .clasp.json créé malgré le refus');
}

mustRefuse({});
mustRefuse({
  RECETTE_SCRIPT_ID: 'recette-simulation-identifiant-001',
  RECETTE_APPROVED_SCRIPT_ID: 'autre-recette-simulation-0001',
  RECETTE_CLASPRC_JSON: '{"test":true}',
});
mustRefuse({
  RECETTE_SCRIPT_ID: 'recette-simulation-identifiant-001',
  RECETTE_APPROVED_SCRIPT_ID: 'recette-simulation-identifiant-001',
  RECETTE_CLASPRC_JSON: '',
});
console.log('Contrôles fail-closed du déploiement recette validés.');
