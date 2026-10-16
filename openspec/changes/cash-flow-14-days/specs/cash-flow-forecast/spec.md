# Capability: 14-Day Cash Flow Forecast

## Requirement: Rolling 14-Day Forecast
The system SHALL provide a rolling 14-day cash-flow forecast for a store using the store's own available financial data.

### Scenario: User requests the forecast
**WHEN** an authenticated user requests the forecast for an authorized store  
**THEN** the system SHALL return the configured 14-day window  
**AND** conservative, expected, and optimistic scenarios  
**AND** a confidence level with reasons.

### Scenario: Shared client contract
**WHEN** React Native or React requests the forecast  
**THEN** both SHALL consume the same backend forecast contract  
**AND** neither SHALL independently calculate authoritative financial results.

## Requirement: Starting Balance Integrity
The system SHALL identify a material difference between stored and reconstructed balances before treating the starting balance as high-confidence.

### Scenario: Material balance discrepancy
**WHEN** stored and reconstructed balances differ beyond the configured threshold  
**THEN** the system SHALL expose the discrepancy  
**AND** allow/request reconciliation  
**AND** reduce forecast confidence until resolved.

### Scenario: User reconciles balance
**WHEN** the user confirms the actual current balance  
**THEN** the system SHALL persist an auditable reconciliation  
**AND** use the confirmed balance as forecast starting balance.

## Requirement: Receivable Estimation
The system SHALL NOT treat every outstanding receivable as guaranteed cash.

### Scenario: Reliable payer
**WHEN** a receivable is due within the horizon  
**AND** the customer has strong on-time history  
**THEN** the expected scenario SHALL assign higher collection likelihood than an equivalent receivable from an unreliable payer.

### Scenario: Usually-late payer
**WHEN** a customer frequently pays late or beyond the horizon  
**THEN** the expected scenario SHALL reduce the amount/probability attributed to that receivable  
**AND** the conservative scenario SHALL be at least as cautious.

## Requirement: Future Cash-Sale Estimation
The system SHALL estimate future cash sales from the store's own history using transparent rule-based/statistical logic.

### Scenario: Weekday pattern
**WHEN** sufficient history exists  
**THEN** the estimate SHALL consider comparable weekdays and recent trend.

### Scenario: Pay-period effect
**WHEN** history indicates a repeatable pay-period/quincena effect  
**THEN** the estimate SHALL apply that effect deterministically to comparable dates.

### Scenario: Closed day
**WHEN** the business is normally closed on a forecast date  
**THEN** expected cash sales SHALL be zero unless explicit future activity indicates otherwise.

## Requirement: Future Outflows
The system SHALL include known and reasonably estimated future outflows.

### Scenario: Payable inside window
**WHEN** a payable is due within the horizon  
**THEN** its pending amount SHALL be included as a confirmed outflow.

### Scenario: Installment inside window
**WHEN** a known obligation implies an installment inside the horizon  
**THEN** it SHALL be included as an installment outflow.

### Scenario: Recurring expense due
**WHEN** an active recurrence produces an occurrence inside the horizon  
**THEN** it SHALL be included as a recurring outflow.

### Scenario: Non-committed future purchases
**WHEN** history indicates likely purchases/variable expenses not yet represented as payables  
**THEN** the expected forecast SHALL include a separate estimated-outflow component  
**AND** SHALL NOT present it as a confirmed obligation.

## Requirement: Forecast Scenarios
The system SHALL express uncertainty through conservative, expected, and optimistic scenarios.

### Scenario: Expected
**WHEN** the forecast is calculated  
**THEN** expected SHALL use the engine's best deterministic estimates.

### Scenario: Conservative
**WHEN** the forecast is calculated  
**THEN** conservative SHALL assume no more favorable inflows and no lower variable outflows than expected.

### Scenario: Optimistic
**WHEN** the forecast is calculated  
**THEN** optimistic SHALL assume no less favorable inflows and no higher variable outflows than expected.

### Scenario: Testable parameters
**WHEN** multipliers, quantiles, or thresholds are used  
**THEN** they SHALL be explicit and covered by tests.

