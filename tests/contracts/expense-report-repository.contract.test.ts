import { describe, expect, it } from 'vitest';
import type { ExpenseReportRepository } from '../../src/application/ports/expense-report-repository';
import type { ExpenseReport } from '../../src/domain/entities/expense-report';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import {
  SheetsExpenseReportRepository,
  type ExpenseReportSheetGateway,
} from '../../src/infrastructure/google/sheets/sheets-expense-report-repository';

class FakeGateway implements ExpenseReportSheetGateway {
  private readonly rows: (string | number)[][] = [];
  readRows(): unknown[][] { return this.rows.map(row => [...row]); }
  runLocked<T>(work: () => T): T { return work(); }
  appendRow(row: (string | number)[]): void { this.rows.push([...row]); }
}

const factories: Array<[string, () => ExpenseReportRepository]> = [
  ['mémoire', () => new InMemoryExpenseReportRepository()],
  ['contrat Sheets simulé', () => new SheetsExpenseReportRepository(new FakeGateway())],
];

function fictionalReport(): ExpenseReport {
  return {
    id: 'fictif-0001',
    claimantId: 'demandeur-fictif',
    purpose: 'Réunion fictive',
    fiscalYear: 2026,
    status: 'DRAFT',
    createdAt: '2026-10-24T10:00:00.000Z',
  };
}

describe.each(factories)('contrat ExpenseReportRepository : %s', (_name, makeRepository) => {
  it('ne retourne rien pour un identifiant inconnu', async () => {
    expect(await makeRepository().findById('inconnu')).toBeNull();
  });

  it('retrouve une note après son enregistrement', async () => {
    const repository = makeRepository();
    const original = fictionalReport();
    await repository.save(original);
    expect(await repository.findById(original.id)).toEqual(original);
  });

  it('rejette un deuxième enregistrement avec le même identifiant', async () => {
    const repository = makeRepository();
    await repository.save(fictionalReport());
    await expect(repository.save(fictionalReport())).rejects.toThrow();
  });

  it('ne renvoie pas de référence mutable vers la note persistée', async () => {
    const repository = makeRepository();
    await repository.save(fictionalReport());
    const loaded = await repository.findById('fictif-0001');
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    loaded.purpose = 'Texte changé localement';
    expect((await repository.findById('fictif-0001'))?.purpose).toBe('Réunion fictive');
  });
});
