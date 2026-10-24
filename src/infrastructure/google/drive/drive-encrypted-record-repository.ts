import type { EncryptedRecord, EncryptedRecordRepository } from '../../persistence/encrypted-backup-store';

/** Persistence opaque : le fournisseur ne reçoit jamais de données déchiffrées. */
export interface OpaqueObjectGateway {
  putIfAbsent(objectKey: string, bytes: Uint8Array): void;
  get(objectKey: string): Uint8Array | null;
}

const identifier = /^[A-Za-z0-9_-]{8,100}$/;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function assertId(id: string): void {
  if (!identifier.test(id)) throw new Error('Identifiant d’archive invalide');
}

function validateEncryptedRecord(record: EncryptedRecord): void {
  if (record.version !== 1 || record.nonce.length !== 12 ||
      record.ciphertext.length < 16 ||
      !Array.from(record.nonce).every(Number.isInteger) ||
      !Array.from(record.ciphertext).every(Number.isInteger)) {
    throw new Error('Enregistrement chiffré invalide');
  }
}

/**
 * Adaptateur indépendant de l'API Google. La passerelle est seule responsable
 * de l'unicité atomique du nom dans l'espace privé choisi.
 */
export class DriveEncryptedRecordRepository implements EncryptedRecordRepository {
  constructor(private readonly gateway: OpaqueObjectGateway) {}

  async saveIfAbsent(id: string, record: EncryptedRecord): Promise<void> {
    assertId(id);
    validateEncryptedRecord(record);
    const objectKey = 'backup_' + id + '.bin';
    const encoded = encoder.encode(JSON.stringify({
      format: 'CFTC_ENCRYPTED_RECORD_V1',
      nonce: Array.from(record.nonce),
      ciphertext: Array.from(record.ciphertext),
    }));
    this.gateway.putIfAbsent(objectKey, encoded);
  }

  async find(id: string): Promise<EncryptedRecord | null> {
    assertId(id);
    const bytes = this.gateway.get('backup_' + id + '.bin');
    if (!bytes) return null;
    let parsed: unknown;
    try { parsed = JSON.parse(decoder.decode(bytes)); }
    catch { throw new Error('Conteneur chiffré illisible'); }
    if (!parsed || typeof parsed !== 'object') throw new Error('Conteneur chiffré invalide');
    const container = parsed as Record<string, unknown>;
    if (container.format !== 'CFTC_ENCRYPTED_RECORD_V1' ||
        !Array.isArray(container.nonce) || !Array.isArray(container.ciphertext) ||
        container.nonce.some(v => !Number.isInteger(v) || v < 0 || v > 255) ||
        container.ciphertext.some(v => !Number.isInteger(v) || v < 0 || v > 255)) {
      throw new Error('Conteneur chiffré invalide');
    }
    const record: EncryptedRecord = {
      version: 1,
      nonce: Uint8Array.from(container.nonce),
      ciphertext: Uint8Array.from(container.ciphertext),
    };
    validateEncryptedRecord(record);
    return record;
  }
}
