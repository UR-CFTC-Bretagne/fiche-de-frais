import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { ExpenseReportRepository } from '../ports/expense-report-repository';
import type { Actor } from '../ports/actor';
import { hasRole } from '../ports/actor';
import type { IdGenerator } from '../ports/id-generator';
import type { Clock } from '../ports/clock';

export interface CreateExpenseReportInput {
  purpose: string;
  fiscalYear: number;
}

export class CreateExpenseReport {
  constructor(
    private readonly repository: ExpenseReportRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(actor: Actor, input: CreateExpenseReportInput): Promise<ExpenseReport> {
    if (!hasRole(actor, 'CLAIMANT')) throw new Error('Accès refusé');
    const purpose = input.purpose.trim();
    if (!purpose || purpose.length > 500) throw new Error('Motif invalide');
    if (!Number.isSafeInteger(input.fiscalYear) || input.fiscalYear < 2000 || input.fiscalYear > 2100) {
      throw new Error('Exercice invalide');
    }
    const id = this.ids.nextId();
    if (!id) throw new Error('Identifiant invalide');
    const report: ExpenseReport = {
      id,
      claimantId: actor.id,
      fiscalYear: input.fiscalYear,
      purpose,
      status: 'DRAFT',
      createdAt: this.clock.nowIso(),
    };
    await this.repository.save(report);
    return report;
  }
}
