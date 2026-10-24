/**
 * Métadonnées de sauvegarde sans contenu personnel.
 * La lecture réelle, le chiffrement et le stockage externe seront des adaptateurs distincts.
 */
export interface BackupManifest {
  readonly format: 'CFTC_EXPENSE_BACKUP_V1';
  readonly backupId: string;
  readonly createdAt: string;
  readonly schemaVersion: number;
  readonly rowCount: number;
  readonly sha256: string;
}

export interface RestoreAssessment {
  readonly permitted: boolean;
  readonly reasons: readonly string[];
}

/** Empêche la restauration automatique ou destructrice par défaut. */
export function assessRestore(
  manifest: BackupManifest,
  expectedSchema: number,
  actualDigest: string,
  approval: { approved: boolean; actorId: string; changeTicket: string; targetIsEmpty: boolean },
): RestoreAssessment {
  const reasons: string[] = [];
  if (manifest.format !== 'CFTC_EXPENSE_BACKUP_V1') reasons.push('Format inconnu');
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(manifest.backupId)) reasons.push('Identifiant invalide');
  if (!Number.isFinite(Date.parse(manifest.createdAt))) reasons.push('Date invalide');
  if (!Number.isSafeInteger(manifest.rowCount) || manifest.rowCount < 0) reasons.push('Nombre de lignes invalide');
  if (!Number.isSafeInteger(manifest.schemaVersion) || manifest.schemaVersion !== expectedSchema) reasons.push('Schéma incompatible');
  if (!/^[a-f0-9]{64}$/i.test(manifest.sha256) || manifest.sha256.toLowerCase() !== actualDigest.toLowerCase()) reasons.push('Empreinte différente');
  if (!approval.approved || !approval.actorId.trim() || !approval.changeTicket.trim()) reasons.push('Autorisation de restauration manquante');
  if (!approval.targetIsEmpty) reasons.push('La cible contient des données : restauration refusée');
  return { permitted: reasons.length === 0, reasons };
}
