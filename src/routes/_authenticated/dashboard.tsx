import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, getMe } from "@/lib/crm.functions";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Plus,
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  Plane,
  Wallet,
  MoreHorizontal,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/format";

const opts = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TraWe" },
      { name: "description", content: "Live overview of your travel business." },
      { property: "og:title", content: "Dashboard — TraWe" },
      { property: "og:description", content: "Live overview of your travel business." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Dashboard,
});

/* ---------- Cloud White · Professional SaaS tokens ----------
 * Palette:  canvas #fafbfc · panel #ffffff · line #e8ecf1 · muted #94a3b8
 *           text #0f172a · accent #3b82f6 · positive #16a34a · negative #dc2626
 * Type:     Sora (display) + Manrope (body)
 * ---------------------------------------------------------- */
/* Brand parity — Navy / Teal / Terracotta from landing */
const CANVAS = "#fafbfc";
const LINE = "#e8ecf1";
const MUTED = "#94a3b8";
const TEXT = "#001830";      /* deep navy */
const ACCENT = "#48a890";    /* teal */
const ACCENT_2 = "#c04818";  /* terracotta */
const NAVY = "#001830";

const display = { fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif' } as const;
const serif = { fontFamily: '"Instrument Serif", "Playfair Display", ui-serif, Georgia, serif' } as const;
const body = { fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' } as const;

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`tile-hairline rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[15px] font-semibold text-[#0f172a] tracking-tight" style={display}>
          {title}
        </h3>
        {hint && <p className="text-xs text-[#64748b] mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function Delta({ pct }: { pct: number }) {
  if (!pct) {
    return <span className="text-xs text-[#94a3b8]">— no change</span>;
  }
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  deltaPct,
  accent = false,
}: {
  label: string;
  value: string;
  icon: any;
  deltaPct?: number;
  accent?: boolean;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between">
        <div
          className={`h-9 w-9 rounded-lg grid place-items-center ${
            accent ? "bg-[#48a890] text-white" : "bg-[#f1f5f9] text-[#001830]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {deltaPct !== undefined && <Delta pct={deltaPct} />}
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-[#64748b] font-medium">
        {label}
      </p>
      <p
        className="mt-1 text-3xl tracking-tight tabular-nums text-[#001830]"
        style={serif}
      >
        {value}
      </p>
    </Panel>
  );
}

/* Smooth area chart with gradient fill */
function AreaChart({ points, labels }: { points: number[]; labels: string[] }) {
  if (!points.length) return null;
  const W = 600;
  const H = 200;
  const P = 24;
  const max = Math.max(...points, 1);
  const min = 0;
  const step = (W - P * 2) / Math.max(points.length - 1, 1);
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - P * 2);
  const coords = points.map((p, i) => [P + i * step, y(p)] as [number, number]);
  const line = coords.map(([x, yy], i) => `${i === 0 ? "M" : "L"} ${x} ${yy}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1][0]} ${H - P} L ${coords[0][0]} ${H - P} Z`;
  const gridY = [0.25, 0.5, 0.75].map((r) => H - P - r * (H - P * 2));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((yy, i) => (
        <line
          key={i}
          x1={P}
          x2={W - P}
          y1={yy}
          y2={yy}
          stroke={LINE}
          strokeDasharray="3 3"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, yy], i) => (
        <circle key={i} cx={x} cy={yy} r={i === coords.length - 1 ? 4 : 2.5} fill="white" stroke={ACCENT} strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={P + i * step}
          y={H - 6}
          fontSize="10"
          fill={MUTED}
          textAnchor="middle"
          style={body}
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

/* Donut with legend under panel */
function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const C = 2 * Math.PI * 42;
  let offset = 0;
  const colors = ["#48a890", "#001830", "#c04818", "#7dd3c0", "#f59e0b", "#8b5cf6"];
  const top = data[0];
  const topPct = top ? Math.round((top.value / total) * 100) : 0;
  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="transparent" stroke={LINE} strokeWidth="10" />
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="10"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold tracking-tight text-[#0f172a] text-[#0f172a] tabular-nums" style={display}>
          {topPct}%
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[#64748b] max-w-[80px] text-center truncate">
          {top?.name || "—"}
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const fetcher = useServerFn(getDashboard);
  const { data } = useSuspenseQuery({ ...opts, queryFn: () => fetcher() });
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const displayName =
    (me?.profile as any)?.full_name?.split(" ")[0] ||
    (me as any)?.email?.split("@")[0] ||
    "there";

  const trendPoints = (data.monthlyTrend || []).map((m: any) => Number(m.total) || 0);
  const trendLabels = (data.monthlyTrend || []).map((m: any) => String(m.label || ""));
  const prev = trendPoints[trendPoints.length - 2] || 0;
  const last = trendPoints[trendPoints.length - 1] || 0;
  const deltaPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;

  const pipeline = (data.pipelineBars || []) as { name: string; count: number }[];
  const followups = (data.todayFollowups || []) as any[];
  const totalPipeline = pipeline.reduce((s, p) => s + p.count, 0) || 1;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const colors = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div
      className="relative -m-4 sm:-m-6 lg:-m-8 min-h-[calc(100vh-4rem)]"
      style={{ ...body, background: CANVAS, color: TEXT }}
    >
      <div className="mx-auto max-w-[1500px] px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* ============== HEADER ============== */}
        <header className="aurora-strip rounded-3xl border border-[#e8ecf1] px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-[#64748b] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {today}
            </p>
            <h1 className="mt-1 text-4xl md:text-5xl text-[#001830]">
              {greet()}, <em className="italic text-[#48a890]">{displayName}</em>
            </h1>
            <p className="text-sm text-[#334155] mt-1.5">
              Here's what's happening across your travel business today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="hidden md:flex items-center gap-2 rounded-full border border-[#001830]/12 bg-white/80 backdrop-blur px-4 py-2 text-sm text-[#64748b] w-64 shadow-[0_1px_2px_rgba(0,24,48,0.06)]"
              aria-label="Search queries and customers"
            >
              <Search className="h-4 w-4" />
              <span>Search queries, customers…</span>
              <kbd className="ml-auto text-[10px] font-medium bg-[#001830]/5 text-[#001830] px-1.5 py-0.5 rounded border border-[#001830]/10">
                ⌘K
              </kbd>
            </button>
            <Link to="/leads" className="btn-brand-ghost text-sm">
              Open queries <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/itineraries" className="btn-brand text-sm">
              <Plus className="h-4 w-4" /> New itinerary
            </Link>
          </div>
        </header>

        {/* ============== KPI ROW ============== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Confirmed value"
            value={formatCurrency(data.kpis.confirmedValue)}
            icon={TrendingUp}
            deltaPct={deltaPct}
            accent
          />
          <KpiCard
            label="Total queries"
            value={String(data.kpis.totalQueries)}
            icon={Users}
          />
          <KpiCard
            label="Confirmed"
            value={String(data.kpis.confirmedQueries)}
            icon={CheckCircle2}
          />
          <KpiCard
            label="Departures"
            value={String(data.kpis.confirmedDepartures)}
            icon={Plane}
          />
        </section>

        {/* ============== MAIN GRID ============== */}
        <section className="grid grid-cols-12 gap-6">
          {/* Revenue chart (large) */}
          <Panel className="col-span-12 xl:col-span-8 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#0f172a] tracking-tight" style={display}>
                  Revenue trend
                </h2>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Confirmed value over the last {trendPoints.length || 0} months
                </p>
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-semibold tracking-tight text-[#0f172a] tabular-nums text-[#0f172a]" style={display}>
                  {formatCurrency(last)}
                </p>
                <Delta pct={deltaPct} />
              </div>
            </div>
            <div className="mt-4">
              {trendPoints.length ? (
                <AreaChart points={trendPoints} labels={trendLabels} />
              ) : (
                <div className="h-56 grid place-items-center text-sm text-[#64748b]">
                  No trend data yet.
                </div>
              )}
            </div>
          </Panel>

          {/* Service mix */}
          <Panel className="col-span-12 xl:col-span-4 p-6">
            <SectionHead
              title="Service mix"
              hint="Distribution across services"
              action={
                <button className="text-[#94a3b8] hover:text-[#0f172a]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
            />
            {data.serviceMix.length === 0 ? (
              <div className="h-56 grid place-items-center text-sm text-[#64748b]">
                Not enough data.
              </div>
            ) : (
              <>
                <Donut data={data.serviceMix} />
                <ul className="mt-6 space-y-2.5">
                  {data.serviceMix.slice(0, 5).map((s: any, i: number) => (
                    <li key={`${s.name}-${i}`} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: colors[i % colors.length] }}
                        />
                        <span className="capitalize truncate text-[#334155]">{s.name}</span>
                      </div>
                      <span className="tabular-nums font-semibold text-[#0f172a]">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          {/* Pipeline */}
          <Panel className="col-span-12 xl:col-span-8 p-6">
            <SectionHead
              title="Query pipeline"
              hint={`${totalPipeline} queries across stages`}
              action={
                <Link
                  to="/leads"
                  className="text-xs font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1"
                >
                  View board <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {pipeline.length === 0 ? (
              <div className="py-14 text-center text-sm text-[#64748b] border border-dashed border-[#e8ecf1] rounded-xl">
                No queries yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pipeline.slice(0, 6).map((stage, i) => {
                  const pct = Math.round((stage.count / totalPipeline) * 100);
                  return (
                    <div key={`${stage.name}-${i}`} className="grid grid-cols-12 items-center gap-3">
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ background: colors[i % colors.length] }}
                        />
                        <span className="text-sm font-medium text-[#0f172a] truncate">
                          {stage.name}
                        </span>
                      </div>
                      <div className="col-span-6">
                        <div className="h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: colors[i % colors.length],
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-baseline justify-end gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-[#0f172a]">
                          {stage.count}
                        </span>
                        <span className="text-[11px] text-[#94a3b8] tabular-nums">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Follow-ups */}
          <Panel className="col-span-12 xl:col-span-4 p-6">
            <SectionHead
              title="Today's follow-ups"
              hint={`${followups.length} scheduled`}
              action={
                <Link
                  to="/activities"
                  className="text-xs font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1"
                >
                  All <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {followups.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-[#e8ecf1]">
                <Sparkles className="h-5 w-5 text-[#94a3b8] mx-auto mb-2" />
                <p className="text-sm text-[#64748b]">All caught up.</p>
              </div>
            ) : (
              <ol className="space-y-3">
                {followups.slice(0, 5).map((f, i) => {
                  const t = f.due_at ? new Date(f.due_at) : null;
                  return (
                    <li
                      key={f.id}
                      className="flex gap-3 rounded-xl border border-[#e8ecf1] p-3 hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-[#eff6ff] text-[#2563eb] grid place-items-center text-[11px] font-semibold shrink-0 tabular-nums">
                        {t
                          ? t
                              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              .replace(" ", "")
                          : String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0f172a] truncate">{f.title}</p>
                        {f.description && (
                          <p className="text-xs text-[#64748b] mt-0.5 truncate">{f.description}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>
        </section>

        {/* ============== BOTTOM ROW ============== */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top destinations */}
          <Panel className="p-6">
            <SectionHead title="Top destinations" hint="Ranked by query volume" />
            {!data.topDestinations || data.topDestinations.length === 0 ? (
              <p className="text-sm text-[#64748b]">Nothing to report.</p>
            ) : (
              <ol className="space-y-3.5">
                {data.topDestinations.slice(0, 5).map((d: any, i: number) => {
                  const max = data.topDestinations[0].count || 1;
                  const pct = (d.count / max) * 100;
                  return (
                    <li key={`${d.name}-${i}`}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-semibold tabular-nums text-[#94a3b8] w-4">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm font-medium text-[#0f172a] truncate">
                            {d.name}
                          </span>
                        </div>
                        <span className="text-xs tabular-nums text-[#64748b] font-medium">
                          {d.count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#0ea5e9]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Panel>

          {/* Source performance */}
          <Panel className="p-6">
            <SectionHead title="Source performance" hint="Conversion by channel" />
            {!data.sourcePerformance || data.sourcePerformance.length === 0 ? (
              <p className="text-sm text-[#64748b]">No sources tracked.</p>
            ) : (
              <ul className="divide-y divide-[#f1f5f9]">
                {data.sourcePerformance.slice(0, 5).map((s: any, i: number) => (
                  <li key={`${s.name}-${i}`} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="capitalize text-sm text-[#334155] truncate">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(Number(s.conversion) || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm tabular-nums font-semibold text-[#0f172a] w-10 text-right">
                        {s.conversion}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Team leaderboard */}
          <Panel className="p-6">
            <SectionHead
              title="Team performance"
              hint="This month's leaders"
              action={
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                  <Wallet className="h-3 w-3" />
                  {formatCurrency(data.kpis.collections)}
                </span>
              }
            />
            {!data.teamPerformance || data.teamPerformance.length === 0 ? (
              <p className="text-sm text-[#64748b]">No team activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.teamPerformance.slice(0, 4).map((t: any, i: number) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-[#f8fafc]"
                  >
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-white grid place-items-center text-xs font-semibold overflow-hidden">
                        {t.avatar ? (
                          <img src={t.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          t.name.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      {i === 0 && (
                        <span className="absolute -top-1 -right-1 text-[10px]">🏆</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#0f172a] truncate">{t.name}</div>
                      <div className="text-[11px] text-[#64748b]">
                        {t.count} queries · <span className="text-emerald-600 font-semibold">{t.won} won</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-[#0f172a]" style={display}>
                        {t.count > 0 ? Math.round((Number(t.won) / Number(t.count)) * 100) : 0}%
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#94a3b8]">win</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}
