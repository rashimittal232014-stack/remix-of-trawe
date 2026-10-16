import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  amISuperAdmin, platformOverview, listClients, createClient, updateClient, deleteClient,
  resetClientPassword, changeMyPassword, listPayments, recordPayment, deletePayment,
  listDomains, addDomain, checkDomain, deleteDomain, listBroadcasts, saveBroadcast,
  deleteBroadcast, impersonateClient, listTickets, replyTicket, clientHealth,
  whatsappFleet, controlWhatsAppSession,
} from "@/lib/platform.functions";
import { FEATURE_LABELS, LIMIT_LABELS, resolvePlan, type FeatureKey, type LimitKey } from "@/lib/plan-config";
import { Switch } from "@/components/ui/switch";
import { listDemoRequests, updateDemoRequest, deleteDemoRequest } from "@/lib/demo.functions";
import {
  ShieldCheck, Building2, Globe, Wallet, Megaphone, LogOut, Plus, RefreshCw, Trash2,
  KeyRound, Copy, TrendingUp, AlertTriangle, Users, Inbox, Mail, Phone, LayoutDashboard,
  Calendar, LifeBuoy, Activity, MessageSquare,
} from "lucide-react";
import traweLogoAsset from "@/assets/trawe-logo.png.asset.json";

const traweLogo = traweLogoAsset.url;

export const Route = createFileRoute("/super-admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Platform Console — TraWe" },
      { name: "description", content: "TraWe white-label platform console." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SuperAdminPage,
});

const money = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");

