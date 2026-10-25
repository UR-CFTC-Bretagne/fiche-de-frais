import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const scriptId = process.env.RECETTE_SCRIPT_ID ?? '';
const approvedId = process.env.RECETTE_APPROVED_SCRIPT_ID ?? '';
const credentials = process.env.RECETTE_CLASPRC_JSON ?? '';
if (!/^[a-zA-Z0-9_-]{20,200}$/.test(scriptId) ||
    scriptId !== approvedId ||
    !credentials) {
  throw new Error('Recette non configurée ou identifiant non approuvé');
}
let auth;
try { auth = JSON.parse(credentials); } catch {
  throw new Error('Format des identifiants de recette invalide');
}
if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
  throw new Error('Identifiants de recette invalides');
}
const manifest = JSON.parse(await readFile('build/apps-script/appsscript.json', 'utf8'));
if (manifest.runtimeVersion !== 'V8' || !Array.isArray(manifest.oauthScopes) ||
    manifest.oauthScopes.length !== 0) {
  throw new Error('Scopes OAuth du bundle non autorisés');
}
await writeFile('.clasp.json', JSON.stringify({ scriptId, rootDir: 'build/apps-script' }), { mode: 0o600 });
await writeFile(join(homedir(), '.clasprc.json'), credentials, { mode: 0o600 });
console.log('Configuration de recette validée (identifiants masqués).');
