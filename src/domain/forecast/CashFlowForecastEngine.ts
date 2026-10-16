import type {
  Action, BalanceInput, Confidence, ForecastData, ForecastRequest, ForecastResult,
  Outflow, Receivable, ScenarioName, ScenarioResult
} from "./types.js";
import { addDays, clamp, dateRange, daysBetween, parseDate, roundPesos, weekday } from "./dateUtils.js";

export const SCENARIO_FACTORS = {
  conservative: { uncertainInflows: 0.8, estimatedOutflows: 1.2 },
  expected: { uncertainInflows: 1, estimatedOutflows: 1 },
  optimistic: { uncertainInflows: 1.1, estimatedOutflows: 0.9 }
} as const;

const MATERIAL_BALANCE_MINIMUM = 100_000;
const MATERIAL_BALANCE_RATIO = 0.05;

type Flow = { date: string; amount: number; kind: "receivable" | "sales" | "confirmed" | "recurring" | "installment" | "estimated"; sourceId: string };

export class CashFlowForecastEngine {
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  calculate(request: ForecastRequest, data: ForecastData): ForecastResult {
    if (!Number.isInteger(request.days) || request.days < 1 || request.days > 30) {
      throw new Error("days must be an integer from 1 to 30");
    }
    parseDate(request.asOfDate);
    const dates = dateRange(request.asOfDate, request.days);
    const startingBalance = this.resolveStartingBalance(data.balance);
    const flows = this.buildFlows(request, dates, data);
    const scenarios = {} as Record<ScenarioName, ScenarioResult>;
    for (const scenario of ["conservative", "expected", "optimistic"] as const) {
      scenarios[scenario] = this.calculateScenario(scenario, startingBalance.amount, dates, flows);
    }

    const confidence = this.calculateConfidence(data.balance, startingBalance.materialDiscrepancy, flows, dates.length);
    const expected = scenarios.expected;
    return {
      period: { asOfDate: request.asOfDate, days: request.days, currency: data.balance.currency, timezone: request.timezone },
      startingBalance,
      scenarios,
      inflows: {
        receivables: this.sum(flows.filter(flow => flow.kind === "receivable")),
        estimatedCashSales: this.sum(flows.filter(flow => flow.kind === "sales"))
      },
      outflows: {
        confirmed: this.sum(flows.filter(flow => flow.kind === "confirmed")),
        recurring: this.sum(flows.filter(flow => flow.kind === "recurring")),
        installment: this.sum(flows.filter(flow => flow.kind === "installment")),
        estimated: this.sum(flows.filter(flow => flow.kind === "estimated"))
      },
      confidence,
      firstExpectedShortfall: expected.firstShortfall,
      actions: {
        collections: this.collectionActions(data.receivables, expected.firstShortfall, request.asOfDate, dates.at(-1)!),
        payments: this.paymentActions(flows, expected.firstShortfall, request.asOfDate)
      },
      generatedAt: this.now()
    };
  }

  private resolveStartingBalance(balance: BalanceInput): ForecastResult["startingBalance"] {
    const delta = balance.storedBalance - balance.reconstructedBalance;
    const materialDiscrepancy = Math.abs(delta) > Math.max(MATERIAL_BALANCE_MINIMUM, balance.storedBalance * MATERIAL_BALANCE_RATIO);
    return {
      amount: balance.confirmedBalance ?? balance.storedBalance,
      status: balance.confirmedBalance === undefined ? "provisional" : "confirmed",
      storedAmount: balance.storedBalance,
      reconstructedAmount: balance.reconstructedBalance,
      delta,
      materialDiscrepancy
    };
  }

  private buildFlows(request: ForecastRequest, dates: string[], data: ForecastData): Flow[] {
    const flows: Flow[] = [];
    const end = dates.at(-1)!;
    const unique = new Set<string>();
    const add = (flow: Flow) => {
      if (flow.date < request.asOfDate || flow.date > end) return;
      // A source obligation is unique even if two upstream records disagree on classification.
      const key = `${flow.sourceId}:${flow.date}`;
      if (unique.has(key)) return;
      unique.add(key);
      flows.push({ ...flow, amount: roundPesos(flow.amount) });
    };

    for (const receivable of data.receivables) {
      const probability = this.collectionProbability(receivable);
      const dueDate = receivable.dueDate < request.asOfDate
        ? addDays(request.asOfDate, Math.max(0, (receivable.averageDaysLate ?? 0) - daysBetween(receivable.dueDate, request.asOfDate)))
        : addDays(receivable.dueDate, receivable.averageDaysLate ? Math.round(receivable.averageDaysLate * (1 - probability)) : 0);
      add({ date: dueDate, amount: receivable.amountPending * probability, kind: "receivable", sourceId: receivable.id });
    }
    for (const date of dates) {
      const day = weekday(date);
      const baseline = data.sales.closedWeekdays.includes(day) ? 0 : (data.sales.weekdayBaseline[day as keyof typeof data.sales.weekdayBaseline] ?? 0);
      const payPeriod = data.sales.payPeriodDates.includes(date) ? data.sales.payPeriodMultiplier : 1;
      add({ date, amount: baseline * payPeriod * data.sales.recentTrendMultiplier, kind: "sales", sourceId: `cash-sales:${date}` });
      if (baseline > 0) add({ date, amount: data.estimatedVariableExpensePerOpenDay, kind: "estimated", sourceId: `variable-expense:${date}` });
    }
    for (const outflow of data.outflows) add({ date: outflow.dueDate, amount: outflow.amount, kind: outflow.classification, sourceId: outflow.id });
    for (const recurring of data.recurringExpenses) {
      if (!recurring.active) continue;
      for (const date of dates) {
        const day = Number(date.slice(8, 10));
        if (day === recurring.dayOfMonth) add({ date, amount: recurring.amount, kind: recurring.classification, sourceId: recurring.id });
      }
    }
    return flows;
  }

