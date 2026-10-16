import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listInvoices, deleteInvoice, saveInvoice, getInvoice } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({ meta: [{ title: "Invoices — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const listFn = useServerFn(listInvoices);
  const delFn = useServerFn(deleteInvoice);
  const saveFn = useServerFn(saveInvoice);
  const getFn = useServerFn(getInvoice);
  const { data: rows = [] } = useQuery({ queryKey: ["invoices"], queryFn: () => listFn() });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Deleted"); } });
  async function download(id: string) {
    try { const inv = await getFn({ data: { id } }); if (!inv) return toast.error("Not found"); downloadInvoicePdf(inv as any); }
    catch (e: any) { toast.error(e.message || "Failed"); }
  }
  const create = useMutation({
    mutationFn: () => saveFn({ data: { invoice_date: new Date().toISOString().slice(0,10), items: [] } as any }),
    onSuccess: ({ id }) => nav({ to: "/invoices/$id", params: { id: id! } }),
  });
  const statusColor: Record<string,string> = { unpaid: "bg-amber-100 text-amber-700", paid: "bg-emerald-100 text-emerald-700", partial: "bg-blue-100 text-blue-700", overdue: "bg-rose-100 text-rose-700" };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Invoices</h1><p className="text-sm text-muted-foreground">{rows.length} invoices</p></div>
        <Button size="sm" className="ml-auto" onClick={() => create.mutate()}><Plus className="h-4 w-4 mr-1" />New Invoice</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Number</th><th className="text-left p-3">Client</th><th className="text-left p-3">Date</th><th className="text-left p-3">Status</th><th className="text-left p-3">Total</th><th className="text-left p-3">Paid</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-3"><Link to="/invoices/$id" params={{ id: r.id }} className="font-mono text-xs text-primary hover:underline">{r.code}</Link></td>
                <td className="p-3">{r.customers?.full_name ?? "—"}<div className="text-xs text-muted-foreground font-mono">{r.customers?.gstin}</div></td>
                <td className="p-3 text-xs">{r.invoice_date}</td>
                <td className="p-3"><Badge className={statusColor[r.status] ?? ""}>{r.status}</Badge></td>
                <td className="p-3 font-medium">{formatCurrency(r.total)}</td>
                <td className="p-3">{formatCurrency(r.amount_paid)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => download(r.id)} title="Download PDF"><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
