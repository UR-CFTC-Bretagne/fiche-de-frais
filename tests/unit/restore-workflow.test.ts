import { describe, expect, it } from 'vitest';
import { prepareBackup, type BackupContent } from '../../src/infrastructure/persistence/backup-archive';
import { InMemoryRestoreTarget } from '../../src/infrastructure/persistence/restore-target';
import { RestoreWorkflow } from '../../src/infrastructure/persistence/restore-workflow';

const codec = {
  encode: (text: string) => new TextEncoder().encode(text),
  decode: (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes),
};
const digest = {
  sha256: async (bytes: Uint8Array) => {
    const hash = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  },
};
const content: BackupContent = {
  version: 1, headers: ['ID', 'AMOUNT'], rows: [['fictive-1', 2000], ['fictive-2', 500]],
};
const identity = { backupId: 'restore-fictif-001', createdAt: '2026-10-25T00:00:00Z', schemaVersion: 1 };
const approval = { approved: true, actorId: 'auditeur-fictif', changeTicket: 'RECETTE-002' };

describe('restauration contrôlée en mémoire', () => {
  it('restaure les données vérifiées vers une cible vide', async () => {
    const archive = await prepareBackup(content, identity, codec, digest);
    const target = new InMemoryRestoreTarget();
    const workflow = new RestoreWorkflow(codec, digest, target);
    expect(await workflow.execute(archive, 1, approval)).toEqual(content);
    expect(target.snapshot()).toEqual(content);
  });

  it('refuse une deuxième restauration sans écraser les données', async () => {
    const archive = await prepareBackup(content, identity, codec, digest);
    const target = new InMemoryRestoreTarget();
    const workflow = new RestoreWorkflow(codec, digest, target);
    await workflow.execute(archive, 1, approval);
    await expect(workflow.execute(archive, 1, approval)).rejects.toThrow('occupée');
    expect(target.snapshot()).toEqual(content);
  });

  it('ne touche pas à la cible en cas de refus', async () => {
    const archive = await prepareBackup(content, identity, codec, digest);
    const target = new InMemoryRestoreTarget();
    await expect(new RestoreWorkflow(codec, digest, target).execute(
      archive, 1, { ...approval, approved: false },
    )).rejects.toThrow('non autorisée');
    expect(target.snapshot()).toBeNull();
  });

  it('ne touche pas à la cible si l’archive est altérée', async () => {
    const archive = await prepareBackup(content, identity, codec, digest);
    const payload = Uint8Array.from(archive.payload);
    payload[0] ^= 1;
    const target = new InMemoryRestoreTarget();
    await expect(new RestoreWorkflow(codec, digest, target).execute(
      { ...archive, payload }, 1, approval,
    )).rejects.toThrow();
    expect(target.snapshot()).toBeNull();
  });

  it('ne touche pas à la cible pour un schéma incompatible', async () => {
    const archive = await prepareBackup(content, identity, codec, digest);
    const target = new InMemoryRestoreTarget();
    await expect(new RestoreWorkflow(codec, digest, target).execute(
      archive, 2, approval,
    )).rejects.toThrow();
    expect(target.snapshot()).toBeNull();
  });
});
