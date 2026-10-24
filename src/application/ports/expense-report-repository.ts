import type { ExpenseReport } from '../../domain/entities/expense-report';

export interface ExpenseReportRepository {
  findById(id: string): Promise<ExpenseReport | null>;
  save(report: ExpenseReport): Promise<void>;
}
