import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/app/marketing-nav";
import { MarketingFooter } from "@/routes/features";
import {
  ArrowRight, Bell, Bot, Check, Building2, Globe2, Compass, Rocket,
  ShieldCheck, Sparkles, Users2, X, Wallet, Layers, Wrench, Scale,
} from "lucide-react";

export const Route = createFileRoute("/compare")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Compare TraWe with other travel CRMs — feature by feature" },
      { name: "description", content: "See how TraWe compares with other travel CRM software: unlimited users, AI itinerary copilot, live flight & hotel search, GST invoicing, WhatsApp inbox, white-labelling and true customisation." },
      { property: "og:title", content: "Why agencies switch to TraWe" },
      { property: "og:description", content: "Unlimited users, AI-native itineraries, live search, GST-ready billing and real customisation — compared honestly against typical travel CRMs." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/compare" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/compare" }],
  }),
});

const PILLARS = [
  { icon: Bell, t: "Zero-leakage leads", d: "SLA timers, overdue alerts and automated follow-up reminders so no enquiry ever goes cold." },
  { icon: Wrench, t: "Unmatched flexibility", d: "Custom fields, custom documents and bespoke modules — we adapt to your workflow, not the other way round." },
  { icon: Layers, t: "Unified operations", d: "Queries, itineraries, hotels, billing, payments and WhatsApp share a single database. No re-typing." },
  { icon: Bot, t: "AI that actually sells", d: "Chat-build and chat-edit itineraries, pull live flight and hotel options, draft replies in seconds." },
];

type Row = { f: string; trawe: string; others: string; ok?: boolean };
const TABLE: { group: string; rows: Row[] }[] = [
  {
    group: "Commercials",
    rows: [
      { f: "User licensing", trawe: "Unlimited users on every plan", others: "Per-user monthly licence fees" },
      { f: "Growth cost", trawe: "Add 20 agents, price unchanged", others: "Bill scales with headcount" },
      { f: "Contract", trawe: "Monthly or annual, no lock-in", others: "Long annual lock-ins common" },
    ],
  },
  {
    group: "AI & automation",
    rows: [
      { f: "AI itinerary builder", trawe: "Conversational build + prompt editing", others: "Manual day-by-day entry" },
      { f: "Live flight & hotel search", trawe: "Grounded live search inside the CRM", others: "Open another tab" },
      { f: "Bring your own AI key", trawe: "Gemini, ChatGPT or Claude", others: "Locked vendor or none" },
      { f: "Automated follow-ups", trawe: "SLA alerts + payment reminders", others: "Basic task list" },
    ],
  },
  {
    group: "Operations",
    rows: [
      { f: "Hotel rate book", trawe: "Country → State → Area → Pincode, meal-plan rates", others: "Flat hotel list" },
      { f: "Quotation to invoice", trawe: "One-click Confirm & Invoice", others: "Re-enter into accounting" },
      { f: "GST compliance", trawe: "CGST/SGST/IGST, TCS, GSTR-1 export", others: "Partial or add-on" },
      { f: "Client approval portal", trawe: "Signable link for the traveller", others: "Email a PDF and hope" },
      { f: "WhatsApp", trawe: "2-way inbox + Cloud API", others: "wa.me link at best" },
    ],
  },
  {
    group: "Branding & platform",
    rows: [
      { f: "White-labelling", trawe: "Your domain, logo, colours, documents", others: "Vendor branding on documents" },
      { f: "Apps", trawe: "Web, PWA, Android APK, Windows desktop", others: "Web only" },
      { f: "Customisation requests", trawe: "Bespoke fields and modules built", others: "\"Not on our roadmap\"" },
      { f: "Data residency", trawe: "Hosted in India, per-tenant isolation", others: "Varies / undisclosed" },
    ],
  },
];

const MODELS = [
  { icon: Building2, t: "B2B operations", d: "Manage sub-agents, automate supplier communication and streamline wholesale bookings.", pts: ["Sub-agent portal", "Dynamic markups", "White-label branding"] },
  { icon: Users2, t: "B2C operations", d: "Capture direct traveller enquiries, send beautiful itineraries and convert faster.", pts: ["Omni-channel lead sync", "Instant smart quotes", "Automated follow-ups"] },
  { icon: Globe2, t: "DMC management", d: "Handle ground operations, destination logistics and local suppliers flawlessly.", pts: ["Supplier contracting", "Ground ops control", "Instant vouchers"] },
  { icon: Compass, t: "Tour operators", d: "Group travel, fixed departures and trip-level accounting on one calendar.", pts: ["Fixed departures", "Smart tour calendar", "Trip-level accounting"] },
];

