import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { ResolveServerActor } from './identity';
import type { CreateExpenseReport, CreateExpenseReportInput } from '../use-cases/create-expense-report';
import type { GetExpenseReport } from '../use-cases/get-expense-report';

/**
 * Façade de sécurité : l'appelant fournit un contexte technique, jamais un Actor.
 * Le contexte doit être produit par une couche serveur digne de confiance.
 */
export class ExpenseReportService<Context> {
  constructor(
    private readonly identity: ResolveServerActor<Context>,
    private readonly createReport: CreateExpenseReport,
    private readonly getReport: GetExpenseReport,
  ) {}

  async create(context: Context, input: CreateExpenseReportInput): Promise<ExpenseReport> {
    const actor = await this.identity.execute(context);
    return this.createReport.execute(actor, input);
  }

  async get(context: Context, id: string): Promise<ExpenseReport | null> {
    const actor = await this.identity.execute(context);
    return this.getReport.execute(actor, id);
  }
}
