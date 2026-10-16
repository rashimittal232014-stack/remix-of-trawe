import {
  Users, Map, Sparkles, Plane, FileText, Receipt, Wallet, MessageCircle,
  Boxes, Globe2, Monitor, ShieldCheck, Layers, Inbox, Clock, Users2, Bell,
  Hotel, Search, IndianRupee, CreditCard, BarChart3, Bot, Palette, Smartphone,
  Building2, Truck, CalendarCheck, FileSignature, Lock, Zap, Workflow, Radio,
  Send, Database, Gauge, KeyRound, Download, PieChart, Route as RouteIcon,
  type LucideIcon,
} from "lucide-react";

export type MockupKind = "dashboard" | "chat" | "document" | "board" | "grid";

export type Product = {
  slug: string;
  name: string;
  navLabel: string;
  navBlurb: string;
  icon: LucideIcon;
  kicker: string;
  h1a: string;
  h1accent: string;
  h1b: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  stats: { n: string; l: string }[];
  panel: { icon: LucideIcon; t: string }[];
  features: { icon: LucideIcon; t: string; d: string }[];
  checklist: string[];
  workflow: { n: string; t: string; d: string }[];
  faqs: { q: string; a: string }[];
  mockup: {
    kind: MockupKind;
    title: string;
    kpis?: { l: string; v: string }[];
    rows?: { a: string; b: string; c?: string; tone?: "primary" | "accent" | "muted" }[];
    chat?: { who: "them" | "us"; text: string }[];
  };
};

