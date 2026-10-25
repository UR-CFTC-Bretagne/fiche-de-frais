import type { CreateExpenseReportInput } from '../../../application/use-cases/create-expense-report';

/** Identifiants d'items Google Forms : à renseigner depuis le formulaire de recette. */
export interface ExpenseFormSchema {
  readonly purposeItemId: string;
  readonly fiscalYearItemId: string;
}
export interface FormAnswer {
  readonly itemId: string;
  readonly value: unknown;
}

const stableId = /^[0-9]{1,20}$/;

/** Ne dépend jamais des libellés éditables de Google Forms. */
export function mapExpenseFormAnswers(
  schema: ExpenseFormSchema,
  answers: readonly FormAnswer[],
): CreateExpenseReportInput {
  if (!stableId.test(schema.purposeItemId) || !stableId.test(schema.fiscalYearItemId) ||
      schema.purposeItemId === schema.fiscalYearItemId) {
    throw new Error('Configuration du formulaire invalide');
  }
  const byId = new Map<string, unknown>();
  for (const answer of answers) {
    if (byId.has(answer.itemId)) throw new Error('Réponse du formulaire en doublon');
    byId.set(answer.itemId, answer.value);
  }
  const purpose = byId.get(schema.purposeItemId);
  const year = byId.get(schema.fiscalYearItemId);
  if (typeof purpose !== 'string' || !purpose.trim() || purpose.length > 500 ||
      typeof year !== 'string' || !/^20[0-9]{2}$/.test(year)) {
    throw new Error('Réponse obligatoire absente ou invalide');
  }
  return { purpose: purpose.trim(), fiscalYear: Number(year) };
}
