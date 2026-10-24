import {
  EXPENSE_LINE_HEADERS,
  type ExpenseLineSheetGateway,
} from './sheets-expense-line-repository';
import { SCHEMA_METADATA_TAB, SCHEMA_METADATA_HEADERS } from './schema-metadata';

export const EXPENSE_LINES_SCHEMA_KEY = 'EXPENSE_LINE_SCHEMA_VERSION';
export const EXPENSE_LINES_SCHEMA_VERSION = 1;

/**
 * Prototype non déployé ; nécessite une migration contrôlée ajoutant
 * la ligne de version et l'onglet ExpenseLines. Ne crée ni onglet ni colonne.
 */
export class AppsScriptExpenseLineGateway implements ExpenseLineSheetGateway {
  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetName = 'ExpenseLines',
  ) {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(spreadsheetId)) {
      throw new Error('Identifiant du tableur invalide');
    }
  }

  private sheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.openById(this.spreadsheetId);
    const meta = spreadsheet.getSheetByName(SCHEMA_METADATA_TAB);
    if (!meta || meta.getLastRow() < 2 || meta.getLastColumn() !== 2) {
      throw new Error('Métadonnées de schéma absentes');
    }
    const header = meta.getRange(1, 1, 1, 2).getValues()[0];
    if (!SCHEMA_METADATA_HEADERS.every((value, index) => header[index] === value)) {
      throw new Error('En-tête du schéma invalide');
    }
    const rows = meta.getRange(2, 1, meta.getLastRow() - 1, 2).getValues();
    const versions = rows.filter(row => row[0] === EXPENSE_LINES_SCHEMA_KEY);
    if (versions.length !== 1 || versions[0][1] !== EXPENSE_LINES_SCHEMA_VERSION) {
      throw new Error('Schéma de lignes non initialisé ou incompatible');
    }
    const sheet = spreadsheet.getSheetByName(this.sheetName);
    if (!sheet || sheet.getLastColumn() !== EXPENSE_LINE_HEADERS.length) {
      throw new Error('Onglet ExpenseLines manquant ou incompatible');
    }
    const headers = sheet.getRange(1, 1, 1, EXPENSE_LINE_HEADERS.length).getValues()[0];
    if (!EXPENSE_LINE_HEADERS.every((value, index) => headers[index] === value)) {
      throw new Error('Colonnes de lignes incompatibles');
    }
    return sheet;
  }

  readRows(): unknown[][] {
    const sheet = this.sheet();
    const count = sheet.getLastRow();
    return count <= 1 ? [] :
      sheet.getRange(2, 1, count - 1, EXPENSE_LINE_HEADERS.length).getValues();
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
    if (row.length !== EXPENSE_LINE_HEADERS.length) throw new Error('Colonnes invalides');
    this.sheet().appendRow(row);
  }
}
