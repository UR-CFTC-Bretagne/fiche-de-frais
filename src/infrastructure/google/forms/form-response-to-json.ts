import { normalizeFormSubmitEvent, type FormSubmitEventPort } from './apps-script-form-event';

export interface FormJsonRecord {
  schemaVersion: 1;
  source: 'GOOGLE_FORMS';
  formId: string;
  responseId: string;
  answers: Record<string, string | string[]>;
}

/** JSON brut, sans attribution d'identité ni création de note de frais. */
export function formSubmissionToJson(event: FormSubmitEventPort, expectedFormId: string): string {
  const parsed = normalizeFormSubmitEvent(event, expectedFormId);
  const answers: Record<string, string | string[]> = Object.create(null) as Record<string, string | string[]>;
  for (const answer of parsed.answers) {
    if (Object.prototype.hasOwnProperty.call(answers, answer.itemId)) {
      throw new Error('Question dupliquée');
    }
    const value = answer.value;
    if (typeof value === 'string') {
      answers[answer.itemId] = value;
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      answers[answer.itemId] = value as string[];
    } else {
      throw new Error('Type de réponse non pris en charge');
    }
  }
  return JSON.stringify({
    schemaVersion: 1, source: 'GOOGLE_FORMS',
    formId: parsed.formId, responseId: parsed.responseId, answers,
  } satisfies FormJsonRecord);
}
