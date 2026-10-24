import { describe, expect, it } from 'vitest';
import { CreateExpenseReport } from '../../src/application/use-cases/create-expense-report';
import { GetExpenseReport } from '../../src/application/use-cases/get-expense-report';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import type { Actor } from '../../src/application/ports/actor';

const claimant: Actor = { id: 'fictif-a', active: true, roles: ['CLAIMANT'] };
const createFixture = () => {
  const repository = new InMemoryExpenseReportRepository();
  const create = new CreateExpenseReport(
    repository,
    { nextId: () => 'fictive-note-001' },
    { nowIso: () => '2026-10-24T12:00:00.000Z' },
  );
  return { repository, create };
};

describe('création de notes', () => {
  it('crée un brouillon appartenant au demandeur', async () => {
    const { repository, create } = createFixture();
    const report = await create.execute(claimant, { purpose: 'Réunion fictive', fiscalYear: 2026 });
    expect(report.status).toBe('DRAFT');
    expect(report.claimantId).toBe(claimant.id);
    expect((await repository.findById(report.id))?.purpose).toBe('Réunion fictive');
  });

  it('refuse un utilisateur inactif', async () => {
    const { create } = createFixture();
    await expect(create.execute({ ...claimant, active: false }, { purpose: 'Réunion', fiscalYear: 2026 })).rejects.toThrow('Accès refusé');
  });

  it('refuse un motif vide', async () => {
    const { create } = createFixture();
    await expect(create.execute(claimant, { purpose: '   ', fiscalYear: 2026 })).rejects.toThrow('Motif invalide');
  });

  it('empêche la lecture par un autre demandeur', async () => {
    const { repository, create } = createFixture();
    const report = await create.execute(claimant, { purpose: 'Déplacement', fiscalYear: 2026 });
    const get = new GetExpenseReport(repository);
    await expect(get.execute({ id: 'fictif-b', active: true, roles: ['CLAIMANT'] }, report.id)).rejects.toThrow('Accès refusé');
  });

  it('permet la lecture au propriétaire', async () => {
    const { repository, create } = createFixture();
    const report = await create.execute(claimant, { purpose: 'Déplacement', fiscalYear: 2026 });
    expect((await new GetExpenseReport(repository).execute(claimant, report.id))?.id).toBe(report.id);
  });
});
