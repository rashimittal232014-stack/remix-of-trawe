import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getReportsOverview } from "@/lib/reports.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Download, Star, FileSpreadsheet, TrendingUp, Receipt, Wallet, Package, Users, Activity as ActivityIcon, BarChart3, Building2, Landmark } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TraWe" },
      { name: "description", content: "Sales, invoices, billing, supplier and activity reports." },
      { property: "og:title", content: "Reports — TraWe" },
      { property: "og:description", content: "Multi-category reports with export." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

const CATS = [
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "quotation", label: "Quotation", icon: FileSpreadsheet },
  { key: "invoice", label: "Invoice", icon: Receipt },
  { key: "billing", label: "Billing", icon: Wallet },
  { key: "supplier", label: "Supplier", icon: Building2 },
  { key: "bank", label: "Bank / Ledger", icon: Landmark },
  { key: "itinerary", label: "Itinerary", icon: Package },
  { key: "client", label: "Client / Company", icon: Users },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "mis", label: "Management / MIS", icon: BarChart3 },
];

const COLORS = ["#48a890", "#3b82f6", "#8b5cf6", "#c04818", "#f59e0b", "#0ea5e9", "#e11d48"];

function ReportsPage() {
  const [cat, setCat] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [starred, setStarred] = useState<Set<string>>(new Set(["sales", "billing"]));

  const fetcher = useServerFn(getReportsOverview);
  const { data } = useQuery({
    queryKey: ["reports-overview", from, to],
    queryFn: () => fetcher({ data: { from: from || undefined, to: to || undefined } }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <aside className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 pb-2">Categories</div>
        {CATS.map((c) => {
          const Icon = c.icon;
          const active = cat === c.key;
          const star = starred.has(c.key);
          return (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm",
                active ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/40",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{c.label}</span>
              <Star
                className={cn("h-3.5 w-3.5", star ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                onClick={(e) => {
                  e.stopPropagation();
                  const s = new Set(starred);
                  s.has(c.key) ? s.delete(c.key) : s.add(c.key);
                  setStarred(s);
                }}
              />
            </button>
          );
        })}
      </aside>

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>{CATS.find((c) => c.key === cat)?.label} Reports</h1>
            <p className="text-sm text-muted-foreground">Filter, drill down, export</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            <Button variant="outline" size="sm" onClick={() => { setFrom(""); setTo(""); }}>Reset</Button>
            <Button size="sm" variant="outline" onClick={() => exportCSV(cat, data)}><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
          </div>
        </div>

        {!data ? <div className="text-sm text-muted-foreground">Loading…</div> : <ReportBody cat={cat} data={data} />}
      </div>
    </div>
  );
}

function ReportBody({ cat, data }: { cat: string; data: any }) {
  const { leads = [], quotations = [], invoices = [], payments = [], bookings = [] } = data ?? {};

  const salesByMonth = useMemo(() => aggByMonth(bookings, "travel_from", "gross_value"), [bookings]);
  const invoiceStatusPie = useMemo(() => aggByField(invoices, "status", "total"), [invoices]);
  const leadSourcePie = useMemo(() => aggByField(leads, "source", null), [leads]);
  const collectionByMonth = useMemo(() => aggByMonth(payments, "paid_at", "amount"), [payments]);
  const quoteStatusPie = useMemo(() => aggByField(quotations, "status", "total"), [quotations]);

  const totalSales = bookings.reduce((s: number, b: any) => s + Number(b.gross_value ?? 0), 0);
  const totalNet = bookings.reduce((s: number, b: any) => s + Number(b.net_cost ?? 0), 0);
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.total ?? 0), 0);
  const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
  const totalOutstanding = invoices.reduce((s: number, i: any) => s + (Number(i.total ?? 0) - Number(i.amount_paid ?? 0)), 0);

  if (cat === "sales") return (
    <>
      <KPIRow items={[
        { l: "Bookings", v: bookings.length, tint: "bg-blue-100 text-blue-700" },
        { l: "Gross Sales", v: formatCurrency(totalSales), tint: "bg-emerald-100 text-emerald-700" },
        { l: "Net Cost", v: formatCurrency(totalNet), tint: "bg-amber-100 text-amber-700" },
        { l: "Margin", v: formatCurrency(totalSales - totalNet), tint: "bg-violet-100 text-violet-700" },
      ]} />
      <Card><CardHeader><CardTitle className="text-sm">Sales by Month</CardTitle></CardHeader><CardContent className="h-72">
        <ResponsiveContainer><BarChart data={salesByMonth}><XAxis dataKey="key" /><YAxis /><RTooltip /><Bar dataKey="value" fill="#48a890" /></BarChart></ResponsiveContainer>
      </CardContent></Card>
    </>
  );

  if (cat === "quotation") return (
    <>
      <KPIRow items={[
        { l: "Quotations", v: quotations.length, tint: "bg-blue-100 text-blue-700" },
        { l: "Value", v: formatCurrency(quotations.reduce((s: number, q: any) => s + Number(q.total ?? 0), 0)), tint: "bg-emerald-100 text-emerald-700" },
      ]} />
      <PieCard title="Quotations by Status" data={quoteStatusPie} />
    </>
  );

  if (cat === "invoice") return (
    <>
      <KPIRow items={[
        { l: "Invoices", v: invoices.length, tint: "bg-blue-100 text-blue-700" },
        { l: "Invoiced", v: formatCurrency(totalInvoiced), tint: "bg-emerald-100 text-emerald-700" },
        { l: "Outstanding", v: formatCurrency(totalOutstanding), tint: "bg-rose-100 text-rose-700" },
      ]} />
      <PieCard title="Invoices by Status" data={invoiceStatusPie} />
      <TableCard title="Invoice List" rows={invoices} cols={["code","invoice_date","total","amount_paid","status"]} />
    </>
  );

  if (cat === "billing") return (
    <>
      <KPIRow items={[
        { l: "Collections", v: formatCurrency(totalPaid), tint: "bg-emerald-100 text-emerald-700" },
        { l: "Outstanding", v: formatCurrency(totalOutstanding), tint: "bg-rose-100 text-rose-700" },
      ]} />
      <Card><CardHeader><CardTitle className="text-sm">Collections by Month</CardTitle></CardHeader><CardContent className="h-72">
        <ResponsiveContainer><LineChart data={collectionByMonth}><XAxis dataKey="key" /><YAxis /><RTooltip /><Line dataKey="value" stroke="#48a890" strokeWidth={2} /></LineChart></ResponsiveContainer>
      </CardContent></Card>
    </>
  );

  if (cat === "client") return (
    <>
      <KPIRow items={[
        { l: "Leads", v: leads.length, tint: "bg-blue-100 text-blue-700" },
        { l: "Sources", v: new Set(leads.map((l: any) => l.source).filter(Boolean)).size, tint: "bg-violet-100 text-violet-700" },
      ]} />
      <PieCard title="Leads by Source" data={leadSourcePie} />
    </>
  );

  if (cat === "activity") return (
    <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">
      Detailed activity reports live under the Activities module. Use Ctrl+K → Activities → Calendar for a visual view.
    </div>
  );

  if (cat === "mis") return (
    <>
      <KPIRow items={[
        { l: "Leads", v: leads.length, tint: "bg-blue-100 text-blue-700" },
        { l: "Quotes", v: quotations.length, tint: "bg-violet-100 text-violet-700" },
        { l: "Bookings", v: bookings.length, tint: "bg-emerald-100 text-emerald-700" },
        { l: "Invoices", v: invoices.length, tint: "bg-amber-100 text-amber-700" },
        { l: "Payments", v: formatCurrency(totalPaid), tint: "bg-sky-100 text-sky-700" },
        { l: "Margin", v: formatCurrency(totalSales - totalNet), tint: "bg-rose-100 text-rose-700" },
      ]} />
    </>
  );

  return <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">No data for this category in the selected range.</div>;
}

function KPIRow({ items }: { items: { l: string; v: any; tint: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((k) => (
        <Card key={k.l}><CardContent className="p-4">
          <div className={`h-9 w-9 rounded-xl grid place-items-center ${k.tint}`}><BarChart3 className="h-4 w-4" /></div>
          <div className="mt-3 text-xs text-muted-foreground">{k.l}</div>
          <div className="text-xl font-bold">{k.v}</div>
        </CardContent></Card>
      ))}
    </div>
  );
}

function PieCard({ title, data }: { title: string; data: { key: string; value: number }[] }) {
  return (
    <Card><CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="h-72">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="key" outerRadius={90} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <RTooltip />
        </PieChart>
      </ResponsiveContainer>
    </CardContent></Card>
  );
}

function TableCard({ title, rows, cols }: { title: string; rows: any[]; cols: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground border-b">
            <tr>{cols.map((c) => <th key={c} className="p-2.5">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((r, i) => (
              <tr key={i} className="border-b hover:bg-muted/30">
                {cols.map((c) => <td key={c} className="p-2.5">{c === "status" ? <Badge variant="outline">{r[c]}</Badge> : String(r[c] ?? "—")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function aggByMonth(rows: any[], dateKey: string, valueKey: string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r[dateKey]) continue;
    const k = String(r[dateKey]).slice(0, 7);
    map.set(k, (map.get(k) ?? 0) + Number(r[valueKey] ?? 0));
  }
  return [...map.entries()].sort().map(([key, value]) => ({ key, value }));
}
function aggByField(rows: any[], key: string, valueKey: string | null) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = (r[key] ?? "unknown") as string;
    map.set(k, (map.get(k) ?? 0) + (valueKey ? Number(r[valueKey] ?? 0) : 1));
  }
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

function exportCSV(cat: string, data: any) {
  if (!data) return;
  const bucket: Record<string, any[]> = {
    sales: data.bookings, quotation: data.quotations, invoice: data.invoices,
    billing: data.payments, client: data.leads, supplier: data.bookings,
    bank: data.payments, itinerary: data.bookings, activity: [], mis: data.invoices,
  };
  const rows = bucket[cat] ?? [];
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = `trawe-${cat}.csv`; a.click();
  URL.revokeObjectURL(url);
}