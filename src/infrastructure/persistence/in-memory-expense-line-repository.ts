import type { ExpenseLine } from '../../domain/entities/expense-line';
import type { ExpenseLineRepository } from '../../application/ports/expense-line-repository';

/** Uniquement pour tests, sans persistance ni accès concurrent réel. */
export class InMemoryExpenseLineRepository implements ExpenseLineRepository {
  private readonly lines = new Map<string, ExpenseLine>();

  async findByReportId(reportId: string): Promise<ExpenseLine[]> {
    return [...this.lines.values()].filter(line => line.reportId === reportId)
      .map(line => ({ ...line }));
  }

  async saveIfAbsent(line: ExpenseLine): Promise<void> {
    if (this.lines.has(line.id)) throw new Error('Ligne de frais déjà existante');
    this.lines.set(line.id, { ...line });
  }
}
