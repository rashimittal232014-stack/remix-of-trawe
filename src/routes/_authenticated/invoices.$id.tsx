import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInvoice, saveInvoice, listCustomers, recordPayment, listBankAccounts } from "@/lib/sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Save, Wallet, Download } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({ meta: [{ title: "Edit Invoice — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: InvoiceEditor,
});

function InvoiceEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getInvoice);
  const saveFn = useServerFn(saveInvoice);
  const custFn = useServerFn(listCustomers);
  const { data: inv, isLoading } = useQuery({ queryKey: ["invoice", id], queryFn: () => getFn({ data: { id } }) });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => custFn({ data: {} }) });
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (inv && !form) setForm({
      customer_id: inv.customer_id, invoice_date: inv.invoice_date, due_date: inv.due_date || "",
      place_of_supply: inv.place_of_supply || "", gst_mode: inv.gst_mode, currency: inv.currency,
      notes: inv.notes || "", terms: inv.terms || "",
      lead_id: (inv as any).lead_id || null,
      booking_id: (inv as any).booking_id || null,
      items: (inv as any).invoice_items?.map((i: any) => ({
        description: i.description, hsn_sac: i.hsn_sac ?? "", qty: Number(i.qty), rate: Number(i.rate),
        discount: Number(i.discount), tax_rate: Number(i.tax_rate),
      })) ?? [{ description: "", hsn_sac: "998551", qty: 1, rate: 0, discount: 0, tax_rate: 5 }],
    });
  }, [inv]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      id,
      customer_id: form.customer_id || null,
      lead_id: form.lead_id || null,
      booking_id: form.booking_id || null,
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      place_of_supply: form.place_of_supply || "",
      gst_mode: form.gst_mode || "cgst_sgst",
      currency: form.currency || "INR",
      notes: form.notes || "",
      terms: form.terms || "",
      items: form.items.map((it: any) => ({
        description: it.description || "Item",
        hsn_sac: it.hsn_sac || "",
        qty: Number(it.qty) || 0,
        rate: Number(it.rate) || 0,
        discount: Number(it.discount) || 0,
        tax_rate: Number(it.tax_rate) || 0,
      })),
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", id] }); qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice saved"); },
    onError: (e: any) => { console.error("saveInvoice failed", e); toast.error(e?.message || "Save failed"); },
  });

  if (isLoading || !form) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const totals = form.items.reduce((acc: any, it: any) => {
    const taxable = Math.max(0, it.qty * it.rate - (it.discount ?? 0));
    const tax = taxable * (it.tax_rate ?? 0) / 100;
    return { sub: acc.sub + taxable, tax: acc.tax + tax, total: acc.total + taxable + tax };
  }, { sub: 0, tax: 0, total: 0 });
  const cgst = form.gst_mode === "cgst_sgst" ? totals.tax / 2 : 0;
  const sgst = form.gst_mode === "cgst_sgst" ? totals.tax / 2 : 0;
  const igst = form.gst_mode === "igst" ? totals.tax : 0;

  function setItem(i: number, patch: any) { const items = [...form.items]; items[i] = { ...items[i], ...patch }; setForm({ ...form, items }); }
  function addRow() { setForm({ ...form, items: [...form.items, { description: "", hsn_sac: "998551", qty: 1, rate: 0, discount: 0, tax_rate: 5 }] }); }
  function delRow(i: number) { setForm({ ...form, items: form.items.filter((_: any, idx: number) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => nav({ to: "/invoices" })}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <div><div className="text-xs text-muted-foreground font-mono">{inv?.code}</div><h1 className="text-xl font-bold">Tax Invoice</h1></div>
        <div className="ml-auto flex gap-2">
          <PaymentButton invoiceId={id} balance={Number(inv?.total ?? 0) - Number(inv?.amount_paid ?? 0)} />
          <Button variant="outline" onClick={() => downloadInvoicePdf({ ...(inv as any), ...form, invoice_items: form.items })}><Download className="h-4 w-4 mr-1" />Download PDF</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-4 w-4 mr-1" />Save</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Bill To & Meta</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Customer</Label>
              <Select value={form.customer_id ?? ""} onValueChange={(v) => setForm({ ...form, customer_id: v || null })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}{c.gstin ? ` · ${c.gstin}` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Invoice date</Label><Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></div>
            <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Place of supply</Label><Input value={form.place_of_supply} onChange={(e) => setForm({ ...form, place_of_supply: e.target.value })} placeholder="Maharashtra" /></div>
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
            {cgst > 0 && <Row label="CGST" value={formatCurrency(cgst)} />}
            {sgst > 0 && <Row label="SGST" value={formatCurrency(sgst)} />}
            {igst > 0 && <Row label="IGST" value={formatCurrency(igst)} />}
            <div className="border-t pt-2"><Row label="Total" value={formatCurrency(totals.total)} bold /></div>
            <Row label="Paid" value={formatCurrency(inv?.amount_paid ?? 0)} />
            <Row label="Balance" value={formatCurrency(Number(inv?.total ?? totals.total) - Number(inv?.amount_paid ?? 0))} bold />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm">Line Items</CardTitle><Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add row</Button></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left p-2">Description</th><th className="text-left p-2 w-28">HSN/SAC</th><th className="text-right p-2 w-16">Qty</th><th className="text-right p-2 w-28">Rate</th><th className="text-right p-2 w-24">Disc</th><th className="text-right p-2 w-20">Tax %</th><th className="text-right p-2 w-28">Amount</th><th className="w-10"></th></tr>
            </thead>
            <tbody>
              {form.items.map((it: any, i: number) => {
                const taxable = Math.max(0, it.qty * it.rate - it.discount);
                const amount = taxable + taxable * it.tax_rate / 100;
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2"><Input value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} /></td>
                    <td className="p-2"><Input value={it.hsn_sac} onChange={(e) => setItem(i, { hsn_sac: e.target.value })} /></td>
                    <td className="p-2"><Input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.rate} onChange={(e) => setItem(i, { rate: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.discount} onChange={(e) => setItem(i, { discount: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2"><Input type="number" value={it.tax_rate} onChange={(e) => setItem(i, { tax_rate: Number(e.target.value) })} className="text-right" /></td>
                    <td className="p-2 text-right font-medium">{formatCurrency(amount)}</td>
                    <td className="p-2"><Button variant="ghost" size="icon" onClick={() => delRow(i)}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
              {form.items.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No line items.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Payments</CardTitle></CardHeader>
        <CardContent>
          {(inv as any)?.payments?.length === 0 || !(inv as any)?.payments ? (
            <div className="text-sm text-muted-foreground text-center py-6">No payments recorded.</div>
          ) : (
            <ul className="space-y-2">
              {(inv as any).payments.map((p: any) => (
                <li key={p.id} className="p-3 rounded-lg border flex items-center gap-3 text-sm">
                  <Wallet className="h-4 w-4 text-primary" />
                  <div className="flex-1"><div className="font-medium">{formatCurrency(p.amount)} <span className="text-xs text-muted-foreground">via {p.mode}</span></div><div className="text-xs text-muted-foreground">{p.paid_at} · {p.reference}</div></div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentButton({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    amount: balance, paid_at: new Date().toISOString().slice(0,10), mode: "bank",
    reference: "", notes: "", bank_account_id: "", payer_name: "",
    txn_fee: 0, currency: "INR", exchange_rate: 1, status: "received",
    cheque_no: "", cheque_date: "",
  });
  const payFn = useServerFn(recordPayment);
  const banksFn = useServerFn(listBankAccounts);
  const { data: banks = [] } = useQuery({ queryKey: ["bank-accounts"], queryFn: () => banksFn() });
  const save = useMutation({
    mutationFn: () => payFn({ data: { invoice_id: invoiceId, ...form } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoice", invoiceId] }); qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Payment recorded"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Wallet className="h-4 w-4 mr-1" />Record Payment</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Amount *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          <div><Label>Payment Date *</Label><Input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} /></div>
          <div>
            <Label>Payment Mode</Label>
            <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["bank","upi","cash","card","cheque","neft","rtgs","imps","wallet","other"].map(x => <SelectItem key={x} value={x}>{x.toUpperCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["received","pending","bounced","refunded"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Received In (Bank Account)</Label>
            <Select value={form.bank_account_id || "none"} onValueChange={(v) => setForm({ ...form, bank_account_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {banks.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.label || b.bank_name} · {b.account_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Payer Name</Label><Input value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} placeholder="Received from" /></div>
          <div><Label>Reference / Txn ID</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / Ref no." /></div>
          {form.mode === "cheque" && (<>
            <div><Label>Cheque No.</Label><Input value={form.cheque_no} onChange={(e) => setForm({ ...form, cheque_no: e.target.value })} /></div>
            <div><Label>Cheque Date</Label><Input type="date" value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} /></div>
          </>)}
          <div><Label>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["INR","USD","EUR","GBP","AED","AUD","SGD"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Exchange Rate</Label><Input type="number" step="0.01" value={form.exchange_rate} onChange={(e) => setForm({ ...form, exchange_rate: Number(e.target.value) })} /></div>
          <div><Label>Transaction Fee / Charges</Label><Input type="number" value={form.txn_fee} onChange={(e) => setForm({ ...form, txn_fee: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes about this payment" /></div>
        </div>
        <div className="flex justify-end"><Button onClick={() => save.mutate()}>Save</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-bold text-base" : ""}`}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
