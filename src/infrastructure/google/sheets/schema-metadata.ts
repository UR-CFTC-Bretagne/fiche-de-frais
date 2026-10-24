import { assessSchema, type SchemaAssessment, type SchemaMigration } from '../../persistence/schema-version';

export const SHEETS_SCHEMA_VERSION = 1;
export const SCHEMA_METADATA_TAB = '_SchemaMeta';
export const SCHEMA_METADATA_HEADERS = ['KEY', 'VALUE'] as const;
export const SCHEMA_VERSION_KEY = 'EXPENSE_REPORT_SCHEMA_VERSION';

/** Ne migre jamais un schéma réel : contrôle préalable strict. */
export function checkSheetsSchema(
  metadataRows: readonly (readonly unknown[])[],
  migrations: readonly SchemaMigration[] = [],
): SchemaAssessment {
  const versionRows = metadataRows.filter(row => row[0] === SCHEMA_VERSION_KEY);
  if (versionRows.length !== 1) {
    return {
      status: 'UNSUPPORTED',
      foundVersion: null,
      reason: versionRows.length === 0 ? 'Version de schéma manquante' : 'Version de schéma dupliquée',
    };
  }
  return assessSchema(versionRows[0][1], SHEETS_SCHEMA_VERSION, migrations);
}

/**
 * Appelé uniquement depuis une routine serveur explicitement autorisée.
 * L'onglet de métadonnées doit déjà exister, avec son en-tête correct.
 */
export function assertAppsScriptSchema(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const tab = spreadsheet.getSheetByName(SCHEMA_METADATA_TAB);
  if (!tab || tab.getLastRow() < 2 || tab.getLastColumn() !== 2) {
    throw new Error('Métadonnées de schéma absentes : initialisation contrôlée requise');
  }
  const headings = tab.getRange(1, 1, 1, 2).getValues()[0];
  if (headings[0] !== SCHEMA_METADATA_HEADERS[0] || headings[1] !== SCHEMA_METADATA_HEADERS[1]) {
    throw new Error('En-tête des métadonnées incompatible');
  }
  const data = tab.getRange(2, 1, tab.getLastRow() - 1, 2).getValues();
  const status = checkSheetsSchema(data);
  if (status.status !== 'CURRENT') {
    throw new Error('Schéma Google Sheets incompatible : ' + (status.status === 'UNSUPPORTED' ? status.reason : 'migration requise'));
  }
}
