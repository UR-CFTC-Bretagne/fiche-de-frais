import { describe, expect, it } from 'vitest';
import type { Actor } from '../../src/application/ports/actor';
import type { PrivateAttachmentReader } from '../../src/application/ports/private-attachment-file';
import { RegisterVerifiedAttachment } from '../../src/application/use-cases/register-verified-attachment';
import { RegisterAttachment } from '../../src/application/use-cases/register-attachment';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import { InMemoryExpenseLineRepository } from '../../src/infrastructure/persistence/in-memory-expense-line-repository';
import { InMemoryAttachmentRepository } from '../../src/infrastructure/persistence/in-memory-attachment-repository';

const actor: Actor = { id: 'claimant-fixture', active: true, roles: ['CLAIMANT'] };
const fileRef = 'file-fictif-prive-001';
const pdf = new TextEncoder().encode('%PDF-1.4\nFICHIER-FICTIF');
const digest = {
  sha256: async (bytes: Uint8Array) => {
    const copy = Uint8Array.from(bytes);
    const hash = await crypto.subtle.digest('SHA-256', copy.buffer);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  },
};

async function setup(bytes = pdf, ownerId = actor.id) {
  const reports = new InMemoryExpenseReportRepository();
  await reports.save({
    id: 'report-fixture', claimantId: actor.id, fiscalYear: 2026,
    purpose: 'Réunion fictive', status: 'DRAFT', createdAt: '2026-10-25T09:00:00Z',
  });
  const attachments = new InMemoryAttachmentRepository();
  const reader: PrivateAttachmentReader = {
    readForOwner: async (ref, subject) => ref === fileRef && subject === ownerId
      ? { bytes, mediaType: 'application/pdf' } : null,
  };
  const useCase = new RegisterVerifiedAttachment(reader, digest,
    new RegisterAttachment(reports, new InMemoryExpenseLineRepository(), attachments,
      { nextId: () => 'attach-fixture' }, { nowIso: () => '2026-10-25T10:00:00Z' }));
  return { useCase, attachments };
}

const input = {
  reportId: 'report-fixture', lineId: null, kind: 'CONVOCATION' as const, privateFileRef: fileRef,
};

describe('vérification serveur des justificatifs', () => {
  it('calcule SHA-256 sur les octets privés et sauvegarde les métadonnées', async () => {
    const { useCase, attachments } = await setup();
    const result = await useCase.execute(actor, input);
    expect(result.sha256).toBe(await digest.sha256(pdf));
    expect(result.sizeBytes).toBe(pdf.length);
    expect((await attachments.findByReportId('report-fixture'))[0]).toEqual(result);
  });
  it('rejette un document auquel le demandeur n’a pas accès', async () => {
    const { useCase, attachments } = await setup(pdf, 'autre-proprietaire');
    await expect(useCase.execute(actor, input)).rejects.toThrow('accès refusé');
    expect(await attachments.findByReportId('report-fixture')).toHaveLength(0);
  });
  it('rejette un faux PDF et ne garde aucune métadonnée', async () => {
    const { useCase, attachments } = await setup(new TextEncoder().encode('fichier suspect'));
    await expect(useCase.execute(actor, input)).rejects.toThrow('format');
    expect(await attachments.findByReportId('report-fixture')).toHaveLength(0);
  });
  it('refuse un utilisateur désactivé avant de lire le document', async () => {
    const { useCase } = await setup();
    await expect(useCase.execute({ ...actor, active: false }, input)).rejects.toThrow('Accès refusé');
  });
  it('rejette un fichier dépassant 10 Mo', async () => {
    const bytes = new Uint8Array(10 * 1024 * 1024 + 1);
    bytes.set(new TextEncoder().encode('%PDF-'), 0);
    const { useCase } = await setup(bytes);
    await expect(useCase.execute(actor, input)).rejects.toThrow('format');
  });
});
