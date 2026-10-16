import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MarketingHeader, MarketingFooter } from "./features";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { PRODUCTS, getProduct } from "@/lib/products-data";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) {
      return { meta: [{ title: "Product not found — TraWe" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: p.metaTitle },
        { name: "description", content: p.metaDescription },
        { property: "og:title", content: p.metaTitle },
        { property: "og:description", content: p.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://trawe.in/products/${p.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://trawe.in/products/${p.slug}` }],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Product not found</h1>
        <p className="mt-3 text-muted-foreground">The page you were looking for isn't part of the TraWe suite.</p>
        <Link to="/products" className="inline-block mt-6"><Button>Browse all products</Button></Link>
      </div>
      <MarketingFooter />
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useLoaderData();
  const p = getProduct(slug)!;
  const others = PRODUCTS.filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              <p.icon className="h-3 w-3" /> {p.kicker}
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.07]">
              {p.h1a}<span className="text-gradient-brand">{p.h1accent}</span>{p.h1b}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">{p.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/features"><Button variant="outline" size="lg">See every feature</Button></Link>
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {p.stats.map((s) => (
                <div key={s.l} className="border rounded-lg p-4">
                  <div className="font-mono text-xl tabular-nums">{s.n}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <ProductMockup mockup={p.mockup} />
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">What's inside</div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{p.name}, in detail</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {p.features.map((f) => (
                <div key={f.t} className="rounded-2xl border bg-card p-6 hover:border-primary/50 transition">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-4 font-medium">{f.t}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border bg-card p-6 lg:sticky lg:top-24">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Highlights</div>
            <ul className="mt-4 space-y-3 text-sm">
              {p.panel.map((r) => (
                <li key={r.t} className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-accent/15 grid place-items-center shrink-0">
                    <r.icon className="h-4 w-4 text-primary" />
                  </span>
                  {r.t}
                </li>
              ))}
            </ul>
            <Link to="/contact" className="block mt-6"><Button className="w-full gap-1.5">Talk to us <ArrowRight className="h-4 w-4" /></Button></Link>
          </aside>
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="border-y bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Included</div>
          <h2 className="text-3xl font-semibold tracking-tight">Everything shipped with {p.name}</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.checklist.map((c) => (
              <div key={c} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">How it works</div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Four steps, start to finish</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {p.workflow.map((s) => (
            <div key={s.n} className="rounded-2xl border bg-card p-6">
              <div className="font-mono text-xs tracking-widest text-primary">STEP {s.n}</div>
              <div className="mt-3 font-medium">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">FAQ</div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Questions agencies ask</h2>
        <div className="mt-8 divide-y border rounded-2xl bg-card">
          {p.faqs.map((f) => (
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

      {/* RELATED */}
      <section className="border-t bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Explore more</div>
          <h2 className="text-2xl font-semibold tracking-tight">Other modules in the TraWe suite</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {others.map((o) => (
              <Link key={o.slug} to="/products/$slug" params={{ slug: o.slug }} className="rounded-2xl border bg-card p-6 hover:border-primary/50 transition">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center">
                  <o.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 font-medium">{o.name}</div>
                <p className="mt-2 text-sm text-muted-foreground">{o.navBlurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl border bg-card p-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">See {p.name} on your own data</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Book a walkthrough — we'll set up a workspace with your destinations and packages so you can judge it with real trips, not a demo dataset.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact"><Button size="lg" className="gap-1.5">Book a demo <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/products"><Button variant="outline" size="lg">All products</Button></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
