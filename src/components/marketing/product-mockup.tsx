import type { Product } from "@/lib/products-data";

/**
 * A pure-CSS "app window" mockup rendered with the marketing design tokens.
 * No screenshots — every product page gets a schematic of the real module.
 */
export function ProductMockup({ mockup }: { mockup: Product["mockup"] }) {
  const tone = (t?: string) =>
    t === "primary"
      ? "bg-primary/10 text-primary border-primary/20"
      : t === "accent"
      ? "bg-accent/15 text-foreground border-accent/25"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="rounded-3xl border bg-card shadow-[0_40px_100px_-60px_rgba(0,24,48,0.7)] overflow-hidden">
      <div className="flex items-center gap-2 border-b bg-secondary/40 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
        <div className="ml-3 truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {mockup.title}
        </div>
      </div>

      <div className="grid grid-cols-[64px_1fr] min-h-[320px]">
        <div className="border-r bg-secondary/20 p-3 space-y-2.5">
          <div className="h-6 w-6 rounded-lg bg-primary/20" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-2 rounded-full ${i === 1 ? "bg-primary/40" : "bg-muted-foreground/15"}`} />
          ))}
        </div>

        <div className="p-5 space-y-4">
          {mockup.kpis?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mockup.kpis.map((k) => (
                <div key={k.l} className="rounded-xl border bg-background p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{k.l}</div>
                  <div className="mt-1 font-mono text-lg tabular-nums">{k.v}</div>
                </div>
              ))}
            </div>
          ) : null}

          {mockup.kind === "chat" ? (
            <div className="space-y-2.5">
              {mockup.chat?.map((m, i) => (
                <div key={i} className={`flex ${m.who === "us" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl border px-3.5 py-2 text-xs leading-relaxed ${
                      m.who === "us"
                        ? "bg-primary/10 border-primary/20 rounded-br-sm"
                        : "bg-secondary/50 border-border rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div className="rounded-full border bg-background px-3.5 py-2 text-xs text-muted-foreground">
                Type a message…
              </div>
            </div>
          ) : mockup.kind === "board" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {mockup.rows?.map((r) => (
                <div key={r.a} className="rounded-xl border bg-background p-3">
                  <div className="text-xs font-medium">{r.a}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{r.b}</div>
                  {r.c && (
                    <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${tone(r.tone)}`}>
                      {r.c}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border divide-y bg-background">
              {mockup.rows?.map((r) => (
                <div key={r.a} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{r.a}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{r.b}</div>
                  </div>
                  {r.c && (
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] tabular-nums ${tone(r.tone)}`}>
                      {r.c}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