  private calculateScenario(scenario: ScenarioName, start: number, dates: string[], flows: Flow[]): ScenarioResult {
    const factors = SCENARIO_FACTORS[scenario];
    let balance = start;
    let uncertainInflows = 0;
    let estimatedOutflows = 0;
    let firstShortfall: ScenarioResult["firstShortfall"] = null;
    const daily = dates.map(date => {
      const dayFlows = flows.filter(flow => flow.date === date);
      let inflows = 0;
      let outflows = 0;
      for (const flow of dayFlows) {
        if (flow.kind === "receivable" || flow.kind === "sales") {
          const amount = roundPesos(flow.amount * factors.uncertainInflows);
          inflows += amount;
          uncertainInflows += amount;
        } else {
          const amount = flow.kind === "estimated" ? roundPesos(flow.amount * factors.estimatedOutflows) : flow.amount;
          outflows += amount;
          if (flow.kind === "estimated") estimatedOutflows += amount;
        }
      }
      balance += inflows - outflows;
      if (balance < 0 && firstShortfall === null) firstShortfall = { date, amount: Math.abs(balance) };
      return { date, inflows, outflows, endingBalance: balance };
    });
    return { endingBalance: balance, firstShortfall, daily, uncertainInflows, estimatedOutflows };
  }

  private collectionProbability(receivable: Receivable): number {
    const rate = receivable.totalHistoricalPayments === 0 ? 0 : receivable.onTimePayments / receivable.totalHistoricalPayments;
    const latenessPenalty = Math.min(0.5, (receivable.averageDaysLate ?? 0) / 30 * 0.5);
    return clamp(rate * (1 - latenessPenalty), 0, 1);
  }

  private calculateConfidence(balance: BalanceInput, materialDiscrepancy: boolean, flows: Flow[], days: number): Confidence {
    let score = 100;
    const reasons: string[] = [];
    if (materialDiscrepancy && balance.confirmedBalance === undefined) { score -= 35; reasons.push("UNRESOLVED_MATERIAL_BALANCE_DISCREPANCY"); }
    if (balance.transactionCoverage !== undefined && balance.transactionCoverage < 0.5) { score -= 25; reasons.push("INCOMPLETE_TRANSACTION_COVERAGE"); }
    const salesDays = new Set(flows.filter(flow => flow.kind === "sales").map(flow => flow.date)).size;
    if (salesDays < Math.min(days, 7)) { score -= 15; reasons.push("INSUFFICIENT_SALES_HISTORY"); }
    if (!balance.sourceDataFresh) { score -= 10; reasons.push("STALE_SOURCE_DATA"); }
    return { score, level: score >= 80 ? "high" : score >= 50 ? "medium" : "low", reasons };
  }

  private collectionActions(receivables: Receivable[], shortfall: ScenarioResult["firstShortfall"], asOf: string, end: string): Action[] {
    return receivables.map(receivable => {
      const probability = this.collectionProbability(receivable);
      const estimatedAmount = roundPesos(receivable.amountPending * probability);
      const beforeShortfall = shortfall === null || receivable.dueDate <= shortfall.date;
      const reasons = [probability >= 0.75 ? "HIGH_COLLECTION_LIKELIHOOD" : "COLLECTION_UNCERTAINTY"];
      if (receivable.dueDate < asOf) reasons.push("OVERDUE");
      if (beforeShortfall && shortfall !== null) reasons.push("BEFORE_EXPECTED_SHORTFALL");
      const action: Action = { id: receivable.id, type: "collection", description: `Collect from ${receivable.customerName}`, amount: estimatedAmount, priorityScore: estimatedAmount + (beforeShortfall ? 100_000 : 0) + Math.round(probability * 10_000), reasonCodes: reasons, dueDate: receivable.dueDate };
      return action;
    }).filter(action => action.dueDate <= end).sort(this.actionSort);
  }

  private paymentActions(flows: Flow[], shortfall: ScenarioResult["firstShortfall"], asOf: string): Action[] {
    return flows.filter(flow => ["confirmed", "recurring", "installment"].includes(flow.kind)).map(flow => {
      const beforeShortfall = shortfall !== null && flow.date <= shortfall.date;
      const reasons = [flow.kind === "confirmed" ? "CONFIRMED_OBLIGATION" : `${flow.kind.toUpperCase()}_OBLIGATION`];
      if (beforeShortfall) reasons.push("BEFORE_EXPECTED_SHORTFALL");
      if (flow.date <= asOf) reasons.push("DUE_NOW");
      const action: Action = { id: flow.sourceId, type: "payment", description: `Review payment ${flow.sourceId}`, amount: flow.amount, priorityScore: flow.amount + (beforeShortfall ? 100_000 : 0), reasonCodes: reasons, dueDate: flow.date };
      return action;
    }).sort(this.actionSort);
  }

  private actionSort(a: Action, b: Action): number {
    return b.priorityScore - a.priorityScore || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id);
  }

  private sum(flows: Flow[]): number { return flows.reduce((total, flow) => total + flow.amount, 0); }
}
