import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getQuotation, saveQuotation, listCustomers } from "@/lib/sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/quotations/$id")({
  head: () => ({ meta: [{ title: "Edit Quotation — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: QuoteEditor,
});

function QuoteEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getQuotation);
  const saveFn = useServerFn(saveQuotation);
  const custFn = useServerFn(listCustomers);
  const { data: q, isLoading } = useQuery({ queryKey: ["quotation", id], queryFn: () => getFn({ data: { id } }) });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => custFn({ data: {} }) });
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (q && !form) setForm({
      title: q.title, customer_id: q.customer_id, lead_id: q.lead_id, status: q.status,
      currency: q.currency, valid_till: q.valid_till || "", terms: q.terms || "", notes: q.notes || "",
      gst_mode: q.gst_mode,
      items: (q as any).quotation_items?.map((i: any) => ({
        description: i.description, qty: Number(i.qty), rate: Number(i.rate),
        discount: Number(i.discount), tax_rate: Number(i.tax_rate),
      })) ?? [{ description: "", qty: 1, rate: 0, discount: 0, tax_rate: 5 }],
    });
  }, [q]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { id, ...form } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotation", id] }); qc.invalidateQueries({ queryKey: ["quotations"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !form) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const totals = form.items.reduce((acc: any, it: any) => {
    const taxable = Math.max(0, it.qty * it.rate - (it.discount ?? 0));
    const tax = taxable * (it.tax_rate ?? 0) / 100;
    return { sub: acc.sub + taxable, tax: acc.tax + tax, total: acc.total + taxable + tax };
  }, { sub: 0, tax: 0, total: 0 });

  function setItem(i: number, patch: any) {
    const items = [...form.items]; items[i] = { ...items[i], ...patch }; setForm({ ...form, items });
  }
  function addRow() { setForm({ ...form, items: [...form.items, { description: "", qty: 1, rate: 0, discount: 0, tax_rate: 5 }] }); }
  function delRow(i: number) { setForm({ ...form, items: form.items.filter((_: any, idx: number) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => nav({ to: "/quotations" })}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <div><div className="text-xs text-muted-foreground font-mono">{q?.code}</div><h1 className="text-xl font-bold">{form.title || "Quotation"}</h1></div>
        <Button className="ml-auto" onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-4 w-4 mr-1" />Save</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Customer</Label>
              <Select value={form.customer_id ?? ""} onValueChange={(v) => setForm({ ...form, customer_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["draft","sent","accepted","rejected"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valid till</Label><Input type="date" value={form.valid_till} onChange={(e) => setForm({ ...form, valid_till: e.target.value })} /></div>
            <div>
              <Label>GST Mode</Label>
              <Select value={form.gst_mode} onValueChange={(v) => setForm({ ...form, gst_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cgst_sgst">CGST + SGST</SelectItem><SelectItem value="igst">IGST</SelectItem><SelectItem value="none">No tax</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Terms</Label><Textarea rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatCurrency(totals.sub)} />
            <Row label="Tax" value={formatCurrency(totals.tax)} />
            <div className="border-t pt-2"><Row label="Total" value={formatCurrency(totals.total)} bold /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm">Line Items</CardTitle><Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add row</Button></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left p-2">Description</th><th className="text-right p-2 w-20">Qty</th><th className="text-right p-2 w-28">Rate</th><th className="text-right p-2 w-24">Discount</th><th className="text-right p-2 w-20">Tax %</th><th className="text-right p-2 w-28">Amount</th><th className="w-10"></th></tr>
            </thead>
            <tbody>
              {form.items.map((it: any, i: number) => {
                const taxable = Math.max(0, it.qty * it.rate - it.discount);
                const amount = taxable + taxable * it.tax_rate / 100;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2"><Input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} /></td>
                    <td className="p-2"><Input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.rate} onChange={(e) => setItem(i, { rate: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.discount} onChange={(e) => setItem(i, { discount: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.tax_rate} onChange={(e) => setItem(i, { tax_rate: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2 text-right font-medium">{formatCurrency(amount)}</td>
                    <td className="p-2"><Button variant="ghost" size="icon" onClick={() => delRow(i)}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
              {form.items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No line items.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-bold text-base" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
