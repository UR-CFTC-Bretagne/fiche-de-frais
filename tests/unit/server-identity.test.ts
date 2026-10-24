import { describe, expect, it } from 'vitest';
import {
  ResolveServerActor,
  type MembershipDirectory,
  type TrustedIdentityProvider,
  type VerifiedPrincipal,
} from '../../src/application/security/identity';
import { ExpenseReportService } from '../../src/application/security/expense-report-service';
import { CreateExpenseReport } from '../../src/application/use-cases/create-expense-report';
import { GetExpenseReport } from '../../src/application/use-cases/get-expense-report';
import { InMemoryExpenseReportRepository } from '../../src/infrastructure/persistence/in-memory-expense-report-repository';

type ServerContext = { readonly requestId: string };
const alice: VerifiedPrincipal = {
  subject: 'google|compte-fictif-a',
  issuer: 'idp-recette',
  verifiedAt: '2026-10-25T10:00:00.000Z',
};

function fixture(principal: VerifiedPrincipal | null = alice, active = true) {
  const provider: TrustedIdentityProvider<ServerContext> = {
    verify: async () => principal,
  };
  const directory: MembershipDirectory = {
    findBySubject: async subject => subject === alice.subject ? {
      subject, actorId: 'mandate-fictif-a', active, roles: ['CLAIMANT'],
    } : null,
  };
  return new ResolveServerActor(provider, directory, ['idp-recette']);
}

describe('résolution des habilitations côté serveur', () => {
  it('retourne un acteur actif pour une identité et une habilitation vérifiées', async () => {
    const actor = await fixture().execute({ requestId: 'req-1' });
    expect(actor).toEqual({ id: 'mandate-fictif-a', active: true, roles: ['CLAIMANT'] });
  });
  it('refuse une identité absente', async () => {
    await expect(fixture(null).execute({ requestId: 'req-2' })).rejects.toThrow('Identité non vérifiée');
  });
  it('refuse un fournisseur non autorisé', async () => {
    await expect(fixture({ ...alice, issuer: 'serveur-inconnu' })
      .execute({ requestId: 'req-3' })).rejects.toThrow('Identité non vérifiée');
  });
  it('refuse une habilitation désactivée', async () => {
    await expect(fixture(alice, false).execute({ requestId: 'req-4' })).rejects.toThrow('Accès refusé');
  });
  it('refuse une identité sans correspondance', async () => {
    await expect(fixture({ ...alice, subject: 'google|autre-personne' })
      .execute({ requestId: 'req-5' })).rejects.toThrow('Accès refusé');
  });
  it('la façade crée une note au nom de l’identité serveur et non du client', async () => {
    const repository = new InMemoryExpenseReportRepository();
    const service = new ExpenseReportService(
      fixture(),
      new CreateExpenseReport(repository, { nextId: () => 'fiche-fictive-1' }, { nowIso: () => '2026-10-25T12:00:00Z' }),
      new GetExpenseReport(repository),
    );
    const created = await service.create({ requestId: 'req-6' }, { purpose: 'Réunion fictive', fiscalYear: 2026 });
    expect(created.claimantId).toBe('mandate-fictif-a');
    expect((await service.get({ requestId: 'req-7' }, created.id))?.id).toBe(created.id);
  });
});
