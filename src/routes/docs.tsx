import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { BookOpen, Rocket, Users, Map, Receipt, Wallet, MessageCircle, Sparkles, Shield, KeyRound, ArrowRight, Hotel } from "lucide-react";
import { DOCS_SECTIONS } from "@/lib/kb-data";

const ICONS: Record<string, any> = {
  "Getting started": Rocket,
  "Leads & pipeline": Users,
  "Itineraries & templates": Map,
  "Hotels & rate cards": Hotel,
  "Quotations & invoices": Receipt,
  "Payments & billing": Wallet,
  "Communications": MessageCircle,
  "Customer portal": KeyRound,
  "AI copilot & automations": Sparkles,
  "Admin & security": Shield,
};

export const Route = createFileRoute("/docs")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Documentation — TraWe Travel CRM" },
      { name: "description", content: "Learn how to set up your agency, capture leads, build itineraries, invoice with GST, and take payments — the complete TraWe documentation." },
      { property: "og:title", content: "TraWe Documentation" },
      { property: "og:description", content: "Setup guides, module walkthroughs and API references for the TraWe travel CRM." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/docs" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/docs" }],
  }),
});


function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="border-b relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Documentation</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">Everything you need to run TraWe like a pro.</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">Setup checklists, module walkthroughs, integration guides and API references — written for busy agency owners, not engineers.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <Link to="/guides" className="rounded-full border bg-card px-3 py-1.5 hover:border-primary">Guides →</Link>
            <Link to="/support" className="rounded-full border bg-card px-3 py-1.5 hover:border-primary">Support →</Link>
            <Link to="/status" className="rounded-full border bg-card px-3 py-1.5 hover:border-primary">Platform status →</Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {DOCS_SECTIONS.map((s) => {
          const Icon = ICONS[s.category] || BookOpen;
          return (
            <div key={s.category} className="rounded-xl border bg-card p-6 hover:border-primary/50 transition">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-semibold">{s.category}</div>
              <ul className="mt-4 space-y-2 text-sm">
                {s.articles.map((a) => (
                  <li key={a.slug}>
                    <Link to="/docs/$slug" params={{ slug: a.slug }} className="flex items-start gap-2 text-muted-foreground hover:text-primary transition">
                      <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                      <span>{a.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="border-t bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Can't find what you need?</h2>
          <p className="mt-3 text-muted-foreground">Our team replies within one business day.</p>
          <Link to="/support" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">
            Contact support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}