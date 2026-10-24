import { describe, expect, it } from 'vitest';
import { validateAttachment, validateAttachmentOwnership } from '../../src/domain/services/attachments';
import type { Attachment } from '../../src/domain/entities/attachment';
import { RegisterAttachment } from '../../src/application/use-cases/register-attachment';
import { InMemoryAttachmentRepository } from '../../src/infrastructure/persistence/in-memory-attachment-repository';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import { InMemoryExpenseLineRepository } from '../../src/infrastructure/persistence/in-memory-expense-line-repository';
import type { Actor } from '../../src/application/ports/actor';

const actor: Actor = { id: 'user-fictif', active: true, roles: ['CLAIMANT'] };
const attachment = (updates: Partial<Attachment> = {}): Attachment => ({
  id: 'attach-001', reportId: 'report-001', lineId: null, kind: 'CONVOCATION',
  privateFileRef: 'private-document-fictif-001',
  sha256: 'a'.repeat(64), mediaType: 'application/pdf', sizeBytes: 128,
  uploadedAt: '2026-10-25T10:00:00.000Z', ...updates,
});

async function fixture(owner = actor.id, status: 'DRAFT' | 'SUBMITTED' = 'DRAFT') {
  const reports = new InMemoryExpenseReportRepository();
  const lines = new InMemoryExpenseLineRepository();
  const attachments = new InMemoryAttachmentRepository();
  await reports.save({
    id: 'report-001', claimantId: owner, fiscalYear: 2026,
    purpose: 'Réunion fictive', status, createdAt: '2026-10-25T09:00:00Z',
  });
  await lines.saveIfAbsent({
    id: 'line-001', reportId: 'report-001', kind: 'TRAVEL',
    description: 'Train fictif', amountCents: 2500, incurredOn: '2026-10-25',
  });
  return {
    attachments,
    useCase: new RegisterAttachment(
      reports, lines, attachments,
      { nextId: () => 'attach-001' }, { nowIso: () => '2026-10-25T10:00:00.000Z' },
    ),
  };
}

describe('intégrité des justificatifs', () => {
  it('accepte un document PDF aux métadonnées valides', () => {
    expect(() => validateAttachment(attachment())).not.toThrow();
  });
  it('rejette les références externes arbitraires', () => {
    expect(() => validateAttachment(attachment({ privateFileRef: 'https://example.com' }))).toThrow();
  });
  it('rejette une empreinte mal formée', () => {
    expect(() => validateAttachment(attachment({ sha256: 'abc' }))).toThrow();
  });
  it('rejette les fichiers trop volumineux', () => {
    expect(() => validateAttachment(attachment({ sizeBytes: 11 * 1024 * 1024 }))).toThrow();
  });
  it('refuse une ligne appartenant à une autre note', () => {
    expect(() => validateAttachmentOwnership(attachment({ lineId: 'line-002' }), 'report-001', ['line-001']))
      .toThrow('rattaché');
  });
});

describe('enregistrement des métadonnées', () => {
  it('référence un document fictif sur la bonne ligne', async () => {
    const { useCase, attachments } = await fixture();
    const record = await useCase.execute(actor, {
      reportId: 'report-001', lineId: 'line-001', kind: 'RECEIPT',
      privateFileRef: 'private-document-fictif-001', sha256: 'b'.repeat(64),
      mediaType: 'image/jpeg', sizeBytes: 300,
    });
    expect(record.lineId).toBe('line-001');
    expect(await attachments.findByReportId('report-001')).toHaveLength(1);
  });
  it('refuse un autre propriétaire', async () => {
    const { useCase } = await fixture('autre-demandeur');
    await expect(useCase.execute(actor, {
      reportId: 'report-001', lineId: null, kind: 'CONVOCATION',
      privateFileRef: 'private-document-fictif-001', sha256: 'a'.repeat(64),
      mediaType: 'application/pdf', sizeBytes: 128,
    })).rejects.toThrow('Accès refusé');
  });
  it('refuse une note soumise', async () => {
    const { useCase } = await fixture(actor.id, 'SUBMITTED');
    await expect(useCase.execute(actor, {
      reportId: 'report-001', lineId: null, kind: 'CONVOCATION',
      privateFileRef: 'private-document-fictif-001', sha256: 'a'.repeat(64),
      mediaType: 'application/pdf', sizeBytes: 128,
    })).rejects.toThrow('non modifiable');
  });
  it('refuse l’identifiant déjà enregistré', async () => {
    const { useCase } = await fixture();
    const input = {
      reportId: 'report-001', lineId: null, kind: 'OTHER' as const,
      privateFileRef: 'private-document-fictif-001', sha256: 'a'.repeat(64),
      mediaType: 'application/pdf' as const, sizeBytes: 128,
    };
    await useCase.execute(actor, input);
    await expect(useCase.execute(actor, input)).rejects.toThrow('déjà référencé');
  });
});
