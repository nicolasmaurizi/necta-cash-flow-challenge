# AI Usage

## Workflow
AI was used as an implementation assistant after the product and architectural
decisions were defined in OpenSpec. The workflow intentionally separated
analysis from implementation so that AI-generated assumptions could be reviewed
and corrected before being introduced into the codebase.

## Prompt 1 — OpenSpec Analysis
### Purpose
Analyze the specification before writing code.

### Prompt
You are working on a technical challenge repository for an existing product called Necta.

Before making any code changes, perform a repository and specification analysis only.

## Context

This repository contains the OpenSpec definition for a new MVP feature: "14-Day Cash Flow Forecast".

The feature must be treated as an incremental addition to an already existing and functional Necta product, NOT as a greenfield application.

The real Necta source code is not provided as part of this challenge. Therefore, do not invent or scaffold unrelated infrastructure simply to simulate the entire product.

The source of truth for the feature is located at:

openspec/changes/cash-flow-14-days/

Read completely:

- proposal.md
- design.md
- tasks.md
- specs/cash-flow-forecast/spec.md

Also inspect:

- docs/architecture.png
- the complete current repository structure

## Goal of this step

Do NOT implement anything yet.

Analyze the specification and determine the best focused partial implementation for the technical challenge.

Our intended direction is a backend vertical slice centered on:

1. deterministic CashFlowForecastEngine business logic;
2. one forecast HTTP endpoint;
3. automated business-logic tests using the Carmen / Limpia Ya case;
4. minimal adapters or fixtures only where the real Necta repository is unavailable.

The implementation should demonstrate the most important architectural and business decisions from the OpenSpec without attempting to rebuild Necta.

## Analysis requirements

Evaluate:

- what can be implemented faithfully with the information available;
- which parts should be represented as interfaces/adapters because the real Necta services are unavailable;
- the minimum domain model required;
- the proposed CashFlowForecastEngine responsibilities;
- how receivables, future cash sales, confirmed outflows, recurring expenses, installments, and estimated future expenses should enter the calculation;
- how the three scenarios should be calculated deterministically;
- how confidence should remain separate from scenario outcome;
- how actionable collection/payment recommendations should be represented;
- how the endpoint should expose the result;
- what should and should not be included in the partial implementation;
- how to test the supplied Carmen / Limpia Ya case meaningfully.

Pay special attention to avoiding assumptions that are not supported by the OpenSpec.

If an exact production behavior cannot be known because the real Necta repository is unavailable, identify it explicitly as an assumption or integration boundary instead of inventing production infrastructure.

## Important constraints

- Do not modify any files.
- Do not generate implementation code.
- Do not initialize a new application yet.
- Do not add dependencies.
- Do not redesign the OpenSpec.
- Do not move business logic into the UI.
- Do not use an LLM for financial calculations.
- Do not expand the scope into Smart Purchasing, cross-business benchmarking, or ML forecasting.
- Prefer deterministic, explainable logic.
- Keep the implementation intentionally small enough to represent a partial technical-challenge implementation, not a production-complete feature.

## Expected output

Return an implementation plan containing:

1. Repository assessment.
2. Proposed vertical slice.
3. Proposed file/folder structure.
4. Domain types/interfaces required.
5. Forecast calculation flow.
6. Deterministic scenario strategy.
7. Confidence strategy.
8. Recommendation-priority strategy.
9. HTTP endpoint contract.
10. Test strategy using the Carmen / Limpia Ya data.
11. Explicit assumptions/integration boundaries.
12. Items intentionally excluded.
13. Estimated implementation complexity.

Finally, identify any contradictions, underspecified decisions, or risks in the current OpenSpec that should be resolved BEFORE implementation.

Do not make changes until I explicitly approve the plan.

### Human Decision
We reviewed the proposal and explicitly defined the missing
MVP heuristics before allowing implementation.

---

## Prompt 2 — Vertical Slice Implementation
### Purpose
Implement the approved partial backend solution.

### Prompt
Proceed with the implementation.

You already analyzed this repository and the OpenSpec under:

openspec/changes/cash-flow-14-days/

Treat those files as the source of truth.

This is a technical-challenge partial implementation of a NEW MVP FEATURE for an already existing and functional Necta product.

The real Necta repository is NOT available.

Do not attempt to rebuild Necta.

Your goal is to implement a small, technically credible backend vertical slice that demonstrates the core business logic of the "14-Day Cash Flow Forecast".

# 1. Implementation scope

Implement:

1. A deterministic CashFlowForecastEngine.
2. Minimal domain types required by that engine.
3. Minimal ports/interfaces representing unavailable Necta services.
4. Fixture/in-memory adapters only where necessary.
5. One HTTP endpoint:
   GET /v2/cash-flow/forecast?days=14
