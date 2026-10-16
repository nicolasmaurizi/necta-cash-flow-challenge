# Proposal: 14-Day Cash Flow Forecast

## Problem
Necta already records sales, purchases, income, expenses, receivables, payables, payments, and cash/bank balances, but it does not answer the forward-looking question: **Will the owner have enough cash to cover obligations during the next 14 days, how reliable is that answer, and what should she do if she is at risk?**

The available data is imperfect: users may record only part of their activity, stored and reconstructed balances may diverge, customers have different payment behavior, and some future obligations are not currently represented.

## Goal
Add an MVP capability named **14-Day Cash Flow Forecast** that:
- projects cash over a rolling 14-day window;
- separates known cash flows from estimated ones;
- returns conservative, expected, and optimistic scenarios;
- reports a confidence level based on data quality;
- recommends which collections and payments deserve attention first;
- recalculates daily and after relevant financial events;
- alerts only when an actionable cash risk is detected;
- optionally uses an LLM to explain deterministic results in natural language.

## Product Principle
This is a new feature in an existing, functional product. Reuse existing Necta capabilities and contracts wherever possible. Do not redesign authentication, sales, purchases, receivables, payables, payments, bank accounts, push delivery, or the internal messaging service.

The backend is the source of truth for forecast calculations. React Native and React consume the same forecast result. React Native additionally supports offline capture and later synchronization.

## In Scope
- Starting-balance validation and reconciliation.
- Receivable collection estimation using due dates and payment behavior.
- Cash-sale estimation using history, weekday patterns, pay-period effects, and recent trend.
- Confirmed future outflows from existing payables/payments.
- Future installments derived from known obligations.
- Recurring expenses such as rent and payroll.
- Estimated future purchases and variable operating expenses from historical behavior.
- Conservative, expected, and optimistic scenarios.
- Forecast confidence based on data completeness.
- Deterministic action prioritization for collections and payments.
- Optional LLM explanation of an already-calculated forecast.
- Daily rolling forecast plus event-driven recalculation.
- Risk-only notifications with deduplication.
- Offline mobile queue using existing idempotency semantics.

## Out of Scope
- Direct performance comparison with other businesses in the same industry.
- Using other businesses' data to calculate the MVP forecast.
- Training a forecasting ML model.
- Letting an LLM calculate balances, scenarios, confidence, or priorities.
- Rebuilding existing Necta domains or infrastructure.
- Full inventory optimization.
- **Smart Purchasing**: simulating a proposed purchase before confirmation and recommending a safer amount/timing. This is the recommended next product step.

## Cross-Business Data Position
The MVP uses only the store's own data. A future benchmarking capability may use aggregated and anonymized cross-business information only with appropriate consent and privacy controls. It must remain separate from the core forecast.

## Success Criteria
The feature must let the owner understand:
1. Expected cash position during the next 14 days.
2. Conservative and optimistic alternatives.
3. Confidence in the result and why.
4. First projected shortfall date/amount, if any.
5. Which customer to collect from first.
6. Which payment to prioritize or negotiate.
7. Whether an alert is necessary.
