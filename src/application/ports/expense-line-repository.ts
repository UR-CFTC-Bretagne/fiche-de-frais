import type { ExpenseLine } from '../../domain/entities/expense-line';

/**
 * Les implémentations doivent garantir l'absence d'écrasement.
 * Une lecture d'ensemble est une copie, jamais une référence mutable partagée.
 */
export interface ExpenseLineRepository {
  findByReportId(reportId: string): Promise<ExpenseLine[]>;
  saveIfAbsent(line: ExpenseLine): Promise<void>;
}
