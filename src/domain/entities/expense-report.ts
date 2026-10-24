export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'TO_PAY' | 'PAID' | 'ARCHIVED' | 'RETURNED' | 'REJECTED';

export interface ExpenseReport {
  id: string;
  claimantId: string;
  fiscalYear: number;
  purpose: string;
  status: ExpenseStatus;
  createdAt: string;
}
