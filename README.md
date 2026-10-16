# Necta 14-Day Cash Flow Forecast

This repository contains a deliberately small backend vertical slice for the OpenSpec feature in `openspec/changes/cash-flow-14-days/`. It extends an existing Necta product conceptually; it is not an attempt to recreate Necta.

## What is implemented

- A framework-independent deterministic `CashFlowForecastEngine`.
- Typed ports for the unavailable Necta financial services.
- An in-memory Carmen Ortiz / Limpia Ya fixture.
- Receivable collection heuristics, weekday/pay-period cash-sales estimation, recurring expenses, installments, confirmed payables, and estimated variable expenses.
- Conservative, expected, and optimistic scenarios.
- Independent confidence scoring with reason codes.
- Deterministic collection and payment recommendations.
- A small standard-library HTTP endpoint:

```text
GET /v2/cash-flow/forecast?days=14
```

## Deterministic rules

All COP amounts are integer pesos. Probability-weighted values use `Math.round`.

Receivable probability is the historical on-time ratio multiplied by a lateness factor:

```text
onTimePayments / totalHistoricalPayments
  * (1 - min(0.5, averageDaysLate / 30 * 0.5))
```

Expected cash sales use the input weekday profile, pay-period multiplier, and recent-trend multiplier. Sundays are closed in the fixture. The fixture uses COP 260,000 Monday–Thursday, COP 520,000 Friday–Saturday, a 1.30 pay-period multiplier, and COP 90,000 estimated operating expense per open day.

Scenario factors are challenge assumptions, not production-calibrated parameters:

| Scenario | Uncertain inflows | Estimated outflows |
| --- | ---: | ---: |
| Conservative | 0.80 | 1.20 |
| Expected | 1.00 | 1.00 |
| Optimistic | 1.10 | 0.90 |

Confirmed, recurring, and installment outflows are never scenario-multiplied. Duplicate source obligation IDs on the same date are counted once.

Confidence starts at 100 and applies only deductions supported by the input data. The Carmen fixture has 25% transaction coverage, and its stored COP 1,900,000 versus reconstructed COP 1,640,000 balance difference is material under `max(COP 100,000, 5% of stored balance)`. A confirmed balance removes the unresolved-discrepancy deduction but does not remove the transaction-coverage limitation.

The fixture uses the synthetic timeline beginning Monday `2027-01-25` in `America/Bogota`. The forecast includes `asOfDate` and contains exactly `days` calendar days. Supported values are 1 through 30.

## Run

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Then request:

```text
http://localhost:3000/v2/cash-flow/forecast?days=14
```

The fixture-backed store context is intentionally fixed to `carmen-limpia-ya`; production authentication and store authorization are outside this challenge slice.

## Structure

```text
src/domain/forecast/       domain types, date rules, and engine
src/ports/                 interfaces for unavailable Necta services
src/adapters/fixtures/     Carmen/Limpia Ya in-memory adapter
src/http/                  thin HTTP adapter
tests/                     business-logic and endpoint tests
openspec/                  source specification
docs/                      supplied architecture diagram
```

## Intentionally excluded

Authentication, persistence, MongoDB, gateway infrastructure, reconciliation CRUD, recurring-expense CRUD, jobs, notifications, mobile/web clients, offline sync, LLM explanations, Smart Purchasing, cross-business benchmarking, ML, and deployment infrastructure remain outside this partial implementation because the real Necta repository is unavailable.
