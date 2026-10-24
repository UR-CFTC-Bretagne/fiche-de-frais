import { describe, expect, it } from 'vitest';
import { totalExpenseLines, validateExpenseLine } from '../../src/domain/services/expense-lines';
import type { ExpenseLine } from '../../src/domain/entities/expense-line';
import { AddExpenseLine } from '../../src/application/use-cases/add-expense-line';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';
import { InMemoryExpenseLineRepository } from '../../src/infrastructure/persistence/in-memory-expense-line-repository';
import type { Actor } from '../../src/application/ports/actor';

const actor: Actor = { id: 'demandeur-fictif', active: true, roles: ['CLAIMANT'] };
const line = (overrides: Partial<ExpenseLine> = {}): ExpenseLine => ({
  id: 'l-1', reportId: 'r-1', kind: 'TRAVEL', description: 'Train fictif',
  amountCents: 1250, incurredOn: '2026-10-25', ...overrides,
});

describe('intégrité des lignes de frais', () => {
  it('calcule un total exact en centimes', () => {
    expect(totalExpenseLines('r-1', [line(), line({ id: 'l-2', amountCents: 350 })])).toBe(1600);
  });
  it('rejette un montant fractionnaire et négatif', () => {
    expect(() => validateExpenseLine(line({ amountCents: 2.5 }), 'r-1')).toThrow();
    expect(() => validateExpenseLine(line({ amountCents: -1 }), 'r-1')).toThrow();
  });
  it('rejette une date inexistante', () => {
    expect(() => validateExpenseLine(line({ incurredOn: '2026-02-30' }), 'r-1')).toThrow('Date');
  });
  it('rejette une ligne rattachée à une autre note', () => {
    expect(() => totalExpenseLines('r-1', [line({ reportId: 'r-2' })])).toThrow();
  });
  it('rejette les identifiants en doublon', () => {
    expect(() => totalExpenseLines('r-1', [line(), line()])).toThrow('doublon');
  });
  it('refuse le dépassement des entiers sûrs', () => {
    expect(() => totalExpenseLines('r-1', [
      line({ amountCents: Number.MAX_SAFE_INTEGER }),
      line({ id: 'l-2', amountCents: 1 }),
    ])).toThrow('limite');
  });
});

describe('ajout d’une ligne de frais à un brouillon', () => {
  async function fixture(owner = 'demandeur-fictif', status: 'DRAFT' | 'SUBMITTED' = 'DRAFT') {
    const reports = new InMemoryExpenseReportRepository();
    const lines = new InMemoryExpenseLineRepository();
    await reports.save({
      id: 'r-1', claimantId: owner, fiscalYear: 2026,
      purpose: 'Réunion fictive', status, createdAt: '2026-10-25T10:00:00Z',
    });
    return { service: new AddExpenseLine(reports, lines, { nextId: () => 'l-1' }), lines };
  }
  const input = {
    reportId: 'r-1', kind: 'MEAL' as const, description: 'Repas fictif',
    amountCents: 1200, incurredOn: '2026-10-25',
  };
  it('ajoute une ligne pour le demandeur propriétaire', async () => {
    const { service, lines } = await fixture();
    expect((await service.execute(actor, input)).amountCents).toBe(1200);
    expect(await lines.findByReportId('r-1')).toHaveLength(1);
  });
  it('refuse un autre propriétaire', async () => {
    const { service } = await fixture('autre-demandeur');
    await expect(service.execute(actor, input)).rejects.toThrow('Accès refusé');
  });
  it('refuse une note déjà soumise', async () => {
    const { service } = await fixture('demandeur-fictif', 'SUBMITTED');
    await expect(service.execute(actor, input)).rejects.toThrow('non modifiable');
  });
  it('refuse un utilisateur inactif', async () => {
    const { service } = await fixture();
    await expect(service.execute({ ...actor, active: false }, input)).rejects.toThrow('Accès refusé');
  });
  it('refuse la réutilisation d’un identifiant de ligne', async () => {
    const { service } = await fixture();
    await service.execute(actor, input);
    await expect(service.execute(actor, input)).rejects.toThrow('doublon');
  });
});
