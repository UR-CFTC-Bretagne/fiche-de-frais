import { describe, expect, it } from 'vitest';
import { assessSchema, type SchemaMigration } from '../../src/infrastructure/persistence/schema-version';
import { checkSheetsSchema, SCHEMA_VERSION_KEY } from '../../src/infrastructure/google/sheets/schema-metadata';

const steps: SchemaMigration[] = [
  { from: 1, to: 2, description: 'Ajouter une colonne de révision' },
  { from: 2, to: 3, description: 'Ajouter un index métier' },
];

describe('versionnement des schémas', () => {
  it('reconnaît une version courante sans opération', () => {
    expect(assessSchema(1, 1, []).status).toBe('CURRENT');
  });
  it('décrit un chemin de migration ordonné sans appliquer les étapes', () => {
    expect(assessSchema(1, 3, steps)).toEqual({
      status: 'MIGRATION_REQUIRED', from: 1, to: 3, steps,
    });
  });
  it('rejette un schéma futur inconnu', () => {
    expect(assessSchema(4, 3, steps).status).toBe('UNSUPPORTED');
  });
  it('rejette une étape manquante', () => {
    expect(assessSchema(1, 3, [steps[0]]).status).toBe('UNSUPPORTED');
  });
  it('rejette une migration ambiguë', () => {
    expect(assessSchema(1, 3, [...steps, { from: 1, to: 3, description: 'Raccourci' }]).status).toBe('UNSUPPORTED');
  });
  it('rejette un schéma sans version', () => {
    expect(assessSchema(null, 1, []).status).toBe('UNSUPPORTED');
  });
  it('lit la version de l’onglet de métadonnées', () => {
    expect(checkSheetsSchema([[SCHEMA_VERSION_KEY, 1]]).status).toBe('CURRENT');
  });
  it('rejette deux valeurs concurrentes', () => {
    expect(checkSheetsSchema([[SCHEMA_VERSION_KEY, 1], [SCHEMA_VERSION_KEY, 1]]).status).toBe('UNSUPPORTED');
  });
});
