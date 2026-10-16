import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listPaymentsHub, markInvoicePaid, deletePaymentRow } from "@/lib/reports.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, CheckCircle2, Clock, AlertTriangle, Search, FileSpreadsheet, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — TraWe" },
      { name: "description", content: "Client and supplier payments hub." },
      { property: "og:title", content: "Payments — TraWe" },
      { property: "og:description", content: "Track receivables and payables in one view." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [scope, setScope] = useState<"client" | "supplier">("client");
  const [status, setStatus] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fetcher = useServerFn(listPaymentsHub);
  const { data } = useQuery({
    queryKey: ["payments-hub", scope, status, from, to],
    queryFn: () => fetcher({ data: { scope, status: status === "all" ? undefined : status, from: from || undefined, to: to || undefined } }),
  });
  const allRows = (data?.rows ?? []) as any[];
  const owners = (data?.owners ?? []) as { id: string; name: string }[];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (scope === "client" && owner !== "all" && r.owner_id !== owner) return false;
      if (!q) return true;
      const c = r.customers ?? {};
      const l = r.leads ?? {};
      const hay = [r.code, l.code, c.full_name, c.company, c.phone, c.email, r.owner_name].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, search, owner, scope]);

  const kpis = useMemo(() => {
    if (scope === "client") {
      const total = allRows.reduce((s, r) => s + Number(r.total ?? 0), 0);
      const paid = allRows.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
      const pending = total - paid;
      const overdue = allRows
        .filter((r) => r.due_date && new Date(r.due_date) < new Date() && r.status !== "paid")
        .reduce((s, r) => s + (Number(r.total ?? 0) - Number(r.amount_paid ?? 0)), 0);
      return { total, paid, pending, overdue };
    }
    const total = allRows.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    return { total, paid: total, pending: 0, overdue: 0 };
  }, [allRows, scope]);

  function reset() { setSearch(""); setStatus("all"); setOwner("all"); setFrom(""); setTo(""); }

  function exportCsv() {
    const header = scope === "client"
      ? ["Query ID","Invoice","Client","Company","Phone","Owner","Invoice Date","Due Date","Total","Paid","Balance","Status"]
      : ["Date","Invoice","Customer","Mode","Reference","Amount"];
    const lines = rows.map((r: any) => scope === "client"
      ? [r.leads?.code ?? "", r.code, r.customers?.full_name ?? "", r.customers?.company ?? "", r.customers?.phone ?? "", r.owner_name ?? "", r.invoice_date, r.due_date ?? "", r.total, r.amount_paid, Number(r.total) - Number(r.amount_paid), r.status]
      : [r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "", r.invoices?.code ?? "", r.invoices?.customers?.full_name ?? "", r.mode, r.reference ?? "", r.amount]
    );
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `payments-${scope}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Payments</h1>
          <p className="text-sm text-muted-foreground">Central client collections and supplier payment tracking.</p>
        </div>
        <div className="inline-flex rounded-full border p-1 bg-muted/40">
          <button onClick={() => setScope("client")} className={`px-4 py-1.5 text-sm rounded-full transition ${scope === "client" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Client Payments</button>
          <button onClick={() => setScope("supplier")} className={`px-4 py-1.5 text-sm rounded-full transition ${scope === "supplier" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Supplier Payments</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Total" value={kpis.total} accent="text-slate-900" />
        <KpiTile label="Paid" value={kpis.paid} accent="text-emerald-700" />
        <KpiTile label="Pending" value={kpis.pending} accent="text-amber-700" />
        <KpiTile label="Overdue" value={kpis.overdue} accent="text-rose-700" />
      </div>

      {/* Filter bar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Query ID, client, company, mobile, email, owner" className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Owner</Label>
              <Select value={owner} onValueChange={setOwner} disabled={scope !== "client"}>
                <SelectTrigger><SelectValue placeholder="All Owners" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 rounded-full"><Search className="h-4 w-4 mr-1" />Search</Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={reset}>Reset</Button>
            <Button size="sm" variant="outline" className="rounded-full text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={exportCsv}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {scope === "client" ? <ClientTable rows={rows} /> : <SupplierTable rows={rows} />}
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  const Icon = label === "Total" ? Wallet : label === "Paid" ? CheckCircle2 : label === "Pending" ? Clock : AlertTriangle;
  const tint = label === "Total" ? "bg-blue-50 text-blue-600" : label === "Paid" ? "bg-emerald-50 text-emerald-600" : label === "Pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600";
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`h-6 w-6 rounded-lg grid place-items-center ${tint}`}><Icon className="h-3.5 w-3.5" /></span>
          {label}
        </div>
        <div className={`mt-2 text-2xl font-bold ${accent}`}>INR {Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      </CardContent>
    </Card>
  );
}

function ClientTable({ rows }: { rows: any[] }) {
  const qc = useQueryClient();
  const pay = useServerFn(markInvoicePaid);
  const delRow = useServerFn(deletePaymentRow);
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank");
  const m = useMutation({
    mutationFn: (id: string) => pay({ data: { invoice_id: id, amount: Number(amount), mode } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments-hub"] });
      setOpenId(null); setAmount("");
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoice-delete`, { method: "POST", body: JSON.stringify({ id }) }).catch(() => null);
      return res;
    },
  });
  void del; void delRow;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b">
          <div className="text-base font-semibold">Client Payments</div>
          <div className="text-xs text-muted-foreground">{rows.length} payment records found.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Query ID</th>
                <th className="text-left px-4 py-3">Client / Company</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Bank</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const balance = Number(r.total ?? 0) - Number(r.amount_paid ?? 0);
                const overdue = r.due_date && new Date(r.due_date) < new Date() && r.status !== "paid";
                const displayStatus = overdue ? "overdue" : r.status;
                const statusPill =
                  displayStatus === "paid" ? "bg-emerald-50 text-emerald-700"
                  : displayStatus === "overdue" ? "bg-rose-50 text-rose-700"
                  : displayStatus === "partial" ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-700";
                const dueFmt = r.due_date ? new Date(r.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/20 align-top">
                    <td className="px-4 py-3">
                      {r.lead_id ? (
                        <Link to="/leads/$id" params={{ id: r.lead_id }} className="text-indigo-600 font-medium hover:underline">
                          {r.leads?.code ?? r.code}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-700">{r.code}</span>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-0.5">{r.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.customers?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.customers?.company ?? r.customers?.phone ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">{r.owner_name ?? "—"}</td>
                    <td className={`px-4 py-3 ${overdue ? "text-rose-600 font-medium" : ""}`}>{dueFmt}</td>
                    <td className="px-4 py-3 font-semibold">INR {Number(balance || r.total || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs capitalize ${statusPill}`}>{displayStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">--</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status !== "paid" && (
                          <Button size="sm" className="h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-xs" onClick={() => { setOpenId(r.id); setAmount(String(balance)); }}>Paid</Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" asChild>
                          <Link to="/invoices/$id" params={{ id: r.id }}>View</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No payments match this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button disabled={!amount || m.isPending} onClick={() => openId && m.mutate(openId)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SupplierTable({ rows }: { rows: any[] }) {
  const qc = useQueryClient();
  const del = useServerFn(deletePaymentRow);
  const m = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments-hub"] }),
  });
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b">
          <div className="text-base font-semibold">Supplier Payments</div>
          <div className="text-xs text-muted-foreground">{rows.length} payment records found.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">{r.paid_at ? new Date(r.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="px-4 py-3 font-medium">{r.invoices?.code ?? "—"}</td>
                  <td className="px-4 py-3">{r.invoices?.customers?.full_name ?? "—"}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 uppercase">{r.mode}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.reference ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="h-7 rounded-full text-rose-500 border-rose-100 hover:bg-rose-50 text-xs" onClick={() => m.mutate(r.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No supplier payments recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}