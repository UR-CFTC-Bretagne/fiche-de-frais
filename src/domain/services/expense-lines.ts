import type { ExpenseLine, ExpenseKind } from '../entities/expense-line';
import { euroCents } from '../value-objects/money';

const kinds: readonly ExpenseKind[] = ['TRAVEL', 'MEAL', 'ACCOMMODATION', 'OTHER'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[A-Za-z0-9_-]{1,100}$/;

function checkDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value;
}

/** Contrôles structurels uniquement : aucun barème ni éligibilité implicite. */
export function validateExpenseLine(line: ExpenseLine, expectedReportId: string): void {
  if (!idPattern.test(line.id) || !idPattern.test(expectedReportId) ||
      line.reportId !== expectedReportId || !kinds.includes(line.kind)) {
    throw new Error('Rattachement ou type de dépense invalide');
  }
  if (!line.description.trim() || line.description.length > 500) {
    throw new Error('Libellé de dépense invalide');
  }
  euroCents(line.amountCents);
  if (!checkDate(line.incurredOn)) throw new Error('Date de dépense invalide');
}

/** Total en centimes, sans calcul de droit au remboursement. */
export function totalExpenseLines(reportId: string, lines: readonly ExpenseLine[]): number {
  const ids = new Set<string>();
  let total = 0;
  for (const line of lines) {
    validateExpenseLine(line, reportId);
    if (ids.has(line.id)) throw new Error('Ligne de frais en doublon');
    ids.add(line.id);
    total += line.amountCents;
    if (!Number.isSafeInteger(total)) throw new Error('Total supérieur à la limite autorisée');
  }
  return total;
}
