import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { ExpenseReportRepository } from '../../application/ports/expense-report-repository';

/** Uniquement pour développement et tests : stockage volatil, sans données réelles. */
export class InMemoryExpenseReportRepository implements ExpenseReportRepository {
  private readonly reports = new Map<string, ExpenseReport>();

  async findById(id: string): Promise<ExpenseReport | null> {
    const report = this.reports.get(id);
    return report ? { ...report } : null;
  }

  async save(report: ExpenseReport): Promise<void> {
    if (this.reports.has(report.id)) throw new Error('Identifiant déjà utilisé');
    this.reports.set(report.id, { ...report });
  }
}
