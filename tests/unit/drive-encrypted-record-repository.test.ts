import { describe, expect, it } from 'vitest';
import {
  DriveEncryptedRecordRepository,
  type OpaqueObjectGateway,
} from '../../src/infrastructure/google/drive/drive-encrypted-record-repository';

class FakeOpaqueGateway implements OpaqueObjectGateway {
  readonly objects = new Map<string, Uint8Array>();
  putIfAbsent(key: string, bytes: Uint8Array): void {
    if (this.objects.has(key)) throw new Error('Archive déjà existante');
    this.objects.set(key, Uint8Array.from(bytes));
  }
  get(key: string): Uint8Array | null {
    const bytes = this.objects.get(key);
    return bytes ? Uint8Array.from(bytes) : null;
  }
}
const id = 'fictive-drive-01';
const encrypted = () => ({
  version: 1 as const,
  nonce: Uint8Array.from({ length: 12 }, (_, i) => i),
  ciphertext: Uint8Array.from({ length: 32 }, (_, i) => (i * 13) % 256),
});

describe('adaptateur Drive de données exclusivement chiffrées', () => {
  it('sauvegarde et retrouve le conteneur opaque', async () => {
    const fake = new FakeOpaqueGateway();
    const repository = new DriveEncryptedRecordRepository(fake);
    await repository.saveIfAbsent(id, encrypted());
    expect(await repository.find(id)).toEqual(encrypted());
    expect(Array.from(fake.objects.keys())).toEqual(['backup_fictive-drive-01.bin']);
  });
  it('refuse les doublons', async () => {
    const repository = new DriveEncryptedRecordRepository(new FakeOpaqueGateway());
    await repository.saveIfAbsent(id, encrypted());
    await expect(repository.saveIfAbsent(id, encrypted())).rejects.toThrow('déjà existante');
  });
  it('ne retourne rien quand l’objet manque', async () => {
    expect(await new DriveEncryptedRecordRepository(new FakeOpaqueGateway()).find(id)).toBeNull();
  });
  it('rejette les chemins et les noms injectés', async () => {
    const repository = new DriveEncryptedRecordRepository(new FakeOpaqueGateway());
    await expect(repository.find('../autre')).rejects.toThrow('Identifiant');
  });
  it('rejette les contenants dont le texte n’est pas un JSON valide', async () => {
    const fake = new FakeOpaqueGateway();
    fake.objects.set('backup_' + id + '.bin', new TextEncoder().encode('corrompu'));
    await expect(new DriveEncryptedRecordRepository(fake).find(id)).rejects.toThrow();
  });
  it('rejette un conteneur au nonce de longueur inattendue', async () => {
    const fake = new FakeOpaqueGateway();
    fake.objects.set('backup_' + id + '.bin', new TextEncoder().encode(JSON.stringify({
      format: 'CFTC_ENCRYPTED_RECORD_V1', nonce: [1, 2], ciphertext: Array(32).fill(1),
    })));
    await expect(new DriveEncryptedRecordRepository(fake).find(id)).rejects.toThrow('invalide');
  });
});
