import type { ExpenseReport } from '../../../domain/entities/expense-report';
import type { ExpenseReportRepository } from '../../../application/ports/expense-report-repository';
import type { FormSubmissionRegistry } from '../../../application/ports/form-submission-registry';

export interface SubmissionStateStore {
  withLock<T>(operation: () => T): T;
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const validId = /^[A-Za-z0-9_-]{10,200}$/;
type State = { status: 'PROCESSING' } | { status: 'DONE'; reportId: string };
function parseState(raw: string): State {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('status' in value)) throw new Error('État de soumission corrompu');
  if (value.status === 'PROCESSING') return { status: 'PROCESSING' };
  if (value.status === 'DONE' && 'reportId' in value &&
      typeof value.reportId === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value.reportId)) {
    return { status: 'DONE', reportId: value.reportId };
  }
  throw new Error('État de soumission corrompu');
}

/**
 * Registre persistant à reprise MANUELLE et comportement fail-closed.
 * Une réservation orpheline PROCESSING doit être réconciliée par un administrateur.
 * Ne garantit pas une transaction atomique avec le dépôt des notes.
 */
export class DurableFormSubmissionRegistry implements FormSubmissionRegistry {
  constructor(
    private readonly store: SubmissionStateStore,
    private readonly reports: ExpenseReportRepository,
  ) {}

  async executeOnce(formId: string, responseId: string, create: () => Promise<ExpenseReport>): Promise<ExpenseReport> {
    if (!validId.test(formId) || !validId.test(responseId)) throw new Error('Identifiant Forms invalide');
    const key = 'form_submission_v1:' + formId + ':' + responseId;
    const previous = this.store.withLock(() => {
      const raw = this.store.get(key);
      if (raw !== null) return parseState(raw);
      this.store.set(key, JSON.stringify({ status: 'PROCESSING' }));
      return null;
    });
    if (previous?.status === 'PROCESSING') {
      throw new Error('Soumission en cours ou à réconcilier manuellement');
    }
    if (previous?.status === 'DONE') {
      const saved = await this.reports.findById(previous.reportId);
      if (!saved) throw new Error('Soumission enregistrée mais note introuvable');
      return saved;
    }
    // Jamais de relance automatique après erreur : la note a pu être écrite.
    const created = await create();
    this.store.withLock(() => {
      const current = this.store.get(key);
      if (current === null || parseState(current).status !== 'PROCESSING') {
        throw new Error('Réservation de soumission modifiée');
      }
      this.store.set(key, JSON.stringify({ status: 'DONE', reportId: created.id }));
    });
    return created;
  }
}
