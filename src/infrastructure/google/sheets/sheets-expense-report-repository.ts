import type { ExpenseReport, ExpenseStatus } from '../../../domain/entities/expense-report';
import type { ExpenseReportRepository } from '../../../application/ports/expense-report-repository';

export const EXPENSE_REPORT_HEADERS = [
  'ID', 'CLAIMANT_ID_JSON', 'FISCAL_YEAR', 'PURPOSE_JSON', 'STATUS', 'CREATED_AT_JSON',
] as const;

export interface ExpenseReportSheetGateway {
  /** Renvoie uniquement les lignes de données (sans l'en-tête). */
  readRows(): unknown[][];
  /** Exécute le contrôle d'unicité et l'écriture sous un même verrou exclusif. */
  runLocked<T>(work: () => T): T;
  appendRow(row: (string | number)[]): void;
}

const idPattern = /^[A-Za-z0-9_-]{1,100}$/;
const statuses: readonly ExpenseStatus[] = [
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'TO_PAY', 'PAID',
  'ARCHIVED', 'RETURNED', 'REJECTED',
];

function fromRow(row: unknown[]): ExpenseReport {
  if (row.length !== EXPENSE_REPORT_HEADERS.length) throw new Error('Schéma de ligne invalide');
  const [id, claimant, fiscalYear, purpose, status, createdAt] = row;
  if (typeof id !== 'string' || !idPattern.test(id)) throw new Error('Identifiant de note invalide');
  if (typeof claimant !== 'string' || typeof purpose !== 'string' || typeof createdAt !== 'string') {
    throw new Error('Colonnes de texte invalides');
  }
  if (typeof status !== 'string' || !statuses.includes(status as ExpenseStatus)) {
    throw new Error('Statut invalide');
  }
  const parsedClaimant: unknown = JSON.parse(claimant);
  const parsedPurpose: unknown = JSON.parse(purpose);
  const parsedDate: unknown = JSON.parse(createdAt);
  if (typeof parsedClaimant !== 'string' || !parsedClaimant ||
      typeof parsedPurpose !== 'string' || typeof parsedDate !== 'string' ||
      !Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
    throw new Error('Données de note invalides');
  }
  return {
    id, claimantId: parsedClaimant, fiscalYear, purpose: parsedPurpose,
    status: status as ExpenseStatus, createdAt: parsedDate,
  };
}

/**
 * Adaptateur append-only pour les brouillons. Les mises à jour de statut
 * feront l'objet d'un cas d'usage et d'un schéma versionné distincts.
 */
export class SheetsExpenseReportRepository implements ExpenseReportRepository {
  constructor(private readonly gateway: ExpenseReportSheetGateway) {}

  async findById(id: string): Promise<ExpenseReport | null> {
    if (!idPattern.test(id)) throw new Error('Identifiant invalide');
    const found = this.gateway.readRows().filter(row => row[0] === id);
    if (found.length > 1) throw new Error('Doublon de note détecté');
    return found.length === 1 ? fromRow(found[0]) : null;
  }

  async save(report: ExpenseReport): Promise<void> {
    if (!idPattern.test(report.id) || !report.claimantId || !report.purpose ||
        report.status !== 'DRAFT' || !Number.isInteger(report.fiscalYear) ||
        report.fiscalYear < 2000 || report.fiscalYear > 2100 ||
        !Number.isFinite(Date.parse(report.createdAt))) {
      throw new Error('Brouillon invalide');
    }
    this.gateway.runLocked(() => {
      if (this.gateway.readRows().some(row => row[0] === report.id)) {
        throw new Error('Une note portant cet identifiant existe déjà');
      }
      // JSON.stringify empêche l'interprétation des saisies comme formules Sheets.
      this.gateway.appendRow([
        report.id, JSON.stringify(report.claimantId), report.fiscalYear,
        JSON.stringify(report.purpose), report.status, JSON.stringify(report.createdAt),
      ]);
    });
  }
}
