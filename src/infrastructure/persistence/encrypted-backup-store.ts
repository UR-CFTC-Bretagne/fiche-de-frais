import type { BackupArchive, BackupStore } from './backup-port';
import type { BackupManifest } from './backup-manifest';

export interface EncryptedRecord {
  readonly version: 1;
  readonly nonce: Uint8Array;
  readonly ciphertext: Uint8Array;
}

/** Fournisseur de chiffrement authentifié ; gestion des clés hors du dépôt. */
export interface AuthenticatedCipher {
  encrypt(plaintext: Uint8Array, associatedData: Uint8Array): Promise<EncryptedRecord>;
  decrypt(record: EncryptedRecord, associatedData: Uint8Array): Promise<Uint8Array>;
}

/** Infrastructure privée injectable, sans accès direct à Drive. */
export interface EncryptedRecordRepository {
  saveIfAbsent(id: string, record: EncryptedRecord): Promise<void>;
  find(id: string): Promise<EncryptedRecord | null>;
}

const encoder = new TextEncoder();
function context(id: string): Uint8Array {
  return encoder.encode('CFTC_EXPENSE_BACKUP_V1:' + id);
}
function validateId(id: string): void {
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) throw new Error('Identifiant de sauvegarde invalide');
}

interface SerializedArchive {
  manifest: BackupManifest;
  payload: number[];
}

/**
 * Chiffre ensemble le manifeste et les données, liés à l'identifiant comme AAD.
 * Ne stocke jamais le contenu en clair et refuse les réécritures de même identifiant.
 */
export class EncryptedBackupStore implements BackupStore {
  constructor(
    private readonly cipher: AuthenticatedCipher,
    private readonly records: EncryptedRecordRepository,
  ) {}

  async write(archive: BackupArchive): Promise<void> {
    validateId(archive.manifest.backupId);
    const serialized: SerializedArchive = {
      manifest: archive.manifest,
      payload: Array.from(archive.payload),
    };
    const plaintext = encoder.encode(JSON.stringify(serialized));
    const encrypted = await this.cipher.encrypt(plaintext, context(archive.manifest.backupId));
    await this.records.saveIfAbsent(archive.manifest.backupId, encrypted);
  }

  async read(backupId: string): Promise<BackupArchive | null> {
    validateId(backupId);
    const encrypted = await this.records.find(backupId);
    if (!encrypted) return null;
    const plaintext = await this.cipher.decrypt(encrypted, context(backupId));
    let decoded: unknown;
    try { decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)); }
    catch { throw new Error('Archive chiffrée illisible'); }
    if (!decoded || typeof decoded !== 'object') throw new Error('Archive chiffrée invalide');
    const parsed = decoded as Partial<SerializedArchive>;
    if (!parsed.manifest || parsed.manifest.backupId !== backupId ||
        !Array.isArray(parsed.payload) || parsed.payload.some(v => !Number.isInteger(v) || v < 0 || v > 255)) {
      throw new Error('Archive chiffrée incohérente');
    }
    return { manifest: parsed.manifest, payload: Uint8Array.from(parsed.payload) };
  }
}