const CUSTOM = [
  { n: "01", t: "Expand data fields", d: "Add custom fields to capture specialised traveller details without waiting for a release." },
  { n: "02", t: "Bespoke feature development", d: "Our team engineers specialised modules and tools on request." },
  { n: "03", t: "Tailored integrations", d: "Connect accounting apps, supplier APIs, payment gateways or external web forms." },
  { n: "04", t: "Flexible documents", d: "Redesign invoices, vouchers and itineraries to carry your brand identity." },
];

const FAQ = [
  { q: "Does the system send notifications?", a: "Yes. TraWe triggers smart alerts for unattended queries, scheduled follow-ups, client callbacks and pending payment schedules — for both collections and supplier payouts. You will never rely on sticky notes to close a booking again." },
  { q: "Will it scale as my team grows?", a: "Every plan includes unlimited users. Whether you run 5 agents or 200, your whole team collaborates on one platform without escalating licence costs." },
  { q: "Can I keep my existing workflow?", a: "Yes. Custom fields, custom stages and custom document templates mean the software bends to your process. Where something genuinely doesn't exist, our team can build it." },
  { q: "How long does migration take?", a: "Most agencies go live within a week. We import your leads, hotels, suppliers and past bookings from Excel or your old CRM, then train your team before switch-over." },
  { q: "Is my data safe?", a: "Data is hosted in India with per-tenant isolation and row-level security. Only your agency can see your records — enforced at the database layer, not just the UI." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-primary" /> Compare
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">
            Why travel agencies are switching to TraWe
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Stop losing leads and burning hours on manual work. Here are the pillars that automate your
            sales, simplify ground operations and scale your travel business — compared honestly against
            the clunky systems most agencies are stuck with.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Start scaling today <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/features"><Button size="lg" variant="outline">See all features</Button></Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="rounded-2xl border bg-card/70 backdrop-blur p-5">
                <p.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-medium">{p.t}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">TraWe vs. typical travel CRMs</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Travel professionals are abandoning outdated systems because TraWe is engineered for speed,
            transparency and real customisation.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-[1.1fr_1.3fr_1.1fr] bg-secondary/50 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <div className="px-4 py-3">Capability</div>
              <div className="px-4 py-3 text-primary">TraWe</div>
              <div className="px-4 py-3">Typical others</div>
            </div>
            {TABLE.map((g) => (
              <div key={g.group}>
                <div className="border-t bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {g.group}
                </div>
                {g.rows.map((r) => (
                  <div key={r.f} className="grid grid-cols-[1.1fr_1.3fr_1.1fr] border-t text-sm">
                    <div className="px-4 py-4 font-medium">{r.f}</div>
                    <div className="px-4 py-4 flex items-start gap-2 bg-primary/[0.04]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{r.trawe}</span>
                    </div>
                    <div className="px-4 py-4 flex items-start gap-2 text-muted-foreground">
                      <X className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                      <span>{r.others}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS MODELS */}
      <section className="border-b bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Comprehensive business model support</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Stop jumping between disjointed tools and spreadsheets. One unified platform, whatever your model.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => (
              <div key={m.t} className="rounded-2xl border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                  <m.icon className="h-5 w-5 text-primary" />
                </span>
                <div className="mt-4 font-semibold">{m.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.d}</p>
                <ul className="mt-4 space-y-1.5">
                  {m.pts.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCALES WITHOUT EXTRA COST */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-8">
            <Wallet className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Scales without extra cost</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Most systems penalise growth with per-user licence fees. TraWe flips the model: unlimited
              user access for your entire team under one transparent plan. Twenty agents or two hundred —
              everyone collaborates without you watching the software bill climb.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Nothing slips through</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              In travel, a missed follow-up is lost revenue. TraWe acts as an automated assistant with
              alerts for unattended queries, scheduled callbacks, and both client collections and supplier
              payment schedules — so the pipeline keeps moving on its own.
            </p>
          </div>
        </div>
      </section>

      {/* CUSTOMISATION */}
      <section className="border-b bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Software customisation
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight max-w-3xl">
            Technology that adapts to your business
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
            Most travel CRMs work backwards — they force you to change your process to fit a rigid system,
            and answer custom requests with a flat "no". TraWe is built with the flexibility and technical
            headroom to accommodate what your operation actually needs.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {CUSTOM.map((c) => (
              <div key={c.n} className="rounded-2xl border bg-card p-6">
                <div className="font-mono text-xs text-primary">{c.n}</div>
                <div className="mt-2 font-medium">{c.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Questions agencies ask before switching</h2>
          <div className="mt-8 divide-y rounded-2xl border bg-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="cursor-pointer list-none font-medium flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-14">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Ready to put your travel business on auto-pilot?</h2>
                <p className="mt-3 text-muted-foreground">See TraWe side by side with what you use today — on your own destinations and pricing.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact"><Button size="lg" className="gap-1.5">Book your free demo <Rocket className="h-4 w-4" /></Button></Link>
                <Link to="/services"><Button size="lg" variant="outline">Our services</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
