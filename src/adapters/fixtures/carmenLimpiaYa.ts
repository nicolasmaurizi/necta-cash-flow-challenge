import type { ForecastData } from "../../domain/forecast/types.js";
import type { ForecastDataProvider } from "../../ports/forecastData.js";

export const CARMEN_AS_OF_DATE = "2027-01-25"; // Monday; day 1 is the following February.

export const carmenLimpiaYa: ForecastData = {
  balance: {
    storedBalance: 1_900_000,
    reconstructedBalance: 1_640_000,
    currency: "COP",
    transactionCoverage: 0.25,
    sourceDataFresh: true
  },
  receivables: [
    { id: "ar-hotel-brisas", customerName: "Hotel Brisas", amountPending: 2_100_000, dueDate: "2027-01-28", onTimePayments: 6, totalHistoricalPayments: 6 },
    { id: "ar-minimercado-sol", customerName: "Minimercado Sol", amountPending: 1_200_000, dueDate: "2027-01-05", onTimePayments: 1, totalHistoricalPayments: 4, averageDaysLate: 18 },
    { id: "ar-tienda-esquina", customerName: "Tienda La Esquina", amountPending: 850_000, dueDate: "2027-01-26", onTimePayments: 2, totalHistoricalPayments: 5, averageDaysLate: 12 },
    { id: "ar-dona-fina", customerName: "Tienda Doña Fina", amountPending: 600_000, dueDate: "2027-01-29", onTimePayments: 4, totalHistoricalPayments: 4 },
    { id: "ar-other-stores", customerName: "Other 9 stores (aggregated)", amountPending: 850_000, dueDate: "2027-01-30", onTimePayments: 22, totalHistoricalPayments: 31 }
  ],
  sales: {
    weekdayBaseline: { 1: 260_000, 2: 260_000, 3: 260_000, 4: 260_000, 5: 520_000, 6: 520_000 },
    closedWeekdays: [0],
    payPeriodMultiplier: 1.3,
    payPeriodDates: ["2027-01-30"],
    recentTrendMultiplier: 1
  },
  outflows: [
    { id: "payable-main-supplier", description: "Main supplier", amount: 4_200_000, dueDate: "2027-01-29", classification: "confirmed" }
  ],
  recurringExpenses: [
    { id: "recurring-helpers", description: "Two helpers", amount: 1_400_000, dayOfMonth: 30, classification: "recurring", active: true },
    { id: "recurring-rent", description: "Warehouse rent", amount: 1_300_000, dayOfMonth: 1, classification: "recurring", active: true },
    { id: "installment-loan", description: "Loan installment", amount: 650_000, dayOfMonth: 10, classification: "installment", active: true }
  ],
  estimatedVariableExpensePerOpenDay: 90_000
};

export class CarmenFixtureProvider implements ForecastDataProvider {
  getForecastData(storeId: string): ForecastData {
    if (storeId !== "carmen-limpia-ya") throw new Error("Unknown fixture store");
    return structuredClone(carmenLimpiaYa);
  }
}
