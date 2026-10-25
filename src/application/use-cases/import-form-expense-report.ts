import type { Actor } from '../ports/actor';
import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { CreateExpenseReport } from './create-expense-report';
import type { FormSubmissionRegistry } from '../ports/form-submission-registry';
import {
  mapExpenseFormAnswers,
  type ExpenseFormSchema,
  type FormAnswer,
} from '../../infrastructure/google/forms/form-response-mapper';

/** L'identité du répondant DOIT provenir du serveur, jamais du formulaire. */
export class ImportFormExpenseReport {
  constructor(
    private readonly createReport: CreateExpenseReport,
    private readonly registry: FormSubmissionRegistry,
    private readonly expectedFormId: string,
    private readonly schema: ExpenseFormSchema,
  ) {}

  async execute(actor: Actor, formId: string, responseId: string, answers: readonly FormAnswer[]): Promise<ExpenseReport> {
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(formId) || formId !== this.expectedFormId ||
        !/^[A-Za-z0-9_-]{10,200}$/.test(responseId)) {
      throw new Error('Origine ou réponse du formulaire invalide');
    }
    const input = mapExpenseFormAnswers(this.schema, answers);
    return this.registry.executeOnce(formId, responseId, () => this.createReport.execute(actor, input));
  }
}
