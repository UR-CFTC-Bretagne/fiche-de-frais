import type { ExpenseLine } from '../../../domain/entities/expense-line';
import type { ExpenseLineRepository } from '../../../application/ports/expense-line-repository';
import { validateExpenseLine } from '../../../domain/services/expense-lines';
export const EXPENSE_LINE_HEADERS = ['ID','REPORT_ID','KIND','DESCRIPTION_JSON','AMOUNT_CENTS','INCURRED_ON_JSON'] as const;
export interface ExpenseLineSheetGateway {
  readRows(): unknown[][];
  runLocked<T>(work: () => T): T;
  appendRow(row: (string | number)[]): void;
}

export class SheetsExpenseLineRepository implements ExpenseLineRepository {
  constructor(private readonly gateway: ExpenseLineSheetGateway) {}
  async findByReportId(reportId: string): Promise<ExpenseLine[]> {
    return this.gateway.readRows().filter(row => row[1] === reportId).map(row => ({
      id: String(row[0]), reportId: String(row[1]),
      kind: row[2] as ExpenseLine['kind'],
      description: JSON.parse(String(row[3])) as string,
      amountCents: Number(row[4]),
      incurredOn: JSON.parse(String(row[5])) as string,
    }));
  }
  async saveIfAbsent(line: ExpenseLine): Promise<void> {
    validateExpenseLine(line, line.reportId);
    this.gateway.runLocked(() => {
      if (this.gateway.readRows().some(row => row[0] === line.id)) throw new Error('Ligne de frais déjà existante');
      this.gateway.appendRow([line.id, line.reportId, line.kind, JSON.stringify(line.description), line.amountCents, JSON.stringify(line.incurredOn)]);
    });
  }
}
