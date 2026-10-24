import { describe, expect, it } from 'vitest';
import { analyzeArchitecture } from '../../scripts/architecture-rules.mjs';

describe('frontières des modules', () => {
  it('accepte application vers domain et adaptateur vers application', () => {
    expect(analyzeArchitecture({
      'domain/entity.ts': 'export const id = 1;',
      'application/usecase.ts': "import { id } from '../domain/entity'; export const action = id;",
      'infrastructure/adapter.ts': "import { action } from '../application/usecase'; export const storage = action;",
    })).toEqual([]);
  });

  it('refuse les références Google dans domain', () => {
    expect(analyzeArchitecture({ 'domain/unsafe.ts': 'SpreadsheetApp.openById("x");' })).toHaveLength(1);
  });

  it('refuse application vers infrastructure malgré un import relatif', () => {
    const violations = analyzeArchitecture({
      'application/service.ts': "import { x } from '../infrastructure/database';",
      'infrastructure/database.ts': 'export const x = 1;',
    });
    expect(violations.some((message: string) => message.includes('application dépend de infrastructure'))).toBe(true);
  });

  it('signale une dépendance circulaire', () => {
    const violations = analyzeArchitecture({
      'domain/a.ts': "import { b } from './b'; export const a = b;",
      'domain/b.ts': "import { a } from './a'; export const b = a;",
    });
    expect(violations.some((message: string) => message.includes('circulaire'))).toBe(true);
  });

  it('signale les fichiers importés mais manquants', () => {
    expect(analyzeArchitecture({ 'domain/a.ts': "import { missing } from './missing';" })
      .some((message: string) => message.includes('introuvable'))).toBe(true);
  });
});
