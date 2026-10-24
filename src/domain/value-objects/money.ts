export type EuroCents = number & { readonly __brand: 'EuroCents' };

export function euroCents(value: number): EuroCents {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Montant invalide en centimes');
  return value as EuroCents;
}
