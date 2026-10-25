import type { Actor } from '../../../application/ports/actor';
import type { ExpenseReportRepository } from '../../../application/ports/expense-report-repository';
import type { SubmissionStateStore } from './durable-form-submission-registry';

export interface ReconciliationRequest {
  readonly formId: string;
  readonly responseId: string;
  readonly reportId: string;
  readonly expectedClaimantId: string;
  readonly evidenceReference: string;
}

/**
 * Reprise exclusivement vers DONE d'une note DÉJÀ enregistrée.
 * Jamais de création de note ni de réinitialisation de PROCESSING.
 * Une preuve externe et un journal d'audit sont obligatoires en production.
 */
export class ReconcileFormSubmission {
  constructor(
    private readonly store: SubmissionStateStore,
    private readonly reports: ExpenseReportRepository,
    private readonly audit: (actorId: string, reference: string, reportId: string) => Promise<void>,
  ) {}

  async execute(actor: Actor, request: ReconciliationRequest): Promise<void> {
    if (!actor.active || !actor.roles.includes('ADMIN') || !actor.id.trim()) throw new Error('Accès refusé');
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(request.formId) ||
        !/^[A-Za-z0-9_-]{10,200}$/.test(request.responseId) ||
        !/^[A-Za-z0-9_-]{1,100}$/.test(request.reportId) ||
        !request.expectedClaimantId.trim() ||
        !/^[A-Za-z0-9_-]{8,100}$/.test(request.evidenceReference)) {
      throw new Error('Demande de rapprochement invalide');
    }
    const report = await this.reports.findById(request.reportId);
    if (!report || report.claimantId !== request.expectedClaimantId) {
      throw new Error('Note absente ou propriétaire incompatible');
    }
    const key = 'form_submission_v1:' + request.formId + ':' + request.responseId;
    // L'audit est écrit AVANT la mutation : si l'audit échoue, aucun état n'est changé.
    // En cas de panne après l'audit, l'action peut être réexaminée par l'opérateur.
    this.store.withLock(() => {
      const state = this.store.get(key);
      if (state !== JSON.stringify({ status: 'PROCESSING' })) {
        throw new Error('Réservation absente ou déjà réconciliée');
      }
    });
    await this.audit(actor.id, request.evidenceReference, request.reportId);
    this.store.withLock(() => {
      const state = this.store.get(key);
      if (state !== JSON.stringify({ status: 'PROCESSING' })) {
        throw new Error('État modifié pendant le rapprochement');
      }
      this.store.set(key, JSON.stringify({ status: 'DONE', reportId: report.id }));
    });
  }
}
