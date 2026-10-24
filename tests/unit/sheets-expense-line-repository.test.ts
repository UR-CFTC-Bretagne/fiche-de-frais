import { describe, expect, it } from 'vitest';
import { SheetsExpenseLineRepository, type ExpenseLineSheetGateway } from '../../src/infrastructure/google/sheets/sheets-expense-line-repository';
import type { ExpenseLine } from '../../src/domain/entities/expense-line';

class FakeGateway implements ExpenseLineSheetGateway {
  rows: unknown[][] = [];
  readRows(): unknown[][] { return this.rows.map(row => [...row]); }
  runLocked<T>(work: () => T): T { return work(); }
  appendRow(row: (string | number)[]): void { this.rows.push([...row]); }
}

const line = (overrides: Partial<ExpenseLine> = {}): ExpenseLine => ({
  id: 'line-001', reportId: 'report-001', kind: 'MEAL',
  description: 'Repas fictif', amountCents: 1200, incurredOn: '2026-10-25', ...overrides,
});

describe('adaptateur Sheets de lignes, sans accès Google réel', () => {
  it('conserve et relit une dépense fictive', async () => {
    const repo = new SheetsExpenseLineRepository(new FakeGateway());
    await repo.saveIfAbsent(line());
    expect(await repo.findByReportId('report-001')).toEqual([line()]);
    expect(await repo.findByReportId('report-002')).toEqual([]);
  });
  it('neutralise la saisie pouvant ressembler à une formule Sheets', async () => {
    const gateway = new FakeGateway();
    const repo = new SheetsExpenseLineRepository(gateway);
    await repo.saveIfAbsent(line({ description: '=HYPERLINK("https://example.invalid")' }));
    expect(String(gateway.rows[0][3]).startsWith('"=')).toBe(true);
  });
  it('refuse les réutilisations d’identifiant, même pour une autre note', async () => {
    const repo = new SheetsExpenseLineRepository(new FakeGateway());
    await repo.saveIfAbsent(line());
    await expect(repo.saveIfAbsent(line({ reportId: 'report-002' }))).rejects.toThrow('déjà existante');
  });
  it('détecte des doublons hérités dans le stockage', async () => {
    const gateway = new FakeGateway();
    const repo = new SheetsExpenseLineRepository(gateway);
    await repo.saveIfAbsent(line());
    gateway.rows.push([...gateway.rows[0]]);
    await expect(repo.findByReportId('report-001')).rejects.toThrow('dupliqué');
  });
  it('rejette les dates invalides et montants fractionnaires', async () => {
    const repo = new SheetsExpenseLineRepository(new FakeGateway());
    await expect(repo.saveIfAbsent(line({ incurredOn: '2026-02-30' }))).rejects.toThrow();
    await expect(repo.saveIfAbsent(line({ amountCents: 1.9 }))).rejects.toThrow();
  });
  it('refuse une ligne stockée avec JSON corrompu', async () => {
    const gateway = new FakeGateway();
    gateway.rows.push(['line-001', 'report-001', 'MEAL', '{', 1200, '"2026-10-25"']);
    await expect(new SheetsExpenseLineRepository(gateway).findByReportId('report-001')).rejects.toThrow();
  });
});