6. Automated business-logic tests.
7. At least one meaningful test using the Carmen / Limpia Ya challenge case.
8. A minimal README explaining how to install, run, test, and understand the partial implementation.

Do NOT implement:

- authentication;
- MongoDB;
- production persistence;
- API gateway;
- full bank reconciliation CRUD;
- full recurring-expense CRUD;
- scheduled jobs;
- notification delivery;
- React Native UI;
- React web UI;
- offline synchronization;
- LLM providers;
- Smart Purchasing;
- cross-business benchmarking;
- ML forecasting;
- deployment infrastructure.

Those capabilities may appear in OpenSpec because it describes the full feature, but they are outside this partial implementation.

# 2. Technology

Use Node.js + TypeScript because the supplied Necta architecture states that the existing backend is Node.js.

Keep dependencies minimal.

Prefer business logic that is framework-independent.

Use a very small HTTP layer around the engine.

Use a lightweight test setup appropriate for TypeScript.

Do not introduce unnecessary frameworks, ORMs, databases, containers, or infrastructure.

Before adding a dependency, verify that it is actually necessary.

# 3. Repository structure

Create the implementation directly at repository root using a conventional structure such as:

src/
  domain/
    forecast/
  ports/
  adapters/
    fixtures/
  http/

tests/

Do NOT create an artificial `implementation/` wrapper directory.

Preserve:

docs/
openspec/

Do not modify the architecture image.

You may make small OpenSpec corrections only if implementation exposes a genuine contradiction. Do not silently redesign the specification.

# 4. Challenge fixture: Carmen / Limpia Ya

Use the following facts from the supplied technical challenge as the basis of the main fixture.

Business:

- Owner: Carmen Ortiz
- Business: Limpia Ya
- Location: Barranquilla
- Currency: COP
- 18 neighborhood stores + 2 hotels as customers
- 3 suppliers
- Only approximately 20-30% of real inflows/outflows are currently entered into Necta

Starting balance:

- Stored cash/bank balance: COP 1,900,000
- Reconstructed balance from registered movements: COP 1,640,000
- Difference: COP 260,000

The fixture should preserve this discrepancy.

Do NOT assume that reconstructed balance is automatically more accurate.

For the deterministic test fixture, represent the current actual balance as manually confirmed at COP 1,900,000 when testing the reconciled case.

Also test the unresolved discrepancy case separately and verify that confidence decreases.

Receivables:

1. Hotel Brisas
   - pending: COP 2,100,000
   - due: Thursday 28
   - historical on-time payments: 6/6

2. Minimercado Sol
   - pending: COP 1,200,000
   - overdue by 20 days
   - historical on-time payments: 1/4
   - average delay: 18 days

3. Tienda La Esquina
   - pending: COP 850,000
   - due: Tuesday 26
   - historical on-time payments: 2/5
   - average delay: 12 days

4. Tienda Doña Fina
   - pending: COP 600,000
   - due: Friday 29
   - historical on-time payments: 4/4

5. Other 9 stores
   - total pending: COP 850,000
   - due during the following two weeks
   - historical on-time payments: 22/31

If exact individual dates for those 9 stores are unavailable, represent them explicitly as aggregated/fixture data rather than inventing nine fake customers with unsupported details.

Known obligations:

1. Main supplier
   - COP 4,200,000
   - due Friday 29
   - already represented in Necta as a payable

2. Two helpers
   - COP 1,400,000
   - every fortnight on days 15 and 30
   - not currently represented as recurring expenses

3. Warehouse rent
   - COP 1,300,000
   - due on day 1 of each month
   - not currently represented as recurring expense

4. Loan installment
   - COP 650,000
   - due on day 10
   - loan exists in Necta but future installments are not automatically generated

Cash sales:

- approximately COP 260,000/day Monday-Thursday
- approximately COP 520,000/day Friday-Saturday
- closed Sunday
- approximately +30% during fortnight/pay-period weeks

Cash operating expenses:

- approximately COP 90,000/day for transport/bags

Use these as fixture-level historical/behavioral inputs.

Do not hard-code Carmen-specific values inside generic engine logic.

# 5. Forecast calendar

The supplied case uses Monday 25 as the starting context.

For the Carmen fixture, use a deterministic synthetic calendar where:

- day 25 = Monday
- day 26 = Tuesday
- day 28 = Thursday
- day 29 = Friday
- day 30 = Saturday
- day 1 = the following month's day 1
- day 10 = the following month's day 10

Choose a concrete synthetic year/month combination that preserves those weekday relationships if possible.

