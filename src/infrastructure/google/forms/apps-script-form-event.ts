import type { FormAnswer } from '../../../application/contracts/form-response';

/** Sous-ensemble de l'événement installable onFormSubmit lié au FORMULAIRE (pas au tableur). */
export interface FormSubmitEventPort {
  readonly source: { getId(): string };
  readonly response: {
    getId(): string | null;
    getItemResponses(): readonly {
      getItem(): { getId(): number };
      getResponse(): unknown;
    }[];
  };
}

export interface NormalizedFormEvent {
  readonly formId: string;
  readonly responseId: string;
  readonly answers: readonly FormAnswer[];
}

/** L'événement ne fournit JAMAIS une identité authentifiée du demandeur. */
export function normalizeFormSubmitEvent(event: FormSubmitEventPort, allowedFormId: string): NormalizedFormEvent {
  if (!event || !event.source || !event.response) throw new Error('Événement Forms absent');
  const formId = event.source.getId();
  const responseId = event.response.getId();
  if (formId !== allowedFormId || !/^[A-Za-z0-9_-]{10,200}$/.test(formId) ||
      typeof responseId !== 'string' || !/^[A-Za-z0-9_-]{10,200}$/.test(responseId)) {
    throw new Error('Origine ou identifiant de réponse Forms invalide');
  }
  const answers: FormAnswer[] = event.response.getItemResponses().map(itemResponse => {
    const id = itemResponse.getItem().getId();
    if (!Number.isSafeInteger(id) || id < 0) throw new Error('Identifiant de question invalide');
    return { itemId: String(id), value: itemResponse.getResponse() };
  });
  if (answers.length > 100) throw new Error('Trop de champs Forms');
  return { formId, responseId, answers };
}
