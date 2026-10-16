import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "./features";
import {
  ArrowRight, Search, LayoutDashboard, FileText, CreditCard, Globe2, Palette,
  Smartphone, ShieldCheck, Sparkles, Hotel, Plane, MessageCircle, CheckCircle2,
  Zap, Gauge, Users, Receipt,
} from "lucide-react";

export const Route = createFileRoute("/travel-website-development")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Travel Website Development for Agencies — TraWe" },
      { name: "description", content: "TraWe builds SEO-friendly, white-label travel websites wired straight into your CRM — packages, enquiry forms, Razorpay payments, blogs and AI itineraries sync live from your TraWe workspace." },
      { property: "og:title", content: "Travel Website Development — powered by the TraWe CRM" },
      { property: "og:description", content: "A booking-ready travel website on your own domain: packages, destination pages, enquiry capture into the CRM, Razorpay payments, AI itineraries and GST invoicing — one connected stack." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/travel-website-development" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/travel-website-development" }],
  }),
});

const INCLUSIONS = [
  { icon: Search, t: "SEO-friendly by default", d: "Server-rendered pages, per-page titles and meta, clean canonical URLs, sitemap.xml and JSON-LD schema — so Google indexes every destination and package page you publish." },
  { icon: LayoutDashboard, t: "Complete CMS — inside your CRM", d: "No separate admin. Your Website tab in TraWe controls the hero, pages, packages, testimonials and contact details. Publish changes without touching code." },
  { icon: FileText, t: "Blog & content engine", d: "Long-form blogs, destination guides and FAQs with structured data. Publish from TraWe and each post gets its own indexable route and share preview." },
  { icon: Hotel, t: "Live packages & hotels", d: "Tour packages, hotel masters and activities from your CRM masters render straight onto the site — update the rate card once, the website follows." },
  { icon: CreditCard, t: "Razorpay payment gateway", d: "Take advances or full payments online. Every receipt lands in the TraWe Billing module against the right query with GST treatment applied." },
  { icon: MessageCircle, t: "Enquiry → CRM in one hop", d: "Website forms, WhatsApp click-to-chat and callback requests create a Query in TraWe instantly, with source attribution and auto-assignment." },
];

const FEATURES = [
  "Responsive on mobile, tablet and desktop",
  "Unlimited packages, hotels, activities",
  "Destination landing pages",
  "Automated package PDF from the itinerary builder",
  "Rapid search across packages and destinations",
  "Customer reviews and testimonials",
  "Your logo, colours and domain (white-label)",
  "SSL, India-hosted data, DPDP-aligned",
  "Blog with categories and schema markup",
  "WhatsApp floating button + click-to-chat",
  "Google Analytics & Search Console ready",
  "Lead forms mapped to CRM pipelines",
];

const PROCESS = [
  { n: "01", t: "Understand your brand", d: "We map your destinations, best-selling packages, pricing style and the enquiries you actually want more of." },
  { n: "02", t: "Pick a theme & structure", d: "Choose a layout, then we lock the sitemap — home, destinations, packages, about, blog, contact." },
  { n: "03", t: "Build & connect the CRM", d: "Your site is wired to your TraWe workspace: masters, packages, forms and payments all point at one database." },
  { n: "04", t: "Content & SEO pass", d: "Titles, meta descriptions, alt text, schema, sitemap and page speed tuned before anything goes live." },
  { n: "05", t: "Domain & go live", d: "Point your CNAME, we verify the custom domain, issue SSL and publish. Your CRM runs on app.yourdomain.com." },
  { n: "06", t: "Support & iterate", d: "Ongoing edits from the CMS, plus our team on WhatsApp and email for anything structural." },
];

const WHY = [
  { icon: Zap, t: "Website + CRM, never out of sync", d: "Most agencies run a website from one vendor and a CRM from another. TraWe ships both — one login, one source of truth." },
  { icon: Sparkles, t: "AI baked into the funnel", d: "An enquiry becomes an AI-drafted itinerary in minutes: chat-build the plan, chat-edit any day, share a signed client portal link." },
  { icon: Receipt, t: "GST-correct from day one", d: "Payments taken online flow into GST invoices with CGST/SGST/IGST and TCS handled — no re-keying into Tally." },
  { icon: Gauge, t: "Fast, indexed, measurable", d: "Server-rendered pages, Core Web Vitals in mind, and every lead attributed back to the page that produced it." },
  { icon: Palette, t: "Truly white-label", d: "Your brand on the site, the client portal, the itinerary PDF, the invoice and the WhatsApp message. TraWe stays invisible." },
  { icon: ShieldCheck, t: "Owned by you", d: "Your domain, your content, your customer data — exportable any time. No lock-in on the content you create." },
];

