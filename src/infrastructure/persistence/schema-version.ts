/**
 * Contrat de versionnement du stockage, indépendant des API Google.
 *
 * Une migration ne doit jamais être appliquée silencieusement à un tableur réel.
 * Les anciennes versions peuvent être reconnues, mais ne sont pas converties
 * sans migration explicitement approuvée.
 */
export interface SchemaMigration {
  readonly from: number;
  readonly to: number;
  readonly description: string;
}

export type SchemaAssessment =
  | { readonly status: 'CURRENT'; readonly version: number }
  | { readonly status: 'MIGRATION_REQUIRED'; readonly from: number; readonly to: number; readonly steps: readonly SchemaMigration[] }
  | { readonly status: 'UNSUPPORTED'; readonly foundVersion: number | null; readonly reason: string };

export function assessSchema(
  foundVersion: unknown,
  targetVersion: number,
  migrations: readonly SchemaMigration[],
): SchemaAssessment {
  if (!Number.isSafeInteger(targetVersion) || targetVersion < 1) {
    throw new Error('Version cible invalide');
  }
  if (!Number.isSafeInteger(foundVersion) || typeof foundVersion !== 'number' || foundVersion < 1) {
    return { status: 'UNSUPPORTED', foundVersion: null, reason: 'Version de schéma absente ou invalide' };
  }
  if (foundVersion === targetVersion) return { status: 'CURRENT', version: targetVersion };
  if (foundVersion > targetVersion) {
    return { status: 'UNSUPPORTED', foundVersion, reason: 'Schéma plus récent que le logiciel' };
  }
  const visited = new Set<number>();
  const steps: SchemaMigration[] = [];
  let current = foundVersion;
  while (current < targetVersion) {
    if (visited.has(current)) return { status: 'UNSUPPORTED', foundVersion, reason: 'Cycle de migration détecté' };
    visited.add(current);
    const options = migrations.filter(step =>
      step.from === current && Number.isSafeInteger(step.to) && step.to > step.from && step.to <= targetVersion,
    );
    if (options.length !== 1) {
      return { status: 'UNSUPPORTED', foundVersion, reason: 'Chemin de migration manquant ou ambigu' };
    }
    const step = options[0];
    steps.push(step);
    current = step.to;
  }
  return { status: 'MIGRATION_REQUIRED', from: foundVersion, to: targetVersion, steps };
}
