import type { Actor, Role } from '../ports/actor';

/**
 * Identité issue exclusivement d'un mécanisme serveur vérifié.
 * La valeur `subject` ne peut jamais provenir d'une saisie client.
 */
export interface VerifiedPrincipal {
  readonly subject: string;
  readonly issuer: string;
  readonly verifiedAt: string;
}

/** Port pour un fournisseur d'identité de confiance, à implémenter côté serveur. */
export interface TrustedIdentityProvider<Context> {
  verify(context: Context): Promise<VerifiedPrincipal | null>;
}

export interface MembershipRecord {
  readonly subject: string;
  readonly actorId: string;
  readonly active: boolean;
  readonly roles: readonly Role[];
}

/** Le référentiel d'habilitations ne doit pas être modifiable par le demandeur. */
export interface MembershipDirectory {
  findBySubject(subject: string): Promise<MembershipRecord | null>;
}

const validRoles: readonly Role[] = ['CLAIMANT', 'REVIEWER', 'FINANCE', 'TREASURER', 'ADMIN', 'AUDITOR'];
const principalPattern = /^[A-Za-z0-9@._|:-]{3,320}$/;

export class ResolveServerActor<Context> {
  constructor(
    private readonly provider: TrustedIdentityProvider<Context>,
    private readonly directory: MembershipDirectory,
    private readonly allowedIssuers: readonly string[],
  ) {
    if (!allowedIssuers.length || allowedIssuers.some(value => !value.trim())) {
      throw new Error('Émetteurs de confiance non configurés');
    }
  }

  async execute(context: Context): Promise<Actor> {
    const principal = await this.provider.verify(context);
    if (!principal || !principalPattern.test(principal.subject) ||
        !this.allowedIssuers.includes(principal.issuer) ||
        !Number.isFinite(Date.parse(principal.verifiedAt))) {
      throw new Error('Identité non vérifiée');
    }
    const membership = await this.directory.findBySubject(principal.subject);
    if (!membership || membership.subject !== principal.subject ||
        !membership.active || !membership.actorId.trim() ||
        membership.roles.length === 0 ||
        membership.roles.some(role => !validRoles.includes(role))) {
      throw new Error('Accès refusé : habilitation absente ou inactive');
    }
    return Object.freeze({
      id: membership.actorId,
      active: true,
      roles: Object.freeze([...new Set(membership.roles)]),
    });
  }
}
