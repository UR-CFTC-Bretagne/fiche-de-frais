import { describe, expect, it } from 'vitest';
import { assessRestore, type BackupManifest } from '../../src/infrastructure/persistence/backup-manifest';

const digest = 'a'.repeat(64);
const manifest: BackupManifest = {
  format: 'CFTC_EXPENSE_BACKUP_V1',
  backupId: 'archive-001',
  createdAt: '2026-10-24T12:00:00Z',
  schemaVersion: 1,
  rowCount: 12,
  sha256: digest,
};
const approval = {
  approved: true, actorId: 'test-approver', changeTicket: 'RECETTE-001', targetIsEmpty: true,
};
describe('préconditions de restauration', () => {
  it('accepte uniquement un plan conforme sur cible vide', () => {
    expect(assessRestore(manifest, 1, digest, approval)).toEqual({ permitted: true, reasons: [] });
  });
  it('refuse sans autorisation formelle', () => {
    expect(assessRestore(manifest, 1, digest, { ...approval, approved: false }).permitted).toBe(false);
  });
  it('refuse une cible occupée', () => {
    expect(assessRestore(manifest, 1, digest, { ...approval, targetIsEmpty: false }).permitted).toBe(false);
  });
  it('refuse toute empreinte divergente', () => {
    expect(assessRestore(manifest, 1, 'b'.repeat(64), approval).permitted).toBe(false);
  });
  it('refuse un schéma non compatible', () => {
    expect(assessRestore(manifest, 2, digest, approval).permitted).toBe(false);
  });
  it('refuse un nombre de lignes négatif', () => {
    expect(assessRestore({ ...manifest, rowCount: -1 }, 1, digest, approval).permitted).toBe(false);
  });
});
