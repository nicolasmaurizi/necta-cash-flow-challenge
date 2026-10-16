# Design: 14-Day Cash Flow Forecast

## 1. Existing Product Context
Necta already has React Native (Expo) and React/Vite clients sharing a Node.js + MongoDB backend; sales with `clientMutationId` idempotency; purchases, income and expenses; receivables/payables with partial payments; stored and reconstructed bank balances; push notifications; internal email/WhatsApp messaging; and AI-assisted voice/photo draft extraction.

This feature extends those capabilities. It does not rebuild them.

## 2. Architecture
Business logic lives in the backend and is shared by mobile and web.

```text
React Native ---------\
                       -> Forecast API -> CashFlowForecastEngine -> Structured Forecast
React Web ------------/                         |
                                                 +-> RecommendationService -> LLMProvider (optional)
                                                 |
                                                 +-> RiskEvaluator -> NotificationService
```

The LLM is never a source of financial truth. The deterministic engine calculates amounts, scenarios, confidence, reason codes, and priorities.

## 3. Starting Balance and Reconciliation
Neither the stored balance nor the reconstructed balance is automatically authoritative when they materially diverge.

When the difference exceeds a configurable threshold:
1. expose both balances and the delta;
2. ask the user to confirm the actual balance;
3. store an auditable reconciliation;
4. use the confirmed balance as the forecast starting balance;
5. until confirmation, allow forecasting with reduced confidence and a visible warning.

Proposed additive endpoint:

```http
POST /v2/banks/:id/reconciliation
```

Example:
```json
{ "confirmedBalance": 1900000, "reason": "manual_confirmation" }
```

## 4. Forecast Inputs

### 4.1 Receivables
Estimate collection likelihood using pending amount, due date, recent on-time/late history, average lateness, and partial-payment history when available. Do not treat every due receivable as guaranteed cash.

### 4.2 Future Cash Sales
Use up to six months of the store's own history. Consider weekday, pay-period/quincena effects, recent trend, and closed days. For the supplied case, the known baseline is approximately COP 260,000 Monday-Thursday, COP 520,000 Friday-Saturday, closed Sunday, with approximately +30% during pay-period weeks.

Production logic should infer patterns from real history rather than hard-code case values.

### 4.3 Confirmed Outflows
Include existing payables, known scheduled payments, and future installments derived from known obligations when they fall inside the window.

### 4.4 Recurring Expenses
Add a minimal recurring-expense capability for obligations such as rent and payroll.

```http
POST /v2/recurring-expenses
GET  /v2/recurring-expenses
```

Expand active recurrence rules into dated occurrences inside the 14-day window.

### 4.5 Estimated Purchases and Variable Expenses
Known payables are not enough because the owner may make new purchases during the next 14 days. Estimate non-committed purchases and variable operating expenses from the store's own history.

Keep forecast classifications separate:
- `confirmed`
- `recurring`
- `installment`
- `estimated`

These are forecast classifications; existing purchase APIs do not need redesign.

## 5. Scenarios

### Conservative
Weaker collections/sales and higher variable outflows within defensible historical bounds.

### Expected
Best deterministic estimates for collections, cash sales, recurring obligations, purchases, and variable expenses. This is the primary scenario.

### Optimistic
Stronger collections/sales and lower variable outflows within defensible historical bounds.

Exact multipliers/quantiles must be explicit and testable.

## 6. Confidence
Scenario and confidence are different concepts. A positive expected balance may still have low confidence.

Return `high`, `medium`, or `low` plus deterministic reason codes. Consider:
- starting-balance reconciliation;
- usable historical coverage;
- confirmed vs estimated cash-flow share;
- known data gaps;
- receivable payment-history coverage;
- source-data freshness.

## 7. Action Prioritization

### Collection priority
Rank using cash impact, probability of collecting in time, due/overdue status, and urgency relative to the first projected shortfall.

### Payment priority
Rank using due date, amount, non-payment impact, and supplier/business criticality when supported by available data.

If the existing data reliably relates supplier purchases to products and subsequent sales/margin, supplier relevance may contribute to the score. If that relationship is absent, the MVP must not invent it.

Commercial benefits/penalties may only be used when the data exists.

## 8. LLM Use
Use a provider abstraction only for natural-language explanation.

```text
RecommendationService -> LLMProvider -> configured provider
```

The provider receives structured forecast data and deterministic reason codes. It must not recalculate balances or override priorities.

