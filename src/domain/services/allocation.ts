export interface Allocation { fundingSource: 'AGFPN' | 'URB'; amountCents: number; }

/** Vérifie l'équilibre, sans présumer de l'éligibilité AGFPN. */
export function validateAllocation(totalCents: number, allocations: Allocation[]): boolean {
  return Number.isSafeInteger(totalCents) && totalCents >= 0 && allocations.length > 0 && allocations.every(a => Number.isSafeInteger(a.amountCents) && a.amountCents >= 0) && allocations.reduce((sum, a) => sum + a.amountCents, 0) === totalCents;
}
