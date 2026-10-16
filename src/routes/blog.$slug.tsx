import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { MarketingNav } from "@/components/app/marketing-nav";
import { POSTS, getPost, formatDate, type BlogSection, type BlogPost } from "@/lib/blog-data";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Article not found — TraWe" }, { name: "robots", content: "noindex" }] };
    }
    const { post } = loaderData;
    const url = `https://trawe.in/blog/${post.slug}`;
    return {
      meta: [
        { title: `${post.title} — TraWe Blog` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.excerpt },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: NotFoundPost,
  errorComponent: ErrorPost,
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData() as { post: BlogPost };
  const idx = POSTS.findIndex((p) => p.slug === post.slug);
  const next = POSTS[(idx + 1) % POSTS.length];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* Cover */}
      <section className="relative border-b overflow-hidden">
        <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${post.gradient} opacity-70`} />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> All articles
          </Link>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-background/80 backdrop-blur border px-2.5 py-1">{post.category}</span>
            <span>{formatDate(post.date)}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readMinutes} min read</span>
          </div>
          <h1 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight">{post.title}</h1>
          <p className="mt-5 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-medium">
              {post.author.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium">{post.author}</div>
              <div className="text-xs text-muted-foreground">{post.role}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-6">
          {post.content.map((s: BlogSection, i: number) => (
            <Block key={i} section={s} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((t: string) => (
            <span key={t} className="rounded-full border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </article>

      {/* Next */}
      <section className="border-t bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Read next</div>
          <Link
            to="/blog/$slug"
            params={{ slug: next.slug }}
            className="group flex items-center justify-between gap-6 rounded-2xl border bg-card p-6 hover:shadow-xl transition-shadow"
          >
            <div>
              <div className="text-xs text-muted-foreground">{next.category} · {next.readMinutes} min</div>
              <div className="mt-1 text-lg font-semibold group-hover:text-primary transition-colors">{next.title}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Block({ section }: { section: BlogSection }) {
  if (section.type === "h2") {
    return <h2 className="text-2xl md:text-3xl font-semibold tracking-tight pt-6">{section.text}</h2>;
  }
  if (section.type === "p") {
    return <p className="text-base md:text-lg leading-relaxed text-foreground/90">{section.text}</p>;
  }
  if (section.type === "ul") {
    return (
      <ul className="space-y-2 pl-1">
        {section.items.map((it, i) => (
          <li key={i} className="flex gap-3 text-foreground/90">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <blockquote className="border-l-4 border-primary pl-5 py-2 italic text-lg text-foreground/90 bg-secondary/40 rounded-r-xl">
      "{section.text}"
    </blockquote>
  );
}

// Very light markdown parser: ## for h2, blank-line paragraphs, "- " for lists, "> " for quote.
function parseMarkdown(md: string): BlogSection[] {
  const lines = md.split(/\r?\n/);
  const out: BlogSection[] = [];
  let buf: string[] = [];
  const flushPara = () => {
    const text = buf.join(" ").trim();
    if (text) out.push({ type: "p", text });
    buf = [];
  };
  let listBuf: string[] = [];
  const flushList = () => {
    if (listBuf.length) { out.push({ type: "ul", items: [...listBuf] }); listBuf = []; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { flushPara(); flushList(); continue; }
    if (line.startsWith("## ")) { flushPara(); flushList(); out.push({ type: "h2", text: line.slice(3) }); continue; }
    if (line.startsWith("> ")) { flushPara(); flushList(); out.push({ type: "quote", text: line.slice(2) }); continue; }
    if (line.startsWith("- ")) { flushPara(); listBuf.push(line.slice(2)); continue; }
    flushList();
    buf.push(line);
  }
  flushPara(); flushList();
  return out;
}

function NotFoundPost() {
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Article not found</h1>
        <p className="mt-3 text-muted-foreground">We could not find a post at <code>/blog/{slug}</code>.</p>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to the blog
        </Link>
      </div>
    </div>
  );
}

function ErrorPost({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">We could not load this article.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}