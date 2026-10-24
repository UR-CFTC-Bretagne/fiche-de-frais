import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { ExpenseReportRepository } from '../ports/expense-report-repository';
import type { Actor } from '../ports/actor';
import { hasRole } from '../ports/actor';

/** Accès minimal : propriétaire ou rôle ADMIN. Les autres périmètres restent à définir. */
export class GetExpenseReport {
  constructor(private readonly repository: ExpenseReportRepository) {}

  async execute(actor: Actor, id: string): Promise<ExpenseReport | null> {
    if (!actor.active || !actor.id) throw new Error('Accès refusé');
    if (!id) throw new Error('Identifiant requis');
    const report = await this.repository.findById(id);
    if (!report) return null;
    if (report.claimantId !== actor.id && !hasRole(actor, 'ADMIN')) {
      throw new Error('Accès refusé');
    }
    return report;
  }
}
