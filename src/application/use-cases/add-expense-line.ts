import type { ExpenseLine, ExpenseKind } from '../../domain/entities/expense-line';
import { totalExpenseLines, validateExpenseLine } from '../../domain/services/expense-lines';
import type { Actor } from '../ports/actor';
import { hasRole } from '../ports/actor';
import type { ExpenseReportRepository } from '../ports/expense-report-repository';
import type { ExpenseLineRepository } from '../ports/expense-line-repository';
import type { IdGenerator } from '../ports/id-generator';

export interface AddExpenseLineInput {
  reportId: string;
  kind: ExpenseKind;
  description: string;
  amountCents: number;
  incurredOn: string;
}

/**
 * Prototype métier : seul le propriétaire actif, sur note DRAFT, ajoute une ligne.
 * Le verrouillage transactionnel des écritures et le calcul des barèmes sont à venir.
 */
export class AddExpenseLine {
  constructor(
    private readonly reports: ExpenseReportRepository,
    private readonly lines: ExpenseLineRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(actor: Actor, input: AddExpenseLineInput): Promise<ExpenseLine> {
    if (!hasRole(actor, 'CLAIMANT') || !actor.id.trim()) throw new Error('Accès refusé');
    const report = await this.reports.findById(input.reportId);
    if (!report || report.claimantId !== actor.id) throw new Error('Accès refusé');
    if (report.status !== 'DRAFT') throw new Error('Note non modifiable');
    const line: ExpenseLine = {
      id: this.ids.nextId(),
      reportId: report.id,
      kind: input.kind,
      description: input.description.trim(),
      amountCents: input.amountCents,
      incurredOn: input.incurredOn,
    };
    validateExpenseLine(line, report.id);
    const existing = await this.lines.findByReportId(report.id);
    totalExpenseLines(report.id, [...existing, line]);
    await this.lines.saveIfAbsent(line);
    return { ...line };
  }
}
