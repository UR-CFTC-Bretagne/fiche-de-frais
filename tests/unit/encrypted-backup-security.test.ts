import { describe, expect, it } from 'vitest';
import { EncryptedBackupStore } from '../../src/infrastructure/persistence/encrypted-backup-store';
import { InMemoryEncryptedRecordRepository } from '../../src/infrastructure/persistence/in-memory-encrypted-record-repository';
import { WebCryptoAesGcm } from '../../src/infrastructure/persistence/webcrypto-aes-gcm';
import type { BackupArchive } from '../../src/infrastructure/persistence/backup-port';
import type { EncryptedRecord, EncryptedRecordRepository } from '../../src/infrastructure/persistence/encrypted-backup-store';

const data = (id = 'fictive-archive-01'): BackupArchive => ({
  manifest: {
    format: 'CFTC_EXPENSE_BACKUP_V1',
    backupId: id,
    createdAt: '2026-10-25T00:00:00.000Z',
    schemaVersion: 1,
    rowCount: 1,
    sha256: 'a'.repeat(64),
  },
  payload: new TextEncoder().encode('DONNEES-ENTIEREMENT-FICTIVES'),
});

async function fixture() {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const records = new InMemoryEncryptedRecordRepository();
  const store = new EncryptedBackupStore(new WebCryptoAesGcm(key), records);
  return { records, store, key };
}

describe('résistance du stockage chiffré aux altérations', () => {
  it('refuse une clé de 128 bits pour une politique AES-256', async () => {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, ['encrypt', 'decrypt']);
    expect(() => new WebCryptoAesGcm(key)).toThrow('Clé AES-GCM');
  });

  it('produit des nonces et des textes chiffrés différents pour deux archives identiques', async () => {
    const { records, store } = await fixture();
    await store.write(data('fictive-archive-01'));
    await store.write(data('fictive-archive-02'));
    const first = await records.find('fictive-archive-01');
    const second = await records.find('fictive-archive-02');
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Array.from(first!.nonce)).not.toEqual(Array.from(second!.nonce));
    expect(Array.from(first!.ciphertext)).not.toEqual(Array.from(second!.ciphertext));
  });

  it('refuse toute modification du texte chiffré', async () => {
    const { records, store, key } = await fixture();
    await store.write(data());
    const original = await records.find('fictive-archive-01');
    expect(original).not.toBeNull();
    const modified: EncryptedRecord = {
      version: 1,
      nonce: Uint8Array.from(original!.nonce),
      ciphertext: Uint8Array.from(original!.ciphertext),
    };
    modified.ciphertext[3] ^= 1;
    const corrupted: EncryptedRecordRepository = {
      saveIfAbsent: async () => { throw new Error('En lecture seule'); },
      find: async () => modified,
    };
    await expect(new EncryptedBackupStore(new WebCryptoAesGcm(key), corrupted)
      .read('fictive-archive-01')).rejects.toThrow();
  });

  it('refuse une attaque par substitution d’identifiant', async () => {
    const { records, store, key } = await fixture();
    await store.write(data());
    const original = await records.find('fictive-archive-01');
    const substituted: EncryptedRecordRepository = {
      saveIfAbsent: async () => { throw new Error('En lecture seule'); },
      find: async () => original,
    };
    // Même avec la bonne clé, l'identifiant associé à l'archive est authentifié.
    await expect(new EncryptedBackupStore(new WebCryptoAesGcm(key), substituted)
      .read('fictive-archive-99')).rejects.toThrow();
  });

  it('refuse les identifiants non conformes avant lecture', async () => {
    const { store } = await fixture();
    await expect(store.read('../sensible')).rejects.toThrow('Identifiant');
  });
});