If the LLM fails, times out, exceeds budget, or returns invalid content:
- the forecast remains valid;
- deterministic actions remain visible;
- use templated explanations.

The deterministic forecast should not consume AI credits. LLM explanation is optional and provider pricing remains operational configuration.

## 9. Main Forecast API

```http
GET /v2/cash-flow/forecast?days=14
```

Illustrative shape:
```json
{
  "period": { "days": 14 },
  "startingBalance": { "amount": 1900000, "status": "reconciled" },
  "scenarios": {
    "conservative": { "endingBalance": -850000 },
    "expected": { "endingBalance": 320000 },
    "optimistic": { "endingBalance": 1450000 }
  },
  "confidence": {
    "level": "medium",
    "reasons": ["INCOMPLETE_TRANSACTION_COVERAGE"]
  },
  "firstExpectedShortfall": null,
  "inflows": {
    "receivables": 3000000,
    "estimatedCashSales": 2400000
  },
  "outflows": {
    "confirmed": 4200000,
    "recurring": 2700000,
    "installments": 650000,
    "estimated": 900000
  },
  "actions": []
}
```

Amounts above are illustrative, not acceptance-test values.

Optional explanation endpoint:
```http
POST /v2/cash-flow/forecast/:id/explanation
```

The exact HTTP shape may follow existing backend conventions; separation between deterministic calculation and LLM explanation is mandatory.

## 10. Recalculation and Alerts

### Daily
Once per day, calculate a rolling `today -> today + 14 days` forecast for eligible stores.

### Event-driven
Recalculate after relevant events such as payment received, purchase/expense recorded, payable change, bank reconciliation, or recurring-obligation change.

### Notification policy
Notify only when:
- a new actionable shortfall appears;
- an existing shortfall materially worsens;
- optionally, a previously notified shortfall is resolved.

Do not resend an unchanged warning every day.

Persist enough alert state for deduplication, e.g. store, risk level, shortfall amount/date, confidence, last notification time, and forecast fingerprint.

## 11. Notification Channels
Reuse existing infrastructure:
1. Push when available.
2. Email when push is unavailable/not permitted.
3. WhatsApp only when enabled and an approved business-initiated template exists.

Automated risk alerts do not require an LLM.

## 12. Offline Mobile Behavior
Reuse existing `clientMutationId` idempotency.

```text
Record offline
 -> persist locally with clientMutationId
 -> show pending sync
 -> connectivity returns
 -> send through existing API
 -> success: remove/mark synced
 -> 409: retain for conflict handling
```

The app may show the last downloaded forecast offline with its generation timestamp. It must not present a locally guessed forecast as current server truth.

Web offline write support is outside this MVP.

## 13. Concurrent Changes
The backend remains authoritative. Preserve existing conflict/idempotency semantics. New mutable support entities should use existing Necta concurrency conventions; if none exist, use explicit version/update timestamps and reject stale conflicting writes rather than silently applying last-write-wins.

This assumption must be verified against the real codebase.

## 14. Cross-Business Data and Privacy
The MVP does not use other stores' data. Same-industry businesses may differ materially in size, location, purchasing power, volume, costs, and operating model.

Future benchmarks may use aggregated, anonymized data with appropriate consent and privacy thresholds, separately from the forecast.

## 15. Technology/Deployment Position
Because no repository is supplied, exact libraries must be validated against the existing project before adding dependencies.

- Reuse Necta's current backend/web hosting model.
- Reuse the project's Expo/EAS mobile release pipeline.
- Reuse existing scheduler/worker infrastructure if present.
- Use an Expo-compatible persistent local store/queue for offline mobile operations.
- Reuse the existing test stack.

Do not invent new infrastructure solely for this feature.

## 16. Alternatives Rejected
- Flat `balance + all receivables - all payables`: ignores payment reliability, future sales, recurring expenses, and likely purchases.
- Stored balance always wins: contradicted by the known discrepancy.
- Reconstructed balance always wins: transaction coverage is incomplete.
- Complex ML forecasting: six months from one store favors transparent rules/simple statistics for the MVP.
- LLM-driven calculation: nondeterministic and unnecessary for core arithmetic.
- Same-industry peer comparison: misleading and privacy-heavy for this MVP.

## 17. Recommended Next Step: Smart Purchasing
Outside the MVP, simulate a proposed purchase before confirmation:
- calculate forecast with and without the purchase;
- show cash impact;
- warn if upcoming obligations become unsafe;
- when supplier/product economics are available, recommend safer amount or timing.

This evolves the feature from warning to prevention.
