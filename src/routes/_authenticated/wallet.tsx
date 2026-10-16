import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listWallet, addWalletEntry, upsertCreditNote, deleteCreditNote } from "@/lib/ops.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Wallet as WalletIcon, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [
    { title: "Wallet & Credit Notes — TraWe" },
    { name: "description", content: "Customer wallet balances, credit notes, and refunds." },
    { name: "robots", content: "noindex" },
  ]}),
  component: WalletPage,
});

function WalletPage() {
  const list = useServerFn(listWallet);
  const add = useServerFn(addWalletEntry);
  const saveCn = useServerFn(upsertCreditNote);
  const delCn = useServerFn(deleteCreditNote);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["wallet"], queryFn: () => list({}) });
  const addM = useMutation({ mutationFn: (d: any) => add({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet"] }); toast.success("Added"); setOpenE(false); } });
  const saveM = useMutation({ mutationFn: (d: any) => saveCn({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallet"] }); toast.success("Saved"); setOpenC(false); } });
  const delM = useMutation({ mutationFn: (id: string) => delCn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }) });

  const [openE, setOpenE] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [entry, setEntry] = useState<any>(null);
  const [cn, setCn] = useState<any>(null);

  const totalCredits = (data?.entries ?? []).filter((e: any) => e.entry_type === "credit").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalDebits = (data?.entries ?? []).filter((e: any) => e.entry_type === "debit").reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Wallet & Credit Notes</h1>
            <p className="text-sm text-muted-foreground">Customer wallet ledger, credit notes, and refunds.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEntry({ entry_type: "credit", source: "manual", amount: 0 }); setOpenE(true); }}><Plus className="h-4 w-4 mr-2" />Wallet entry</Button>
            <Button onClick={() => { setCn({ status: "issued", amount: 0, tax_amount: 0, currency: "INR" }); setOpenC(true); }}><Receipt className="h-4 w-4 mr-2" />Credit note</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-emerald-100 text-emerald-700"><TrendingUp className="h-5 w-5" /></div>
            <div className="mt-3 text-xs text-muted-foreground">Total Credits</div>
            <div className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>{formatCurrency(totalCredits)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-rose-100 text-rose-700"><TrendingDown className="h-5 w-5" /></div>
            <div className="mt-3 text-xs text-muted-foreground">Total Debits</div>
            <div className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>{formatCurrency(totalDebits)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 text-primary"><WalletIcon className="h-5 w-5" /></div>
            <div className="mt-3 text-xs text-muted-foreground">Net Balance Held</div>
            <div className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>{formatCurrency(totalCredits - totalDebits)}</div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="balances">
          <TabsList>
            <TabsTrigger value="balances">Customer Balances</TabsTrigger>
            <TabsTrigger value="entries">Ledger Entries</TabsTrigger>
            <TabsTrigger value="notes">Credit Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="balances">
            <Card><CardContent className="p-0">
              {(data?.balances ?? []).length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No customer balances yet</div> :
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b"><tr><th className="p-3">Customer</th><th>Balance</th></tr></thead>
                  <tbody>{data!.balances.map((b: any) => (
                    <tr key={b.customer_id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{b.name}</td>
                      <td className={b.balance >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{formatCurrency(b.balance)}</td>
                    </tr>
                  ))}</tbody>
                </table>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="entries">
            <Card><CardContent className="p-0">
              {(data?.entries ?? []).length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No entries yet</div> :
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b"><tr><th className="p-3">Date</th><th>Customer</th><th>Type</th><th>Source</th><th>Amount</th><th>Notes</th></tr></thead>
                  <tbody>{data!.entries.map((e: any) => (
                    <tr key={e.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-xs">{e.entry_date}</td>
                      <td>{e.customers?.full_name}</td>
                      <td><Badge variant={e.entry_type === "credit" ? "default" : "destructive"}>{e.entry_type}</Badge></td>
                      <td className="text-xs capitalize">{e.source.replace("_"," ")}</td>
                      <td className="font-semibold">{formatCurrency(Number(e.amount))}</td>
                      <td className="text-xs text-muted-foreground">{e.notes}</td>
                    </tr>
                  ))}</tbody>
                </table>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card><CardContent className="p-0">
              {(data?.creditNotes ?? []).length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No credit notes issued</div> :
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b"><tr><th className="p-3">Code</th><th>Date</th><th>Customer</th><th>Invoice</th><th>Total</th><th>Status</th><th></th></tr></thead>
                  <tbody>{data!.creditNotes.map((n: any) => (
                    <tr key={n.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{n.code}</td>
                      <td className="text-xs">{n.issue_date}</td>
                      <td>{n.customers?.full_name}</td>
                      <td className="text-xs">{n.invoices?.code ?? "—"}</td>
                      <td className="font-semibold">{formatCurrency(Number(n.total))}</td>
                      <td><Badge>{n.status}</Badge></td>
                      <td className="text-right"><Button size="icon" variant="ghost" onClick={() => delM.mutate(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                    </tr>
                  ))}</tbody>
                </table>}
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Wallet entry dialog */}
        <Dialog open={openE} onOpenChange={setOpenE}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add wallet entry</DialogTitle></DialogHeader>
            {entry && (
              <div className="space-y-3">
                <div><Label>Customer</Label>
                  <Select value={entry.customer_id ?? ""} onValueChange={(v) => setEntry({ ...entry, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{(data?.customers ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Type</Label>
                    <Select value={entry.entry_type} onValueChange={(v) => setEntry({ ...entry, entry_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="credit">Credit</SelectItem><SelectItem value="debit">Debit</SelectItem></SelectContent>
                    </Select></div>
                  <div><Label>Source</Label>
                    <Select value={entry.source} onValueChange={(v) => setEntry({ ...entry, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="loyalty">Loyalty</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="redeem">Redeem</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div><Label>Amount</Label><Input type="number" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: Number(e.target.value) })} /></div>
                <div><Label>Notes</Label><Textarea rows={2} value={entry.notes ?? ""} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenE(false)}>Cancel</Button>
              <Button onClick={() => addM.mutate(entry)}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credit note dialog */}
        <Dialog open={openC} onOpenChange={setOpenC}>
          <DialogContent>
            <DialogHeader><DialogTitle>New credit note</DialogTitle></DialogHeader>
            {cn && (
              <div className="space-y-3">
                <div><Label>Customer</Label>
                  <Select value={cn.customer_id ?? ""} onValueChange={(v) => setCn({ ...cn, customer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{(data?.customers ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Amount</Label><Input type="number" value={cn.amount} onChange={(e) => setCn({ ...cn, amount: Number(e.target.value) })} /></div>
                  <div><Label>Tax</Label><Input type="number" value={cn.tax_amount} onChange={(e) => setCn({ ...cn, tax_amount: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Reason</Label><Input value={cn.reason ?? ""} onChange={(e) => setCn({ ...cn, reason: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea rows={2} value={cn.notes ?? ""} onChange={(e) => setCn({ ...cn, notes: e.target.value })} /></div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Switch checked={cn.applied_to_wallet ?? false} onCheckedChange={(v) => setCn({ ...cn, applied_to_wallet: v })} />
                  <div className="text-sm">Apply to customer wallet as credit</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenC(false)}>Cancel</Button>
              <Button onClick={() => saveM.mutate({ ...cn, total: Number(cn?.amount ?? 0) + Number(cn?.tax_amount ?? 0) })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
