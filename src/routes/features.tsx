import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import {
  Users, Map, FileText, Receipt, Wallet, Zap, MessageCircle, Sparkles, Shield,
  BarChart3, Globe2, CalendarCheck, Building2, Truck, Inbox, Bot, PhoneCall,
  ShieldCheck, Layers, Bell, Search, Palette, Smartphone, KeyRound, Plane,
  Hotel, IndianRupee, Workflow, FileSignature, Users2, Clock, CheckCircle2,
  ArrowRight, Sparkle, Database, Lock, Boxes, Radio,
} from "lucide-react";
import {
  Globe, Landmark, HeartHandshake, Ticket, MapPinned, Target, Command,
  Keyboard, TableProperties, Download, Trophy, Gift, ShieldAlert, PlugZap,
  LineChart, ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Features — Gemini-powered Travel CRM · TraWe" },
      { name: "description", content: "AI Itinerary Copilot that chat-builds AND chat-edits trips, Live Flight/Hotel Search, one-click Confirm & Invoice with a signable client portal, Billing 2.0, multi-provider AI (Gemini/ChatGPT/Claude), 2-way WhatsApp, GST invoicing, Razorpay, hotel B2B rates, automations, multi-currency, Windows desktop app — the complete AI-native stack for Indian travel agencies." },
      { property: "og:title", content: "Every feature a travel agency needs — with Google Gemini built in" },
      { property: "og:description", content: "From the first WhatsApp message to the GST invoice — AI Itinerary Copilot, Live Search, Confirm & Invoice, signable client portal, pipelines, hotel rates, Billing 2.0, WhatsApp inbox, automations, multi-provider AI and a Windows desktop app in one workspace." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/features" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/features" }],
  }),
});

