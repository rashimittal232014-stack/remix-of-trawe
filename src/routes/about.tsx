import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/app/marketing-nav";
import { MarketingFooter } from "@/routes/features";
import {
  ArrowRight, Compass, Heart, Rocket, ShieldCheck, Sparkles, Users2,
  Zap, Globe2, Code2, MessageCircle, Target, Eye, HandHeart,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  component: Page,
  head: () => ({
    meta: [
      { title: "About TraWe — the travel CRM built by travel people" },
      { name: "description", content: "TraWe is an AI-native travel CRM built in India for travel agencies, DMCs, tour operators and wholesalers. Our story, mission, values and the team behind the platform." },
      { property: "og:title", content: "About TraWe — built in India for the travel trade" },
      { property: "og:description", content: "Why we built an AI-native travel CRM, what we believe, and how we work with the agencies that run on TraWe every day." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/about" }],
  }),
});

const STATS = [
  { k: "10+", v: "Modules in one platform" },
  { k: "Unlimited", v: "Users on every plan" },
  { k: "<1 week", v: "Typical go-live time" },
  { k: "100%", v: "Data hosted in India" },
];

const VALUES = [
  { icon: Zap, t: "Speed over ceremony", d: "A quotation should take three minutes, not thirty. Every screen we ship is measured against how fast it gets an agent to 'sent'." },
  { icon: HandHeart, t: "The agency owns the brand", d: "Your client sees your logo on every itinerary, voucher and invoice. We stay invisible where it matters." },
  { icon: ShieldCheck, t: "Boring reliability", d: "Row-level security, per-tenant isolation, India-hosted data and audited access. Trust is the product." },
  { icon: MessageCircle, t: "Answer the phone", d: "Real humans who understand FIT, GIT, DMC margins and GST — not a chatbot that recycles help articles." },
  { icon: Code2, t: "Flexibility by design", d: "Custom fields, custom templates, custom workflows. We adapt to your process instead of asking you to change it." },
  { icon: Sparkles, t: "AI where it earns its keep", d: "AI that drafts itineraries and finds live rates — not gimmicks bolted on for a launch announcement." },
];

const TIMELINE = [
  { y: "The problem", t: "Spreadsheets, WhatsApp and lost leads", d: "We watched agencies run six-figure trips out of a shared Excel file, a personal WhatsApp and a folder of Word itineraries. Enquiries went cold because nobody remembered to follow up." },
  { y: "The build", t: "One workspace, end to end", d: "TraWe started as a query tracker and grew into the full chain — itinerary builder, quotations, confirmations, GST invoices, payments and reporting, all sharing one database." },
  { y: "The leap", t: "AI-native, not AI-sprinkled", d: "We wired Gemini, ChatGPT and Claude into the core so an agent can chat-build a day-by-day itinerary, edit it by prompt, and pull live flight and hotel options while the client is still on the call." },
  { y: "Today", t: "A platform, on every device", d: "Web, installable PWA, Android APK and a Windows desktop app — plus white-label deployments running on agencies' own domains." },
];

const AUDIENCE = [
  { icon: Users2, t: "Retail agencies (B2C)", d: "Capture enquiries from every channel and convert them with instant, beautiful quotations." },
  { icon: Globe2, t: "DMCs", d: "Ground operations, supplier contracting and instant vouchers with localised control." },
  { icon: Compass, t: "Tour operators", d: "Fixed departures, group travel and trip-level accounting on a smart calendar." },
  { icon: Rocket, t: "B2B wholesalers", d: "Sub-agent portals, dynamic markups and fully white-labelled documents." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary" /> About us
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">
            We build software for the people who build holidays
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            TraWe is an AI-native travel CRM, made in India, for travel agencies, DMCs, tour operators
            and wholesalers. One workspace that carries a traveller from the first WhatsApp message all
            the way to a GST-compliant invoice — without a single spreadsheet in between.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/features"><Button size="lg" variant="outline">See the platform</Button></Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.v} className="rounded-2xl border bg-card/70 backdrop-blur p-5">
                <div className="text-3xl font-semibold tracking-tight text-primary">{s.k}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-8">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Our mission</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              To give every travel business — from a two-person agency in Indore to a multi-branch DMC —
              the same operating power that only large OTAs could afford. Affordable, unlimited-user
              software that removes the busywork and puts selling back at the centre of the day.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <Eye className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Our vision</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              A travel trade where no enquiry is ever lost, no itinerary is retyped, and no invoice is
              raised by hand. Where AI drafts the first version and a human expert makes it unforgettable —
              because judgement, taste and relationships are what travellers actually pay for.
            </p>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="border-b bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How TraWe came to be</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {TIMELINE.map((s, i) => (
              <div key={s.y} className="relative rounded-2xl border bg-card p-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">{s.y}</div>
                <div className="mt-2 font-medium">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                <div className="absolute -top-3 right-5 grid h-7 w-7 place-items-center rounded-full border bg-background font-mono text-[11px]">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">What we believe</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Six principles that decide what we ship — and what we refuse to.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.t} className="rounded-2xl border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </span>
                <div className="mt-4 font-semibold">{v.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Who we build for</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {AUDIENCE.map((a) => (
              <div key={a.t} className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-6">
                <a.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-medium">{a.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-14">
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Come see it working</h2>
                <p className="mt-3 text-muted-foreground">A 30-minute demo on your destinations, your pricing and your document formats.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
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
