import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { findDoc, DOCS_SECTIONS } from "@/lib/kb-data";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => {
    const article = findDoc(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Not found — TraWe Docs" }, { name: "robots", content: "noindex" }] };
    const { article } = loaderData;
    return {
      meta: [
        { title: `${article.title} — TraWe Docs` },
        { name: "description", content: article.summary.slice(0, 155) },
        { property: "og:title", content: `${article.title} — TraWe Docs` },
        { property: "og:description", content: article.summary.slice(0, 155) },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: `https://trawe.in/docs/${article.slug}` }],
    };
  },
  component: Page,
  notFoundComponent: NotFound,
});

function Page() {
  const { article } = Route.useLoaderData();
  const section = DOCS_SECTIONS.find((s) => s.category === article.category);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/docs" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-primary">
          <ArrowLeft className="h-3 w-3" /> All docs
        </Link>
        <div className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">{article.category} · {article.time} read</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          {article.body.map((b: { h?: string; p: string }, i: number) => (
            <div key={i}>
              {b.h && <h2 className="text-lg font-semibold tracking-tight text-foreground mb-2">{b.h}</h2>}
              <p>{b.p}</p>
            </div>
          ))}
        </div>
        {section && section.articles.length > 1 && (
          <div className="mt-16 border-t pt-8">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">More in {section.category}</div>
            <ul className="space-y-2">
              {section.articles.filter((a) => a.slug !== article.slug).slice(0, 5).map((a) => (
                <li key={a.slug}>
                  <Link to="/docs/$slug" params={{ slug: a.slug }} className="group flex items-center gap-2 text-sm hover:text-primary">
                    <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                    <span>{a.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition" />
                  </Link>
                </li>
              ))}
            </ul>
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Article not found</h1>
        <p className="mt-3 text-muted-foreground">This doc may have moved. Head back to the index to find what you are looking for.</p>
        <Link to="/docs" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium">
          Back to docs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <MarketingFooter />
    </div>
  );
}