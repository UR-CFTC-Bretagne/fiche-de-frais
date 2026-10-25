import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const directory = 'build/apps-script';
await mkdir(directory, { recursive: true });
await build({
  entryPoints: ['src/recette/health-check.ts'],
  outfile: join(directory, 'Code.gs'),
  bundle: true,
  platform: 'neutral',
  format: 'iife',
  globalName: 'CFTCRecette',
  target: 'es2020',
  legalComments: 'none',
  sourcemap: false,
  minify: false,
  logLevel: 'warning',
});
const code = await readFile(join(directory, 'Code.gs'), 'utf8');
if (!code.includes('CFTCRecette') || !code.includes('healthCheck')) {
  throw new Error('Le bundle de recette ne contient pas la sonde attendue');
}
await writeFile(join(directory, 'Main.gs'),
  'function cftcRecetteHealthCheck() { return CFTCRecette.healthCheck(); }\n', 'utf8');

const manifest = JSON.parse(await readFile('appsscript.json', 'utf8'));
if (manifest.runtimeVersion !== 'V8' || !Array.isArray(manifest.oauthScopes) ||
    manifest.oauthScopes.length !== 0) {
  throw new Error('Manifeste non conforme : la recette doit conserver zéro scope OAuth');
}
await writeFile(join(directory, 'appsscript.json'),
  JSON.stringify(manifest, null, 2) + '\n', 'utf8');
