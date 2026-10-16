# TraWe WhatsApp — our own QR-based WhatsApp API

## What you asked for

In Settings, each agency picks one of two WhatsApp engines:

1. **WasenderAPI** — the paid service in use today (unchanged).
2. **TraWe WhatsApp** — our own service, QR-scan based, working the same way, with no per-agency subscription to an outside provider.

## Honest note before we build

TraWe WhatsApp connects to WhatsApp the same way WhatsApp Web does: the agency scans a QR code with their phone and their normal number starts sending. That is exactly what Wasender does under the hood, so we can match its behaviour and remove the subscription.

What no provider can promise — including Wasender — is immunity from bans. WhatsApp bans on behaviour, not on the tool. We will make TraWe WhatsApp behave as human-like as possible (details below) and block the patterns that actually get numbers banned. Bulk marketing blasts and OTP will stay unsupported on this engine.

Cost: no provider fee, but TraWe pays for a small always-on server that keeps each agency's session alive.

## How it works

```text
Agency dashboard (Settings > WhatsApp)
   |  choose engine: Wasender  |  TraWe WhatsApp
   v
TraWe WhatsApp service (always-on, one private session per agency)
   |  QR scan from the agency's own phone
   v
WhatsApp
   |  incoming messages + delivery updates
   v
Existing TraWe inbox, queries, itinerary sharing, automations
```

## Anti-ban behaviour (built in, not optional)

- Presence that mirrors a real person: online marker, "typing…" for a realistic duration before each message, read receipts on incoming chats.
- Randomised human delays between messages, never a fixed interval.
- Per-hour and per-day send caps, with a slow warm-up for a newly connected number over the first weeks.
- New/unknown numbers rate-limited harder than existing conversations; replies to inbound chats prioritised over cold outreach.
- Cold bulk campaigns blocked on this engine — they are routed to Wasender or the official Meta path instead.
- No duplicate message text sent to many numbers; near-identical bodies are flagged and spun or blocked.
- Night-hours quiet window per agency timezone.
- Stable single session per number, proper device name, no rapid connect/disconnect loops, no simultaneous logins.
- Automatic pause and alert when WhatsApp signals blocks, spam reports, or repeated failures.

None of this is a guarantee — it is the set of behaviours that keeps numbers healthy in practice.

## Build phases

### 1. Engine selector in Settings
Settings gets a WhatsApp engine choice: **WasenderAPI** or **TraWe WhatsApp**. Existing Wasender fields stay under the first option. Everything downstream (inbox replies, itinerary sharing, invoices, automations, the `wa.me` fallback) goes through one internal sending layer that routes to whichever engine is selected — so no feature has to be rebuilt.

### 2. TraWe WhatsApp service
An always-on service that holds one isolated, encrypted WhatsApp session per agency. It exposes only internal, authenticated endpoints: start session, fetch QR, send message, session status, logout, delete. Session data never reaches the browser.

### 3. Connection panel
Under TraWe WhatsApp the agency sees: Connect button → QR code with a live countdown and refresh → status turning Connecting → Connected, showing the connected number and last-seen time. Plus Reconnect, Log out, and Remove, each confirmed. Health feeds the Connected/Disconnected badge already in the WhatsApp inbox.

### 4. Sending, inbox and safety rails
Outgoing messages queue through the pacing and cap rules above; incoming messages and delivery statuses land in the existing inbox tables so conversations, automation logs and itinerary sends look identical no matter which engine is chosen. Campaign sends refuse the TraWe WhatsApp engine with a clear explanation.

### 5. Reliability
Auto-reconnect with backoff, session restore after a service restart, duplicate-event protection, retry limits, heartbeat monitoring, and a Super Admin view of every agency's connection health, queue depth and disconnect history.

## What you get at the end

- Two engines in Settings, switchable per agency, defaulting to whatever they use today.
- QR onboarding that feels like WhatsApp Web.
- No Wasender subscription for agencies on TraWe WhatsApp.
- The same inbox, automations and itinerary sharing as today.

## Before we start building

TraWe WhatsApp needs one always-on server that stays running and keeps encrypted session files. It cannot live inside the current app's hosting, which starts and stops on demand. I need to know where that server should run and who pays for it before phase 2.
