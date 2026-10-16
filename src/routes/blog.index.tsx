import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav } from "@/components/app/marketing-nav";
import { POSTS, formatDate } from "@/lib/blog-data";
import { ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  loader: async () => ({ dbPosts: [] as any[] }),
  head: () => ({
    meta: [
      { title: "TraWe Blog — Playbooks for modern travel agencies" },
      { name: "description", content: "Practical guides on CRM, GST, WhatsApp sales, itineraries, AI and analytics — written for Indian travel agency owners and their teams." },
      { property: "og:title", content: "TraWe Blog — Playbooks for modern travel agencies" },
      { property: "og:description", content: "Practical guides on CRM, GST, WhatsApp sales, itineraries, AI and analytics — written for Indian travel agency owners and their teams." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/blog" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TraWe Blog — Playbooks for modern travel agencies" },
      { name: "twitter:description", content: "Practical guides on CRM, GST, WhatsApp sales, itineraries, AI and analytics — written for Indian travel agency owners and their teams." },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/blog" }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { dbPosts } = Route.useLoaderData();
  const merged = [
    ...dbPosts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? "",
      category: p.category ?? "News",
      author: p.author ?? "TraWe Team",
      date: p.published_at ?? new Date().toISOString(),
      readMinutes: parseInt(p.read_time ?? "5", 10) || 5,
      gradient: "from-teal-500/30 via-emerald-500/20 to-cyan-500/30",
    })),
    ...POSTS,
  ];
  const [featured, ...rest] = merged;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 opacity-60">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> The TraWe Journal
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight">
              Playbooks for the modern <span className="bg-gradient-to-r from-primary via-teal-400 to-emerald-400 bg-clip-text text-transparent">travel agency</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
              Field-tested writing on selling on WhatsApp, GST-ready invoicing, AI itineraries, hotel contracting and scaling your team — from operators who ship every week.
            </p>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Link
          to="/blog/$slug"
          params={{ slug: featured.slug }}
          className="group grid md:grid-cols-2 gap-8 rounded-3xl border bg-card p-3 hover:shadow-2xl transition-shadow"
        >
          <div className={`relative aspect-[16/11] md:aspect-auto rounded-2xl bg-gradient-to-br ${featured.gradient} overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute bottom-4 left-4 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs font-medium">Featured</div>
          </div>
          <div className="p-4 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full bg-secondary px-2.5 py-1">{featured.category}</span>
              <span>{formatDate(featured.date)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readMinutes} min</span>
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight group-hover:text-primary transition-colors">
              {featured.title}
            </h2>
            <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
              Read the story <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl font-semibold tracking-tight">Latest articles</h2>
          <span className="text-sm text-muted-foreground">{rest.length} more reads</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group rounded-2xl border bg-card p-3 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className={`relative aspect-[16/10] rounded-xl bg-gradient-to-br ${p.gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[11px] font-medium">
                  {p.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.author}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readMinutes} min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h3 className="text-3xl font-semibold tracking-tight">Run your agency on TraWe.</h3>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Everything in these guides is a click away inside the product. Start free, no card needed.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}