// Category → detailed feature groups. Each pillar is one deep section on the page.
const PILLARS = [
  {
    id: "sales",
    kicker: "Sales & Pipeline",
    icon: Users,
    title: "Turn every inquiry into a confirmed trip",
    intro: "Capture leads from every channel, work them in a Kanban that mirrors your day, and never miss a follow-up.",
    bullets: [
      { icon: Inbox, t: "Omnichannel capture", d: "Website forms, WhatsApp, Instagram DMs, Google Ads and phone — every lead lands in one queue with source attribution." },
      { icon: Layers, t: "Kanban + table views", d: "6 stages: New → Contacted → Qualified → Quoted → Negotiation → Won. Drag between lanes or switch to a filterable table." },
      { icon: Clock, t: "Follow-up reminders", d: "SLA-based nudges, overdue badges on the dashboard, and daily digest so nothing slips through the cracks." },
      { icon: Users2, t: "Assignments & round-robin", d: "Auto-assign to agents by destination, budget or workload. Team leaders see everyone's pipeline in one view." },
      { icon: Bell, t: "Activity timeline", d: "Every call, message, quote and payment is stitched onto the lead — full context before you pick up the phone." },
    ],
  },
  {
    id: "itineraries",
    kicker: "Itinerary & Templates",
    icon: Map,
    title: "Design day-by-day trips in minutes",
    intro: "Build once, reuse forever. A visual itinerary builder plus a template marketplace for your fastest-selling packages.",
    bullets: [
      { icon: Map, t: "Day-by-day builder", d: "Add hotels, meal plans, transfers, sightseeing and free time. Drag to reorder days, duplicate any day in one click." },
      { icon: Boxes, t: "Reusable templates", d: "Save Rishikesh 3N/4D, Bali honeymoon, Kashmir family — instantiate for a new lead in seconds and customise the diff." },
      { icon: FileSignature, t: "Inclusions & exclusions", d: "Standardised T&C blocks so what's covered — and what's not — is unambiguous before the trip starts." },
      { icon: FileText, t: "One-click to quotation", d: "Turn any itinerary into a priced quotation. Line items flow through with GST, markup and discount preserved." },
    ],
  },
  {
    id: "hotels",
    kicker: "Hotels & B2B Rates",
    icon: Hotel,
    title: "Your private hotel rate book",
    intro: "Built for the small agent who negotiates directly with hotels. Store B2B pricing across meal plans and quote from it instantly.",
    bullets: [
      { icon: Globe2, t: "Country → State → Area → Pincode", d: "Cascading location dropdowns with a full geo dataset. Find every hotel you have in Rishikesh, Manali or Bali in one search." },
      { icon: Building2, t: "Rate cards per meal plan", d: "EP, CP (breakfast), MAP (breakfast + one meal), AP (all meals) with seasonal validity windows for each rate." },
      { icon: Sparkle, t: "Quick Quote calculator", d: "Pick a hotel, enter pax + nights, apply your commission, generate a ready-to-send quotation linked to the lead." },
      { icon: IndianRupee, t: "Margin tracking", d: "Cost vs sell price on every hotel line so you always know your take before the customer says yes." },
    ],
  },
  {
    id: "quotes",
    kicker: "Quotes · Bookings · Invoices",
    icon: Receipt,
    title: "GST-compliant paperwork, automated",
    intro: "Versioned quotations, printable vouchers and India-ready invoicing — sequential numbering, tax splits and GSTR-1 export.",
    bullets: [
      { icon: FileText, t: "Versioned quotations", d: "Revise pricing without losing history. Every version has a valid-until date, portal preview and branded PDF." },
      { icon: CalendarCheck, t: "Bookings & vouchers", d: "Convert accepted quotes to bookings. Auto-generate hotel and transfer vouchers with confirmation numbers." },
      { icon: Receipt, t: "GST invoicing", d: "CGST/SGST for intra-state, IGST for inter-state, place-of-supply logic baked in. Sequential per-agency numbering." },
      { icon: BarChart3, t: "GSTR-1 export", d: "One-click CSV in the format your CA wants. Advances, invoices and cancellations reconciled every month." },
    ],
  },
  {
    id: "payments",
    kicker: "Payments & Billing",
    icon: Wallet,
    title: "Get paid the moment you send the link",
    intro: "Native Razorpay integration with automatic reconciliation, plus supplier bill tracking so you always see net margin.",
    bullets: [
      { icon: Wallet, t: "Razorpay hosted pay links", d: "Attach a pay link to any invoice. UPI, cards, netbanking and wallets — no gateway plumbing on your side." },
      { icon: Radio, t: "Auto-reconciliation", d: "Webhooks match payments to invoices in real time. Partial payments, refunds and settlements handled automatically." },
      { icon: Truck, t: "Supplier bills & payouts", d: "Log hotel and DMC bills against a booking. See true trip margin — sell price minus every cost — on one screen." },
      { icon: IndianRupee, t: "Advances & schedules", d: "Split payments into deposit, mid-trip and balance. Automated reminders when the next installment is due." },
    ],
  },
  {
    id: "portal",
    kicker: "Customer Portal",
    icon: KeyRound,
    title: "A branded trip page for every traveller",
    intro: "Send one link. Your customer sees the itinerary, invoices, pay buttons and travel documents — signed and stamped with your brand.",
    bullets: [
      { icon: KeyRound, t: "Passwordless OTP login", d: "Customer signs in with an email or WhatsApp OTP. No accounts to manage, no passwords to reset." },
      { icon: Plane, t: "Trip tracker", d: "One page showing itinerary, quotations, invoices, payments and travel documents in the order they happened." },
      { icon: FileSignature, t: "E-signatures on quotes", d: "Customer approves a quotation directly on the portal. You get a stamped audit trail and PDF." },
      { icon: Palette, t: "Your logo & colours", d: "Portal and PDFs render in your agency brand — logo, primary colour, footer imprint — set once in Settings." },
    ],
  },
  {
    id: "comms",
    kicker: "Communications",
    icon: MessageCircle,
    title: "Every conversation, in one inbox",
    intro: "Send email, WhatsApp and SMS from inside the CRM. Two-way WhatsApp so replies land on the lead — not on someone's personal phone.",
    bullets: [
      { icon: Inbox, t: "Unified inbox", d: "Reply to WhatsApp messages inside TraWe. Chats are linked to leads and visible to the whole team." },
      { icon: MessageCircle, t: "Meta WhatsApp Cloud API", d: "Official templates, delivery receipts, media messages. Business-verified sending, not scraped web chat." },
      { icon: PhoneCall, t: "Email & SMS", d: "Transactional email from your own domain (via Cloud) and SMS for OTP + urgent nudges." },
      { icon: Database, t: "Full audit log", d: "Every message, who sent it and when — searchable, exportable, immutable." },
    ],
  },
  {
    id: "ai",
    kicker: "Gemini AI Copilot",
    icon: Sparkles,
    title: "Multi-provider AI copilot — Gemini, ChatGPT or Claude",
    intro: "Every AI feature in TraWe runs on your choice of provider. Paste a Gemini, OpenAI or Anthropic key in Settings → AI, hit Test, and TraWe verifies connectivity — with automatic 3-tier fallback so nothing ever breaks mid-flow.",
    bullets: [
      { icon: KeyRound, t: "BYO key — Gemini / ChatGPT / Claude", d: "Pick your provider per workspace and paste your own key. A one-click Test button verifies connectivity before you rely on it. Zero markup on your provider bill." },
      { icon: ShieldCheck, t: "3-tier fallback chain", d: "Workspace key → project secret → TraWe shared AI. If your key expires or rate-limits, TraWe silently falls back — no AI feature ever breaks mid-flow." },
      { icon: Bot, t: "AI Itinerary Builder (chat)", d: "Conversational interview — 4-6 targeted questions with quick-reply chips (trip style, hotel category, meal plan) — then a full day-by-day plan lands in the builder." },
      { icon: Sparkle, t: "AI Itinerary Edit (chat)", d: "Open any itinerary and refine by chat: 'swap day 2 hotel', 'add candlelight dinner on day 3'. Edits are atomic — untouched days keep their exact costs, markup, GST and TCS." },
      { icon: MessageCircle, t: "WhatsApp AI Agent", d: "24×7 auto-replies on new query threads with a Gemini system prompt you fully control from Settings → WhatsApp — with brand tone, language and guardrails." },
      { icon: Search, t: "Ask my CRM (RAG)", d: "Semantic search across queries, quotations, invoices and chat history — powered by pgvector and Gemini embeddings. 'Which Rishikesh trips are pending payment?' — instant answer with sources." },
      { icon: FileText, t: "Query summaries", d: "One-paragraph brief of any query's full history — every timeline entry, quote and payment condensed before you jump on a call." },
      { icon: Sparkle, t: "Smart compose", d: "Channel-aware WhatsApp and email drafts that pick up prior context and match the customer's language — English, Hindi or Hinglish." },
      { icon: LineChart, t: "AI sales forecast", d: "Projected month-end revenue based on pipeline velocity, historical close rates and seasonality — refreshed nightly by Gemini on your own data." },
      { icon: Lock, t: "Per-tenant isolation", d: "Your Gemini key is stored encrypted per workspace and never shared. Prompts never leak between agencies — Row-Level Security enforces it in the database." },
      { icon: Bell, t: "Google Sheets AI enrichment", d: "Incoming rows from Google Sheets are auto-classified into the right pipeline stage and service type by Gemini before landing in Queries." },
    ],
  },
  {
    id: "live-search",
    kicker: "Live Flight & Hotel Search",
    icon: Search,
    title: "Real flights and hotels, inside your CRM",
    intro: "Gemini-grounded live search brings real-time airfare and hotel availability into the workspace — no tab switching, no copy-paste.",
    bullets: [
      { icon: Plane, t: "Live flight search", d: "Gemini 2.5 Flash with Google Search grounding returns fares, timings and carriers — structured and ready to paste into a quotation." },
      { icon: Hotel, t: "Live hotel search", d: "Ask by city or area — get availability, star rating, typical rate and an image. One click to add the hotel into the itinerary day." },
      { icon: Globe2, t: "Full airport picker", d: "Every IATA code in one autocomplete — city, country and airport name searchable in the flight forms." },
      { icon: MapPinned, t: "Cascading location picker", d: "Country → State → City → Area dropdowns backed by a full geo dataset for hotels, transfers and itinerary destinations." },
    ],
  },
  {
    id: "confirm",
    kicker: "Confirm & Invoice",
    icon: FileSignature,
    title: "One click from quotation to signed GST invoice",
    intro: "Confirm the itinerary the client actually chose — TraWe raises the tax invoice, mints a signable client-portal token and locks the plan against edits. Reopen safely voids the linked invoice.",
    bullets: [
      { icon: CheckCircle2, t: "One confirmed per query", d: "Only one itinerary can be Confirmed on a query at a time — no confusion about which plan is live for invoicing and operations." },
      { icon: Receipt, t: "Auto-invoice on confirm", d: "Confirm & Invoice creates the GST invoice from the exact confirmed plan — costs, markup, GST and TCS flow through untouched." },
      { icon: KeyRound, t: "Signable portal link", d: "Confirming mints a public tokenised portal URL the client can open, review, accept and pay — no login, no password." },
      { icon: Bell, t: "Safe Reopen", d: "Need to change something? Reopen resets the itinerary to draft, voids the auto-generated invoice, clears confirmation metadata and invalidates caches — cleanly." },
    ],
  },
  {
    id: "billing",
    kicker: "Billing 2.0",
    icon: Wallet,
    title: "Payments, dues and proofs in one calm ledger",
    intro: "5 live KPIs — Collected, Due, Overdue, Refunded, Wallet — with an Add Payment side-sheet that captures bank, UTR, due date and proof upload.",
    bullets: [
      { icon: IndianRupee, t: "5 real-time KPIs", d: "Collected · Due · Overdue · Refunded · Wallet — auto-computed from invoices, payments and refunds, filterable by date and agent." },
      { icon: Wallet, t: "Add Payment side-sheet", d: "Bank name, UTR/reference, due date, proof file — everything on one form. Auto-picks GST mode from client and agency state." },
      { icon: FileText, t: "Manual & auto invoices", d: "Auto-raise from a confirmed itinerary, or Manual Invoice dialog with live tax preview, HSN/SAC per line and auto CGST/SGST vs IGST." },
      { icon: Landmark, t: "Bank picker on invoice PDF", d: "Choose which agency bank the customer should pay to — the branded PDF prints the correct account and UPI." },
    ],
  },
  {
    id: "pricing-ui",
    kicker: "Simplified Pricing UI",
    icon: Sparkle,
    title: "One markup. One GST. One clear total.",
    intro: "The itinerary builder's pricing sidebar was rebuilt for clarity — big client-price card up top, a plain 3-line breakdown, one markup row, one GST row (defaulted to 5%). Everything else tucked away.",
    bullets: [
      { icon: IndianRupee, t: "Client-price hero card", d: "The number that matters — the customer's grand total — is the biggest thing on the screen. No mental math." },
      { icon: Sparkle, t: "One markup row (₹ or %)", d: "Toggle rupees or percentage. Distributed proportionally across service lines in the costing summary." },
      { icon: Receipt, t: "One GST row, 5% default", d: "Sensible default for tour packages. CGST/SGST split and place-of-supply logic still handled correctly in the invoice PDF." },
      { icon: Command, t: "Advanced options collapsed", d: "CGST/SGST split, TCS, GST-apply-on, per-child / per-infant, costing type and currency all live in one collapsible section." },
    ],
  },
  {
    id: "ai-copilot",
    kicker: "AI Itinerary Copilot",
    icon: Sparkles,
    title: "Build AND edit itineraries by chat",
    intro: "A conversational assistant for the entire itinerary lifecycle — Builder for new plans, Edit for refinements, both aware of the lead's destination, dates and your tenant catalog.",
    bullets: [
      { icon: Bot, t: "Chat-first Builder", d: "4-6 short questions with quick-reply chips — trip style, hotel category, meal plan — then a full day-by-day plan lands in the builder ready to edit." },
      { icon: Sparkle, t: "Chat-first Editor", d: "'Add a candlelight dinner on day 3' or 'replace the day 2 hotel with a 5★ beachfront' — the AI rewrites only what you mention and preserves the rest." },
      { icon: Layers, t: "Atomic day rewrites", d: "Even single-day edits re-emit all days so costs and taxes stay consistent — no orphan services, no drifted totals." },
      { icon: Boxes, t: "Save as Template", d: "Turn any AI-built plan into a reusable template with one click — future queries instantiate in seconds and diff from there." },
    ],
  },
  {
    id: "desktop",
    kicker: "Windows Desktop App",
    icon: Command,
    title: "TraWe as a native .exe for daily operators",
    intro: "An Electron desktop build of the whole workspace — tray icon, launch-on-startup and external-link handling — for teams that want a single window pinned to the taskbar.",
    bullets: [
      { icon: Command, t: "Native .exe (Windows)", d: "Ships as a signed installer. Same auth, same workspace, same live data — just outside the browser." },
      { icon: Bell, t: "Tray icon & startup", d: "Runs in the system tray so notifications and reminders stay reachable even when the window is closed." },
      { icon: ArrowRight, t: "External link handling", d: "Docs, Razorpay pay pages and portal links open in the default browser — the desktop shell stays on the CRM." },
    ],
  },
  {
    id: "automations",
    kicker: "Automations & Ops",
    icon: Zap,
    title: "Rules that do the boring work for you",
    intro: "Visual rule builder plus a calendar for ops. Trigger on any event, act on any object.",
    bullets: [
      { icon: Workflow, t: "Visual rule builder", d: "When lead stage → Quoted, send WhatsApp template + create a follow-up in 2 days. No code." },
      { icon: CalendarCheck, t: "Ops calendar", d: "Every departure, hotel check-in and driver assignment on a shared calendar the whole team sees." },
      { icon: Bell, t: "Real-time notifications", d: "Ping the right agent when a customer pays, replies or signs a quote." },
      { icon: CheckCircle2, t: "Traveller docs registry", d: "Passport, visa and ID uploads with expiry alerts 30/60/90 days out." },
    ],
  },
  {
    id: "analytics",
    kicker: "Analytics & Reporting",
    icon: BarChart3,
    title: "The numbers, honest and instant",
    intro: "From today's revenue to the agent leaderboard — clarity on the metrics that actually move your business.",
    bullets: [
      { icon: BarChart3, t: "Sales funnel", d: "Conversion at every stage, average time-in-stage, and drop-off reasons across sources." },
      { icon: IndianRupee, t: "Revenue & margin", d: "MTD / QTD / YTD revenue, by destination, agent and package. Margin after supplier bills." },
      { icon: Users2, t: "Agent leaderboard", d: "Who's closing, who's chasing, who needs help — updated live." },
      { icon: FileText, t: "GSTR-1 & audit exports", d: "Tax-ready CSVs and an immutable audit log for compliance and internal review." },
    ],
  },
  {
    id: "platform",
    kicker: "Platform & Security",
    icon: Shield,
    title: "Enterprise-grade foundations, small-agency price",
    intro: "Multi-tenant isolation, role-based access, live backups. Built on infrastructure trusted by fintechs.",
    bullets: [
      { icon: ShieldCheck, t: "Multi-tenant + RLS", d: "Every agency is fully isolated at the database row level. Your data never touches another tenant's queries." },
      { icon: Lock, t: "Roles & permissions", d: "Owner, Sales Manager, Agent, Accounts, Ops — each with a scoped permission set out of the box." },
      { icon: Smartphone, t: "Installable PWA", d: "Add TraWe to your phone home screen. Works on the go, syncs when you're back online." },
      { icon: Globe2, t: "Multi-currency + FX", d: "Quote in USD, EUR, AED, SGD with live exchange rates. Base currency configurable per agency." },
      { icon: Database, t: "Data residency in India", d: "Hosted in India-region datacentres. TLS everywhere, encryption at rest, daily backups." },
    ],
  },
  {
    id: "whitelabel",
    kicker: "White-label & Domains",
    icon: Globe,
    title: "Your brand, your domain, your CRM",
    intro: "Run the customer portal and share links on your own domain — logo, colours, favicon and OG image all follow the tenant.",
    bullets: [
      { icon: Globe, t: "Custom domain (CNAME)", d: "Point portal.your-agency.com at app.trawe.in, hit Verify, and every share link renders on your domain — SSL handled for you." },
      { icon: Boxes, t: "Agency subdomain", d: "Prefer zero DNS? Get your-agency.trawe.in out of the box with the same branding controls." },
      { icon: Palette, t: "Full brand kit", d: "Logo, accent colour, favicon and social OG image — set once in Settings, applied to portal, PDFs and public share pages." },
      { icon: ShieldCheck, t: "Tenant-scoped resolver", d: "Anon-safe public RPC resolves the tenant by host — travellers never see TraWe branding on your domain." },
    ],
  },
  {
    id: "fd-tours",
    kicker: "Fixed Departures",
    icon: Ticket,
    title: "Group tours, packaged and priced",
    intro: "Publish fixed-date group departures with pax caps, priced twin/triple/child, and one-click booking against the tour.",
    bullets: [
      { icon: Ticket, t: "FD tour catalogue", d: "Tour code, itinerary, departure dates and pax slots — run the same package across the season without rebuilding it every time." },
      { icon: CalendarCheck, t: "Seat inventory", d: "Live remaining-seats counter as bookings come in. Auto-close when the batch is full." },
      { icon: IndianRupee, t: "Twin / triple / child pricing", d: "Store the full occupancy matrix so agents pick the right slab in one click." },
      { icon: Layers, t: "Queries board", d: "Every FD inquiry lands in a dedicated queue, tagged to the tour and departure date." },
    ],
  },
  {
    id: "insurance",
    kicker: "Travel Insurance",
    icon: HeartHandshake,
    title: "Sell insurance from a rate matrix",
    intro: "Store plans from Bajaj, Reliance, TATA AIG and any partner — with age-band premiums, sum insured and cover regions.",
    bullets: [
      { icon: HeartHandshake, t: "Insurance masters", d: "Plans with underwriter, cover geography (Domestic, Asia, Worldwide), sum insured tiers and inclusions." },
      { icon: TableProperties, t: "Age-band rate cards", d: "Premium matrix by age slab and trip duration — pick the row, we plug it into the quotation." },
      { icon: FileText, t: "One-line add", d: "Add insurance as a taxable line item to any quotation or invoice with the correct HSN/SAC code." },
    ],
  },
  {
    id: "banks",
    kicker: "Multi-bank Accounting",
    icon: Landmark,
    title: "One agency, many bank accounts",
    intro: "Keep current, savings and payment-gateway settlements in separate ledgers. Every invoice picks the right receiving account.",
    bullets: [
      { icon: Landmark, t: "Bank masters", d: "Store bank name, account number, IFSC, branch and UPI ID per agency — mark a default for new invoices." },
      { icon: Receipt, t: "Bank picker on invoices", d: "Choose the receiving bank when raising an invoice. Printed PDFs show the correct account for the customer to pay to." },
      { icon: BarChart3, t: "Per-bank reconciliation", d: "Filter payments and settlements by bank to reconcile each ledger cleanly at month-end." },
    ],
  },
  {
    id: "transfers",
    kicker: "Transfers & Route Rates",
    icon: MapPinned,
    title: "Airport, hotel and city transfer rates",
    intro: "Store transfer points and a full rate matrix per vehicle type — pick a route, the price appears.",
    bullets: [
      { icon: MapPinned, t: "Transfer point masters", d: "Airports, hotels, railway stations and city landmarks — reusable across every quotation." },
      { icon: TableProperties, t: "Rate matrix", d: "Sedan, SUV, tempo, coach — per-point rates with peak/off-peak windows and margin visibility." },
      { icon: Truck, t: "Driver assignments", d: "Assign a driver from the crew master to any transfer segment; export a run-sheet for ops." },
    ],
  },
  {
    id: "vouchers-ops",
    kicker: "Vouchers & Ops",
    icon: Ticket,
    title: "Ops-ready vouchers in one click",
    intro: "Branded hotel, transfer and activity vouchers ready to hand to the traveller — with confirmation numbers and QR.",
    bullets: [
      { icon: Ticket, t: "Voucher builder", d: "Generate hotel + transfer + activity vouchers from a booking with your agency logo, colours and 24/7 contact line." },
      { icon: FileText, t: "Branded PDFs", d: "Every voucher, invoice and quotation renders in the agency's own brand kit — no TraWe watermark." },
      { icon: Users2, t: "Ops assignments", d: "Assign guide, driver and vehicle per booking; the customer portal shows point-of-contact details." },
    ],
  },
  {
    id: "roles",
    kicker: "Roles Matrix",
    icon: ShieldAlert,
    title: "Fine-grained permissions, per team",
    intro: "Grouped permission matrix — Sell, Operate, Finance, Configure — with per-role toggles and RLS enforcement in the database.",
    bullets: [
      { icon: ShieldAlert, t: "Grouped matrix UI", d: "See every permission for every role on one screen. Toggle in place, changes take effect immediately." },
      { icon: Users2, t: "Preset roles", d: "Owner, Sales Manager, Agent, Accounts, Ops shipped out of the box — clone and tweak for your team." },
      { icon: Lock, t: "Database-enforced", d: "Every rule is backed by Postgres row-level security — client tampering can't bypass what you deny." },
    ],
  },
  {
    id: "targets",
    kicker: "Sales Targets & Forecast",
    icon: Target,
    title: "Set the number. Track it live.",
    intro: "Monthly and quarterly targets per agent and per team, with an AI-projected close date on every open lead.",
    bullets: [
      { icon: Target, t: "Targets per agent & team", d: "Monthly revenue, bookings and quota — attainment updates in real time on the dashboard." },
      { icon: Trophy, t: "Live leaderboard", d: "Who's ahead, who's chasing — a healthy scoreboard that runs itself." },
      { icon: LineChart, t: "AI sales forecast", d: "Projected month-end revenue based on pipeline velocity, historical close rates and seasonality." },
    ],
  },
  {
    id: "referrals",
    kicker: "Referrals & Wallet",
    icon: Gift,
    title: "Give customers a reason to come back",
    intro: "Referral codes, wallet credits and coupons — apply at quote time, redeem at invoice time, tracked in one ledger.",
    bullets: [
      { icon: Gift, t: "Referral codes", d: "Auto-generate a shareable code per customer; auto-credit the wallet when a friend books." },
      { icon: Wallet, t: "Wallet credits", d: "Store per-customer credit balance; redeem on any invoice with a full audit trail." },
      { icon: IndianRupee, t: "Coupons & discounts", d: "Percentage or flat coupons with expiry, minimum ticket and destination scoping." },
    ],
  },
  {
    id: "power",
    kicker: "Power-user Tools",
    icon: Command,
    title: "The little things that make daily work fast",
    intro: "Global command palette, saved views, keyboard shortcuts and CSV export across every module.",
    bullets: [
      { icon: Command, t: "Global ⌘K palette", d: "Jump to any module, lead, invoice or command in three keystrokes. Works from anywhere in the app." },
      { icon: Keyboard, t: "Hotkeys everywhere", d: "'g' + letter to navigate, '/' to search, '?' for the cheatsheet. Built for the keyboard-first operator." },
      { icon: TableProperties, t: "Saved views", d: "Save your favourite filters on Leads, Quotations, Bookings, Invoices, Vouchers and Bills — one click to recall." },
      { icon: Download, t: "CSV export", d: "Export any list to CSV with the columns and filters you're looking at — clean rows for finance and BI tools." },
      { icon: ListChecks, t: "Custom lead fields", d: "Add your own fields to the lead form — text, select, number, date — no code, no migration." },
    ],
  },
  {
    id: "integrations-hub",
    kicker: "Integrations Hub",
    icon: PlugZap,
    title: "Plug into the tools you already use",
    intro: "Razorpay, Meta Ads, WhatsApp Cloud, Gmail, Google Calendar, Zoho Books, Tally, TBO, Agoda and 5,000+ apps via Zapier.",
    bullets: [
      { icon: PlugZap, t: "Curated catalogue", d: "One page listing every integration with connection status, docs and a live setup dialog per app." },
      { icon: MessageCircle, t: "WhatsApp Cloud wizard", d: "Guided flow to plug in your Meta app id, phone number id and system token — verify the send in under a minute." },
      { icon: Radio, t: "Custom webhooks", d: "Fire outbound webhooks on any CRM event — leads, payments, bookings — to your own systems." },
    ],
  },
];

