export type ScenarioName = "conservative" | "expected" | "optimistic";
export type OutflowClassification = "confirmed" | "recurring" | "installment" | "estimated";

export interface ForecastRequest {
  storeId: string;
  asOfDate: string;
  days: number;
  timezone: string;
}

export interface BalanceInput {
  storedBalance: number;
  reconstructedBalance: number;
  confirmedBalance?: number;
  currency: string;
  transactionCoverage?: number;
  sourceDataFresh: boolean;
}

export interface Receivable {
  id: string;
  customerName: string;
  amountPending: number;
  dueDate: string;
  onTimePayments: number;
  totalHistoricalPayments: number;
  averageDaysLate?: number;
}

export interface SalesProfile {
  weekdayBaseline: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, number>>;
  closedWeekdays: number[];
  payPeriodMultiplier: number;
  payPeriodDates: string[];
  recentTrendMultiplier: number;
}

export interface Outflow {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  classification: OutflowClassification;
  nonPaymentImpact?: number;
  supplierCriticality?: number;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  classification: "recurring" | "installment";
  active: boolean;
}

export interface ForecastData {
  balance: BalanceInput;
  receivables: Receivable[];
  sales: SalesProfile;
  outflows: Outflow[];
  recurringExpenses: RecurringExpense[];
  estimatedVariableExpensePerOpenDay: number;
}

export interface Confidence {
  level: "high" | "medium" | "low";
  score: number;
  reasons: string[];
}

export interface DailyForecastPoint {
  date: string;
  inflows: number;
  outflows: number;
  endingBalance: number;
}

export interface ScenarioResult {
  endingBalance: number;
  firstShortfall: { date: string; amount: number } | null;
  daily: DailyForecastPoint[];
  uncertainInflows: number;
  estimatedOutflows: number;
}

export interface Action {
  id: string;
  type: "collection" | "payment";
  description: string;
  amount: number;
  priorityScore: number;
  reasonCodes: string[];
  dueDate: string;
}

export interface ForecastResult {
  period: { asOfDate: string; days: number; currency: string; timezone: string };
  startingBalance: {
    amount: number;
    status: "confirmed" | "provisional";
    storedAmount: number;
    reconstructedAmount: number;
    delta: number;
    materialDiscrepancy: boolean;
  };
  scenarios: Record<ScenarioName, ScenarioResult>;
  inflows: { receivables: number; estimatedCashSales: number };
  outflows: Record<OutflowClassification, number>;
  confidence: Confidence;
  firstExpectedShortfall: { date: string; amount: number } | null;
  actions: { collections: Action[]; payments: Action[] };
  generatedAt: string;
}
