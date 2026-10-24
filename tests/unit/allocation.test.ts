import { describe, expect, it } from 'vitest';
import { validateAllocation } from '../../src/domain/services/allocation';

describe('ventilation analytique', () => {
  it('accepte une répartition équilibrée URB / AGFPN', () => expect(validateAllocation(10000, [{ fundingSource: 'URB', amountCents: 4000 }, { fundingSource: 'AGFPN', amountCents: 6000 }])).toBe(true));
  it('refuse une répartition incomplète', () => expect(validateAllocation(10000, [{ fundingSource: 'URB', amountCents: 3000 }])).toBe(false));
  it('refuse les montants négatifs', () => expect(validateAllocation(10000, [{ fundingSource: 'URB', amountCents: -1 }])).toBe(false));
});