// Small feature chips at the bottom — everything else that ships.
const EVERYTHING_ELSE = [
  "AI Itinerary Builder (chat)", "AI Itinerary Edit (chat, day-specific)",
  "Live flight search (Gemini-grounded)", "Live hotel search (Gemini-grounded)",
  "Add hotel via Gemini in the builder", "Full IATA airport picker",
  "Cascading Country/State/City/Area picker", "Confirm & Invoice one-click",
  "Safe Reopen (voids linked invoice)", "Signable client portal token",
  "Manual Invoice dialog with live tax preview", "5-KPI Billing dashboard",
  "Add Payment with bank + UTR + proof upload", "Simplified pricing sidebar",
  "Multi-provider AI (Gemini/ChatGPT/Claude)", "AI provider Test button",
  "WhatsApp share as PDF or 4,096-char text", "Windows desktop app (.exe)",
  "Company logo upload", "Auto-calc Nights from date range",
  "Save Itinerary as Template", "Empty-draft cleaner utility",
  "Supplier Communication 2.0 with logs", "Stage dropdown from query header",
  "Global ⌘K command palette", "Keyboard shortcuts + cheatsheet", "Saved views on every list",
  "CSV export on every list", "Custom lead fields", "Onboarding wizard", "Per-agency branded PDFs",
  "White-label custom domain", "Agency subdomain (your-agency.trawe.in)", "Branded favicon & OG image",
  "Immutable audit log", "Passport & visa registry with expiry alerts",
  "Webhooks: Razorpay, WhatsApp, reminders cron", "Sitemap + SEO metadata",
  "Super Admin panel for tenants", "Plan limits with hard enforcement",
  "Portal share tokens (public + tokenised)", "Google auth", "Email OTP",
  "Team invites & role changes", "Roles matrix (Sell/Operate/Finance/Configure)",
  "Custom lead sources", "Custom currencies", "Custom tax rates",
  "Fixed Departure tours & seat inventory", "Insurance rate matrix",
  "Multi-bank ledger", "Sales targets & AI forecast", "Referral codes & wallet credits",
  "Coupons with expiry & scoping", "Transfer point rate matrix",
  "Duplicate lead detection", "Lead scoring", "Quotation versioning",
  "Tour packages with payment schedules", "Arrivals board",
  "Query type masters (colour-coded)", "Visa / room type / meal plan masters",
  "Dashboard skeleton loaders", "Animated KPIs", "Recharts revenue trend",
  "Dark mode ready tokens", "Mobile bottom nav",
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">The complete feature set</div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Everything a modern <span className="text-gradient-brand">travel agency</span> runs on — in one workspace.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              From the first WhatsApp inquiry to the GST invoice and post-trip review — TraWe covers every step. No stitching four tools together, no spreadsheets, no missed follow-ups.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact" ><Button size="lg" className="gap-1.5">Start free <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/request-demo"><Button variant="outline" size="lg">Get a live demo</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: "100+", l: "modules" },
                { n: "25", l: "core pillars" },
                { n: "100%", l: "GST compliant" },
                { n: "White-label", l: "on your domain" },
              ].map((s) => (
                <div key={s.l} className="border rounded-lg p-4">
                  <div className="font-mono text-2xl tabular-nums">{s.n}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TABLE OF CONTENTS */}
      <section className="border-b bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Jump to</div>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <a key={p.id} href={`#${p.id}`} className="group inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition">
                <p.icon className="h-3 w-3" />
                {p.kicker}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        {PILLARS.map((p, i) => (
          <section key={p.id} id={p.id} className="scroll-mt-24">
            <div className="grid md:grid-cols-[280px_1fr] gap-10">
              <div className="md:sticky md:top-24 self-start">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-muted-foreground">·</span>
                  {p.kicker}
                </div>
                <div className="mt-4 h-12 w-12 rounded-xl bg-primary/10 grid place-items-center">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">{p.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{p.intro}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {p.bullets.map((b) => (
                  <div key={b.t} className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center mb-3 group-hover:bg-primary/15 transition">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="font-medium">{b.t}</div>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{b.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* EVERYTHING ELSE */}
      <section className="border-t bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">And a whole lot more</div>
            <h2 className="text-3xl font-semibold tracking-tight">The details that add up.</h2>
            <p className="mt-3 text-muted-foreground">Small touches across the product that make daily work faster.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {EVERYTHING_ELSE.map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW STRIP */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">How it fits together</div>
            <h2 className="text-3xl font-semibold tracking-tight">One workflow. Five steps. Zero copy-paste.</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {[
              { n: "01", t: "Capture", d: "Lead lands from WhatsApp, site or Instagram" },
              { n: "02", t: "Design", d: "Build itinerary from a template or from scratch" },
              { n: "03", t: "Quote", d: "GST-priced quotation shared via portal" },
              { n: "04", t: "Collect", d: "Razorpay link, auto-reconciled to invoice" },
              { n: "05", t: "Fly", d: "Vouchers issued, ops calendar updated" },
            ].map((s) => (
              <div key={s.n} className="relative rounded-xl border bg-card p-5">
                <div className="font-mono text-xs text-primary tabular-nums">{s.n}</div>
                <div className="mt-2 font-medium">{s.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-14">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to run your agency on TraWe?</h3>
                <p className="mt-3 text-muted-foreground">Free 14-day trial. No credit card. Import your leads on day one.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" ><Button size="lg" className="gap-1.5">Start free <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/contact"><Button variant="outline" size="lg">Talk to sales</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

import { MarketingNav } from "@/components/app/marketing-nav";
export const MarketingHeader = MarketingNav;

export function MarketingFooter() {
  const cols: { title: string; links: { to: string; label: string; external?: boolean }[] }[] = [
    {
      title: "Product",
      links: [
        { to: "/features", label: "Features" },
        { to: "/products", label: "All products" },
        { to: "/travel-website-development", label: "Website development" },
        
        { to: "/contact", label: "Start free trial" },
        { to: "/contact", label: "Book a demo" },
      ],
    },
    {
      title: "Resources",
      links: [
        { to: "/docs", label: "Docs" },
        { to: "/guides", label: "Guides" },
        { to: "/support", label: "Support" },
        { to: "/status", label: "Status" },
        { to: "/blog", label: "Blog" },
      ],
    },
    {
      title: "Company",
      links: [
        { to: "/about", label: "About us" },
        { to: "/services", label: "Services" },
        { to: "/compare", label: "Compare with others" },
        { to: "/contact", label: "Contact" },
        { to: "/blog", label: "Blog" },
      ],
    },
    {
      title: "Legal",
      links: [
        { to: "/privacy", label: "Privacy" },
        { to: "/terms", label: "Terms of service" },
        { to: "/refund", label: "Refund policy" },
        { to: "/dpdp", label: "DPDP compliance" },
      ],
    },
  ];
  return (
    <footer className="border-t mt-16 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Logo className="h-8 w-auto" />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The travel CRM built for Indian agencies — leads to GST invoice, in one workspace.
            </p>
            <div className="mt-4 text-xs font-mono text-muted-foreground">Made in India · Data hosted in India</div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">{c.title}</div>
              <ul className="space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-foreground/80 hover:text-primary transition">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
          <span>© {new Date().getFullYear()} TraWe Technologies Pvt. Ltd. — All rights reserved.</span>
          <span>sales@trawe.in · +91 93117 84451</span>
        </div>
      </div>
    </footer>
  );
}