import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/app/marketing-nav";
import { MarketingFooter } from "@/routes/features";
import {
  ArrowRight, Bot, Building2, Cloud, Globe, LayoutTemplate, Palette,
  PlugZap, Search, ShieldCheck, Smartphone, Sparkles, Users2, Wrench,
  Database, Headphones, GraduationCap, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/services")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Services — Travel CRM, Websites, Apps & AI · TraWe" },
      { name: "description", content: "End-to-end services for travel businesses: Travel CRM software, B2B & B2C editions, website design, mobile apps, AI automation, API integrations, SEO, hosting, data migration and 24x7 support." },
      { property: "og:title", content: "TraWe Services — everything a travel business needs to run online" },
      { property: "og:description", content: "CRM, B2B/B2C editions, websites, mobile apps, AI automation, API integrations, SEO, migration and support — delivered by one team." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/services" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/services" }],
  }),
});

const SERVICES = [
  { icon: LayoutTemplate, name: "Travel CRM Software", blurb: "The core TraWe platform — queries, itinerary builder, quotations, GST invoices, payments and reporting in one workspace built for Indian travel agencies.", points: ["Query → itinerary → invoice pipeline", "Unlimited users on every plan", "Made-in-India data residency"] },
  { icon: Building2, name: "B2B Travel Software", blurb: "For wholesalers and consolidators — sub-agent portals, dynamic markups, credit limits and white-labelled documents for your agent network.", points: ["Sub-agent logins", "Per-agent markup rules", "White-label vouchers"] },
  { icon: Users2, name: "B2C Travel Software", blurb: "For retail agencies selling directly to travellers — omnichannel lead capture, instant quotes, follow-up automation and a signable client portal.", points: ["WhatsApp & web lead sync", "One-click quotations", "Client approval portal"] },
  { icon: Globe, name: "Web Design & Development", blurb: "Fully responsive travel websites with package CMS, enquiry forms wired straight into your CRM, blog and payment gateway.", points: ["Package & destination CMS", "Forms post directly to TraWe", "Core Web Vitals tuned"] },
  { icon: Smartphone, name: "Mobile Applications", blurb: "Android APK and installable iOS/desktop PWA builds of your CRM so your team can sell from the airport lounge, not just the desk.", points: ["Android APK build", "iOS home-screen PWA", "Windows desktop installer"] },
  { icon: Bot, name: "AI Automation", blurb: "Gemini, ChatGPT or Claude wired into your workflow — AI itinerary copilot, live flight & hotel search, smart summaries and reply drafting.", points: ["AI itinerary builder", "Bring-your-own AI key", "Grounded live search"] },
  { icon: PlugZap, name: "API Integration", blurb: "Connect supplier APIs, payment gateways, accounting tools, IVR and Meta lead ads so data flows without a single copy-paste.", points: ["Razorpay & payment links", "Meta lead-ads sync", "Accounting & Tally exports"] },
  { icon: Palette, name: "Branding & Graphic Design", blurb: "Logos, brand palettes and beautifully formatted itinerary, voucher and invoice templates that carry your identity, not ours.", points: ["Document template design", "Logo & brand kit", "Social creatives"] },
  { icon: Search, name: "SEO & Growth", blurb: "Technical SEO, destination content clusters and landing pages engineered to rank for the keywords that actually convert into enquiries.", points: ["Technical audit & fixes", "Destination content plan", "Conversion tracking"] },
  { icon: Cloud, name: "Domain & Hosting", blurb: "Domain registration, DNS, SSL and managed hosting — including running your whole CRM on your own branded domain.", points: ["Custom domain CRM", "Free SSL & CDN", "Managed uptime"] },
  { icon: Database, name: "Data Migration", blurb: "We move your existing leads, hotels, suppliers and past bookings from spreadsheets or your old CRM — cleaned, mapped and verified.", points: ["Excel & CSV bulk import", "Legacy CRM extraction", "Duplicate cleanup"] },
  { icon: ShieldCheck, name: "White-Label SaaS", blurb: "Resell TraWe under your own brand with your domain, logo, colours and pricing — we handle the infrastructure behind the scenes.", points: ["Your domain & branding", "Tenant provisioning", "Revenue share model"] },
];

const PROCESS = [
  { n: "01", t: "Discovery call", d: "We map your current workflow, team size, document formats and the gaps costing you bookings." },
  { n: "02", t: "Tailored demo", d: "A live walkthrough on a sandbox loaded with your destinations and your pricing — not a generic slide deck." },
  { n: "03", t: "Setup & migration", d: "Branding, users, masters, templates and your existing data imported and verified before go-live." },
  { n: "04", t: "Training & launch", d: "Role-based training for sales and ops, then a guided first week with our team on call." },
  { n: "05", t: "Ongoing support", d: "Priority support, feature requests and quarterly reviews so the system keeps pace with your growth." },
];

const ADDONS = [
  { icon: Headphones, t: "Priority support", d: "WhatsApp, email and call support with defined response SLAs." },
  { icon: GraduationCap, t: "Team training", d: "Live onboarding sessions plus recorded modules for new joiners." },
  { icon: Wrench, t: "Custom development", d: "Bespoke fields, modules and workflows engineered for your operation." },
  { icon: Sparkles, t: "Managed content", d: "Ready-made itinerary templates for your top-selling destinations." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Services
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl">
            Everything your travel business needs — from one team
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Unlock your travel business's full potential with our complete range of travel CRM services.
            From software and websites to AI automation, integrations and migration, we deliver tailored
            solutions that streamline operations, strengthen customer relationships and grow revenue.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Book a free demo <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/products"><Button size="lg" variant="outline">Explore products</Button></Link>
          </div>
        </div>
      </section>

      {/* SERVICE GRID */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.name} className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:-translate-y-0.5">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition" />
                <div className="relative">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight">{s.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.blurb}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground/80">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-t bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">How we work with you</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">No 6-month implementation projects. Most agencies are live and quoting within a week.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {PROCESS.map((p) => (
              <div key={p.n} className="rounded-2xl border bg-card p-5">
                <div className="font-mono text-xs text-primary">{p.n}</div>
                <div className="mt-2 font-medium">{p.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADDONS */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Add-ons that keep you moving</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {ADDONS.map((a) => (
              <div key={a.t} className="rounded-2xl border bg-card p-6">
                <a.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 font-medium">{a.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-14">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Tell us what you need built</h2>
                <p className="mt-3 text-muted-foreground">Share your workflow and we'll come back with a scoped plan and timeline — usually within 24 hours.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact"><Button size="lg" className="gap-1.5">Talk to us <ArrowRight className="h-4 w-4" /></Button></Link>
                <Link to="/compare"><Button size="lg" variant="outline">Compare with others</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
