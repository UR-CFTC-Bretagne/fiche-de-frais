import type { ExpenseReport } from '../../../domain/entities/expense-report';
import type { Actor } from '../../../application/ports/actor';
import type { ImportFormExpenseReport } from '../../../application/use-cases/import-form-expense-report';
import { normalizeFormSubmitEvent, type FormSubmitEventPort } from './apps-script-form-event';

/**
 * L'événement Google Forms ne permet pas de prouver l'identité métier.
 * Le résolveur doit relier la réponse à une identité vérifiée côté serveur.
 * Ne pas utiliser getRespondentEmail() comme autorisation en soi.
 */
export interface TrustedFormActorResolver {
  resolve(formId: string, responseId: string): Promise<Actor | null>;
}

export class FormSubmissionHandler {
  constructor(
    private readonly allowedFormId: string,
    private readonly actors: TrustedFormActorResolver,
    private readonly importer: ImportFormExpenseReport,
  ) {}

  async handle(event: FormSubmitEventPort): Promise<ExpenseReport> {
    const normalized = normalizeFormSubmitEvent(event, this.allowedFormId);
    const actor = await this.actors.resolve(normalized.formId, normalized.responseId);
    if (!actor || !actor.active || !actor.roles.includes('CLAIMANT')) {
      throw new Error('Auteur du formulaire non authentifié et habilité');
    }
    return this.importer.execute(actor, normalized.formId, normalized.responseId, normalized.answers);
  }
}
