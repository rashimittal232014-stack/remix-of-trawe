import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { saveInvoice } from "@/lib/sales.functions";
import { toast } from "sonner";

type Row = { particular: string; description: string; qty: number; rate: number };

export function ManualInvoiceDialog({
  open, onOpenChange, leadId, customerId, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  customerId?: string | null;
  onCreated?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveInvoice);

  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("Manual Invoice");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([{ particular: "Service Charges", description: "", qty: 1, rate: 0 }]);
  const [notes, setNotes] = useState("");
  const [igst, setIgst] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [tcs, setTcs] = useState(0);

  const subtotal = useMemo(() => rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0), 0), [rows]);
  const igstAmt = subtotal * (igst / 100);
  const cgstAmt = subtotal * (cgst / 100);
  const sgstAmt = subtotal * (sgst / 100);
  const tcsAmt = subtotal * (tcs / 100);
  const total = subtotal + igstAmt + cgstAmt + sgstAmt + tcsAmt;

  const addRow = () => setRows([...rows, { particular: "", description: "", qty: 1, rate: 0 }]);
  const removeRow = (i: number) => setRows(rows.filter((_, ix) => ix !== i));
  const updateRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, ix) => ix === i ? { ...r, ...patch } : r));

  const mut = useMutation({
    mutationFn: async () => {
      const gst_mode: "cgst_sgst" | "igst" | "none" =
        igst > 0 ? "igst" : (cgst > 0 || sgst > 0) ? "cgst_sgst" : "none";
      const tax_rate = gst_mode === "igst" ? igst : gst_mode === "cgst_sgst" ? (cgst + sgst) : 0;
      const items = rows
        .filter(r => r.particular || r.rate)
        .map(r => ({
          description: [r.particular, r.description].filter(Boolean).join(" — "),
          qty: Number(r.qty) || 0,
          rate: Number(r.rate) || 0,
          discount: 0,
          tax_rate,
        }));
      const composedNotes = [
        title && title !== "Manual Invoice" ? `Title: ${title}` : "",
        tcs > 0 ? `TCS ${tcs}% = ${tcsAmt.toFixed(2)}` : "",
        notes,
      ].filter(Boolean).join("\n");
      return saveFn({ data: {
        lead_id: leadId ?? null,
        customer_id: customerId ?? null,
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        gst_mode,
        currency: "INR",
        notes: composedNotes,
        items,
      } as any });
    },
    onSuccess: (res) => {
      toast.success("Invoice created");
      qc.invalidateQueries({ queryKey: ["invoices-all"] });
      onOpenChange(false);
      onCreated?.(res.id);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save invoice"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Manual Invoice</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Create Manual Invoice</div>
              <p className="text-xs text-muted-foreground">Manual invoice with editable particulars, tax and total.</p>
            </div>
            <Badge variant="secondary" className="rounded-full">MANUAL INVOICE</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Invoice Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Particulars</div>
              <Button size="sm" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add Particular</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1.2fr_1.4fr_80px_110px_120px_36px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium">
                <div>Particular</div><div>Description</div><div>Qty</div><div>Rate</div><div>Amount</div><div></div>
              </div>
              {rows.map((r, i) => {
                const amt = (Number(r.qty) || 0) * (Number(r.rate) || 0);
                return (
                  <div key={i} className="grid grid-cols-[1.2fr_1.4fr_80px_110px_120px_36px] gap-2 px-3 py-2 border-t items-center">
                    <Input value={r.particular} onChange={(e) => updateRow(i, { particular: e.target.value })} placeholder="Service Charges" />
                    <Input value={r.description} onChange={(e) => updateRow(i, { description: e.target.value })} />
                    <Input type="number" value={r.qty} onChange={(e) => updateRow(i, { qty: Number(e.target.value) })} />
                    <Input type="number" value={r.rate} onChange={(e) => updateRow(i, { rate: Number(e.target.value) })} />
                    <Input readOnly value={amt.toFixed(2)} className="bg-muted/30" />
                    <Button size="icon" variant="ghost" onClick={() => removeRow(i)} disabled={rows.length === 1}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Notes</Label>
              <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <Row2 label="Subtotal" value={subtotal.toFixed(2)} readOnly />
              <TaxRow label="IGST %" pct={igst} setPct={setIgst} amt={igstAmt} />
              <TaxRow label="CGST %" pct={cgst} setPct={setCgst} amt={cgstAmt} />
              <TaxRow label="SGST %" pct={sgst} setPct={setSgst} amt={sgstAmt} />
              <TaxRow label="TCS %"  pct={tcs}  setPct={setTcs}  amt={tcsAmt} />
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span>Total Amount</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Save Invoice"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row2({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <Input readOnly={readOnly} value={value} className="w-32 text-right" />
    </div>
  );
}

function TaxRow({ label, pct, setPct, amt }: { label: string; pct: number; setPct: (n: number) => void; amt: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Input type="number" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-24 text-right" />
        <span className="w-20 text-right tabular-nums">{amt.toFixed(2)}</span>
      </div>
    </div>
  );
}