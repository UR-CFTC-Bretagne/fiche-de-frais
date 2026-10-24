import { describe, expect, it } from 'vitest';
import { prepareBackup, verifyBackup, type BackupContent } from '../../src/infrastructure/persistence/backup-archive';

const codec = {
  encode: (text: string) => new TextEncoder().encode(text),
  decode: (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes),
};
const digest = {
  sha256: async (bytes: Uint8Array) => {
    const hash = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  },
};
const data: BackupContent = {
  version: 1,
  headers: ['ID', 'MONTANT'],
  rows: [['fic-1', 1234], ['fic-2', 0]],
};
const identity = { backupId: 'backup-test-0001', createdAt: '2026-10-25T00:00:00Z', schemaVersion: 1 };
const approval = { approved: true, actorId: 'approbateur-fictif', changeTicket: 'RECETTE-123', targetIsEmpty: true };

describe('archives de sauvegarde sur données fictives', () => {
  it('produit une empreinte SHA-256 et valide une archive intègre', async () => {
    const archive = await prepareBackup(data, identity, codec, digest);
    expect(archive.manifest.sha256).toHaveLength(64);
    expect(archive.manifest.rowCount).toBe(2);
    expect(await verifyBackup(archive, 1, approval, codec, digest)).toEqual(data);
  });
  it('détecte une altération des octets', async () => {
    const archive = await prepareBackup(data, identity, codec, digest);
    const altered = Uint8Array.from(archive.payload);
    altered[altered.length - 3] ^= 1;
    await expect(verifyBackup({ ...archive, payload: altered }, 1, approval, codec, digest)).rejects.toThrow('Empreinte');
  });
  it('refuse une destination non vide', async () => {
    const archive = await prepareBackup(data, identity, codec, digest);
    await expect(verifyBackup(archive, 1, { ...approval, targetIsEmpty: false }, codec, digest))
      .rejects.toThrow('restauration');
  });
  it('refuse une quantité de lignes falsifiée même si le contenu reste intact', async () => {
    const archive = await prepareBackup(data, identity, codec, digest);
    await expect(verifyBackup({ ...archive, manifest: { ...archive.manifest, rowCount: 3 } }, 1, approval, codec, digest))
      .rejects.toThrow('Nombre de lignes');
  });
  it('refuse un tableau aux colonnes incohérentes', async () => {
    await expect(prepareBackup({ ...data, rows: [['fic-1']] }, identity, codec, digest))
      .rejects.toThrow('Ligne');
  });
});
