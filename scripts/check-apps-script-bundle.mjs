import { readFile, readdir } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const directory = 'build/apps-script';
const files = (await readdir(directory)).sort();
if (JSON.stringify(files) !== JSON.stringify(['Code.gs', 'Main.gs', 'appsscript.json'])) {
  throw new Error('Le paquet Apps Script contient des fichiers inattendus');
}
const manifest = JSON.parse(await readFile(directory + '/appsscript.json', 'utf8'));
if (manifest.runtimeVersion !== 'V8' || manifest.oauthScopes?.length !== 0) {
  throw new Error('Permissions Apps Script non conformes');
}
const code = await readFile(directory + '/Code.gs', 'utf8');
const main = await readFile(directory + '/Main.gs', 'utf8');
if (/\b(doGet|doPost|DriveApp|SpreadsheetApp|GmailApp|UrlFetchApp)\b/.test(code + main)) {
  throw new Error('Le bundle de recette contient une API ou un endpoint interdit');
}
const result = runInNewContext(code + '\n' + main + '\ncftcRecetteHealthCheck();', {}, { timeout: 1500 });
if (result?.status !== 'OK' || result?.schema !== 'RECETTE_1' || result?.amountCents !== 1250) {
  throw new Error('La sonde de recette ne répond pas comme attendu');
}
console.log('Bundle Apps Script de recette validé localement (aucun déploiement).');
