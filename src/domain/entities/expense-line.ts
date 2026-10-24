export type ExpenseKind = 'TRAVEL' | 'MEAL' | 'ACCOMMODATION' | 'OTHER';

export interface ExpenseLine {
  id: string;
  reportId: string;
  kind: ExpenseKind;
  description: string;
  amountCents: number;
  incurredOn: string;
}
