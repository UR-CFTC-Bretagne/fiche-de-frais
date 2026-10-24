import {
  EXPENSE_REPORT_HEADERS,
  type ExpenseReportSheetGateway,
} from './sheets-expense-report-repository';
import { assertAppsScriptSchema } from './schema-metadata';

/**
 * Adaptateur Google Apps Script, non activé tant que l'identité et la
 * configuration de l'application n'ont pas été validées.
 * Le tableur et l'onglet doivent exister ; aucune création implicite.
 */
export class AppsScriptSheetGateway implements ExpenseReportSheetGateway {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName = 'ExpenseReports',
  ) {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(spreadsheetId)) {
      throw new Error('Configuration du tableur absente ou invalide');
    }
  }

  private sheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    assertAppsScriptSchema(spreadsheet);
    const sheet = spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) throw new Error('Onglet des notes introuvable');
    const headers = sheet.getRange(1, 1, 1, EXPENSE_REPORT_HEADERS.length).getValues()[0];
    if (!EXPENSE_REPORT_HEADERS.every((name, index) => headers[index] === name) ||
        sheet.getLastColumn() !== EXPENSE_REPORT_HEADERS.length) {
      throw new Error('Structure du tableau incompatible : migration nécessaire');
    }
    return sheet;
  }

  readRows(): unknown[][] {
    const sheet = this.sheet();
    const lastRow = sheet.getLastRow();
    return lastRow <= 1
      ? []
      : sheet.getRange(2, 1, lastRow - 1, EXPENSE_REPORT_HEADERS.length).getValues();
  }

  runLocked<T>(work: () => T): T {
    const lock = LockService.getScriptLock();
    lock.waitLock(20_000);
    try {
      const result = work();
      SpreadsheetApp.flush();
      return result;
    } finally {
      lock.releaseLock();
    }
  }

  appendRow(row: (string | number)[]): void {
    if (row.length !== EXPENSE_REPORT_HEADERS.length) throw new Error('Colonnes incompatibles');
    this.sheet().appendRow(row);
  }
}
