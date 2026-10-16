import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { findGuide, GUIDES } from "@/lib/kb-data";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const article = findGuide(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found — TraWe Guides" }, { name: "robots", content: "noindex" }] };
    const { article } = loaderData;
    return {
      meta: [
        { title: `${article.title} — TraWe Guides` },
        { name: "description", content: article.summary.slice(0, 155) },
        { property: "og:title", content: `${article.title} — TraWe Guides` },
        { property: "og:description", content: article.summary.slice(0, 155) },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: `https://trawe.in/guides/${article.slug}` }],
    };
  },
  component: Page,
  notFoundComponent: NotFound,
});

function Page() {
  const { article } = Route.useLoaderData();
  const others = GUIDES.filter((g) => g.slug !== article.slug).slice(0, 3);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/guides" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-primary">
          <ArrowLeft className="h-3 w-3" /> All guides
        </Link>
        <div className="mt-4 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1">{article.tag}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {article.time} read</span>
        </div>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{article.summary}</p>
        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          {article.body.map((b: { h?: string; p: string }, i: number) => (
            <div key={i}>
              {b.h && <h2 className="text-lg font-semibold tracking-tight text-foreground mb-2">{b.h}</h2>}
              <p>{b.p}</p>
            </div>
          ))}
        </div>
        {others.length > 0 && (
          <div className="mt-16 border-t pt-8">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Keep reading</div>
            <div className="grid gap-4 md:grid-cols-3">
              {others.map((o) => (
                <Link key={o.slug} to="/guides/$slug" params={{ slug: o.slug }} className="rounded-xl border bg-card p-4 hover:border-primary/50 transition">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-primary">{o.tag}</div>
                  <div className="mt-1 text-sm font-semibold">{o.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
      <MarketingFooter />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">404</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Guide not found</h1>
        <p className="mt-3 text-muted-foreground">This playbook may have moved. Browse the full library from the index.</p>
        <Link to="/guides" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">
          Back to guides <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <MarketingFooter />
    </div>
  );
}