const FAQS = [
  { q: "How long does a TraWe travel website take?", a: "A standard theme-based site goes live in 7–10 working days once we have your logo, package content and domain access. Custom layouts take 3–4 weeks." },
  { q: "Can I edit the website myself?", a: "Yes. The Website tab in your TraWe dashboard is the CMS — hero content, pages, packages, blogs, testimonials and contact details are all editable without a developer." },
  { q: "Does the website connect to the CRM automatically?", a: "It is the same system. Enquiry forms create Queries, packages come from your masters, payments post to Billing, and itineraries shared from the CRM open on your own domain." },
  { q: "Will it run on my own domain?", a: "Yes — white-label on yourdomain.com, with the CRM on app.yourdomain.com. We verify the CNAME and provision SSL for you." },
  { q: "Is the site SEO-friendly?", a: "Pages are server-rendered with unique titles, meta descriptions, canonical tags, Open Graph previews, sitemap.xml and JSON-LD schema. Blogs and destination pages are built to rank." },
  { q: "Can I take online payments?", a: "Razorpay is integrated. Customers can pay advances or the full amount from the package page or the client portal, and each payment reconciles into the CRM." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Built for Indian travel agencies
            </div>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              Travel <span className="text-gradient-brand">website development</span> that plugs straight into your CRM.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              A booking-ready website on your own domain — packages, destination pages, blogs, Razorpay payments and enquiry forms that create Queries inside TraWe the moment a traveller hits submit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button size="lg" className="gap-1.5">Set up my website <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/features"><Button variant="outline" size="lg">See every feature</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { n: "7–10", l: "days to live" },
                { n: "100%", l: "white-label" },
                { n: "SEO", l: "server-rendered" },
                { n: "1", l: "system, not four" },
              ].map((s) => (
                <div key={s.l} className="border rounded-lg p-4">
                  <div className="font-mono text-2xl tabular-nums">{s.n}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-[0_30px_80px_-50px_rgba(0,24,48,0.5)]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">What ships with your site</div>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { icon: Globe2, t: "yourdomain.com — website" },
                { icon: LayoutDashboard, t: "app.yourdomain.com — TraWe CRM" },
                { icon: Plane, t: "Live flight & hotel search inside the CRM" },
                { icon: Sparkles, t: "AI itinerary builder & editor" },
                { icon: Users, t: "Client portal for accept + pay" },
                { icon: Smartphone, t: "PWA install on Android & iOS" },
              ].map((r) => (
                <li key={r.t} className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                    <r.icon className="h-4 w-4 text-primary" />
                  </span>
                  {r.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* INCLUSIONS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Website inclusions</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Everything a travel website needs — and the CRM behind it</h2>
          <p className="mt-4 text-muted-foreground">
            We don't hand you a brochure site. Every module on your website reads from the same TraWe database your team works in daily, so packages, rates and enquiries never drift apart.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {INCLUSIONS.map((f) => (
            <div key={f.t} className="rounded-2xl border bg-card p-6 hover:border-primary/50 transition">
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4 font-medium">{f.t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEY FEATURES */}
      <section className="border-y bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Key features</div>
          <h2 className="text-3xl font-semibold tracking-tight">Shipped with every TraWe website</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Our process</div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">From first call to live domain in six steps</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map((s) => (
            <div key={s.n} className="rounded-2xl border bg-card p-6">
              <div className="font-mono text-xs tracking-widest text-primary">STEP {s.n}</div>
              <div className="mt-3 font-medium">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY TRAWE */}
      <section className="border-y bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Why TraWe</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">A website is only useful if the lead reaches the right place</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-2xl border bg-card p-6">
                <div className="h-10 w-10 rounded-xl bg-accent/15 grid place-items-center">
                  <w.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 font-medium">{w.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">FAQ</div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Frequently asked questions</h2>
        <div className="mt-8 divide-y border rounded-2xl bg-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium flex items-start justify-between gap-4">
                {f.q}
                <span className="text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-card p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Get your travel website and CRM in one go</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Tell us your destinations and best-selling packages — we'll show you the site, the CRM behind it and exactly what your enquiry flow will look like.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
            
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}