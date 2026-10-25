import type { ExpenseReport } from '../../domain/entities/expense-report';
import type { FormSubmissionRegistry } from '../../application/ports/form-submission-registry';

/** Simulation : pas de persistance, ni garantie entre différents processus. */
export class InMemoryFormSubmissionRegistry implements FormSubmissionRegistry {
  private readonly done = new Map<string, ExpenseReport>();
  private readonly pending = new Map<string, Promise<ExpenseReport>>();

  async executeOnce(formId: string, responseId: string, create: () => Promise<ExpenseReport>): Promise<ExpenseReport> {
    const key = JSON.stringify([formId, responseId]);
    const existing = this.done.get(key);
    if (existing) return { ...existing };
    const running = this.pending.get(key);
    if (running) return { ...(await running) };
    const task = create().then(result => {
      this.done.set(key, { ...result });
      return { ...result };
    });
    this.pending.set(key, task);
    try { return { ...(await task) }; }
    finally { this.pending.delete(key); }
  }
}
