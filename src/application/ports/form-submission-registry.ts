import type { ExpenseReport } from '../../domain/entities/expense-report';

/** Exécution idempotente durable exigée en production. */
export interface FormSubmissionRegistry {
  executeOnce(formId: string, responseId: string, create: () => Promise<ExpenseReport>): Promise<ExpenseReport>;
}
