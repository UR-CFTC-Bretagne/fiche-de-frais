import { euroCents } from '../domain/value-objects/money';
import { validateAllocation } from '../domain/services/allocation';

/**
 * Sonde locale et non sensible. Aucune API Google, donnée privée ou réseau.
 * Ce module ne doit pas devenir un endpoint de remboursement.
 */
export function healthCheck(): { status: 'OK'; schema: 'RECETTE_1'; amountCents: number } {
  const amountCents = euroCents(1250);
  if (!validateAllocation(amountCents, [{ fundingSource: 'URB', amountCents }])) {
    throw new Error('Contrôle de calcul en échec');
  }
  return { status: 'OK', schema: 'RECETTE_1', amountCents };
}
