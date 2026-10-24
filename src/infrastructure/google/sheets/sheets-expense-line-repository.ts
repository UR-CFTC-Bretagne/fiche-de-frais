export const EXPENSE_LINE_HEADERS = ['ID','REPORT_ID','KIND','DESCRIPTION_JSON','AMOUNT_CENTS','INCURRED_ON_JSON'] as const;
export interface ExpenseLineSheetGateway {
  readRows(): unknown[][];
  runLocked<T>(work: () => T): T;
  appendRow(row: (string | number)[]): void;
}
