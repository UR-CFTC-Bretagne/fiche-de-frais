import type { EncryptedRecord, EncryptedRecordRepository } from './encrypted-backup-store';

/** Environnement fictif uniquement. Aucun stockage persistant. */
export class InMemoryEncryptedRecordRepository implements EncryptedRecordRepository {
  private readonly records = new Map<string, EncryptedRecord>();

  async saveIfAbsent(id: string, record: EncryptedRecord): Promise<void> {
    if (this.records.has(id)) throw new Error('Sauvegarde déjà présente');
    this.records.set(id, {
      version: record.version,
      nonce: Uint8Array.from(record.nonce),
      ciphertext: Uint8Array.from(record.ciphertext),
    });
  }

  async find(id: string): Promise<EncryptedRecord | null> {
    const value = this.records.get(id);
    return value ? {
      version: value.version,
      nonce: Uint8Array.from(value.nonce),
      ciphertext: Uint8Array.from(value.ciphertext),
    } : null;
  }
}
