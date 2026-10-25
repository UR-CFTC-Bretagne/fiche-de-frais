import { expect, it } from 'vitest';
import { ReconcileFormSubmission } from '../../src/infrastructure/google/forms/reconcile-form-submission';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';

it('requires an existing note, admin role and audit for reconciliation', async () => {
  const formId = 'form-fixture-00001';
  const responseId = 'response-fixture-001';
  const key = 'form_submission_v1:' + formId + ':' + responseId;
  const data = new Map([[key, '{"status":"PROCESSING"}']]);
  const store = {
    withLock: <T>(fn: () => T) => fn(),
    get: (id: string) => data.get(id) ?? null,
    set: (id: string, value: string) => { data.set(id, value); },
  };
  const reports = new InMemoryExpenseReportRepository();
  const claim = { id: 'note-fictive', claimantId: 'owner', fiscalYear: 2026,
    purpose: 'Essai', status: 'DRAFT' as const, createdAt: '2026-10-25T10:00:00Z' };
  await reports.save(claim);
  const audits: string[] = [];
  const useCase = new ReconcileFormSubmission(store, reports,
    async (_, ref) => { audits.push(ref); });
  const request = { formId, responseId, reportId: claim.id,
    expectedClaimantId: 'owner', evidenceReference: 'incident-0001' };
  await expect(useCase.execute({ id: 'fictif', active: true, roles: ['CLAIMANT'] }, request))
    .rejects.toThrow('Accès refusé');
  await expect(useCase.execute({ id: 'admin', active: true, roles: ['ADMIN'] },
    { ...request, expectedClaimantId: 'autre' })).rejects.toThrow('propriétaire');
  expect(audits).toHaveLength(0);
  await useCase.execute({ id: 'admin', active: true, roles: ['ADMIN'] }, request);
  expect(audits).toEqual(['incident-0001']);
  expect(data.get(key)).toContain('DONE');
});
