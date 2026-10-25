import { describe, expect, it } from 'vitest';
import { DurableFormSubmissionRegistry } from '../../src/infrastructure/google/forms/durable-form-submission-registry';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';

const form = 'form-fixture-0000001';
const response = 'response-fixture-001';
const report = { id: 'report-001', claimantId: 'actor-fictif', fiscalYear: 2026,
  purpose: 'Réunion fictive', status: 'DRAFT' as const, createdAt: '2026-10-25T00:00:00Z' };
function fixture() {
  const data = new Map<string, string>();
  const store = { withLock: <T>(fn: () => T) => fn(),
    get: (key: string) => data.get(key) ?? null,
    set: (key: string, value: string) => { data.set(key, value); } };
  const notes = new InMemoryExpenseReportRepository();
  return { notes, store, registry: new DurableFormSubmissionRegistry(store, notes) };
}
describe('registre persistant de soumissions', () => {
  it('retrouve la note après recréation du registre', async () => {
    const { store, notes, registry } = fixture();
    await registry.executeOnce(form, response, async () => { await notes.save(report); return report; });
    let called = false;
    const replay = new DurableFormSubmissionRegistry(store, notes);
    const result = await replay.executeOnce(form, response, async () => { called = true; return report; });
    expect(result.id).toBe(report.id);
    expect(called).toBe(false);
  });
  it('bloque toute reprise automatique si l’écriture a été interrompue', async () => {
    const { registry, notes } = fixture();
    await expect(registry.executeOnce(form, response, async () => {
      await notes.save(report); throw new Error('panne fictive');
    })).rejects.toThrow('panne fictive');
    await expect(registry.executeOnce(form, response, async () => report)).rejects.toThrow('réconcilier');
  });
  it('rejette une réponse en cours de traitement', async () => {
    const { registry } = fixture();
    let complete!: (value: typeof report) => void;
    const first = registry.executeOnce(form, response, () => new Promise(resolve => { complete = resolve; }));
    await expect(registry.executeOnce(form, response, async () => report)).rejects.toThrow('réconcilier');
    complete(report);
    await first;
  });
});
