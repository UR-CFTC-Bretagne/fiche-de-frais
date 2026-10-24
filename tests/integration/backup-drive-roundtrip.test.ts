import { describe, expect, it } from 'vitest';
import { prepareBackup, verifyBackup, type BackupContent } from '../../src/infrastructure/persistence/backup-archive';
import { EncryptedBackupStore } from '../../src/infrastructure/persistence/encrypted-backup-store';
import { WebCryptoAesGcm } from '../../src/infrastructure/persistence/webcrypto-aes-gcm';
import { DriveEncryptedRecordRepository, type OpaqueObjectGateway } from '../../src/infrastructure/google/drive/drive-encrypted-record-repository';
import { RestoreWorkflow } from '../../src/infrastructure/persistence/restore-workflow';
import { InMemoryRestoreTarget } from '../../src/infrastructure/persistence/restore-target';

class IsolatedOpaqueGateway implements OpaqueObjectGateway {
  readonly objects = new Map<string, Uint8Array>();
  putIfAbsent(key: string, value: Uint8Array): void {
    if (this.objects.has(key)) throw new Error('Archive déjà existante');
    this.objects.set(key, Uint8Array.from(value));
  }
  get(key: string): Uint8Array | null {
    const value = this.objects.get(key);
    return value ? Uint8Array.from(value) : null;
  }
}

const codec = {
  encode: (text: string) => new TextEncoder().encode(text),
  decode: (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes),
};
const digest = {
  sha256: async (bytes: Uint8Array) => {
    const buffer = Uint8Array.from(bytes).buffer;
    const result = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
  },
};
const data: BackupContent = {
  version: 1,
  headers: ['ID', 'MONTANT_CENTIMES'],
  rows: [['note-fictive-001', 1950], ['note-fictive-002', 4250]],
};
const identity = {
  backupId: 'backup-recette-0001',
  createdAt: '2026-10-25T10:00:00.000Z',
  schemaVersion: 1,
};
const approval = { approved: true, actorId: 'approbateur-fictif', changeTicket: 'RECETTE-SEC-01' };

async function setup() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
  const gateway = new IsolatedOpaqueGateway();
  const store = new EncryptedBackupStore(
    new WebCryptoAesGcm(key),
    new DriveEncryptedRecordRepository(gateway),
  );
  return { gateway, store };
}

describe('recette fictive : sauvegarde chiffrée, lecture et restauration', () => {
  it('effectue un aller-retour sans mettre le contenu clair dans le stockage', async () => {
    const { gateway, store } = await setup();
    const archive = await prepareBackup(data, identity, codec, digest);
    await store.write(archive);
    expect(gateway.objects.size).toBe(1);
    const stored = gateway.objects.get('backup_backup-recette-0001.bin');
    expect(stored).toBeDefined();
    expect(new TextDecoder().decode(stored)).not.toContain('note-fictive-001');

    const fetched = await store.read(identity.backupId);
    expect(fetched).not.toBeNull();
    if (!fetched) return;
    const target = new InMemoryRestoreTarget();
    const restored = await new RestoreWorkflow(codec, digest, target).execute(fetched, 1, approval);
    expect(restored).toEqual(data);
    expect(target.snapshot()).toEqual(data);
    expect(restored.rows.reduce((sum, row) => sum + Number(row[1]), 0)).toBe(6200);
  });

  it('refuse un conteneur Drive dont un octet a changé', async () => {
    const { gateway, store } = await setup();
    await store.write(await prepareBackup(data, identity, codec, digest));
    const key = 'backup_backup-recette-0001.bin';
    const raw = gateway.objects.get(key);
    expect(raw).toBeDefined();
    if (!raw) return;
    const decoded = JSON.parse(new TextDecoder().decode(raw)) as {
      ciphertext: number[];
    };
    decoded.ciphertext[5] ^= 1;
    gateway.objects.set(key, new TextEncoder().encode(JSON.stringify(decoded)));
    await expect(store.read(identity.backupId)).rejects.toThrow();
  });

  it('ne restaure rien si la validation métier est refusée', async () => {
    const { store } = await setup();
    await store.write(await prepareBackup(data, identity, codec, digest));
    const archive = await store.read(identity.backupId);
    expect(archive).not.toBeNull();
    if (!archive) return;
    const target = new InMemoryRestoreTarget();
    await expect(new RestoreWorkflow(codec, digest, target).execute(
      archive, 1, { ...approval, approved: false },
    )).rejects.toThrow('non autorisée');
    expect(target.snapshot()).toBeNull();
  });

  it('ne remplace jamais les données déjà restaurées', async () => {
    const { store } = await setup();
    await store.write(await prepareBackup(data, identity, codec, digest));
    const archive = await store.read(identity.backupId);
    expect(archive).not.toBeNull();
    if (!archive) return;
    const target = new InMemoryRestoreTarget();
    const workflow = new RestoreWorkflow(codec, digest, target);
    await workflow.execute(archive, 1, approval);
    await expect(workflow.execute(archive, 1, approval)).rejects.toThrow('occupée');
    expect(target.snapshot()).toEqual(data);
  });
});
