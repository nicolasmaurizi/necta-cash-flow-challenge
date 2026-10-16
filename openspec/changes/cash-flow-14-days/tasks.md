# Tasks: 14-Day Cash Flow Forecast

> Incremental MVP on top of the existing Necta product. Reuse existing domains, services, authentication, persistence conventions, jobs, and tests.

## 1. Validate Existing Integration Points
- [ ] Locate existing sales, purchases, expenses, receivables, payables, payments, and bank services.
- [ ] Confirm store identity, currency, authentication, and `x-client-platform`.
- [ ] Confirm idempotency/conflict conventions, especially `clientMutationId`.
- [ ] Confirm existing jobs/workers and notification adapters.
- [ ] Confirm the existing Node.js test framework and service/repository patterns.

## 2. Forecast Domain Model
- [ ] Add internal forecast input/output types without changing existing transaction contracts.
- [ ] Represent confirmed, recurring, installment, and estimated outflows separately.
- [ ] Represent receivable and estimated cash-sale inflows separately.
- [ ] Add deterministic reason codes for confidence and action priorities.

## 3. Starting Balance Reconciliation
- [ ] Reuse existing stored/reconstructed bank-balance logic.
- [ ] Add configurable discrepancy detection.
- [ ] Add auditable reconciliation persistence.
- [ ] Add `POST /v2/banks/:id/reconciliation`.
- [ ] Reduce confidence when a material discrepancy remains unresolved.

## 4. Recurring Expenses
- [ ] Add the minimal recurring-expense model needed for payroll, rent, and similar obligations.
- [ ] Add create/read endpoints with existing authorization/store scoping.
- [ ] Expand recurrence rules into dated forecast outflows.
- [ ] Prevent duplicate occurrences.

## 5. CashFlowForecastEngine
- [ ] Resolve starting balance.
- [ ] Estimate receivable collections.
- [ ] Estimate cash sales from history, weekday, pay-period pattern, and recent trend.
- [ ] Resolve confirmed payables and known installments.
- [ ] Add recurring-expense occurrences.
- [ ] Estimate future purchases and variable expenses.
- [ ] Calculate conservative, expected, and optimistic scenarios.
- [ ] Calculate confidence and reason codes.
- [ ] Detect first projected shortfall date/amount.
- [ ] Generate deterministic collection/payment priorities.

## 6. Forecast API
- [ ] Add `GET /v2/cash-flow/forecast?days=14`.
- [ ] Default to 14 days and validate supported bounds.
- [ ] Return inflows, outflows, scenarios, confidence, shortfall, and actions.
- [ ] Keep the same contract for React Native and React.

## 7. Optional LLM Explanation
- [ ] Define an `LLMProvider` interface.
- [ ] Add `RecommendationService` using only structured forecast results/reason codes.
- [ ] Implement one provider adapter appropriate to the environment.
- [ ] Add timeout/error/invalid-response fallback to deterministic templates.
- [ ] Ensure LLM output cannot modify amounts, confidence, or priorities.
- [ ] Expose explanation using existing API conventions.

## 8. Recalculation and Alerts
- [ ] Add a daily rolling 14-day forecast job using existing scheduler infrastructure.
- [ ] Trigger recalculation after relevant financial events.
- [ ] Persist minimal alert state for deduplication.
- [ ] Notify only for new actionable shortfall or material deterioration.
- [ ] Reuse push/email; use WhatsApp only with approved template/configuration.
- [ ] Do not call the LLM merely to send an automated alert.

## 9. Mobile Offline Extension
- [ ] Add persistent local queue for supported offline writes.
- [ ] Generate/preserve `clientMutationId`.
- [ ] Sync when connectivity returns.
- [ ] Handle backend `409` without silently discarding local data.
- [ ] Cache last server forecast for timestamped read-only offline display.

## 10. Tests
- [ ] Unit-test reconciliation behavior.
- [ ] Unit-test receivable likelihood rules.
- [ ] Unit-test weekday/pay-period sales estimation.
- [ ] Unit-test recurring and estimated outflows.
- [ ] Unit-test scenarios and confidence.
- [ ] Unit-test action prioritization.
- [ ] Unit-test notification deduplication.
- [ ] Test LLM failure fallback.
- [ ] Add a business-logic fixture based on Carmen/Limpia Ya.

## 11. Partial Technical-Challenge Implementation
For the challenge submission, implement a focused vertical slice:
- [ ] Implement the deterministic engine core required for the supplied case.
- [ ] Expose one forecast endpoint using simplified/in-memory adapters where the real repository is unavailable.
- [ ] Add at least one business-logic test using supplied case data.
- [ ] Document assumptions caused by the missing real repository.
- [ ] Do not scaffold unrelated Necta infrastructure.

## 12. Deferred
- [ ] Smart Purchasing simulation.
- [ ] Cross-business benchmarks.
- [ ] Advanced statistical/ML forecasting.
- [ ] Full supplier-product-margin optimization when source data is unavailable.
