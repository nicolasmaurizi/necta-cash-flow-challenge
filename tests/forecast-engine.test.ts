import { describe, expect, it } from "vitest";
import { carmenLimpiaYa, CARMEN_AS_OF_DATE } from "../src/adapters/fixtures/carmenLimpiaYa.js";
import { CashFlowForecastEngine } from "../src/domain/forecast/CashFlowForecastEngine.js";
import type { ForecastData } from "../src/domain/forecast/types.js";

const request = { storeId: "carmen-limpia-ya", asOfDate: CARMEN_AS_OF_DATE, days: 14, timezone: "America/Bogota" };

describe("CashFlowForecastEngine", () => {
  it("uses a confirmed balance and preserves the Carmen discrepancy details", () => {
    const data = structuredClone(carmenLimpiaYa);
    data.balance.confirmedBalance = 1_900_000;
    const result = new CashFlowForecastEngine(() => "2027-01-25T00:00:00.000Z").calculate(request, data);
    expect(result.startingBalance.amount).toBe(1_900_000);
    expect(result.startingBalance.status).toBe("confirmed");
    expect(result.startingBalance.delta).toBe(260_000);
    expect(result.confidence.reasons).toContain("INCOMPLETE_TRANSACTION_COVERAGE");
    expect(result.confidence.reasons).not.toContain("UNRESOLVED_MATERIAL_BALANCE_DISCREPANCY");
  });

  it("reduces confidence for the unresolved material discrepancy", () => {
    const result = new CashFlowForecastEngine().calculate(request, structuredClone(carmenLimpiaYa));
    expect(result.startingBalance.amount).toBe(1_900_000);
    expect(result.startingBalance.materialDiscrepancy).toBe(true);
    expect(result.confidence.level).toBe("low");
    expect(result.confidence.reasons).toEqual(expect.arrayContaining(["UNRESOLVED_MATERIAL_BALANCE_DISCREPANCY", "INCOMPLETE_TRANSACTION_COVERAGE"]));
  });

  it("applies weekday, pay-period, closed-day and estimated-expense rules", () => {
    const result = new CashFlowForecastEngine().calculate(request, carmenLimpiaYa);
    const expected = result.scenarios.expected;
    expect(expected.daily.find(day => day.date === "2027-01-31")?.inflows).toBe(0);
    expect(result.inflows.estimatedCashSales).toBe(4_316_000);
    expect(expected.daily.find(day => day.date === "2027-01-30")?.inflows).toBeGreaterThanOrEqual(676_000);
    expect(result.outflows.estimated).toBe(1_080_000);
    expect(result.outflows.recurring).toBe(2_700_000);
  });

  it("ranks reliable collections above late payers and applies lateness", () => {
    const result = new CashFlowForecastEngine().calculate(request, carmenLimpiaYa);
    const collections = result.actions.collections;
    const brisas = collections.find(action => action.id === "ar-hotel-brisas")!;
    const sol = collections.find(action => action.id === "ar-minimercado-sol")!;
    expect(brisas.amount).toBeGreaterThan(sol.amount);
    expect(brisas.priorityScore).toBeGreaterThan(sol.priorityScore);
    expect(collections.find(action => action.id === "ar-minimercado-sol")?.reasonCodes).toContain("OVERDUE");
  });

  it("keeps scenarios ordered and does not multiply confirmed obligations", () => {
    const result = new CashFlowForecastEngine().calculate(request, carmenLimpiaYa);
    expect(result.scenarios.conservative.endingBalance).toBeLessThanOrEqual(result.scenarios.expected.endingBalance);
    expect(result.scenarios.expected.endingBalance).toBeLessThanOrEqual(result.scenarios.optimistic.endingBalance);
    expect(result.outflows.confirmed).toBe(4_200_000);
    expect(result.outflows.estimated).toBe(1_080_000);
    expect(result.scenarios.conservative.daily.find(day => day.date === "2027-01-29")?.outflows).toBe(4_308_000);
    expect(result.outflows.installment).toBe(0);
  });

  it("expands the loan installment separately when the horizon reaches day 10", () => {
    const result = new CashFlowForecastEngine().calculate({ ...request, days: 30 }, carmenLimpiaYa);
    expect(result.outflows.installment).toBe(650_000);
    expect(result.outflows.confirmed).toBe(4_200_000);
    expect(result.scenarios.conservative.daily.find(day => day.date === "2027-02-10")?.outflows).toBe(758_000);
  });

  it("prevents the same obligation from being counted twice", () => {
    const data: ForecastData = structuredClone(carmenLimpiaYa);
    data.outflows.push({ id: "duplicate-obligation", description: "same", amount: 500_000, dueDate: "2027-01-29", classification: "confirmed" });
    data.recurringExpenses.push({ id: "duplicate-obligation", description: "same", amount: 500_000, dayOfMonth: 29, classification: "installment", active: true });
    const result = new CashFlowForecastEngine().calculate(request, data);
    expect(result.outflows.confirmed).toBe(4_700_000);
    expect(result.outflows.installment).toBe(0);
  });

  it("keeps confidence independent from a positive or negative balance", () => {
    const data = structuredClone(carmenLimpiaYa);
    data.balance.confirmedBalance = 100_000_000;
    const highBalance = new CashFlowForecastEngine().calculate(request, data);
    expect(highBalance.confidence.level).toBe("medium");
    expect(highBalance.confidence.reasons).toContain("INCOMPLETE_TRANSACTION_COVERAGE");
  });
});
