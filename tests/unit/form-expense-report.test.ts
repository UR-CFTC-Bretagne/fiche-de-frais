import { describe, expect, it } from 'vitest';
import { mapExpenseFormAnswers } from '../../src/infrastructure/google/forms/form-response-mapper';
import { ImportFormExpenseReport } from '../../src/application/use-cases/import-form-expense-report';
import { CreateExpenseReport } from '../../src/application/use-cases/create-expense-report';
import { InMemoryFormSubmissionRegistry } from '../../src/infrastructure/persistence/in-memory-form-submission-registry';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import type { Actor } from '../../src/application/ports/actor';

const schema = { purposeItemId: '12345', fiscalYearItemId: '67890' };
const answers = [{ itemId: '12345', value: '  Réunion fictive  ' }, { itemId: '67890', value: '2026' }];
const formId = 'form-fixture-000001';
const responseId = 'response-fixture-001';
const actor: Actor = { id: 'mandate-fictif', active: true, roles: ['CLAIMANT'] };

describe('contrat Forms vers métier', () => {
  it('normalise les valeurs à partir des identifiants stables', () => {
    expect(mapExpenseFormAnswers(schema, answers)).toEqual({ purpose: 'Réunion fictive', fiscalYear: 2026 });
  });
  it('rejette un doublon de réponse', () => {
    expect(() => mapExpenseFormAnswers(schema, [...answers, answers[0]])).toThrow('doublon');
  });
  it('rejette un exercice incorrect', () => {
    expect(() => mapExpenseFormAnswers(schema, [answers[0], { itemId: '67890', value: '2026;malice' }])).toThrow();
  });
  it('rejette les identifiants de configuration identiques', () => {
    expect(() => mapExpenseFormAnswers({ purposeItemId: '12345', fiscalYearItemId: '12345' }, answers)).toThrow();
  });
  it('ne fait pas confiance à une identité présente dans les réponses', () => {
    expect(mapExpenseFormAnswers(schema, [...answers, { itemId: '99999', value: 'admin' }]).purpose).toBe('Réunion fictive');
  });
  it('importe exactement une fois une même réponse dans le registre de simulation', async () => {
    const repository = new InMemoryExpenseReportRepository();
    let calls = 0;
    const importer = new ImportFormExpenseReport(
      new CreateExpenseReport(repository, { nextId: () => String(++calls) }, { nowIso: () => '2026-10-25T00:00:00Z' }),
      new InMemoryFormSubmissionRegistry(), formId, schema,
    );
    const [first, duplicate] = await Promise.all([
      importer.execute(actor, formId, responseId, answers),
      importer.execute(actor, formId, responseId, answers),
    ]);
    expect(first.id).toBe(duplicate.id);
    expect(calls).toBe(1);
    expect(first.claimantId).toBe(actor.id);
  });
  it('refuse un autre formulaire', async () => {
    const importer = new ImportFormExpenseReport(
      new CreateExpenseReport(new InMemoryExpenseReportRepository(),
        { nextId: () => 'id-fictif' }, { nowIso: () => '2026-10-25T00:00:00Z' }),
      new InMemoryFormSubmissionRegistry(), formId, schema,
    );
    await expect(importer.execute(actor, 'form-non-autorise', responseId, answers)).rejects.toThrow();
  });
});