const body = { fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' } as const;
const display = { fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif' } as const;
const serif = { fontFamily: '"Instrument Serif", "Playfair Display", ui-serif, Georgia, serif' } as const;

function SuperAdminPage() {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="min-h-screen bg-[#fafbfc]" />;
  if (!session) return <PlatformLogin />;
  return <Console />;
}

/* --------------------------------- login --------------------------------- */

function PlatformLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  }

  return (
    <div className="aurora-strip min-h-screen grid place-items-center px-4" style={body}>
      <form onSubmit={submit} className="tile-hairline w-full max-w-sm rounded-3xl p-8">
        <img src={traweLogo} alt="TraWe" className="h-8 w-auto object-contain" />
        <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#e8ecf1] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#48a890]">
          <ShieldCheck className="h-3 w-3" /> Platform Console
        </p>
        <h1 className="mt-3 text-3xl text-[#001830]" style={serif}>Sign in</h1>
        <p className="mt-1 text-sm text-[#64748b]">Restricted to TraWe platform staff.</p>
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs text-[#64748b]">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 bg-white" />
          </div>
          <div>
            <Label className="text-xs text-[#64748b]">Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 bg-white" />
          </div>
          <button type="submit" className="btn-brand w-full justify-center" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------- console -------------------------------- */

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, group: "Platform" },
  { key: "clients", label: "Clients", icon: Building2, group: "Platform" },
  { key: "demos", label: "Demo requests", icon: Inbox, group: "Growth" },
  { key: "broadcasts", label: "Broadcasts", icon: Megaphone, group: "Growth" },
  { key: "domains", label: "Domains", icon: Globe, group: "Operations" },
  { key: "payments", label: "Payments", icon: Wallet, group: "Operations" },
  { key: "support", label: "Support", icon: LifeBuoy, group: "Operations" },
  { key: "health", label: "Usage & health", icon: Activity, group: "Operations" },
  { key: "whatsapp", label: "WhatsApp fleet", icon: MessageSquare, group: "Operations" },
  { key: "security", label: "Security", icon: ShieldCheck, group: "Operations" },
] as const;

type TabKey = (typeof NAV)[number]["key"];

function Console() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const whoami = useServerFn(amISuperAdmin);
  const { data: me, isLoading } = useQuery({ queryKey: ["platform", "me"], queryFn: () => whoami() });
  const [tab, setTab] = useState<TabKey>("overview");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/super-admin", replace: true });
    if (typeof window !== "undefined") window.location.reload();
  }

  if (isLoading) return <div className="min-h-screen bg-[#fafbfc]" />;

  if (!me?.ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#fafbfc] px-4 text-center" style={body}>
        <div className="tile-hairline rounded-3xl px-8 py-10">
          <p className="text-[#001830]">This login does not have platform access.</p>
          <Button variant="outline" className="mt-4" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  const active = NAV.find((n) => n.key === tab)!;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="app-shell relative min-h-screen bg-[#fafbfc] text-[#0f172a]" style={body}>
      {/* sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-[#e8ecf1] bg-card/80 backdrop-blur-xl z-40">
        <div className="px-5 pt-4 pb-3">
          <img src={traweLogo} alt="TraWe" className="h-8 w-auto object-contain" />
        </div>
        <div className="mx-5 border-t border-border/40" />
        <div className="mx-3 mt-3 mb-2 flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-lg border bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Platform</div>
            <div className="truncate text-sm font-semibold leading-tight">{me.email}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-6">
          {groups.map((g) => (
            <div key={g}>
              <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
              <ul className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const Icon = n.icon;
                  return (
                    <li key={n.key}>
                      <button
                        type="button"
                        onClick={() => setTab(n.key)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                          tab === n.key
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground/70 hover:bg-accent/40 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{n.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button onClick={signOut} className="btn-brand-ghost w-full justify-center text-sm">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 border-b border-[#e8ecf1] bg-white/85 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <img src={traweLogo} alt="TraWe" className="h-7 w-auto object-contain" />
          <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
                tab === n.key ? "border-transparent bg-[#48a890] text-white" : "border-[#e8ecf1] bg-white text-[#64748b]",
              )}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <header className="aurora-strip flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#e8ecf1] px-6 py-6">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs text-[#64748b]">
                <Calendar className="h-3.5 w-3.5" /> {today}
              </p>
              <h1 className="mt-1 text-4xl text-[#001830] md:text-5xl">
                {active.label === "Overview" ? <>Platform <em className="italic text-[#48a890]">console</em></> : <em className="italic text-[#48a890]">{active.label}</em>}
              </h1>
              <p className="mt-2 text-sm text-[#64748b]">Manage client workspaces, domains, billing and growth from one place.</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8ecf1] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#48a890]">
                <ShieldCheck className="h-3.5 w-3.5" /> Super admin
              </span>
            </div>
          </header>

          {tab === "overview" && <OverviewTab />}
          {tab === "clients" && <ClientsTab />}
          {tab === "demos" && <DemosTab />}
          {tab === "domains" && <DomainsTab />}
          {tab === "payments" && <PaymentsTab />}
          {tab === "broadcasts" && <BroadcastsTab />}
          {tab === "support" && <SupportTab />}
          {tab === "health" && <HealthTab />}
          {tab === "whatsapp" && <WhatsAppFleetTab />}
          {tab === "security" && <SecurityTab />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`tile-hairline rounded-2xl ${className}`}>{children}</div>;
}

function PanelHead({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eef1f5] px-5 py-4">
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-[#0f172a]" style={display}>{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-[#64748b]">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent = false }: any) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accent ? "bg-[#48a890] text-white" : "bg-[#f1f5f9] text-[#001830]"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="mt-1 text-3xl tabular-nums tracking-tight text-[#001830]" style={serif}>{value}</p>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-[#64748b]">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Panel className="grid place-items-center px-6 py-14 text-center">
      <p className="text-sm text-[#64748b]">{text}</p>
    </Panel>
  );
}

/* -------------------------------- overview -------------------------------- */

function OverviewTab() {
  const fn = useServerFn(platformOverview);
  const { data } = useQuery({ queryKey: ["platform", "overview"], queryFn: () => fn() });
  if (!data) return <Empty text="Loading platform metrics…" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Clients" value={data.totalClients} icon={Building2} accent />
      <Kpi label="Active" value={data.activeClients} icon={ShieldCheck} />
      <Kpi label="Estimated MRR" value={money(data.mrr)} icon={TrendingUp} />
      <Kpi label="Collected this month" value={money(data.collectedThisMonth)} icon={Wallet} />
      <Kpi label="Renewals in 30 days" value={data.expiring} icon={RefreshCw} />
      <Kpi label="Overdue" value={data.overdue} icon={AlertTriangle} />
      <Kpi label="Suspended" value={data.suspended} icon={AlertTriangle} />
      <Kpi label="Total users" value={data.users} icon={Users} />
    </div>
  );
}

/* ---------------------------- demo requests ---------------------------- */

const DEMO_STATUS = ["new", "contacted", "demo_scheduled", "converted", "lost"] as const;
const demoTone: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 border-sky-100",
  contacted: "bg-amber-50 text-amber-700 border-amber-100",
  demo_scheduled: "bg-violet-50 text-violet-700 border-violet-100",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  lost: "bg-red-50 text-red-700 border-red-100",
};

