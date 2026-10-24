import { describe, expect, it } from 'vitest';
import {
  EXPENSE_REPORT_HEADERS,
  SheetsExpenseReportRepository,
  type ExpenseReportSheetGateway,
} from '../../src/infrastructure/google/sheets/sheets-expense-report-repository';
import type { ExpenseReport } from '../../src/domain/entities/expense-report';

class FakeSheet implements ExpenseReportSheetGateway {
  readonly rows: (string | number)[][] = [];
  lockCount = 0;

  readRows(): unknown[][] { return this.rows.map(row => [...row]); }
  runLocked<T>(work: () => T): T { this.lockCount++; return work(); }
  appendRow(row: (string | number)[]): void { this.rows.push([...row]); }
}

const report = (purpose = 'Réunion fictive'): ExpenseReport => ({
  id: 'note-test-001', claimantId: 'usager-fictif', fiscalYear: 2026,
  purpose, status: 'DRAFT', createdAt: '2026-10-24T10:00:00.000Z',
});

describe('adaptateur Sheets des brouillons', () => {
  it('décrit un schéma stable', () => {
    expect(EXPENSE_REPORT_HEADERS).toHaveLength(6);
  });

  it('enregistre puis retrouve une note', async () => {
    const sheet = new FakeSheet();
    const repo = new SheetsExpenseReportRepository(sheet);
    await repo.save(report());
    expect(sheet.lockCount).toBe(1);
    expect(await repo.findById('note-test-001')).toEqual(report());
  });

  it('bloque une seconde création avec le même identifiant', async () => {
    const repo = new SheetsExpenseReportRepository(new FakeSheet());
    await repo.save(report());
    await expect(repo.save(report())).rejects.toThrow('existe déjà');
  });

  it('préserve le texte commençant par une formule sans le soumettre directement à Sheets', async () => {
    const sheet = new FakeSheet();
    const repo = new SheetsExpenseReportRepository(sheet);
    await repo.save(report('=HYPERLINK("https://exemple.invalid")'));
    expect(String(sheet.rows[0][3]).startsWith('"=')).toBe(true);
    expect((await repo.findById('note-test-001'))?.purpose).toBe('=HYPERLINK("https://exemple.invalid")');
  });

  it('refuse un identifiant pouvant devenir une formule', async () => {
    await expect(new SheetsExpenseReportRepository(new FakeSheet()).save({
      ...report(), id: '=1+1',
    })).rejects.toThrow('invalide');
  });

  it('signale deux lignes portant le même identifiant', async () => {
    const sheet = new FakeSheet();
    const repo = new SheetsExpenseReportRepository(sheet);
    await repo.save(report());
    sheet.rows.push([...sheet.rows[0]]);
    await expect(repo.findById('note-test-001')).rejects.toThrow('Doublon');
  });
});
