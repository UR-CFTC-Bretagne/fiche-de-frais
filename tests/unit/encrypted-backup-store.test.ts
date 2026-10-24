import { describe, expect, it } from 'vitest';
import { EncryptedBackupStore } from '../../src/infrastructure/persistence/encrypted-backup-store';
import { InMemoryEncryptedRecordRepository } from '../../src/infrastructure/persistence/in-memory-encrypted-record-repository';
import { WebCryptoAesGcm } from '../../src/infrastructure/persistence/webcrypto-aes-gcm';
import type { BackupArchive } from '../../src/infrastructure/persistence/backup-port';

async function fixture() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
  const records = new InMemoryEncryptedRecordRepository();
  const store = new EncryptedBackupStore(new WebCryptoAesGcm(key), records);
  return { store, records };
}

const archive = (): BackupArchive => ({
  manifest: {
    format: 'CFTC_EXPENSE_BACKUP_V1', backupId: 'archive-fictive-0001',
    createdAt: '2026-10-25T00:00:00Z', schemaVersion: 1, rowCount: 1,
    sha256: 'a'.repeat(64),
  },
  payload: new TextEncoder().encode('{"simulation":true}'),
});

describe('stockage chiffré de sauvegardes fictives', () => {
  it('relit l’archive après chiffrement AES-GCM', async () => {
    const { store } = await fixture();
    const original = archive();
    await store.write(original);
    expect(await store.read(original.manifest.backupId)).toEqual(original);
  });
  it('ne conserve pas le contenu en clair dans le dépôt de records', async () => {
    const { store, records } = await fixture();
    await store.write(archive());
    const item = await records.find('archive-fictive-0001');
    expect(item).not.toBeNull();
    expect(item?.nonce).toHaveLength(12);
    expect(new TextDecoder().decode(item?.ciphertext)).not.toContain('simulation');
  });
  it('refuse le remplacement d’une sauvegarde existante', async () => {
    const { store } = await fixture();
    await store.write(archive());
    await expect(store.write(archive())).rejects.toThrow('déjà présente');
  });
  it('échoue avec une clé incorrecte', async () => {
    const { store, records } = await fixture();
    await store.write(archive());
    const otherKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
    const reader = new EncryptedBackupStore(new WebCryptoAesGcm(otherKey), records);
    await expect(reader.read('archive-fictive-0001')).rejects.toThrow();
  });
  it('renvoie null pour une archive absente', async () => {
    const { store } = await fixture();
    expect(await store.read('archive-absente-0001')).toBeNull();
  });
});
