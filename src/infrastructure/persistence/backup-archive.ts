import type { BackupArchive } from './backup-port';
import { assessRestore } from './backup-manifest';

export interface BackupCodec {
  encode(text: string): Uint8Array;
  decode(bytes: Uint8Array): string;
}
export interface DigestService {
  /** SHA-256 réel encodé en 64 caractères hexadécimaux. */
  sha256(bytes: Uint8Array): Promise<string>;
}

export interface BackupContent {
  readonly version: 1;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly (string | number | boolean | null)[])[];
}

function validateContent(content: BackupContent): void {
  if (content.version !== 1 || !Array.isArray(content.headers) ||
      content.headers.length === 0 || new Set(content.headers).size !== content.headers.length ||
      content.headers.some(x => typeof x !== 'string' || !x.trim()) ||
      !Array.isArray(content.rows)) throw new Error('Contenu de sauvegarde invalide');
  for (const row of content.rows) {
    if (!Array.isArray(row) || row.length !== content.headers.length ||
        row.some(value => value !== null && typeof value !== 'string' &&
          (typeof value !== 'number' || !Number.isFinite(value)) && typeof value !== 'boolean')) {
      throw new Error('Ligne de sauvegarde invalide');
    }
  }
}

function parseContent(text: string): BackupContent {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Archive illisible');
  const value = parsed as BackupContent;
  validateContent(value);
  return value;
}

/** Préparation en mémoire : ne chiffre pas l'archive et ne la transmet à aucun service. */
export async function prepareBackup(
  content: BackupContent,
  identity: { backupId: string; createdAt: string; schemaVersion: number },
  codec: BackupCodec,
  digest: DigestService,
): Promise<BackupArchive> {
  validateContent(content);
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(identity.backupId) ||
      !Number.isFinite(Date.parse(identity.createdAt)) ||
      !Number.isSafeInteger(identity.schemaVersion) || identity.schemaVersion < 1) {
    throw new Error('Métadonnées de sauvegarde invalides');
  }
  const payload = codec.encode(JSON.stringify(content));
  const sha256 = await digest.sha256(payload);
  if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error('Empreinte SHA-256 invalide');
  return {
    manifest: {
      format: 'CFTC_EXPENSE_BACKUP_V1',
      backupId: identity.backupId,
      createdAt: identity.createdAt,
      schemaVersion: identity.schemaVersion,
      rowCount: content.rows.length,
      sha256: sha256.toLowerCase(),
    },
    payload,
  };
}

/** Décode et valide intégrité, version, nombre de lignes et autorisation ; n'écrit rien. */
export async function verifyBackup(
  archive: BackupArchive,
  expectedSchema: number,
  approval: { approved: boolean; actorId: string; changeTicket: string; targetIsEmpty: boolean },
  codec: BackupCodec,
  digest: DigestService,
): Promise<BackupContent> {
  const actualDigest = await digest.sha256(archive.payload);
  const result = assessRestore(archive.manifest, expectedSchema, actualDigest, approval);
  if (!result.permitted) throw new Error('Restauration interdite : ' + result.reasons.join('; '));
  let content: BackupContent;
  try { content = parseContent(codec.decode(archive.payload)); }
  catch { throw new Error('Archive invalide ou corrompue'); }
  if (content.rows.length !== archive.manifest.rowCount) throw new Error('Nombre de lignes incohérent');
  return content;
}