If no convenient real calendar is needed, model fixture dates explicitly and document that they represent the challenge timeline.

Do NOT silently reinterpret the challenge dates using today's date.

Forecast date boundaries must be explicit.

For this implementation:

- `asOfDate` is included as the starting date;
- the forecast contains exactly `days` calendar days;
- default `days = 14`;
- support only `1..30` days;
- use one explicit fixture timezone;
- date calculations must be deterministic and timezone-safe.

# 6. Monetary representation

Do NOT use floating-point arithmetic for COP monetary amounts.

Represent COP amounts as integer pesos.

All engine calculations must produce deterministic integer monetary values.

When probability-weighting amounts, define and consistently apply an explicit rounding rule.

Document that rule.

# 7. Receivable collection model

The OpenSpec intentionally requires a deterministic and explainable MVP, not ML.

Implement a simple collection-likelihood model.

Use historical on-time ratio as the primary signal.

Recommended base:

onTimeRate = onTimePayments / totalHistoricalPayments

Then apply a deterministic lateness adjustment when averageDaysLate is available.

Keep the model intentionally simple and document the exact formula in code.

Requirements:

- 6/6 on-time must rank as more collectible than 1/4 on-time.
- 4/4 on-time must rank as highly collectible.
- historical lateness must reduce probability of collection within the relevant window.
- probability must always remain within [0, 1].
- no LLM.
- no ML.

Do not pretend this formula is a production-trained probability model.

Name/document it as an MVP heuristic.

For expected collection timing:

- reliable receivables should be placed near their due date;
- historically late receivables may be shifted using average lateness;
- if their estimated collection date falls outside the forecast horizon, they should not contribute expected cash inside the horizon.

Keep this behavior deterministic.

# 8. Future cash sales

Implement a transparent estimator.

For the Carmen fixture it must reproduce the supplied behavioral pattern:

- Mon-Thu baseline: COP 260,000
- Fri-Sat baseline: COP 520,000
- Sunday: COP 0
- pay-period uplift: +30%

The generic engine must receive historical/profile information through inputs or ports.

Do not encode Carmen's amounts in the estimator itself.

The estimator should be structurally capable of using:

- comparable weekday baseline;
- pay-period multiplier;
- recent trend multiplier.

For the challenge fixture, recent trend may be neutral (1.0) if no trend data is supplied.

# 9. Estimated variable expenses

The challenge states approximately COP 90,000/day in cash operating expenses for transport/bags.

Represent this as an estimated variable outflow.

It must remain classified as `estimated`, never `confirmed`.

Use the supplied fixture value rather than inventing additional historical expense categories.

# 10. Scenario model

Use explicit challenge-level configuration.

Apply scenario adjustments ONLY to uncertain components:

- expected receivable collections;
- estimated cash sales;
- estimated variable expenses.

Do NOT multiply:

- confirmed payables;
- recurring obligations;
- known installments.

Use these default MVP scenario factors unless implementation reveals a strong reason not to:

Expected:
- uncertain inflows: 1.00
- estimated variable outflows: 1.00

Conservative:
- uncertain inflows: 0.80
- estimated variable outflows: 1.20

Optimistic:
- uncertain inflows: 1.10
- estimated variable outflows: 0.90

Clamp/round monetary results deterministically.

These are challenge assumptions, NOT production-calibrated financial parameters.

Put them in configuration/constants rather than scattering magic numbers through the engine.

Verify invariants:

conservative ending balance <= expected ending balance <= optimistic ending balance

and:

conservative uncertain inflows <= expected <= optimistic

conservative estimated outflows >= expected >= optimistic

# 11. Starting balance rule

Use this deterministic rule:

1. If `confirmedBalance` exists, use it.
2. Otherwise use `storedBalance` as the provisional starting balance.
3. Compare stored vs reconstructed balance.
4. If the absolute difference exceeds the material threshold, expose the discrepancy and reduce confidence.
5. Never silently replace stored balance with reconstructed balance.

For this challenge implementation use a material discrepancy threshold defined as:

max(COP 100,000, 5% of stored balance)

Make this policy explicit and configurable.

For Carmen:

stored = 1,900,000
reconstructed = 1,640,000
delta = 260,000

Therefore the discrepancy is material.

# 12. Confidence model

Implement a simple deterministic score, separate from forecast outcome.

Start at 100.

Suggested deductions:

- unresolved material starting-balance discrepancy: -35
- transaction coverage below 50%: -25
- insufficient sales history: -15
- low receivable-history coverage: -10
- high estimated-flow share: -10
- stale source data: -10

Do not deduct for a condition when the fixture/data cannot establish that condition.

Map:

- high: score >= 80
- medium: score >= 50 and < 80
- low: score < 50

