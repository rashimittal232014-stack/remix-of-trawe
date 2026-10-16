# Wire Super Admin controls to every client workspace

## Goal
Make Super Admin suspension, plan switches, limits, domains, billing, and WhatsApp fleet controls reliably affect what clients can use and see.

## Implementation

### 1. Complete suspension enforcement
- Add one shared server-side workspace guard and apply it to all authenticated business actions, including itineraries, invoices, payments, bookings/packages, wallet, automations, WhatsApp, reports, settings, uploads, and remaining CRM utilities.
- Keep only subscription details, support requests, profile/password access, and sign-out available while suspended.
- Strengthen the existing full-screen hold notice so suspended users cannot continue through background requests or direct action calls.

### 2. Make plan switches functional
- **White label:** block tenant branding/domain mutations when disabled; hide or lock branding controls and domain details with a clear plan message.
- **API access:** check the tenant entitlement inside every MCP/API tool before reading or creating data.
- **WhatsApp Cloud:** block the external/Cloud provider configuration, testing, and sending paths when disabled while preserving TraWe WhatsApp where available.
- Also enforce existing advanced-report and campaign switches consistently in both navigation/UI and server actions.

### 3. Accurate usage metering
- Route all AI-producing features through a shared metered guard so itinerary generation/editing, live flight search, AI summaries/forecasting, and other provider calls increment `ai_calls` exactly once per request.
- Add tenant-safe storage usage synchronization based on actual files in the workspace’s storage folders, expose the real MB value on Subscription, and reject new uploads that exceed the configured limit.
- Update the existing upload controls to use the checked upload path instead of unmetered direct uploads.

### 4. Client visibility
- Add custom-domain status to the client Subscription page, including hostname, DNS verification record, latest check time, connection state, SSL state, and any actionable error. Keep domain creation/removal under Super Admin control.
- Add a dedicated subscription-invoices table with invoice number, issue/due dates, status, amount/tax/total, and download link when present.
- Add WhatsApp safety information to the WhatsApp screen/settings: configured and effective hourly/daily caps, current usage, quiet hours, warm-up day/stage/progress, and next limit increase.

### 5. Data and security
- Add only the minimal database helper/index changes needed for accurate storage/usage accounting and tenant-safe reads.
- Preserve tenant isolation, validate every privileged operation server-side, and avoid exposing provider secrets or cross-workspace records.

## Validation
- Run focused tests for active, suspended, feature-enabled, and feature-disabled workspaces.
- Verify AI and storage counters change correctly and stop at limits.
- Verify domains, invoices, and WhatsApp safety details render for the correct workspace on desktop and mobile.
- Run the project type check, inspect the latest build result, and browser-test the affected signed-in pages before completion.