function DemosTab() {
  const qc = useQueryClient();
  const list = useServerFn(listDemoRequests);
  const upd = useServerFn(updateDemoRequest);
  const del = useServerFn(deleteDemoRequest);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const { data } = useQuery({ queryKey: ["platform", "demos"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform", "demos"] });

  const updM = useMutation({
    mutationFn: (v: any) => upd({ data: v }),
    onSuccess: () => { invalidate(); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((r: any) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return [r.full_name, r.company, r.email, r.phone, r.city].some((v: any) =>
        String(v ?? "").toLowerCase().includes(term));
    });
  }, [data, q, filter]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total requests" value={(data ?? []).length} icon={Inbox} accent />
        <Kpi label="New" value={(data ?? []).filter((r: any) => r.status === "new").length} icon={AlertTriangle} />
        <Kpi label="Demo scheduled" value={(data ?? []).filter((r: any) => r.status === "demo_scheduled").length} icon={RefreshCw} />
        <Kpi label="Converted" value={(data ?? []).filter((r: any) => r.status === "converted").length} icon={ShieldCheck} />
      </div>

      <Panel className="flex flex-wrap items-center gap-2 p-4">
        <Input
          placeholder="Search name, agency, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs bg-white"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DEMO_STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <button className="btn-brand-ghost text-sm" onClick={invalidate}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </Panel>

      {rows.length === 0 && <Empty text="No demo requests yet." />}

      <div className="grid gap-3">
        {rows.map((r: any) => (
          <Panel key={r.id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-[#0f172a]">
                  {r.full_name}
                  {r.company ? <span className="text-[#94a3b8]"> · {r.company}</span> : null}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[#64748b]">
                  <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-[#48a890]"><Mail className="h-3 w-3" /> {r.email}</a>
                  <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-[#48a890]"><Phone className="h-3 w-3" /> {r.phone}</a>
                  {r.city && <span>{r.city}{r.country ? `, ${r.country}` : ""}</span>}
                  {r.team_size && <span>Team: {r.team_size}</span>}
                  {r.current_software && <span>Using: {r.current_software}</span>}
                  <span>{new Date(r.created_at).toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={demoTone[r.status] ?? "bg-[#f1f5f9] text-[#64748b]"}>{String(r.status).replace("_", " ")}</Badge>
                <Select value={r.status} onValueChange={(v) => updM.mutate({ id: r.id, status: v })}>
                  <SelectTrigger className="h-8 w-40 bg-white text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEMO_STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="text-[#94a3b8] hover:text-destructive" onClick={() => delM.mutate(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {r.message && <p className="rounded-xl bg-[#f8fafc] p-3 text-sm text-[#475569]">{r.message}</p>}

            <Textarea
              defaultValue={r.notes ?? ""}
              rows={2}
              placeholder="Internal notes…"
              className="bg-white"
              onBlur={(e) => {
                if (e.target.value !== (r.notes ?? "")) updM.mutate({ id: r.id, notes: e.target.value });
              }}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- clients ------------------------------- */

const emptyClient = {
  agency_name: "", owner_email: "", owner_name: "", phone: "", password: "",
  plan: "starter", plan_price: 0, billing_cycle: "monthly", seat_limit: 5,
  subscription_status: "active", subscription_start: new Date().toISOString().slice(0, 10),
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

function ClientsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listClients);
  const create = useServerFn(createClient);
  const update = useServerFn(updateClient);
  const remove = useServerFn(deleteClient);
  const resetPw = useServerFn(resetClientPassword);
  const impersonate = useServerFn(impersonateClient);

  const { data: clients } = useQuery({ queryKey: ["platform", "clients"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyClient);
  const [edit, setEdit] = useState<any>(null);

  const invalidate = () => { qc.invalidateQueries({ queryKey: ["platform"] }); };

  const createM = useMutation({
    mutationFn: (d: any) => create({ data: { ...d, plan_price: Number(d.plan_price), seat_limit: Number(d.seat_limit) } }),
    onSuccess: (_r, d: any) => {
      const creds = `TraWe login\nURL: https://app.trawe.in/auth\nEmail: ${d.owner_email}\nPassword: ${d.password}`;
      navigator.clipboard?.writeText(creds).catch(() => {});
      toast.success("Account created — credentials copied to clipboard");
      setOpen(false); setForm(emptyClient); invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: (d: { id: string; patch: any }) => update({ data: d }),
    onSuccess: () => { toast.success("Saved"); setEdit(null); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const statusTone = (s?: string) =>
    s === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : s === "suspended" ? "bg-red-50 text-red-700 border-red-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHead
          title="Client workspaces"
          hint={`${(clients ?? []).length} workspaces provisioned`}
          action={<button className="btn-brand text-sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New client</button>}
        />
        <div className="divide-y divide-[#eef1f5]">
          {(clients ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-[#64748b]">No clients yet.</p>}
          {(clients ?? []).map((c: any) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#0f172a]">{c.name}</p>
                  {c.is_platform_owner && <Badge variant="outline" className="border-[#48a890]/20 bg-[#48a890]/10 text-[#2f7c69]">Platform</Badge>}
                  <Badge variant="outline" className={statusTone(c.subscription_status)}>{c.subscription_status ?? "—"}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-[#64748b]">{c.owner_email ?? "—"} · {c.user_count} users · {c.plan ?? "—"}</p>
                {c.domains?.length > 0 && (
                  <p className="mt-1 text-xs text-[#48a890]">{c.domains.map((d: any) => d.hostname).join(", ")}</p>
                )}
              </div>
              <div className="text-right text-xs text-[#64748b]">
                <p className="font-medium text-[#0f172a]">{money(c.plan_price ?? 0)} <span className="font-normal text-[#94a3b8]">/ {c.billing_cycle ?? "monthly"}</span></p>
                <p>Renews {c.renewal_date ?? "—"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEdit(c)}>Manage</Button>
                {!c.is_platform_owner && (
                  <>
                    <Button size="sm" variant="outline" title="Reset password" onClick={async () => {
                      const pw = window.prompt("New password for " + c.owner_email);
                      if (!pw) return;
                      try { await resetPw({ data: { email: c.owner_email, password: pw } }); toast.success("Password updated"); }
                      catch (e: any) { toast.error(e.message); }
                    }}><KeyRound className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" title="Copy one-time login link" onClick={async () => {
                      try {
                        const r = await impersonate({ data: { tenant_id: c.id, reason: "support" } });
                        await navigator.clipboard.writeText(r.url);
                        toast.success("One-time login link copied for " + r.email);
                      } catch (e: any) { toast.error(e.message); }
                    }}><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                      if (!window.confirm(`Delete ${c.name} and all its logins? This cannot be undone.`)) return;
                      try { await remove({ data: { id: c.id } }); toast.success("Deleted"); invalidate(); }
                      catch (e: any) { toast.error(e.message); }
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>New client workspace</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <Field label="Agency name"><Input value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} /></Field>
            <Field label="Owner name"><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></Field>
            <Field label="Owner email (login)"><Input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Temporary password">
              <div className="flex gap-2">
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: generatePassword() })}>Generate</Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan"><Input value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} /></Field>
              <Field label="Price (₹)"><Input type="number" value={form.plan_price} onChange={(e) => setForm({ ...form, plan_price: e.target.value })} /></Field>
              <Field label="Billing cycle">
                <Select value={form.billing_cycle} onValueChange={(v) => setForm({ ...form, billing_cycle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Seats"><Input type="number" value={form.seat_limit} onChange={(e) => setForm({ ...form, seat_limit: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.subscription_status} onValueChange={(v) => setForm({ ...form, subscription_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Start date"><Input type="date" value={form.subscription_start} onChange={(e) => setForm({ ...form, subscription_start: e.target.value })} /></Field>
            </div>
            <Button className="w-full" disabled={createM.isPending} onClick={() => createM.mutate(form)}>
              {createM.isPending ? "Creating…" : "Create client"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Creates the agency workspace plus the owner login. Share the email and temporary password with the agency admin —
              they add their own team members from Settings → Users.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{edit?.name}</SheetTitle></SheetHeader>
          {edit && (
            <div className="mt-6 space-y-4">
              <Field label="Agency name"><Input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="CRM name shown to their staff"><Input value={edit.crm_name ?? ""} onChange={(e) => setEdit({ ...edit, crm_name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan"><Input value={edit.plan ?? ""} onChange={(e) => setEdit({ ...edit, plan: e.target.value })} /></Field>
                <Field label="Price (₹)"><Input type="number" value={edit.plan_price ?? 0} onChange={(e) => setEdit({ ...edit, plan_price: Number(e.target.value) })} /></Field>
                <Field label="Billing cycle">
                  <Select value={edit.billing_cycle ?? "monthly"} onValueChange={(v) => setEdit({ ...edit, billing_cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="half_yearly">Half yearly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={edit.subscription_status ?? "active"} onValueChange={(v) => setEdit({ ...edit, subscription_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Renewal date"><Input type="date" value={edit.renewal_date ?? ""} onChange={(e) => setEdit({ ...edit, renewal_date: e.target.value })} /></Field>
                <Field label="Grace days"><Input type="number" value={edit.grace_days ?? 7} onChange={(e) => setEdit({ ...edit, grace_days: Number(e.target.value) })} /></Field>
                <Field label="Seats"><Input type="number" value={edit.seat_limit ?? 5} onChange={(e) => setEdit({ ...edit, seat_limit: Number(e.target.value) })} /></Field>
              </div>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feature access</p>
              <div className="space-y-2 rounded-2xl border border-[#e8ecf1] p-3">
                {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((k) => {
                  const resolved = resolvePlan(edit.plan, edit.features, edit.usage_limits);
                  const on = !!resolved.features[k];
                  return (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-[#334155]">{FEATURE_LABELS[k]}</span>
                      <Switch checked={on} onCheckedChange={(v) => setEdit({ ...edit, features: { ...(edit.features ?? {}), [k]: v } })} />
                    </div>
                  );
                })}
              </div>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly limits (0 = unlimited)</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(LIMIT_LABELS) as LimitKey[]).map((k) => {
                  const resolved = resolvePlan(edit.plan, edit.features, edit.usage_limits);
                  return (
                    <Field key={k} label={LIMIT_LABELS[k]}>
                      <Input type="number" value={Number(resolved.limits[k] ?? 0)}
                        onChange={(e) => setEdit({ ...edit, usage_limits: { ...(edit.usage_limits ?? {}), [k]: Number(e.target.value) } })} />
                    </Field>
                  );
                })}
              </div>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">White-label branding</p>
              <Field label="Logo URL"><Input value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Primary colour"><Input value={edit.primary_color ?? ""} placeholder="#0B2545" onChange={(e) => setEdit({ ...edit, primary_color: e.target.value })} /></Field>
                <Field label="Accent colour"><Input value={edit.accent_color ?? ""} placeholder="#48A890" onChange={(e) => setEdit({ ...edit, accent_color: e.target.value })} /></Field>
              </div>
              <Field label="Login headline"><Input value={edit.login_headline ?? ""} onChange={(e) => setEdit({ ...edit, login_headline: e.target.value })} /></Field>
              <Field label="Internal notes"><Textarea value={edit.internal_notes ?? ""} onChange={(e) => setEdit({ ...edit, internal_notes: e.target.value })} /></Field>
              <Button className="w-full" disabled={updateM.isPending}
                onClick={() => updateM.mutate({ id: edit.id, patch: edit })}>
                {updateM.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------- support ------------------------------- */

function SupportTab() {
  const qc = useQueryClient();
  const list = useServerFn(listTickets);
  const reply = useServerFn(replyTicket);
  const { data } = useQuery({ queryKey: ["platform", "tickets"], queryFn: () => list() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (v: { id: string; reply?: string; status?: string }) => reply({ data: v }),
    onSuccess: () => { toast.success("Ticket updated"); qc.invalidateQueries({ queryKey: ["platform", "tickets"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Panel>
      <PanelHead title="Support requests" hint="Raised by agencies from their dashboard" />
      <div className="divide-y divide-[#eef2f6]">
        {(data ?? []).length === 0 && <p className="p-6 text-sm text-[#94a3b8]">No support requests yet.</p>}
        {(data ?? []).map((t: any) => (
          <div key={t.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-[#0f172a]">{t.subject}</p>
              <Badge variant="outline">{t.tenant_name}</Badge>
              <Badge variant={t.priority === "high" ? "destructive" : "secondary"}>{t.priority}</Badge>
              <Badge variant="outline">{t.status}</Badge>
              <span className="text-xs text-[#94a3b8]">{new Date(t.created_at).toLocaleString("en-IN")}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#64748b]">{t.message}</p>
            {t.reply && <p className="mt-2 rounded-xl bg-[#effaf5] p-3 text-sm text-[#0d4f3f] whitespace-pre-wrap">{t.reply}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Textarea rows={2} className="min-w-[240px] flex-1 bg-white" placeholder="Reply…"
                value={drafts[t.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: e.target.value })} />
              <div className="flex flex-col gap-2">
                <Button size="sm" disabled={save.isPending} onClick={() => save.mutate({ id: t.id, reply: drafts[t.id] ?? "", status: "answered" })}>Reply</Button>
                <Button size="sm" variant="outline" onClick={() => save.mutate({ id: t.id, status: "closed" })}>Close</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------------------- usage & health ---------------------------- */

function HealthTab() {
  const list = useServerFn(clientHealth);
  const { data } = useQuery({ queryKey: ["platform", "health"], queryFn: () => list() });
  return (
    <Panel>
      <PanelHead title="Usage & health" hint="Current month consumption per workspace" />
      <div className="overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[#94a3b8]">
            <tr><th className="py-2">Client</th><th>Plan</th><th>Status</th><th>Seats</th><th>Queries</th><th>AI calls</th><th>Messages</th><th>Last active</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-[#eef2f6]">
                <td className="py-2.5 font-medium text-[#0f172a]">{r.name}</td>
                <td className="capitalize text-[#64748b]">{r.plan ?? "—"}</td>
                <td><Badge variant={r.subscription_status === "active" ? "secondary" : "destructive"}>{r.subscription_status ?? "—"}</Badge></td>
                <td className="tabular-nums text-[#64748b]">{r.seats_used}/{r.seat_limit ?? 0}</td>
                <td className="tabular-nums text-[#64748b]">{r.usage?.queries ?? 0}</td>
                <td className="tabular-nums text-[#64748b]">{r.usage?.ai_calls ?? 0}</td>
                <td className="tabular-nums text-[#64748b]">{r.usage?.messages ?? 0}</td>
                <td className="text-[#94a3b8]">{r.last_active_at ? new Date(r.last_active_at).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------------------------- whatsapp fleet ---------------------------- */

function WhatsAppFleetTab() {
  const qc = useQueryClient();
  const load = useServerFn(whatsappFleet);
  const control = useServerFn(controlWhatsAppSession);
  const { data, isFetching } = useQuery({
    queryKey: ["platform", "wa-fleet"],
    queryFn: () => load(),
    refetchInterval: 30_000,
  });
  const act = useMutation({
    mutationFn: (v: { tenantId: string; action: "restart" | "logout" }) => control({ data: v }),
    onSuccess: () => { toast.success("Done"); qc.invalidateQueries({ queryKey: ["platform", "wa-fleet"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Could not reach the WhatsApp service"),
  });

  const gw = data?.gateway;
  const rows = data?.workspaces ?? [];
  const connected = rows.filter((r: any) => r.status === "connected").length;
  const queued = rows.reduce((s: number, r: any) => s + (r.queueDepth ?? 0), 0);
  const failed = rows.reduce((s: number, r: any) => s + (r.failed ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Service" icon={Activity} accent value={!gw?.configured ? "Not set up" : gw?.online ? "Online" : "Offline"} />
        <Kpi label="Connected numbers" icon={MessageSquare} value={String(connected)} />
        <Kpi label="Messages waiting" icon={Inbox} value={String(queued)} />
        <Kpi label="Failed sends" icon={AlertTriangle} value={String(failed)} />
      </div>

      <Panel>
        <PanelHead
          title="TraWe WhatsApp fleet"
          hint={gw?.error ? `Service unreachable: ${gw.error}` : gw?.uptimeSeconds ? `Service up for ${Math.round(gw.uptimeSeconds / 60)} min` : "Live connection health per workspace"}
          action={
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["platform", "wa-fleet"] })}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} /> Refresh
            </Button>
          }
        />
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-[#94a3b8]">
              <tr><th className="py-2">Workspace</th><th>Engine</th><th>Status</th><th>Number</th><th>Queue</th><th>Sent</th><th>Failed</th><th>Drops</th><th>Last activity</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.tenantId} className="border-t border-[#eef2f6]">
                  <td className="py-2.5 font-medium text-[#0f172a]">{r.name}</td>
                  <td className="text-[#64748b]">{r.engine === "trawe" ? "TraWe WhatsApp" : "WasenderAPI"}</td>
                  <td>
                    <Badge variant={r.status === "connected" ? "secondary" : r.status === "error" ? "destructive" : "outline"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="tabular-nums text-[#64748b]">{r.phone ?? "—"}</td>
                  <td className="tabular-nums text-[#64748b]">{r.queueDepth}</td>
                  <td className="tabular-nums text-[#64748b]">{r.sent}</td>
                  <td className="tabular-nums text-[#64748b]">{r.failed}</td>
                  <td className="tabular-nums text-[#64748b]">{r.disconnectCount}</td>
                  <td className="text-[#94a3b8]">{r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString("en-IN") : "—"}</td>
                  <td className="whitespace-nowrap text-right">
                    {r.engine === "trawe" && (
                      <>
                        <Button variant="ghost" size="sm" disabled={act.isPending} onClick={() => act.mutate({ tenantId: r.tenantId, action: "restart" })}>Reconnect</Button>
                        <Button variant="ghost" size="sm" className="text-[#c2410c]" disabled={act.isPending} onClick={() => act.mutate({ tenantId: r.tenantId, action: "logout" })}>Sign out</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center text-[#94a3b8]">No workspaces yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------- domains ------------------------------- */

function DomainsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listDomains);
  const clientsFn = useServerFn(listClients);
  const add = useServerFn(addDomain);
  const check = useServerFn(checkDomain);
  const remove = useServerFn(deleteDomain);

  const { data } = useQuery({ queryKey: ["platform", "domains"], queryFn: () => list() });
  const { data: clients } = useQuery({ queryKey: ["platform", "clients"], queryFn: () => clientsFn() });
  const [tenantId, setTenantId] = useState("");
  const [hostname, setHostname] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["platform", "domains"] });

  return (
    <div className="space-y-5">
      {!data?.cloudflare && (
        <Panel className="p-4 text-sm text-amber-700">
          Cloudflare isn’t connected yet. Add <code>CLOUDFLARE_API_TOKEN</code> and <code>CLOUDFLARE_ZONE_ID</code> and
          domains will be provisioned with SSL automatically. Until then, domains are stored for manual setup.
        </Panel>
      )}

      <Panel>
        <PanelHead title="Add a client domain" hint="Point their CNAME at app.trawe.in" />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[220px] flex-1">
            <Label className="text-xs text-[#64748b]">Client</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[220px] flex-1">
            <Label className="text-xs text-[#64748b]">Hostname</Label>
            <Input className="mt-1 bg-white" placeholder="crm.clientdomain.com" value={hostname} onChange={(e) => setHostname(e.target.value)} />
          </div>
          <button className="btn-brand text-sm" onClick={async () => {
            if (!tenantId || !hostname) return toast.error("Pick a client and enter a hostname");
            try { await add({ data: { tenant_id: tenantId, hostname } }); setHostname(""); toast.success("Domain added"); invalidate(); }
            catch (e: any) { toast.error(e.message); }
          }}><Plus className="h-4 w-4" /> Add</button>
        </div>
      </Panel>

      {(data?.rows ?? []).length === 0 && <Empty text="No client domains yet." />}

      <div className="grid gap-3">
        {(data?.rows ?? []).map((d: any) => (
          <Panel key={d.id} className="space-y-2 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Globe className="h-4 w-4 text-[#48a890]" />
              <p className="font-medium text-[#0f172a]">{d.hostname}</p>
              <Badge variant="outline" className={d.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}>
                {d.status}{d.ssl_status ? ` · SSL ${d.ssl_status}` : ""}
              </Badge>
              <span className="text-xs text-[#64748b]">{d.tenants?.name}</span>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  try { await check({ data: { id: d.id } }); toast.success("Re-checked"); invalidate(); }
                  catch (e: any) { toast.error(e.message); }
                }}><RefreshCw className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                  if (!window.confirm(`Remove ${d.hostname}?`)) return;
                  await remove({ data: { id: d.id } }); invalidate();
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-3 text-xs text-[#475569]">
              <p className="mb-1 font-medium text-[#0f172a]">DNS the client must add:</p>
              <p>CNAME <code>{d.hostname.split(".")[0]}</code> → <code>app.trawe.in</code></p>
              {d.verification_txt_name && (
                <p className="mt-1">TXT <code>{d.verification_txt_name}</code> → <code>{d.verification_txt_value}</code></p>
              )}
              {d.error_message && <p className="mt-1 text-destructive">{d.error_message}</p>}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- payments ------------------------------- */

function PaymentsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listPayments);
  const clientsFn = useServerFn(listClients);
  const record = useServerFn(recordPayment);
  const remove = useServerFn(deletePayment);

  const { data: rows } = useQuery({ queryKey: ["platform", "payments"], queryFn: () => list({ data: {} }) });
  const { data: clients } = useQuery({ queryKey: ["platform", "clients"], queryFn: () => clientsFn() });
  const [form, setForm] = useState<any>({
    tenant_id: "", amount: "", paid_on: new Date().toISOString().slice(0, 10),
    mode: "bank_transfer", reference: "", note: "", extend_renewal: true, cycles: 1,
  });

  const total = useMemo(() => (rows ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0), [rows]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total collected" value={money(total)} icon={Wallet} accent />
        <Kpi label="Payments logged" value={(rows ?? []).length} icon={TrendingUp} />
      </div>

      <Panel>
        <PanelHead title="Record an offline payment" hint="Extends the client renewal date automatically" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-[#64748b]">Client</Label>
            <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs text-[#64748b]">Amount (₹)</Label><Input className="mt-1 bg-white" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label className="text-xs text-[#64748b]">Paid on</Label><Input className="mt-1 bg-white" type="date" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} /></div>
          <div>
            <Label className="text-xs text-[#64748b]">Mode</Label>
            <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
              <SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs text-[#64748b]">Reference</Label><Input className="mt-1 bg-white" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
          <div><Label className="text-xs text-[#64748b]">Cycles paid</Label><Input className="mt-1 bg-white" type="number" min={1} value={form.cycles} onChange={(e) => setForm({ ...form, cycles: Number(e.target.value) })} /></div>
          <div className="sm:col-span-3">
            <button className="btn-brand text-sm" onClick={async () => {
              if (!form.tenant_id || !Number(form.amount)) return toast.error("Client and amount are required");
              try {
                await record({ data: { ...form, amount: Number(form.amount) } });
                toast.success("Payment recorded, renewal extended");
                setForm({ ...form, amount: "", reference: "" });
                qc.invalidateQueries({ queryKey: ["platform"] });
              } catch (e: any) { toast.error(e.message); }
            }}>Record payment</button>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Payment history" hint={`${(rows ?? []).length} entries`} />
        <div className="divide-y divide-[#eef1f5]">
          {(rows ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-[#64748b]">No payments recorded yet.</p>}
          {(rows ?? []).map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 px-5 py-3 text-sm">
              <span className="flex-1 font-medium text-[#0f172a]">{r.tenants?.name ?? "—"}</span>
              <span className="tabular-nums text-[#0f172a]">{money(r.amount)}</span>
              <span className="text-[#64748b]">{r.paid_on} · {r.mode}{r.reference ? " · " + r.reference : ""}</span>
              <span className="text-[#94a3b8]">{r.period_start} → {r.period_end}</span>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                await remove({ data: { id: r.id } });
                qc.invalidateQueries({ queryKey: ["platform"] });
              }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------ broadcasts ------------------------------ */

function BroadcastsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listBroadcasts);
  const save = useServerFn(saveBroadcast);
  const remove = useServerFn(deleteBroadcast);
  const { data: rows } = useQuery({ queryKey: ["platform", "broadcasts"], queryFn: () => list() });
  const [form, setForm] = useState({ title: "", body: "", kind: "info", active: true });

  return (
    <div className="space-y-5">
      <Panel>
        <PanelHead title="New announcement" hint="Shown inside every client workspace" />
        <div className="space-y-3 p-5">
          <Input className="bg-white" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea className="bg-white" placeholder="Message shown to every client workspace" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <button className="btn-brand text-sm" onClick={async () => {
            if (!form.title) return toast.error("Title required");
            await save({ data: form });
            setForm({ title: "", body: "", kind: "info", active: true });
            qc.invalidateQueries({ queryKey: ["platform", "broadcasts"] });
            toast.success("Published");
          }}><Megaphone className="h-4 w-4" /> Publish</button>
        </div>
      </Panel>

      {(rows ?? []).length === 0 && <Empty text="No announcements published yet." />}

      <div className="grid gap-3">
        {(rows ?? []).map((b: any) => (
          <Panel key={b.id} className="flex items-start gap-4 p-5">
            <div className="flex-1">
              <p className="font-medium text-[#0f172a]">{b.title}</p>
              <p className="text-sm text-[#64748b]">{b.body}</p>
            </div>
            <Badge variant="outline" className={b.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-[#f1f5f9] text-[#64748b]"}>
              {b.active ? "Live" : "Off"}
            </Badge>
            <Button size="sm" variant="outline" onClick={async () => {
              await save({ data: { id: b.id, title: b.title, body: b.body, kind: b.kind, active: !b.active } });
              qc.invalidateQueries({ queryKey: ["platform", "broadcasts"] });
            }}>{b.active ? "Disable" : "Enable"}</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
              await remove({ data: { id: b.id } });
              qc.invalidateQueries({ queryKey: ["platform", "broadcasts"] });
            }}><Trash2 className="h-4 w-4" /></Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- security ------------------------------- */

function SecurityTab() {
  const change = useServerFn(changeMyPassword);
  const [pw, setPw] = useState("");
  return (
    <div className="max-w-md">
      <Panel>
        <PanelHead title="Change my platform password" hint="Applies to your super admin login" />
        <div className="space-y-3 p-5">
          <Input className="bg-white" type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn-brand text-sm" onClick={async () => {
            try { await change({ data: { password: pw } }); setPw(""); toast.success("Password updated"); }
            catch (e: any) { toast.error(e.message); }
          }}><KeyRound className="h-4 w-4" /> Update password</button>
        </div>
      </Panel>
    </div>
  );
}
