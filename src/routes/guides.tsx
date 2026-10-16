import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { Clock, Users, Receipt, MessageCircle, Sparkles, Wallet, Map, Hotel, ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/kb-data";

const ICONS: Record<string, any> = {
  Sales: Users, Itineraries: Map, Hotels: Hotel, GST: Receipt,
  Payments: Wallet, WhatsApp: MessageCircle, AI: Sparkles, Operations: Clock,
};

export const Route = createFileRoute("/guides")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Guides — TraWe for travel agencies" },
      { name: "description", content: "Step-by-step playbooks for the workflows that matter: chasing leads, closing quotes, invoicing with GST, and using WhatsApp the right way." },
      { property: "og:title", content: "TraWe Guides & Playbooks" },
      { property: "og:description", content: "Playbooks written for Indian travel agency owners — practical, actionable, ready to copy." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/guides" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/guides" }],
  }),
});


function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Guides & Playbooks</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">Playbooks the best agencies actually use.</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">Practical, step-by-step guides written for owners and agents. No fluff — just what to do, in what order, and why it works.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-6 md:grid-cols-2">
        {GUIDES.map((g) => {
          const Icon = ICONS[g.tag] || Sparkles;
          return (
            <Link key={g.slug} to="/guides/$slug" params={{ slug: g.slug }} className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:-translate-y-0.5 transition block">
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-mono uppercase tracking-widest">
                  <Icon className="h-3 w-3" />
                  {g.tag}
                </span>
                <span className="font-mono text-muted-foreground">{g.time} read</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight group-hover:text-primary transition">{g.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{g.summary}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                Read guide <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="border-t bg-secondary/30">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Want more like these?</h2>
          <p className="mt-3 text-muted-foreground">We publish a new playbook every fortnight. Get them in your inbox — no other marketing, ever.</p>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">
            Browse the blog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}