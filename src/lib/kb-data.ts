// Knowledge base content for /docs/:slug and /guides/:slug

export type KbArticle = {
  slug: string;
  title: string;
  category: string;
  time: string;
  summary: string;
  body: { h?: string; p: string }[];
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const RAW_DOCS: { category: string; articles: { title: string; body: { h?: string; p: string }[] }[] }[] = [
  { category: "Getting started", articles: [
    { title: "Create your agency in under 5 minutes", body: [
      { p: "Signing up on TraWe creates your workspace, your first Owner user, and a blank pipeline ready for leads. The whole process takes under five minutes and does not require a card." },
      { h: "Step 1 — Sign up", p: "Head to app.trawe.in/auth, pick a strong password, and confirm your email. TraWe provisions your tenant and routes you to the onboarding wizard." },
      { h: "Step 2 — Agency profile", p: "Add your legal name, brand name, GSTIN, PAN, city, and default currency (INR). This information appears on every quotation, invoice and portal page." },
      { h: "Step 3 — Branding", p: "Upload your logo (square PNG works best) and set your primary brand colour. PDFs and the customer portal use these instantly." },
      { h: "Step 4 — First lead", p: "Create a demo lead from the Dashboard or import your Excel to see the pipeline populate. You are ready to invite your team." },
    ]},
    { title: "Invite your team and assign roles", body: [
      { p: "TraWe supports Owner, Manager, Agent, Accounts and Ops roles out of the box. Every action is audited and RLS keeps tenants strictly isolated." },
      { h: "Sending invites", p: "Settings → Team → Invite. Enter the teammate's email and pick a role. They receive a branded email with a one-click join link that expires in 7 days." },
      { h: "Choosing a role", p: "Agents see only leads assigned to them. Managers see the full pipeline. Accounts sees invoices, payments and supplier bills. Ops sees departures and driver assignments." },
      { h: "Seat limits", p: "Starter includes 3 seats, Pro includes 10, Business is unlimited. Add-on seats can be purchased any time from Billing." },
    ]},
    { title: "Configure GSTIN, PAN and invoice numbering", body: [
      { p: "Getting your tax profile right up-front prevents a lot of paperwork later. TraWe validates GSTIN format and derives your state of supply automatically." },
      { h: "GSTIN and PAN", p: "Settings → Agency → Tax. Enter your 15-character GSTIN — the state code is extracted and used for CGST/SGST vs IGST decisions on every invoice." },
      { h: "Numbering scheme", p: "Pick a prefix (e.g. TRW/2026-27/) and reset frequency (financial year by default in India). TraWe assigns sequential numbers without gaps." },
      { h: "SAC and HSN", p: "SAC 998552 is the default for tour operator services. You can override per line item on any invoice." },
    ]},
    { title: "Upload your logo and brand colours", body: [
      { p: "TraWe uses your logo and primary colour on quotations, invoices, vouchers, the customer portal and every transactional email." },
      { h: "Logo requirements", p: "PNG with transparent background, at least 512x512, under 500 KB. Landscape logos also work — TraWe keeps aspect ratio." },
      { h: "Colours", p: "Pick a single primary brand colour. Accessible foreground text colours are derived automatically to keep PDFs and emails readable." },
    ]},
    { title: "Import your existing leads from Excel", body: [
      { p: "Bring your history along. TraWe accepts CSV or XLSX with a flexible column mapping — you do not need to reshape your sheet." },
      { h: "Preparing the file", p: "Include at minimum: name, phone, destination, source, stage. Extra columns are stored as custom attributes." },
      { h: "Running the import", p: "Leads → Import. Upload the file, confirm the column mapping preview, and TraWe queues the rows. Duplicate detection uses phone + destination." },
    ]},
  ]},
  { category: "Leads & pipeline", articles: [
    { title: "Anatomy of a lead", body: [
      { p: "Every lead in TraWe carries a traveller profile, activity timeline, attached documents, quotations, bookings and payments — everything you need on one screen." },
      { h: "The header", p: "Name, destination, pax, budget, source and assigned agent. Editing here updates the pipeline card in real time." },
      { h: "Activities", p: "Calls, WhatsApp, emails and notes appear in reverse chronological order. Every event is timestamped and attributed to a user." },
      { h: "Documents", p: "Quotations, itineraries, vouchers and traveller documents (passport, visa) are attached to the lead so nothing gets lost between apps." },
    ]},
    { title: "Kanban vs table view", body: [
      { p: "Kanban is best for daily standups — you see the shape of the pipeline. Table view is better for weekly reviews, filtering and bulk operations." },
      { h: "Switching", p: "Toggle between views from the top-right of the Leads screen. Filters, saved views and search work in both." },
      { h: "Bulk actions", p: "In table view, select rows to bulk-assign, tag or move to a stage. Kanban supports drag-and-drop for single-row stage changes." },
    ]},
    { title: "Auto-assignment rules", body: [
      { p: "Never leave a fresh lead waiting because everyone assumed someone else would pick it up. TraWe assigns automatically the second a lead is created." },
      { h: "Round-robin", p: "Distributes leads evenly across a defined pool of agents. Off-duty agents can be excluded from the rotation." },
      { h: "Destination-based", p: "Route Bali to your Southeast Asia specialist and Ladakh to your Himalayan expert. Rules stack in priority order." },
    ]},
    { title: "Follow-up SLAs and overdue reminders", body: [
      { p: "Define an SLA per stage (e.g. respond to New leads in 30 minutes). Cards turn amber, then red, and pings arrive on WhatsApp." },
      { h: "Configuring", p: "Settings → Pipeline → SLAs. Set a target duration for each stage and choose who gets notified when it breaches." },
    ]},
    { title: "Merging duplicate leads", body: [
      { p: "TraWe auto-detects duplicates on phone number and destination. You can also merge manually from any lead detail page." },
      { h: "What survives", p: "Activities, files, quotations, invoices — everything is preserved. The oldest lead keeps its ID and the newer one's data is folded in." },
    ]},
  ]},
  { category: "Itineraries & templates", articles: [
    { title: "Building a day-by-day itinerary", body: [
      { p: "TraWe's itinerary builder gives you a canvas per day with hotels, activities, transfers, meals, inclusions and exclusions blocks." },
      { h: "Working the canvas", p: "Add days from the sidebar. Each day can hold multiple activity blocks. Drag to reorder." },
      { h: "Publishing", p: "Save as draft while you work. Publish when it is ready to share — the customer portal picks it up immediately." },
    ]},
    { title: "Reusable templates and instantiation", body: [
      { p: "Turn your best-selling packages into templates. New leads get a starting point in seconds instead of a blank page." },
      { h: "Creating a template", p: "Any itinerary can be saved as a template from the detail screen. Templates are workspace-wide by default." },
      { h: "Instantiating", p: "From a lead, pick Start from template, tweak dates, pax and any custom line items, and you are ready to quote." },
    ]},
    { title: "AI itinerary drafts — best prompts to use", body: [
      { p: "The AI copilot writes a first-draft itinerary you can refine, not a final one to send. Feed it constraints and it will honour them." },
      { h: "A good prompt", p: "5 nights in Ladakh for a 45-year-old couple, moderate pace, no altitude issues, mid-range hotels, from Delhi — produces a usable draft in one shot." },
      { h: "Refining", p: "Ask follow-ups: replace day 3 with monastery tour, add a rest day, shift Nubra to before Pangong." },
    ]},
    { title: "Attaching hotels from your rate book", body: [
      { p: "Every hotel you have stored under Masters → Hotels is one click away from any itinerary day. TraWe pulls rates, GST and inclusions automatically." },
    ]},
    { title: "Sharing an itinerary via the customer portal", body: [
      { p: "Every published itinerary generates a passwordless customer portal link. Travellers see days, hotels, inclusions, payment schedule, and can e-sign." },
    ]},
  ]},
  { category: "Hotels & rate cards", articles: [
    { title: "Adding hotels by country, state, area and pincode", body: [
      { p: "TraWe organises your hotel master by Country → State → Area → Pincode. Drop-downs cascade so you never have to type geography twice." },
      { h: "Adding a hotel", p: "Hotels → Add Hotel. Pick country and state from the cascading dropdowns. Enter area, pincode and a display name." },
    ]},
    { title: "Seasonal rate cards", body: [
      { p: "Rates change with season and meal plan. TraWe stores EP (room only), CP (breakfast), MAP (breakfast + dinner) and AP (all meals) separately per date range." },
    ]},
    { title: "Quick Quote calculator", body: [
      { p: "Given pax, nights, room type and meal plan, TraWe calculates hotel cost, applies your markup, and adds GST — all before you type anything into an invoice." },
    ]},
    { title: "Linking hotel line items to quotations", body: [
      { p: "Any hotel line becomes a quote line with one click. Updates to the master rate card do not retroactively change quoted rates — history is preserved." },
    ]},
  ]},
  { category: "Quotations & invoices", articles: [
    { title: "Versioning quotations without losing history", body: [
      { p: "Every edit to a shared quotation creates a new version. Old versions stay accessible so you can compare what changed for the traveller." },
    ]},
    { title: "Converting an approved quote into a booking", body: [
      { p: "One click promotes an approved quotation to a booking. Payment schedule, itinerary and traveller documents move over — nothing to retype." },
    ]},
    { title: "GST invoicing — CGST/SGST vs IGST", body: [
      { p: "TraWe compares your registered state to the customer's place of supply and splits taxes accordingly. Reverse charge scenarios are supported." },
    ]},
    { title: "Sequential invoice numbering per financial year", body: [
      { p: "Invoice numbers reset every 1 April with the prefix you configured. Gapless numbering is enforced at the database level." },
    ]},
    { title: "GSTR-1 CSV export", body: [
      { p: "Reports → GSTR-1. Pick a month, download the CSV in the exact format your CA expects, and upload it straight to the GST portal." },
    ]},
  ]},
  { category: "Payments & billing", articles: [
    { title: "Connecting Razorpay in Settings", body: [
      { p: "Paste your Razorpay Key ID and Secret in Settings → Payments. TraWe verifies the credentials and enables pay-links on every invoice." },
    ]},
    { title: "Sending a hosted pay link on any invoice", body: [
      { p: "Every invoice generates a Razorpay hosted checkout link. Share it on WhatsApp, email or via the customer portal." },
    ]},
    { title: "Auto-reconciliation via webhook", body: [
      { p: "Razorpay webhooks land on our public endpoint, are signature-verified, and mark the invoice paid. No manual reconciliation." },
    ]},
    { title: "Supplier bills and trip margin", body: [
      { p: "Log supplier bills against a booking to see live margin per trip. Roll-ups appear on the dashboard." },
    ]},
    { title: "Advance / mid-trip / balance schedules", body: [
      { p: "Split any invoice into a payment schedule — commonly 40/40/20. Reminders go out automatically on WhatsApp and email." },
    ]},
  ]},
  { category: "Communications", articles: [
    { title: "Connecting WhatsApp Cloud API (Meta)", body: [
      { p: "Settings → WhatsApp. Enter your WABA ID, Phone Number ID and permanent token. TraWe verifies against Meta and turns on the inbox." },
    ]},
    { title: "Approved templates: what and why", body: [
      { p: "WhatsApp only allows business-initiated messages via approved templates. TraWe ships with 10 patterns covering quotes, payment nudges and vouchers." },
    ]},
    { title: "Two-way inbox for team-shared replies", body: [
      { p: "Incoming WhatsApp lands in a shared inbox tied to the lead. Any teammate can reply — everyone sees the full thread." },
    ]},
    { title: "Sending from your own email domain", body: [
      { p: "Verify a subdomain (like send.youragency.com) with a DKIM record and TraWe sends transactional emails from your address." },
    ]},
  ]},
  { category: "Customer portal", articles: [
    { title: "How OTP login works for travellers", body: [
      { p: "Travellers enter their booking phone or email, receive a 6-digit OTP, and land on their personal trip tracker. No passwords." },
    ]},
    { title: "Sharing the trip tracker link", body: [
      { p: "Every booking has a unique portal link. Share it once — travellers can revisit any time via OTP." },
    ]},
    { title: "E-signature workflow on quotations", body: [
      { p: "Travellers sign on the portal with their finger or mouse. A signed PDF is stored and emailed to your agency and the customer." },
    ]},
    { title: "Customising portal branding", body: [
      { p: "The portal picks up your logo, colours and agency name automatically. Optionally set a custom hero image per booking." },
    ]},
  ]},
  { category: "AI copilot & automations", articles: [
    { title: "Ask my CRM — RAG search examples", body: [
      { p: "Ask questions like Show me all Bali leads above 1L pending payment — the copilot retrieves grounded results with pgvector." },
    ]},
    { title: "Draft itinerary prompts that actually work", body: [
      { p: "Constraints (pax, dates, budget, pace, must-see, must-avoid) matter more than adjectives. Be specific and the copilot will be too." },
    ]},
    { title: "Building your first automation rule", body: [
      { p: "Automations run on events (lead created, payment received, quote signed). Combine triggers with conditions and actions in the visual builder." },
    ]},
    { title: "Notification recipes for lead & payment events", body: [
      { p: "Ship-ready recipes: WhatsApp the assigned agent on new lead, ping Accounts on payment received, remind traveller 24h before check-in." },
    ]},
  ]},
  { category: "Admin & security", articles: [
    { title: "Role matrix", body: [
      { p: "Owner controls everything. Manager runs the pipeline. Agent works assigned leads. Accounts owns invoices and payments. Ops owns departures." },
    ]},
    { title: "Audit log — what gets recorded", body: [
      { p: "Every create, update and delete on core entities is captured with actor, timestamp, and a before/after diff. The log is append-only." },
    ]},
    { title: "Backups, encryption and data residency", body: [
      { p: "Data lives in Mumbai (ap-south-1). Encrypted at rest with AES-256 and in transit with TLS 1.2+. Point-in-time recovery for 7 days on all plans." },
    ]},
    { title: "Deleting or exporting your data (DPDP)", body: [
      { p: "Settings → Privacy. Export a full dump of your workspace as JSON + CSV, or trigger a full deletion. Deletion completes within 30 days." },
    ]},
  ]},
];

export const DOCS_ARTICLES: KbArticle[] = RAW_DOCS.flatMap((sec) =>
  sec.articles.map((a) => ({
    slug: toSlug(a.title),
    title: a.title,
    category: sec.category,
    time: `${Math.max(3, Math.round(a.body.reduce((n, b) => n + (b.p?.length || 0), 0) / 400))} min`,
    summary: a.body[0]?.p || "",
    body: a.body,
  }))
);

export const DOCS_SECTIONS = RAW_DOCS.map((sec) => ({
  category: sec.category,
  articles: sec.articles.map((a) => ({ title: a.title, slug: toSlug(a.title) })),
}));

export function findDoc(s: string) {
  return DOCS_ARTICLES.find((a) => a.slug === s);
}

const RAW_GUIDES: { tag: string; time: string; title: string; desc: string; body: { h?: string; p: string }[] }[] = [
  { tag: "Sales", time: "8 min", title: "The 24-hour lead response playbook", desc: "How to structure the first day after an inquiry — from the first WhatsApp reply to the discovery call script we use with 500+ agencies.", body: [
    { p: "Speed of first response is the single strongest predictor of whether a travel lead converts. Agencies that respond within 30 minutes close three times more than those that reply the next day." },
    { h: "Minute 0-2 — Auto-acknowledge on WhatsApp", p: "Set up a WhatsApp template that fires the second a lead lands. Address by first name, confirm you have their inquiry, and promise a call within the hour." },
    { h: "Minute 5-30 — Personal reply", p: "Send a personal, non-template message with a tentative day-by-day sketch. Do not send a full quote yet — the goal is to earn a call, not close a deal." },
    { h: "Hour 1-4 — The discovery call", p: "Ask about pace, non-negotiables, past trips, and budget range (not budget cap). Take notes directly in the lead's activity log so the entire team can see." },
    { h: "Hour 4-24 — First quote", p: "Send a versioned quotation with two options — a headline package and a stretch upgrade. Include an expiry and a Razorpay pay-link for the deposit." },
  ]},
  { tag: "Itineraries", time: "12 min", title: "Design a Kerala honeymoon in 15 minutes", desc: "Building a customisable 5N/6D honeymoon itinerary from a template, adding hotel line items and generating a branded quotation.", body: [
    { p: "This walkthrough uses TraWe's template library, the hotel rate book, and the quotation builder to go from an empty screen to a share-ready quote in under fifteen minutes." },
    { h: "Step 1 — Start from a template", p: "Under Itineraries → New, pick the 5N/6D Kerala Honeymoon template. It ships with Cochin → Munnar → Thekkady → Alleppey → Cochin as a baseline." },
    { h: "Step 2 — Swap in the couple's dates", p: "Set travel dates. TraWe recomputes weekday/weekend pricing on hotels automatically from the seasonal rate cards." },
    { h: "Step 3 — Choose hotels", p: "For each day, pick a hotel from the master with the right meal plan (MAP works well for honeymoons — breakfast + candlelight dinner)." },
    { h: "Step 4 — Add signature touches", p: "Add a private houseboat upgrade on Alleppey day, a couples spa in Munnar, and airport transfers with a decorated pickup." },
    { h: "Step 5 — Generate the quote", p: "Convert the itinerary to a quotation. TraWe applies your markup, computes GST (5% on tour operator service), and outputs a branded PDF ready to share on WhatsApp." },
  ]},
  { tag: "Hotels", time: "6 min", title: "Build a hotel rate book that stays fresh", desc: "Structuring EP/CP/MAP/AP rates by season, and how to update rates in bulk when suppliers revise pricing.", body: [
    { p: "A stale rate book is worse than no rate book — you will quote a rate you cannot honour. Keep it fresh with the workflow below." },
    { h: "Structure", p: "For every hotel, store per-room-type rates across four meal plans and at least three seasons (peak, shoulder, off). TraWe supports date ranges per season." },
    { h: "Bulk updates", p: "When a supplier revises rates, use the CSV export, edit, re-import loop. TraWe versions rate cards so historical quotes remain accurate." },
    { h: "Approvals", p: "Only Managers and Owners can publish new rate cards. Agents see the currently published version." },
  ]},
  { tag: "GST", time: "10 min", title: "GST for travel agents — the practical guide", desc: "Place of supply, 5% vs 18%, tour operator margin scheme, and exactly how TraWe splits CGST/SGST vs IGST for you.", body: [
    { p: "GST for travel is not complicated once you separate the two common billing models: tour operator services and pure agent (commission) services." },
    { h: "Tour operator — 5%", p: "SAC 998552 with 5% GST and no input tax credit. This is the default for most inclusive tours sold by Indian agencies." },
    { h: "Pure agent — 18%", p: "When you invoice only your commission (e.g. flight ticketing) it is 18%. TraWe flags this at line-item level." },
    { h: "Place of supply", p: "For B2C, it is the customer's location. For B2B, it is the customer's registered state. TraWe uses this to decide CGST/SGST vs IGST split." },
    { h: "Filing", p: "Export GSTR-1 CSV monthly. TraWe formats it exactly for the GSTN portal — your CA uploads without touching Excel." },
  ]},
  { tag: "Payments", time: "7 min", title: "Collect 40-40-20 payments without chasing", desc: "Set up deposit, mid-trip and balance schedules with Razorpay pay links and automated WhatsApp reminders.", body: [
    { p: "Chasing payments is the single largest time-sink in a travel agency. Automate the schedule and the reminders and reclaim your afternoons." },
    { h: "Schedule setup", p: "On any invoice, choose Split Payment. TraWe defaults to 40% at confirmation, 40% at 30 days before departure, and 20% at 7 days before." },
    { h: "Pay links", p: "Each installment generates a Razorpay hosted link. Share on WhatsApp with one tap." },
    { h: "Reminders", p: "Automations fire 5, 2 and 0 days before each due date. The traveller gets a friendly nudge; your Accounts team stays out of it." },
  ]},
  { tag: "WhatsApp", time: "9 min", title: "WhatsApp templates that actually get replies", desc: "Ten Meta-approved template patterns for follow-ups, quote sharing, payment nudges and post-trip reviews — with copy-paste text.", body: [
    { p: "Meta requires templates for business-initiated messages. Written well, they double reply rates. Written badly, they get you rate-limited." },
    { h: "Pattern 1 — Fresh inquiry", p: "Hi {{1}}, this is {{2}} from TraWe Holidays. Got your Bali inquiry — can I call you at {{3}}? Reply YES to confirm." },
    { h: "Pattern 2 — Quote shared", p: "Hi {{1}}, your Kerala itinerary is ready. View it here: {{2}}. Any questions I will be on WhatsApp all day." },
    { h: "Pattern 3 — Payment nudge", p: "Hi {{1}}, friendly reminder — the deposit for your {{2}} trip is due {{3}}. Pay in one tap: {{4}}" },
    { p: "Full ten-template pack is in the app under Communications → Templates → Recipes." },
  ]},
  { tag: "AI", time: "5 min", title: "Prompt patterns for the AI copilot", desc: "How to ask better questions of Ask my CRM, and 20 itinerary prompts that produce sellable drafts on the first try.", body: [
    { p: "The AI copilot is only as good as your prompt. Two habits separate great prompts from mediocre ones: constraints first, and one question at a time." },
    { h: "Constraints first", p: "Lead with pax, dates, budget range, pace, must-see, must-avoid. The copilot honours what you tell it explicitly." },
    { h: "One question at a time", p: "Instead of asking for a full itinerary, ask for a skeleton. Then ask for day 3 alternatives. Then ask for a hotel swap." },
  ]},
  { tag: "Operations", time: "11 min", title: "Never miss a check-in with the ops calendar", desc: "How to run departures, driver assignments and hotel check-ins from a single shared view your whole team subscribes to.", body: [
    { p: "The ops calendar is a single timeline of every departure, transfer and check-in. Everyone on Ops subscribes to the same view." },
    { h: "Assignments", p: "Drag a driver onto a transfer or a coordinator onto a check-in. Assignees are notified on WhatsApp with pickup time and passenger contact." },
    { h: "Escalations", p: "Any unassigned event within 24 hours of go-time pings the Ops lead. Overdue check-ins ping the Owner." },
  ]},
];

export const GUIDES: (KbArticle & { tag: string })[] = RAW_GUIDES.map((g) => ({
  slug: toSlug(g.title),
  title: g.title,
  category: g.tag,
  tag: g.tag,
  time: g.time,
  summary: g.desc,
  body: g.body,
}));

export function findGuide(s: string) {
  return GUIDES.find((g) => g.slug === s);
}