## Requirement: Confidence
The system SHALL return confidence independently from scenario outcome.

### Scenario: Positive result with weak data
**WHEN** expected ending balance is positive  
**AND** important source data is incomplete or starting balance unresolved  
**THEN** confidence MAY be low  
**AND** deterministic reason codes SHALL explain why.

## Requirement: Actionable Recommendations
The system SHALL produce deterministic collection/payment priorities when action can improve the forecast.

### Scenario: Collection can reduce shortfall
**WHEN** a shortfall exists and receivables could materially reduce it  
**THEN** rank collection actions by cash impact, collection likelihood, due status, and shortfall urgency  
**AND** return reason codes.

### Scenario: Payments compete for cash
**WHEN** multiple obligations compete for insufficient cash  
**THEN** rank payment/negotiation actions by due date, amount, non-payment impact, and supported supplier criticality  
**AND** do not invent supplier-margin relationships absent from source data.

## Requirement: Optional Natural-Language Explanation
The system MAY use an LLM to explain an already-calculated forecast.

### Scenario: Explanation requested
**WHEN** explanation is requested  
**THEN** the LLM SHALL receive structured forecast results and reason codes  
**AND** SHALL NOT calculate/change amounts, confidence, or priority.

### Scenario: LLM unavailable
**WHEN** the provider fails, times out, or returns invalid output  
**THEN** deterministic forecast/actions SHALL remain available  
**AND** use a deterministic/template explanation.

## Requirement: Daily and Event-Driven Recalculation
The system SHALL keep the rolling forecast current without notification fatigue.

### Scenario: Daily job
**WHEN** the scheduled job runs  
**THEN** recalculate the rolling 14-day forecast for eligible stores.

### Scenario: Relevant event
**WHEN** a relevant payment, purchase, expense, payable change, recurring-expense change, or reconciliation occurs  
**THEN** recalculate or invalidate the affected forecast.

## Requirement: Risk Notifications
The system SHALL notify only when forecast risk requires action.

### Scenario: New shortfall
**WHEN** recalculation detects a new actionable shortfall  
**THEN** create a risk alert and send it through an available configured channel.

### Scenario: Unchanged risk
**WHEN** the same material shortfall was already notified and has not materially worsened  
**THEN** do not resend solely because another daily calculation occurred.

### Scenario: Push unavailable
**WHEN** push is unavailable/not permitted  
**THEN** fall back to email when available.

### Scenario: WhatsApp
**WHEN** WhatsApp is selected for a business-initiated alert  
**THEN** use it only when required approved template/configuration exists.

## Requirement: Mobile Offline Capture
The mobile app SHALL support durable offline capture for supported writes without duplicates after synchronization.

### Scenario: Record offline
**WHEN** the device has no connection  
**THEN** persist the operation locally with a stable mutation identifier  
**AND** show pending synchronization.

### Scenario: Connectivity returns
**WHEN** connectivity returns  
**THEN** submit queued operations through existing contracts  
**AND** reuse existing idempotency semantics.

### Scenario: Conflict
**WHEN** synchronization returns a conflict such as HTTP 409  
**THEN** retain enough local state to resolve it  
**AND** do not silently discard or duplicate the operation.

### Scenario: Forecast viewed offline
**WHEN** offline and a downloaded forecast exists  
**THEN** the app MAY display it with its generation timestamp  
**AND** SHALL NOT claim it is newly recalculated.

## Requirement: Store Data Isolation
The MVP forecast SHALL use only the current store/business data.

### Scenario: Forecast calculation
**WHEN** a store forecast is generated  
**THEN** other businesses' data SHALL NOT be used as forecast input.

### Scenario: Future benchmarking
**WHEN** future benchmarking uses cross-business information  
**THEN** it SHALL be separate from the MVP  
**AND** require appropriate consent, aggregation, anonymization, and privacy controls.

## Requirement: Smart Purchasing Is Deferred
Smart Purchasing SHALL remain outside the MVP.

### Scenario: Future purchase simulation
**WHEN** future product work adds Smart Purchasing  
**THEN** it SHOULD compare the forecast before and after a proposed purchase  
**AND** warn when the purchase creates or worsens a shortfall.
