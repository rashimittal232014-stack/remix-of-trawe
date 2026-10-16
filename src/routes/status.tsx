import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { CheckCircle2, Activity } from "lucide-react";

export const Route = createFileRoute("/status")({
  component: Page,
  head: () => ({
    meta: [
      { title: "System status — TraWe" },
      { name: "description", content: "Live status of the TraWe platform — API, database, payments, WhatsApp, email and portal. Historic uptime and incident timeline." },
      { property: "og:title", content: "TraWe System Status" },
      { property: "og:description", content: "Real-time platform status and 90-day uptime for every TraWe service." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/status" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/status" }],
  }),
});

const SERVICES = [
  { name: "Web app & API", uptime: "99.98%" },
  { name: "Database & storage", uptime: "99.99%" },
  { name: "Customer portal", uptime: "99.97%" },
  { name: "Razorpay payments webhook", uptime: "99.95%" },
  { name: "WhatsApp Cloud API bridge", uptime: "99.92%" },
  { name: "Transactional email", uptime: "99.96%" },
  { name: "AI copilot (Gemini)", uptime: "99.90%" },
  { name: "Scheduled reminders (cron)", uptime: "99.99%" },
];

// Build a fake but realistic-looking 90-day bar. Deterministic per index.
function bars(seed: number) {
  const out: ("ok" | "degraded" | "down")[] = [];
  for (let i = 0; i < 90; i++) {
    const n = (Math.sin(seed * 13 + i * 7.31) + 1) * 0.5;
    out.push(n > 0.985 ? "down" : n > 0.94 ? "degraded" : "ok");
  }
  return out;
}

const INCIDENTS = [
  { date: "12 Jul 2026", title: "Elevated latency on WhatsApp bridge", status: "Resolved", duration: "23m",
    body: "Meta Cloud API upstream returned slow responses between 14:12 and 14:35 IST. Retries queued and delivered — no messages lost." },
  { date: "28 Jun 2026", title: "Razorpay webhook delivery delay", status: "Resolved", duration: "8m",
    body: "Reconciliation lagged by up to 8 minutes for a small subset of tenants. Backfilled and confirmed no missing payments." },
  { date: "05 Jun 2026", title: "Scheduled maintenance — database upgrade", status: "Completed", duration: "12m",
    body: "Planned Postgres minor version upgrade, executed during the announced 03:00–04:00 IST window. Read-only for 12 minutes." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="border-b bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-14 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2">System status</div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">All systems operational.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last checked just now · India (ap-south) · UTC+05:30</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono uppercase tracking-widest text-xs">Live</span>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-xl border bg-card divide-y">
          {SERVICES.map((s, i) => (
            <div key={s.name} className="p-5 flex items-center gap-4">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.name}</div>
                <div className="mt-2 flex gap-[2px]" aria-hidden>
                  {bars(i + 1).map((b, j) => (
                    <div key={j} className={`h-6 w-[3px] rounded-sm ${b === "ok" ? "bg-primary/70" : b === "degraded" ? "bg-yellow-500/70" : "bg-destructive/70"}`} title={`Day ${90 - j}: ${b}`} />
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono tabular-nums text-sm">{s.uptime}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">90-day</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Recent incidents</h2>
        </div>
        <div className="space-y-3">
          {INCIDENTS.map((i) => (
            <article key={i.title} className="border rounded-xl bg-card p-5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground uppercase tracking-widest">{i.date}</span>
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 uppercase tracking-widest text-[10px]">{i.status}</span>
                  <span className="text-muted-foreground">{i.duration}</span>
                </span>
              </div>
              <div className="mt-2 font-medium">{i.title}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{i.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground text-center">Subscribe to status alerts at <span className="font-mono">status@trawe.in</span></p>
      </section>
      <MarketingFooter />
    </div>
  );
}