export const PRODUCTS: Product[] = [
  {
    slug: "travel-crm",
    name: "B2C Travel CRM",
    navLabel: "B2C Travel CRM",
    navBlurb: "Queries, pipelines, follow-ups and team assignment",
    icon: Users,
    kicker: "Core CRM",
    h1a: "Every traveller enquiry, ",
    h1accent: "worked to a confirmation",
    h1b: ".",
    intro:
      "Capture enquiries from your website, WhatsApp, Instagram and phone into one queue. Work them in a Kanban that mirrors your day, assign agents, chase follow-ups and see exactly where the money is stuck.",
    metaTitle: "B2C Travel CRM for Indian Agencies — TraWe",
    metaDescription:
      "TraWe's B2C travel CRM captures enquiries from website, WhatsApp and calls into one pipeline — stages, assignments, follow-up reminders, activity timeline and query-level profitability.",
    stats: [
      { n: "6", l: "pipeline stages" },
      { n: "0", l: "leads lost to inbox" },
      { n: "1", l: "timeline per query" },
      { n: "∞", l: "custom sources" },
    ],
    panel: [
      { icon: Inbox, t: "Omnichannel query capture" },
      { icon: Layers, t: "Kanban + filterable table" },
      { icon: Clock, t: "Follow-up reminders & SLAs" },
      { icon: Users2, t: "Agent assignment & round-robin" },
      { icon: Bell, t: "Full activity timeline" },
      { icon: BarChart3, t: "Conversion & source reports" },
    ],
    features: [
      { icon: Inbox, t: "One queue for every channel", d: "Website forms, WhatsApp, click-to-call and walk-ins create a Query with source attribution, so you know which channel actually pays." },
      { icon: Layers, t: "Stages that match your desk", d: "New → Contacted → Qualified → Quoted → Negotiation → Won. Drag on the board or bulk-move from the table view." },
      { icon: Clock, t: "Nothing slips", d: "Next-follow-up dates, overdue badges and a daily digest keep every warm traveller from going cold." },
      { icon: Users2, t: "Team-ready", d: "Assign by destination, budget or workload. Owners see everyone's pipeline; agents see only their own." },
      { icon: Bell, t: "Context before you dial", d: "Calls, WhatsApp threads, quotations, payments and documents are stitched onto the query in one scrollable timeline." },
      { icon: BarChart3, t: "Numbers you can act on", d: "Win rate per agent, per source and per destination — plus value sitting in each stage right now." },
    ],
    checklist: [
      "Query stages with drag-and-drop",
      "Duplicate detection on phone/email",
      "Travel dates, pax and auto nights calculation",
      "Budget, destination and trip-type fields",
      "Notes, tasks and reminders",
      "Bulk import from Excel",
      "Source attribution and UTM capture",
      "Role-based access for agents and owners",
      "Query-level quotations, invoices and payments",
      "Search across every query field",
    ],
    workflow: [
      { n: "01", t: "Enquiry lands", d: "Website form, WhatsApp message or manual entry creates a Query with the traveller's details." },
      { n: "02", t: "Qualify & assign", d: "Add dates, pax and budget; the query is routed to the right agent automatically." },
      { n: "03", t: "Quote & negotiate", d: "Build the itinerary, share it, and log every follow-up against the same record." },
      { n: "04", t: "Confirm & invoice", d: "Mark the accepted quotation confirmed — the GST invoice and payment schedule generate themselves." },
    ],
    faqs: [
      { q: "Can I import my existing leads?", a: "Yes — bulk Excel import maps your columns to TraWe fields, with duplicate checks on phone and email." },
      { q: "Do agents see each other's queries?", a: "No. Agents see their assigned queries; owners and managers see the whole pipeline." },
      { q: "Can I add my own stages?", a: "Pipelines and stages are configurable per workspace, so you can mirror how your team actually sells." },
      { q: "Is my data safe?", a: "Every record is scoped to your workspace with row-level security, hosted in India and exportable at any time." },
    ],
    mockup: {
      kind: "board",
      title: "Queries — Pipeline",
      rows: [
        { a: "Rahul Thakur", b: "Manali · 4N/5D", c: "Quoted", tone: "primary" },
        { a: "Aman Verma", b: "Bali · 6N/7D", c: "Negotiation", tone: "accent" },
        { a: "Priya Nair", b: "Kashmir · 5N/6D", c: "Qualified", tone: "muted" },
        { a: "Rohit Shah", b: "Dubai · 3N/4D", c: "Won", tone: "primary" },
      ],
      kpis: [
        { l: "Open queries", v: "48" },
        { l: "Quoted value", v: "₹18.4L" },
        { l: "Win rate", v: "31%" },
      ],
    },
  },

  {
    slug: "ai-itinerary-builder",
    name: "AI Itinerary Builder",
    navLabel: "AI Itinerary Builder",
    navBlurb: "Chat-build and chat-edit day-by-day trips",
    icon: Sparkles,
    kicker: "AI Copilot",
    h1a: "Describe the trip. ",
    h1accent: "The itinerary writes itself",
    h1b: ".",
    intro:
      "An AI copilot that interviews you like a senior travel consultant, then produces a complete day-by-day plan with hotels, transfers, sightseeing, inclusions and pricing — inside the same builder your team edits by hand.",
    metaTitle: "AI Itinerary Builder for Travel Agents — TraWe",
    metaDescription:
      "Chat-build a full day-by-day itinerary in minutes and chat-edit any day later. Hotels, transfers, sightseeing, inclusions, pricing and a branded PDF — all inside the TraWe CRM.",
    stats: [
      { n: "3 min", l: "draft itinerary" },
      { n: "Day-wise", l: "edit by prompt" },
      { n: "1-click", l: "save as template" },
      { n: "PDF", l: "branded output" },
    ],
    panel: [
      { icon: Bot, t: "Interview-style AI brief" },
      { icon: Map, t: "Day-by-day visual builder" },
      { icon: Sparkles, t: "AI edit: “swap day 2 hotel”" },
      { icon: Boxes, t: "Reusable trip templates" },
      { icon: FileText, t: "Branded itinerary PDF" },
      { icon: Send, t: "Share on WhatsApp or portal" },
    ],
    features: [
      { icon: Bot, t: "It asks before it writes", d: "Trip style, hotel category, pace, must-dos and budget — a handful of quick-reply questions, then a complete draft grounded in your own masters." },
      { icon: Sparkles, t: "Edit by prompt", d: "“Make day 3 relaxed”, “swap the Manali hotel for a 4-star”, “add a Shikara ride” — the AI rewrites only what you asked for and leaves costs intact." },
      { icon: Map, t: "Still a real builder", d: "Every AI output lands in the standard day-by-day builder, so your team can drag, duplicate and fine-tune manually." },
      { icon: Boxes, t: "Templates that compound", d: "Save any itinerary as a template and instantiate it for the next enquiry in seconds." },
      { icon: Hotel, t: "Hotels added by AI or by hand", d: "Grounded hotel search pulls real property details, or add a hotel manually with check-in/out times and meal plan." },
      { icon: FileText, t: "Client-ready output", d: "A branded PDF and a shareable portal link, with your logo, inclusions, exclusions and policies." },
    ],
    checklist: [
      "Conversational AI brief with quick replies",
      "Auto day-count from travel dates",
      "Hotels, transfers, activities and meals per day",
      "Inclusions, exclusions and policy blocks",
      "AI edit sheet for changes after generation",
      "Save as template / clone to another query",
      "Auto-save while you build",
      "Multiple itinerary versions per query",
      "Branded PDF export",
      "WhatsApp and email sharing",
    ],
    workflow: [
      { n: "01", t: "Open the copilot", d: "From the query, click AI Itinerary Builder — the assistant already knows destination, dates and pax." },
      { n: "02", t: "Answer 4–6 questions", d: "Trip style, hotel category, pace and inclusions, mostly by tapping quick-reply chips." },
      { n: "03", t: "Review the draft", d: "The full plan lands in the builder with days, services and costs ready to adjust." },
      { n: "04", t: "Refine and send", d: "Prompt-edit any day, price it, then share the PDF or the client portal link." },
    ],
    faqs: [
      { q: "Which AI model powers it?", a: "Google Gemini by default. You can also plug in your own Gemini, ChatGPT or Claude key per workspace." },
      { q: "Does it invent hotels?", a: "Hotel suggestions come from your masters or from grounded live search, and every service is editable before you send." },
      { q: "Can I change just one day?", a: "Yes — the AI edit sheet applies scoped changes and leaves untouched days and their costs unchanged." },
      { q: "Do I have to use AI?", a: "No. The manual day-by-day builder and templates work exactly the same without it." },
    ],
    mockup: {
      kind: "chat",
      title: "AI Itinerary Copilot",
      chat: [
        { who: "them", text: "Manali, 4N/5D, 2 adults. What style of trip?" },
        { who: "us", text: "Honeymoon · 4-star · relaxed pace" },
        { who: "them", text: "Adding Solang valley, Atal tunnel and a candlelight dinner. Generating 5 days…" },
        { who: "us", text: "Swap day 3 hotel to a riverside resort" },
      ],
    },
  },

  {
    slug: "live-flight-hotel-search",
    name: "Live Flight & Hotel Search",
    navLabel: "Live Flight & Hotel Search",
    navBlurb: "Grounded fare and property search inside the CRM",
    icon: Plane,
    kicker: "Live Search",
    h1a: "Search flights and hotels ",
    h1accent: "without leaving the CRM",
    h1b: ".",
    intro:
      "AI-grounded live search brings real fares, routes and property options into the query you're working on — then drops the selected option straight into the itinerary with costs attached.",
    metaTitle: "Live Flight & Hotel Search in Your Travel CRM — TraWe",
    metaDescription:
      "Grounded live search for flights and hotels inside TraWe: world airport dropdowns, country–city–area pickers, structured results and one-click add into the itinerary.",
    stats: [
      { n: "9,000+", l: "airports indexed" },
      { n: "Live", l: "grounded results" },
      { n: "1-click", l: "add to itinerary" },
      { n: "0", l: "extra tabs" },
    ],
    panel: [
      { icon: Plane, t: "Airport dropdown with IATA codes" },
      { icon: Hotel, t: "Country → city → area hotel picker" },
      { icon: Search, t: "Grounded results with sources" },
      { icon: Layers, t: "Structured, comparable cards" },
      { icon: IndianRupee, t: "Cost lands in the costing sheet" },
      { icon: Sparkles, t: "Add hotel to itinerary via AI" },
    ],
    features: [
      { icon: Plane, t: "Every airport, typed fast", d: "A worldwide airport dataset with city, country and IATA code — type “DEL”, “Del” or “Indira Gandhi” and get the right one." },
      { icon: Hotel, t: "Location picker that makes sense", d: "Cascading country → state → city → area selection so hotel results are actually relevant to where the guest is staying." },
      { icon: Search, t: "Grounded, not guessed", d: "Search runs through Gemini with Google Search grounding, returning structured results you can compare side by side." },
      { icon: Layers, t: "Comparable result cards", d: "Airline, timings, stops and fare for flights; property, star rating, area and indicative rate for hotels." },
      { icon: RouteIcon, t: "Straight into the plan", d: "Pick an option and it becomes a service line on the right day, with supplier cost ready for markup." },
      { icon: Gauge, t: "Fewer tabs, faster quotes", d: "Your team stops bouncing between five booking sites while the traveller waits on WhatsApp." },
    ],
    checklist: [
      "Worldwide airport search with IATA codes",
      "One-way and round-trip flight search",
      "Cabin class and pax selection",
      "Hotel search by country, city and area",
      "Star rating and budget band filters",
      "Structured comparison cards",
      "Add selection as an itinerary service",
      "Supplier cost captured for costing",
      "Works with your own AI provider key",
      "Search history on the query",
    ],
    workflow: [
      { n: "01", t: "Open Live Search", d: "From the sidebar or from inside an itinerary day." },
      { n: "02", t: "Set the route or city", d: "Airport dropdowns for flights; cascading location picker for hotels." },
      { n: "03", t: "Compare results", d: "Structured cards show timings, stops, ratings and indicative pricing." },
      { n: "04", t: "Add to the itinerary", d: "The chosen option becomes a priced service line on the correct day." },
    ],
    faqs: [
      { q: "Are these bookable fares?", a: "They are indicative, grounded results for quoting speed. You book through your usual supplier or GDS and record the final cost in TraWe." },
      { q: "Does it cost extra?", a: "Live Search runs on your workspace AI allowance, or on your own provider key if you add one." },
      { q: "Which destinations are covered?", a: "Global — the airport dataset and the location picker cover worldwide routes and cities." },
      { q: "Can I edit the result before adding?", a: "Yes. Every field — timings, property name, cost — stays editable in the itinerary." },
    ],
    mockup: {
      kind: "grid",
      title: "Live Search — DEL → DXB",
      rows: [
        { a: "IndiGo 6E 1471", b: "02:35 · non-stop", c: "₹18,420", tone: "primary" },
        { a: "Air India AI 995", b: "04:10 · non-stop", c: "₹21,900", tone: "muted" },
        { a: "Emirates EK 511", b: "03:55 · non-stop", c: "₹27,300", tone: "accent" },
        { a: "Atlantis The Palm", b: "Palm Jumeirah · 5★", c: "₹34,500/nt", tone: "muted" },
      ],
    },
  },

  {
    slug: "quotations-gst-invoicing",
    name: "Quotations & GST Invoicing",
    navLabel: "Quotations & GST Invoicing",
    navBlurb: "Confirm a quote, raise a compliant invoice",
    icon: Receipt,
    kicker: "Quote to invoice",
    h1a: "One click from ",
    h1accent: "confirmed quotation to GST invoice",
    h1b: ".",
    intro:
      "Price a trip with markup, GST and TCS handled correctly, share it for approval, and turn the accepted version into a numbered, GST-compliant tax invoice without re-keying a single line.",
    metaTitle: "Travel Quotations & GST Invoicing Software — TraWe",
    metaDescription:
      "Build priced quotations with markup, CGST/SGST/IGST and TCS, confirm the version the client accepted, and auto-generate a numbered GST tax invoice with your branding.",
    stats: [
      { n: "1-click", l: "confirm & invoice" },
      { n: "GST", l: "CGST/SGST/IGST" },
      { n: "TCS", l: "handled" },
      { n: "PDF", l: "client-branded" },
    ],
    panel: [
      { icon: FileText, t: "Multiple quotation versions" },
      { icon: FileSignature, t: "Confirm the accepted version" },
      { icon: Receipt, t: "Auto GST tax invoice" },
      { icon: IndianRupee, t: "Markup, GST and TCS logic" },
      { icon: Palette, t: "Your branding on every PDF" },
      { icon: Lock, t: "Void & reopen with audit trail" },
    ],
    features: [
      { icon: IndianRupee, t: "Pricing that stays simple", d: "One markup row and one GST row up front; CGST/SGST split, TCS, per-child pricing and currency live under Advanced options." },
      { icon: FileText, t: "Version the negotiation", d: "Send option A, B and C against the same query — each with its own costing and share link." },
      { icon: FileSignature, t: "Confirm & Invoice", d: "Mark the accepted quotation confirmed and TraWe raises the invoice, links it to the query and locks the numbers." },
      { icon: Receipt, t: "Compliant documents", d: "Sequential numbering with your own prefix, HSN/SAC, place of supply and correct intra/inter-state tax treatment." },
      { icon: Lock, t: "Reopen safely", d: "Need to change a confirmed trip? Reopening voids the linked invoice and keeps a clean audit trail." },
      { icon: Palette, t: "Strong client branding", d: "The invoice PDF leads with your agency's identity, with TraWe kept subtle — or invisible on white-label." },
    ],
    checklist: [
      "Costing sheet per itinerary",
      "Markup by amount or percentage",
      "GST modes: CGST/SGST or IGST",
      "TCS on overseas tour packages",
      "Manual invoices for ad-hoc billing",
      "Sequential numbering with prefixes",
      "Client-branded PDF export",
      "Void, reopen and re-issue",
      "Payment schedule linkage",
      "Costing summary with per-pax breakdown",
    ],
    workflow: [
      { n: "01", t: "Price the itinerary", d: "Service costs roll up; add markup and GST in two fields." },
      { n: "02", t: "Share for approval", d: "Send the PDF on WhatsApp or a client portal link the traveller can accept." },
      { n: "03", t: "Confirm", d: "One click marks the accepted version confirmed and generates the tax invoice." },
      { n: "04", t: "Collect & reconcile", d: "Record payments against the invoice and watch the balance close in Billing." },
    ],
    faqs: [
      { q: "Is TCS supported?", a: "Yes — TCS on overseas packages is calculated alongside GST and shown separately on the costing summary and invoice." },
      { q: "Can I raise an invoice without a quotation?", a: "Yes. Manual invoices let you bill ad-hoc services with live tax calculation." },
      { q: "How is inter-state GST handled?", a: "Place of supply decides CGST/SGST versus IGST automatically; you can override per invoice." },
      { q: "Can I use my own invoice numbering?", a: "Set a prefix and starting number per workspace — TraWe keeps the sequence gapless." },
    ],
    mockup: {
      kind: "document",
      title: "Tax Invoice · INV-2026-0142",
      rows: [
        { a: "Manali 4N/5D — 2 Adults", b: "Package", c: "₹96,000" },
        { a: "Markup", b: "12%", c: "₹11,520" },
        { a: "GST @ 5%", b: "CGST 2.5% + SGST 2.5%", c: "₹5,376" },
        { a: "Grand total", b: "Payable", c: "₹1,12,896", tone: "primary" },
      ],
    },
  },

  {
    slug: "billing-payments",
    name: "Billing & Payments",
    navLabel: "Billing & Payments",
    navBlurb: "Receipts, dues, schedules and reconciliation",
    icon: Wallet,
    kicker: "Billing 2.0",
    h1a: "Know exactly ",
    h1accent: "who owes you what",
    h1b: ", today.",
    intro:
      "Record advances and instalments against every invoice, track dues by date, attach payment proofs and reconcile the whole month without a parallel spreadsheet.",
    metaTitle: "Travel Agency Billing & Payment Tracking — TraWe",
    metaDescription:
      "Track advances, instalments, due dates, bank references and payment proofs against every invoice. Live KPIs for collected, pending and overdue amounts across your agency.",
    stats: [
      { n: "5", l: "live billing KPIs" },
      { n: "Proofs", l: "attached to receipts" },
      { n: "Due dates", l: "with overdue alerts" },
      { n: "₹", l: "multi-currency ready" },
    ],
    panel: [
      { icon: Wallet, t: "Advance and instalment receipts" },
      { icon: CalendarCheck, t: "Payment schedule and due dates" },
      { icon: CreditCard, t: "Razorpay online collection" },
      { icon: Database, t: "Bank, UTR and mode captured" },
      { icon: BarChart3, t: "Collected vs pending KPIs" },
      { icon: Bell, t: "Overdue reminders" },
    ],
    features: [
      { icon: Wallet, t: "Every rupee against a query", d: "Add a payment from the Billing tab with amount, mode, bank, reference and date — the invoice balance updates instantly." },
      { icon: CalendarCheck, t: "Schedules, not guesswork", d: "Set advance and balance due dates; overdue rows are flagged before the traveller departs." },
      { icon: CreditCard, t: "Collect online", d: "Razorpay links from the client portal let travellers pay the advance themselves, and receipts post back automatically." },
      { icon: FileText, t: "Proof on file", d: "Attach a screenshot or bank slip to any receipt so accounts never chase your sales team again." },
      { icon: BarChart3, t: "The month at a glance", d: "Invoiced, collected, pending, overdue and refunded — five KPIs recalculated in real time." },
      { icon: PieChart, t: "Reconciliation-ready exports", d: "Export receipts and invoices for your accountant with GST breakups intact." },
    ],
    checklist: [
      "Multiple part-payments per invoice",
      "Cash, UPI, NEFT, card and cheque modes",
      "Bank name and reference number fields",
      "Payment proof attachments",
      "Due-date tracking with overdue flags",
      "Refunds and adjustments",
      "Razorpay online payments",
      "Per-query and agency-wide views",
      "Live collection KPIs",
      "Excel export for accounting",
    ],
    workflow: [
      { n: "01", t: "Invoice raised", d: "Confirming a quotation creates the invoice and its payment schedule." },
      { n: "02", t: "Advance received", d: "Record it manually or let Razorpay post it from the client portal." },
      { n: "03", t: "Balance tracked", d: "Due dates count down; overdue balances surface on the dashboard." },
      { n: "04", t: "Closed and exported", d: "Once fully paid the query closes clean and the data is ready for your accountant." },
    ],
    faqs: [
      { q: "Can I take part payments?", a: "Yes — unlimited part-payments per invoice, each with its own mode, reference and proof." },
      { q: "Does it integrate with Razorpay?", a: "Yes, for online collection from the client portal and your website." },
      { q: "Can I see agency-wide dues?", a: "The Billing dashboard aggregates invoiced, collected, pending and overdue across all queries." },
      { q: "What about refunds?", a: "Refunds and adjustments are recorded against the invoice and reflected in the KPIs." },
    ],
    mockup: {
      kind: "dashboard",
      title: "Billing overview",
      kpis: [
        { l: "Invoiced", v: "₹42.6L" },
        { l: "Collected", v: "₹31.2L" },
        { l: "Pending", v: "₹9.1L" },
        { l: "Overdue", v: "₹2.3L" },
      ],
      rows: [
        { a: "INV-2026-0142 · Rahul", b: "Due 12 Aug", c: "₹56,448", tone: "primary" },
        { a: "INV-2026-0139 · Aman", b: "Overdue 4d", c: "₹1,20,000", tone: "accent" },
        { a: "INV-2026-0131 · Priya", b: "Paid in full", c: "₹88,300", tone: "muted" },
      ],
    },
  },

  {
    slug: "whatsapp-crm",
    name: "WhatsApp & Marketing",
    navLabel: "WhatsApp & Marketing",
    navBlurb: "2-way inbox, campaigns and automated updates",
    icon: MessageCircle,
    kicker: "Engagement",
    h1a: "Sell where your travellers already are — ",
    h1accent: "WhatsApp",
    h1b: ".",
    intro:
      "A two-way WhatsApp inbox connected to the Cloud API, plus click-to-chat fallbacks, itinerary sharing, campaign broadcasts and email templates — all logged against the right query.",
    metaTitle: "WhatsApp CRM & Marketing for Travel Agencies — TraWe",
    metaDescription:
      "Two-way WhatsApp inbox on the Meta Cloud API, itinerary and invoice sharing, click-to-chat links, broadcast campaigns and branded email templates — logged against every query.",
    stats: [
      { n: "2-way", l: "Cloud API inbox" },
      { n: "4,096", l: "chars per share" },
      { n: "PDF", l: "or rich text share" },
      { n: "Auto", l: "contact name sync" },
    ],
    panel: [
      { icon: MessageCircle, t: "Dual-pane WhatsApp inbox" },
      { icon: Send, t: "Share itinerary, invoice, portal link" },
      { icon: Radio, t: "Broadcast campaigns" },
      { icon: Inbox, t: "IMAP/SMTP email inbox" },
      { icon: Zap, t: "Automated trip updates" },
      { icon: Smartphone, t: "Mobile-first chat view" },
    ],
    features: [
      { icon: MessageCircle, t: "A real inbox, not a link", d: "Connect the Meta WhatsApp Cloud API and your team replies from inside TraWe, with threads matched to queries by phone number." },
      { icon: Send, t: "Share what matters", d: "Send an itinerary as formatted text or a branded PDF, plus invoice and client-portal links — and the quotation flips to Sent automatically." },
      { icon: Radio, t: "Campaigns to past travellers", d: "Segment by destination, season or spend and broadcast offers, then track who opened and replied." },
      { icon: Inbox, t: "Email in the same place", d: "IMAP/SMTP brings supplier and traveller email into the CRM, with branded templates for every event." },
      { icon: Zap, t: "Automations", d: "Payment reminders, trip-start wishes and document requests trigger on schedule without anyone remembering." },
      { icon: Smartphone, t: "Built for the phone", d: "The mobile view opens with the contact list first, so agents can work the inbox on the move." },
    ],
    checklist: [
      "Meta WhatsApp Cloud API integration",
      "wa.me click-to-chat fallback",
      "Contact names synced from queries",
      "Itinerary text and PDF sharing",
      "Invoice and portal link sharing",
      "Broadcast campaigns with segments",
      "IMAP/SMTP email inbox",
      "Branded transactional email templates",
      "Automated reminders and updates",
      "Full message history on the query",
    ],
    workflow: [
      { n: "01", t: "Connect", d: "Add your WhatsApp Cloud API credentials, or start with click-to-chat links." },
      { n: "02", t: "Converse", d: "Reply from the dual-pane inbox; every message is stored on the query timeline." },
      { n: "03", t: "Share", d: "Push itineraries, invoices and portal links in one tap." },
      { n: "04", t: "Re-engage", d: "Broadcast seasonal offers to past travellers and route replies back into the pipeline." },
    ],
    faqs: [
      { q: "Do I need the WhatsApp Business API?", a: "For the two-way inbox, yes — the Meta Cloud API. Without it, TraWe falls back to click-to-chat links that still log the intent." },
      { q: "Will messages be linked to the right query?", a: "Yes, matching is done on the last ten digits of the phone number, so country-code variations still resolve." },
      { q: "Can I send PDFs?", a: "Yes — itinerary and invoice PDFs, or long-form formatted text up to WhatsApp's limit." },
      { q: "Is email included?", a: "Yes, an IMAP/SMTP inbox plus branded templates for quotations, invoices, reminders and trip updates." },
    ],
    mockup: {
      kind: "chat",
      title: "WhatsApp · Rahul Thakur",
      chat: [
        { who: "them", text: "Can you share the Manali plan?" },
        { who: "us", text: "Sent! Manali 4N/5D — itinerary PDF 📎" },
        { who: "them", text: "Looks great. How do I pay the advance?" },
        { who: "us", text: "Here's your portal link — accept and pay ₹25,000." },
      ],
    },
  },

  {
    slug: "masters-suppliers",
    name: "Masters & Suppliers",
    navLabel: "Masters & Suppliers",
    navBlurb: "Hotels, packages, visas, transport and vendors",
    icon: Boxes,
    kicker: "Operations",
    h1a: "Your rate card, ",
    h1accent: "organised once",
    h1b: ", reused forever.",
    intro:
      "Hotels by country, state, city and pincode. Tour packages, visa rules, meal plans, transport, activities and suppliers — the catalogue every quotation and itinerary pulls from.",
    metaTitle: "Travel Masters, Hotels & Supplier Management — TraWe",
    metaDescription:
      "Maintain hotels by country/state/area, tour packages, visas, meal plans, transport, activities and suppliers — with Excel import, media library and supplier communication logs.",
    stats: [
      { n: "12+", l: "master types" },
      { n: "Excel", l: "bulk import" },
      { n: "Pincode", l: "level hotel data" },
      { n: "Logs", l: "for supplier comms" },
    ],
    panel: [
      { icon: Hotel, t: "Hotels by country → area" },
      { icon: Boxes, t: "Tour packages & templates" },
      { icon: FileSignature, t: "Visa rules and documents" },
      { icon: Truck, t: "Transport and transfers" },
      { icon: Building2, t: "Supplier and vendor directory" },
      { icon: Send, t: "Supplier communication log" },
    ],
    features: [
      { icon: Hotel, t: "Hotels, properly indexed", d: "Browse and filter by country → state → area → pincode, with star rating, room types, meal plans and contracted rates." },
      { icon: Boxes, t: "Packages ready to quote", d: "Fixed departures and FIT packages with day plans, inclusions and pricing slabs that flow into a quotation instantly." },
      { icon: Truck, t: "Everything else you sell", d: "Visas, meal plans, activities, transport, cruise and flight bookings — each with its own structured master." },
      { icon: Building2, t: "Suppliers in one directory", d: "Contacts, payment terms and history per vendor, so ops knows who to call when a booking changes." },
      { icon: Send, t: "Supplier communication", d: "Send booking details by email or WhatsApp from the query and keep a permanent log of what was sent, and when." },
      { icon: Download, t: "Import in bulk", d: "Excel import for hotels, packages and rates, plus a media library with Pexels search for imagery." },
    ],
    checklist: [
      "Hotels with country/state/city/area/pincode",
      "Room types, meal plans and rate seasons",
      "Tour packages with day-wise plans",
      "Visa masters with document checklists",
      "Activities and sightseeing",
      "Transport and transfer rates",
      "Cruise and flight booking records",
      "Supplier directory with terms",
      "Supplier communication history",
      "Excel import and image library",
    ],
    workflow: [
      { n: "01", t: "Load your catalogue", d: "Import hotels, packages and rates from Excel or add them one by one." },
      { n: "02", t: "Quote from masters", d: "The itinerary builder picks services straight from your catalogue with costs pre-filled." },
      { n: "03", t: "Confirm with suppliers", d: "Send booking details from the query and log the response." },
      { n: "04", t: "Keep it current", d: "Update a rate once and every new quotation uses it." },
    ],
    faqs: [
      { q: "Can I import my existing hotel list?", a: "Yes — Excel import maps your columns, including location hierarchy and rates." },
      { q: "Are contracted rates supported?", a: "Yes, with seasonal rate bands per room type and meal plan." },
      { q: "Can I store supplier contacts?", a: "The supplier directory holds contacts, payment terms and the full communication log." },
      { q: "Where do images come from?", a: "Upload your own or search Pexels from inside the master form." },
    ],
    mockup: {
      kind: "grid",
      title: "Masters — Hotels",
      rows: [
        { a: "The Himalayan", b: "Manali · Himachal · 175131", c: "5★", tone: "primary" },
        { a: "Snow Valley Resorts", b: "Manali · Himachal · 175131", c: "4★", tone: "muted" },
        { a: "Vivanta Dal View", b: "Srinagar · J&K · 190001", c: "5★", tone: "accent" },
        { a: "Radisson Blu", b: "Kaziranga · Assam · 785609", c: "4★", tone: "muted" },
      ],
    },
  },

  {
    slug: "client-portal",
    name: "Client Portal",
    navLabel: "Client Portal",
    navBlurb: "Travellers view, accept and pay online",
    icon: Globe2,
    kicker: "Client experience",
    h1a: "Let the traveller ",
    h1accent: "accept and pay",
    h1b: " on their own time.",
    intro:
      "Share a secure link and your client sees the full itinerary, pricing and policies in your branding — then accepts the plan and pays the advance without a single phone call.",
    metaTitle: "Client Portal for Travel Itineraries & Payments — TraWe",
    metaDescription:
      "A branded, tokenised client portal where travellers view the day-by-day itinerary, inclusions, pricing and policies, accept the quotation and pay the advance online.",
    stats: [
      { n: "Secure", l: "tokenised links" },
      { n: "Mobile", l: "first design" },
      { n: "Accept", l: "and pay online" },
      { n: "Auto", l: "marks quote as sent" },
    ],
    panel: [
      { icon: Globe2, t: "Branded shareable link" },
      { icon: Map, t: "Day-by-day itinerary view" },
      { icon: FileSignature, t: "Digital acceptance" },
      { icon: CreditCard, t: "Pay advance via Razorpay" },
      { icon: Bell, t: "View notifications to the agent" },
      { icon: Palette, t: "Your logo, not ours" },
    ],
    features: [
      { icon: Globe2, t: "One link, everything inside", d: "Itinerary, hotels, inclusions, exclusions, policies and pricing — presented cleanly on any device." },
      { icon: FileSignature, t: "Acceptance you can prove", d: "The traveller confirms on the portal; the quotation is marked confirmed and the invoice is generated." },
      { icon: CreditCard, t: "Advance collected instantly", d: "Razorpay checkout on the portal posts the receipt straight into Billing against the right invoice." },
      { icon: Bell, t: "Know when they looked", d: "First view flips the quotation to Sent and notifies the owning agent, so follow-ups are timed right." },
      { icon: Palette, t: "Fully white-label", d: "Agency logo, colours and contact details. On white-label plans TraWe's name never appears." },
      { icon: Lock, t: "Private by design", d: "Each portal link carries a unique token scoped to one itinerary — no login, no data leakage." },
    ],
    checklist: [
      "Tokenised, no-login access",
      "Day-by-day itinerary presentation",
      "Hotel details with check-in/out times",
      "Inclusions, exclusions and policies",
      "Transparent pricing summary",
      "Accept / request changes actions",
      "Razorpay advance payment",
      "Automatic Sent tracking",
      "Agency branding throughout",
      "Mobile-optimised layout",
    ],
    workflow: [
      { n: "01", t: "Share the link", d: "From the itinerary header, on WhatsApp or by email." },
      { n: "02", t: "Client reviews", d: "They read the full plan on their phone, at their own pace." },
      { n: "03", t: "Accept", d: "One tap confirms the itinerary and triggers the GST invoice." },
      { n: "04", t: "Pay", d: "Advance paid online lands in Billing with the receipt attached." },
    ],
    faqs: [
      { q: "Does the client need an account?", a: "No. The link carries a secure token; there is nothing to install or sign up for." },
      { q: "Can they request changes?", a: "Yes — change requests come back to the agent, who can prompt-edit the itinerary and re-share." },
      { q: "Is TraWe branding visible?", a: "Your branding leads everywhere, and on white-label plans TraWe is entirely hidden." },
      { q: "What happens after they accept?", a: "The quotation is confirmed, the GST invoice is generated and the payment schedule starts." },
    ],
    mockup: {
      kind: "document",
      title: "Client portal · Manali 4N/5D",
      rows: [
        { a: "Day 1", b: "Arrival · Snow Valley Resorts", c: "MAP" },
        { a: "Day 2", b: "Solang Valley + paragliding", c: "MAP" },
        { a: "Day 3", b: "Atal Tunnel · Sissu", c: "MAP" },
        { a: "Total payable", b: "2 adults · all taxes", c: "₹1,12,896", tone: "primary" },
      ],
    },
  },

  {
    slug: "desktop-app",
    name: "Windows Desktop App",
    navLabel: "Windows Desktop App",
    navBlurb: "TraWe as a native app on your team's PCs",
    icon: Monitor,
    kicker: "Desktop",
    h1a: "TraWe on the desktop — ",
    h1accent: "one click from the taskbar",
    h1b: ".",
    intro:
      "A native Windows build of the full CRM, with tray icon, launch on startup and a dedicated window that keeps your team out of the browser tab jungle.",
    metaTitle: "TraWe Windows Desktop App for Travel Agencies",
    metaDescription:
      "Install TraWe as a native Windows application — full CRM, tray icon, launch on startup, dedicated window and the same live data as the web workspace.",
    stats: [
      { n: "Windows", l: "installer (.exe)" },
      { n: "Tray", l: "always available" },
      { n: "Startup", l: "auto-launch" },
      { n: "Same", l: "live data" },
    ],
    panel: [
      { icon: Monitor, t: "Dedicated app window" },
      { icon: Zap, t: "Launch on Windows startup" },
      { icon: Bell, t: "System tray access" },
      { icon: Smartphone, t: "PWA install on Android & iOS" },
      { icon: ShieldCheck, t: "Same security model as web" },
      { icon: Download, t: "Simple .exe installer" },
    ],
    features: [
      { icon: Monitor, t: "Not a browser tab", d: "The whole CRM in a focused desktop window your agents can alt-tab to, with no accidental tab closures." },
      { icon: Bell, t: "Tray + startup", d: "TraWe sits in the system tray and can launch when Windows boots, so the workday starts inside the pipeline." },
      { icon: Database, t: "Always the same data", d: "It's the same workspace as the web app — no sync step, no offline conflicts to resolve." },
      { icon: Smartphone, t: "Mobile covered too", d: "Install the PWA on Android and iOS for the same experience on the road." },
      { icon: ShieldCheck, t: "Secure by default", d: "External links open in the system browser; sessions follow the same role-based rules." },
      { icon: Download, t: "Easy rollout", d: "One installer to distribute across your office machines." },
    ],
    checklist: [
      "Windows .exe installer",
      "Dedicated application window",
      "System tray icon and menu",
      "Launch on startup option",
      "External links open in the browser",
      "Automatic updates from the web app",
      "Android and iOS PWA install",
      "Same roles and permissions",
      "Works on multi-monitor setups",
      "No separate licence to manage",
    ],
    workflow: [
      { n: "01", t: "Download", d: "Grab the Windows installer from your workspace settings." },
      { n: "02", t: "Install", d: "Run the .exe on each agent's machine — under a minute." },
      { n: "03", t: "Sign in", d: "Same credentials, same workspace, same permissions." },
      { n: "04", t: "Work", d: "Pin it to the taskbar and let it start with Windows." },
    ],
    faqs: [
      { q: "Is there a Mac version?", a: "Windows is available today. Mac users can install the PWA from the browser for a near-native window." },
      { q: "Does it work offline?", a: "No — TraWe is a live multi-user CRM and needs a connection, the same as the web app." },
      { q: "How do updates work?", a: "The desktop app loads the current version of your workspace, so updates arrive automatically." },
      { q: "Any extra cost?", a: "No. The desktop app is included with your workspace." },
    ],
    mockup: {
      kind: "dashboard",
      title: "TraWe for Windows",
      kpis: [
        { l: "Open queries", v: "48" },
        { l: "Follow-ups", v: "12" },
        { l: "Departures", v: "7" },
        { l: "Dues", v: "₹9.1L" },
      ],
      rows: [
        { a: "Tray icon", b: "Always available", c: "On", tone: "primary" },
        { a: "Launch at startup", b: "Windows boot", c: "On", tone: "muted" },
        { a: "External links", b: "System browser", c: "On", tone: "muted" },
      ],
    },
  },

  {
    slug: "white-label-saas",
    name: "White-Label SaaS",
    navLabel: "White-Label SaaS",
    navBlurb: "Run TraWe under your own brand and domain",
    icon: Palette,
    kicker: "White label",
    h1a: "Your brand on the front. ",
    h1accent: "TraWe underneath",
    h1b: ".",
    intro:
      "Run the entire platform on your own domain with your logo, colours and email templates — for agencies who want their own product, and for consultancies reselling to a network.",
    metaTitle: "White-Label Travel CRM Platform — TraWe",
    metaDescription:
      "Run TraWe under your own brand: custom domain with CNAME verification, your logo and palette, branded emails, PDFs and client portal, plus multi-tenant super-admin controls.",
    stats: [
      { n: "Your", l: "domain & logo" },
      { n: "CNAME", l: "verified setup" },
      { n: "Multi", l: "tenant control" },
      { n: "0", l: "TraWe branding" },
    ],
    panel: [
      { icon: Globe2, t: "app.yourdomain.com" },
      { icon: Palette, t: "Logo, colours and favicon" },
      { icon: FileText, t: "Branded PDFs and emails" },
      { icon: Users2, t: "Tenant provisioning" },
      { icon: KeyRound, t: "Role-based access control" },
      { icon: ShieldCheck, t: "India-hosted, DPDP-aligned" },
    ],
    features: [
      { icon: Globe2, t: "Your own domain", d: "Point a CNAME, we verify it and issue SSL — your team and your clients only ever see your address." },
      { icon: Palette, t: "Brand everywhere", d: "Logo and palette applied across the dashboard, login, client portal, itinerary PDFs, invoices and transactional emails." },
      { icon: Users2, t: "Tenant management", d: "Provision workspaces, set plans and seats, suspend or extend access from a super-admin console." },
      { icon: BarChart3, t: "Oversight built in", d: "Usage, AI consumption, billing status and system health across every tenant you run." },
      { icon: Workflow, t: "Per-tenant configuration", d: "Document prefixes, currencies, GST defaults, AI provider keys and feature access set individually." },
      { icon: ShieldCheck, t: "Isolation by default", d: "Row-level security keeps each tenant's data strictly separate, with an audit trail on privileged actions." },
    ],
    checklist: [
      "Custom domain with CNAME verification",
      "Logo, favicon and colour palette",
      "Branded login and dashboard",
      "Branded client portal and PDFs",
      "Branded transactional emails",
      "Super-admin tenant console",
      "Plan, seat and expiry management",
      "Per-tenant AI provider keys",
      "Usage and health monitoring",
      "Row-level tenant isolation",
    ],
    workflow: [
      { n: "01", t: "Talk to us", d: "We map your brand, domains and how many workspaces you expect to run." },
      { n: "02", t: "Brand setup", d: "Logo, palette, email sender and document prefixes configured for you." },
      { n: "03", t: "Domain verification", d: "Add the CNAME; we verify and issue SSL for your CRM and portal." },
      { n: "04", t: "Go live", d: "Provision tenants from the super-admin console and start onboarding." },
    ],
    faqs: [
      { q: "Will my clients see TraWe anywhere?", a: "No. On white-label plans the branding, domain, emails and documents are entirely yours." },
      { q: "Can I resell to multiple agencies?", a: "Yes — the super-admin console is built for provisioning and managing many tenants." },
      { q: "Where is the data hosted?", a: "In India, with row-level isolation per tenant and export available at any time." },
      { q: "How long does setup take?", a: "Brand and domain setup is typically completed within a week of DNS access." },
    ],
    mockup: {
      kind: "dashboard",
      title: "Super admin · Tenants",
      kpis: [
        { l: "Tenants", v: "36" },
        { l: "Active", v: "31" },
        { l: "Trials", v: "4" },
        { l: "MRR", v: "₹6.4L" },
      ],
      rows: [
        { a: "Sunrise Holidays", b: "app.sunrise.co.in", c: "Active", tone: "primary" },
        { a: "Voyager Trips", b: "crm.voyager.in", c: "Trial", tone: "accent" },
        { a: "BlueSky Travels", b: "app.bluesky.travel", c: "Active", tone: "muted" },
      ],
    },
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** Extra nav entries that live on their own routes. */
export const EXTRA_NAV_PRODUCTS = [
  {
    to: "/travel-website-development",
    label: "Travel Website Development",
    blurb: "SEO-ready website wired into your CRM",
    icon: Globe2,
  },
] as const;