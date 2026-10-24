export type Role = 'CLAIMANT' | 'REVIEWER' | 'FINANCE' | 'TREASURER' | 'ADMIN' | 'AUDITOR';

export interface Actor {
  id: string;
  active: boolean;
  roles: readonly Role[];
}

export function hasRole(actor: Actor, role: Role): boolean {
  return actor.active && actor.roles.includes(role);
}
