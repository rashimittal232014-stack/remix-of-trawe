import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "./features";
import { PRODUCTS, EXTRA_NAV_PRODUCTS } from "@/lib/products-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/products/")({
  component: ProductsIndex,
  head: () => ({
    meta: [
      { title: "Products — The Complete Travel Technology Suite · TraWe" },
      { name: "description", content: "Explore the TraWe suite: B2C travel CRM, AI itinerary builder, live flight and hotel search, GST invoicing, billing, WhatsApp, masters, client portal, Windows desktop app and white-label SaaS." },
      { property: "og:title", content: "TraWe Products — travel technology for Indian agencies" },
      { property: "og:description", content: "One connected stack: CRM, AI itineraries, live search, quotations and GST invoicing, billing, WhatsApp, masters, client portal, desktop app and white-label." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/products" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/products" }],
  }),
});

function ProductsIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Travel technology solutions
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
            One platform. <span className="text-gradient-brand">Every module</span> a travel agency runs on.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            From the first WhatsApp enquiry to the GST invoice and the client's payment receipt — each TraWe product is a full module, and all of them share one database.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/features"><Button variant="outline" size="lg">Full feature list</Button></Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              to="/products/$slug"
              params={{ slug: p.slug }}
              className="group rounded-2xl border bg-card p-6 hover:border-primary/50 transition"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                <p.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4 font-medium flex items-center gap-1.5">
                {p.name}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.navBlurb}</p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">{p.kicker}</div>
            </Link>
          ))}

          {EXTRA_NAV_PRODUCTS.map((p) => (
            <Link key={p.to} to={p.to} className="group rounded-2xl border bg-card p-6 hover:border-primary/50 transition">
              <div className="h-10 w-10 rounded-xl bg-accent/15 grid place-items-center">
                <p.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-4 font-medium flex items-center gap-1.5">
                {p.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.blurb}</p>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">Websites</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-card p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Not sure which modules you need?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Tell us how your agency sells today and we'll show you the shortest path from enquiry to confirmed, invoiced trip.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Talk to us <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