Return:

- level
- numeric score
- reason codes

For Carmen, the known 20-30% transaction coverage must be represented as a confidence limitation.

A reconciled balance may improve confidence but must not erase the incomplete-transaction-coverage limitation.

# 13. Recommendations

Recommendations must remain deterministic.

Collection priority should consider:

1. expected collectible amount;
2. probability of collection in time;
3. due/overdue state;
4. whether collection occurs before the first expected shortfall.

Return a numeric score plus reason codes.

Payment priority should consider:

1. due date;
2. amount;
3. proximity to projected shortfall;
4. non-payment impact if provided;
5. supplier criticality only if provided.

Do not invent supplier/product/margin relationships for the Carmen fixture.

Use deterministic tie-breaking, for example:

1. priority score descending;
2. due date ascending;
3. stable ID ascending.

Document the scoring formula.

The exact score has no business meaning outside ranking; it is an explainable MVP heuristic.

# 14. Double-counting protection

A financial obligation must not be included twice.

Use a stable source/obligation identifier and classification.

A payable already representing an obligation must not also be added as an installment or recurring occurrence for the same obligation/date.

Add at least one test protecting this invariant.

# 15. Endpoint

Implement:

GET /v2/cash-flow/forecast?days=14

Because production authentication/store context is unavailable, use a clearly documented fixture-backed store context.

Do not invent a production authentication mechanism.

The route must be thin.

All financial logic belongs in the engine/domain layer.

Return at least:

- period/asOfDate/days/currency
- starting balance details
- daily forecast points
- three scenarios
- first expected shortfall
- inflow totals
- outflow totals by classification
- confidence level/score/reasons
- collection actions
- payment actions
- generatedAt/calculation metadata

`firstExpectedShortfall` means the first negative balance in the EXPECTED scenario.

Other scenarios may expose their own first shortfall separately.

# 16. Tests

Tests are more important than framework sophistication.

At minimum verify:

1. confirmed balance is used when available;
2. unresolved Carmen balance discrepancy lowers confidence;
3. 6/6 payer has greater collection likelihood than 1/4 payer;
4. historical lateness affects expected collection timing/probability;
5. Sunday cash sales are zero;
6. pay-period uplift is applied correctly;
7. COP 90,000 daily operating cost remains `estimated`;
8. main supplier COP 4.2M appears exactly once;
9. payroll recurrence is included when its occurrence falls in the horizon;
10. rent recurrence is included when its occurrence falls in the horizon;
11. installment is classified separately;
12. confirmed obligations are not scenario-multiplied;
13. scenario ordering invariants hold;
14. confidence is independent from ending-balance sign;
15. collection recommendation ranking is deterministic;
16. payment ranking is deterministic;
17. duplicate obligation protection works;
18. HTTP endpoint returns the engine result shape.

Also add one readable integration/business test around the Carmen / Limpia Ya fixture that demonstrates the 14-day forecast behavior.

Do not force a predetermined final balance if it does not logically follow from the documented heuristic.

The test should verify explainable invariants and calculated outputs instead of reverse-engineering a desired answer.

# 17. README

Create a concise README.md containing:

- challenge purpose;
- architecture/approach;
- relationship with OpenSpec;
- what was implemented;
- what intentionally remains outside the partial implementation;
- assumptions;
- deterministic financial rules;
- how to install;
- how to run;
- how to test;
- endpoint example;
- repository structure.

Make it clear that this is a partial implementation of an MVP feature for an existing product, not a recreation of Necta.

# 18. Code quality

Prioritize:

- readability;
- explicit business rules;
- deterministic behavior;
- small functions;
- meaningful names;
- strong TypeScript types;
- no `any` unless unavoidable and justified;
- no dead code;
- no speculative abstractions;
- no unnecessary dependencies.

Comments should explain business decisions, not obvious syntax.

# 19. Validation

After implementation:

1. install dependencies;
2. run formatting if configured;
3. run type checking;
4. run all tests;
5. run build;
6. run the endpoint locally if practical;
7. inspect `git diff`;
8. verify that OpenSpec and docs were not accidentally removed or rewritten.

Fix failures before finishing.

Do NOT commit or push changes.

# 20. Final response

When complete, report:

1. files created/modified;
2. implementation architecture;
3. exact deterministic formulas/assumptions used;
4. Carmen fixture interpretation;
5. test results;
6. build/typecheck results;
7. endpoint example;
8. known limitations/integration boundaries;
9. any OpenSpec issue discovered during implementation;
10. whether you recommend any change before this is committed as the challenge implementation.

Do not expand scope beyond this prompt.

### Human Review / Corrections
[Lo completamos después de nuestra revisión.]