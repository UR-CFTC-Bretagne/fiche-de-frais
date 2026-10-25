import { describe, expect, it } from 'vitest';
import { normalizeFormSubmitEvent } from '../../src/infrastructure/google/forms/apps-script-form-event';
import { FormSubmissionHandler } from '../../src/infrastructure/google/forms/form-submission-handler';
import { ImportFormExpenseReport } from '../../src/application/use-cases/import-form-expense-report';
import { CreateExpenseReport } from '../../src/application/use-cases/create-expense-report';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import { InMemoryFormSubmissionRegistry } from '../../src/infrastructure/persistence/in-memory-form-submission-registry';
import type { FormSubmitEventPort } from '../../src/infrastructure/google/forms/apps-script-form-event';

const formId = 'form-fictif-000001';
const responseId = 'reponse-fictive-001';
function event(form = formId, response: string | null = responseId): FormSubmitEventPort {
  return {
    source: { getId: () => form },
    response: {
      getId: () => response,
      getItemResponses: () => [
        { getItem: () => ({ getId: () => 12345 }), getResponse: () => 'Réunion fictive' },
        { getItem: () => ({ getId: () => 67890 }), getResponse: () => '2026' },
      ],
    },
  };
}
function fixture(authorized: boolean) {
  const reports = new InMemoryExpenseReportRepository();
  let count = 0;
  const importer = new ImportFormExpenseReport(
    new CreateExpenseReport(reports, { nextId: () => 'report-' + ++count }, {
      nowIso: () => '2026-10-25T12:00:00Z',
    }), new InMemoryFormSubmissionRegistry(), formId,
    { purposeItemId: '12345', fiscalYearItemId: '67890' },
  );
  const handler = new FormSubmissionHandler(formId, {
    resolve: async () => authorized ? { id: 'mandate-fictif', active: true, roles: ['CLAIMANT'] } : null,
  }, importer);
  return { handler, count: () => count };
}
describe('déclencheur Google Forms, données fictives', () => {
  it('normalise un événement sans dépendance au libellé', () => {
    expect(normalizeFormSubmitEvent(event(), formId).answers).toHaveLength(2);
  });
  it('refuse un formulaire tiers', () => {
    expect(() => normalizeFormSubmitEvent(event('autre-formulaire-01'), formId)).toThrow();
  });
  it('refuse une réponse sans identifiant', () => {
    expect(() => normalizeFormSubmitEvent(event(formId, null), formId)).toThrow();
  });
  it('refuse une identité non résolue avant création', async () => {
    const { handler, count } = fixture(false);
    await expect(handler.handle(event())).rejects.toThrow('non authentifié');
    expect(count()).toBe(0);
  });
  it('importe une seule fois deux déclenchements identiques', async () => {
    const { handler, count } = fixture(true);
    const [first, second] = await Promise.all([handler.handle(event()), handler.handle(event())]);
    expect(first.id).toBe(second.id);
    expect(count()).toBe(1);
  });
});
