import { describe, expect, it } from 'vitest';
import { formSubmissionToJson } from '../../src/infrastructure/google/forms/form-response-to-json';
import type { FormSubmitEventPort } from '../../src/infrastructure/google/forms/apps-script-form-event';
const form = 'form-fictif-000001';
function fixture(): FormSubmitEventPort {
  return { source: { getId: () => form }, response: {
    getId: () => 'response-fictive-001',
    getItemResponses: () => [
      { getItem: () => ({ getId: () => 123 }), getResponse: () => 'Réunion' },
      { getItem: () => ({ getId: () => 456 }), getResponse: () => ['Train', 'Repas'] },
    ],
  } };
}
describe('Google Forms vers JSON', () => {
  it('convertit le texte et les choix multiples en JSON versionné', () => {
    expect(JSON.parse(formSubmissionToJson(fixture(), form))).toEqual({
      schemaVersion: 1, source: 'GOOGLE_FORMS', formId: form,
      responseId: 'response-fictive-001',
      answers: { '123': 'Réunion', '456': ['Train', 'Repas'] },
    });
  });
  it('refuse une autre origine', () => {
    expect(() => formSubmissionToJson(fixture(), 'form-non-autorise')).toThrow();
  });
  it('refuse une valeur non textuelle', () => {
    const event = fixture();
    const invalid = { ...event, response: { ...event.response,
      getItemResponses: () => [{ getItem: () => ({ getId: () => 123 }), getResponse: () => ({ secret: true }) }] } };
    expect(() => formSubmissionToJson(invalid, form)).toThrow('non pris en charge');
  });
  it('refuse les questions dupliquées', () => {
    const event = fixture();
    const duplicate = { ...event, response: { ...event.response,
      getItemResponses: () => [...event.response.getItemResponses(), event.response.getItemResponses()[0]] } };
    expect(() => formSubmissionToJson(duplicate, form)).toThrow('dupliquée');
  });
});
