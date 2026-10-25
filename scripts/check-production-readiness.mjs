import { readFileSync } from 'node:fs';
const state = JSON.parse(readFileSync('release/mvp-readiness.json', 'utf8'));
const required = [
  'completeWorkflow', 'verifiedIdentityAndRoles', 'approvedExpensePolicies',
  'privateAttachments', 'protectedStorage', 'successfulStagingAcceptance',
  'backupAndRestore', 'rgpdReview', 'rollbackTested', 'productionAccessApproved',
];
if (state.schemaVersion !== 1 || state.project !== 'UR-CFTC-Bretagne/fiche-de-frais') {
  throw new Error('Fichier de préparation MVP invalide');
}
const missing = required.filter(key => state.checks?.[key] !== true);
const revision = process.env.REQUESTED_SHA ?? '';
const approval = state.approval ?? {};
const approved = approval.approved === true &&
  approval.channel === 'chatgpt' &&
  typeof approval.reference === 'string' && approval.reference.length >= 8 &&
  /^[0-9a-f]{40}$/.test(approval.approvedRevision ?? '') &&
  approval.approvedRevision === revision &&
  state.releaseCandidate === revision;
if (missing.length || !approved) {
  console.error('MVP NON AUTORISÉ pour la production.');
  if (missing.length) console.error('Critères à justifier : ' + missing.join(', '));
  if (!approved) console.error('Approbation liée à la révision absente ou incohérente.');
  process.exitCode = 1;
} else {
  console.log('Dossier de décision complet pour cette révision (sans déploiement).');
}
