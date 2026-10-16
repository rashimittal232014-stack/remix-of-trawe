import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listVouchers, upsertVoucher, deleteVoucher } from "@/lib/ops.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download, FileText, Plane, Hotel, Car, StampIcon, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vouchers")({
  head: () => ({ meta: [
    { title: "Vouchers — TraWe" },
    { name: "description", content: "Generate hotel, flight, transfer, visa and sightseeing vouchers." },
    { name: "robots", content: "noindex" },
  ]}),
  component: VouchersPage,
});

const TYPES = [
  { v: "hotel", label: "Hotel", icon: Hotel, tint: "bg-blue-100 text-blue-700" },
  { v: "flight", label: "Flight", icon: Plane, tint: "bg-sky-100 text-sky-700" },
  { v: "transfer", label: "Transfer", icon: Car, tint: "bg-amber-100 text-amber-700" },
  { v: "visa", label: "Visa", icon: StampIcon, tint: "bg-violet-100 text-violet-700" },
  { v: "sightseeing", label: "Sightseeing", icon: MapPin, tint: "bg-emerald-100 text-emerald-700" },
];

function VouchersPage() {
  const [filter, setFilter] = useState<{ type?: string; status?: string; search?: string }>({});
  const list = useServerFn(listVouchers);
  const save = useServerFn(upsertVoucher);
  const del = useServerFn(deleteVoucher);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["vouchers", filter], queryFn: () => list({ data: filter }) });
  const saveM = useMutation({ mutationFn: (d: any) => save({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["vouchers"] }); toast.success("Saved"); } });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["vouchers"] }); toast.success("Deleted"); } });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  function openNew(type = "hotel") { setEdit({ type, status: "draft", currency: "INR", pax_count: 1 }); setOpen(true); }

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Vouchers</h1>
            <p className="text-sm text-muted-foreground">Hotel, flight, transfer, visa and sightseeing vouchers.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />New voucher</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} voucher</DialogTitle></DialogHeader>
              {edit && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <Select value={edit.type} onValueChange={(v) => setEdit({ ...edit, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div><Label>Status</Label>
                    <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="col-span-2"><Label>Title</Label><Input value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="e.g. Taj Palace, Delhi — 3N" /></div>
                  <div><Label>Supplier</Label><Input value={edit.supplier_name ?? ""} onChange={(e) => setEdit({ ...edit, supplier_name: e.target.value })} /></div>
                  <div><Label>Reference #</Label><Input value={edit.reference_no ?? ""} onChange={(e) => setEdit({ ...edit, reference_no: e.target.value })} /></div>
                  <div><Label>From</Label><Input type="date" value={edit.travel_date ?? ""} onChange={(e) => setEdit({ ...edit, travel_date: e.target.value })} /></div>
                  <div><Label>To</Label><Input type="date" value={edit.travel_end_date ?? ""} onChange={(e) => setEdit({ ...edit, travel_end_date: e.target.value })} /></div>
                  <div><Label>Pax</Label><Input type="number" value={edit.pax_count ?? 0} onChange={(e) => setEdit({ ...edit, pax_count: Number(e.target.value) })} /></div>
                  <div><Label>Amount</Label><Input type="number" value={edit.amount ?? 0} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) })} /></div>
                  <div className="col-span-2"><Label>Location</Label><Input value={edit.location ?? ""} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Notes</Label><Textarea value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} rows={3} /></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => { saveM.mutate(edit); setOpen(false); }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES.map(t => {
            const count = (data as any[]).filter(v => v.type === t.v).length;
            return (
              <Card key={t.v} className="cursor-pointer hover:shadow-md" onClick={() => setFilter({ ...filter, type: filter.type === t.v ? undefined : t.v })}>
                <CardContent className="p-4">
                  <div className={`h-9 w-9 rounded-xl grid place-items-center ${t.tint}`}><t.icon className="h-4 w-4" /></div>
                  <div className="mt-2 text-xs text-muted-foreground">{t.label}</div>
                  <div className="text-xl font-bold">{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <CardTitle className="text-sm">All vouchers</CardTitle>
            <Input placeholder="Search…" className="ml-auto w-64" value={filter.search ?? ""} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
            <Select value={filter.status ?? "all"} onValueChange={(v) => setFilter({ ...filter, status: v === "all" ? undefined : v })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <div className="text-sm text-muted-foreground py-10 text-center bg-muted/30 rounded-lg">No vouchers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="p-2">Code</th><th>Type</th><th>Title</th><th>Customer</th><th>Travel</th><th>Amount</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {(data as any[]).map(v => (
                      <tr key={v.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-mono text-xs">{v.code}</td>
                        <td className="capitalize">{v.type}</td>
                        <td className="font-medium">{v.title}</td>
                        <td>{v.customers?.full_name ?? "—"}</td>
                        <td className="text-xs">{v.travel_date ?? "—"}</td>
                        <td>{formatCurrency(Number(v.amount ?? 0))}</td>
                        <td><Badge variant={v.status === "issued" ? "default" : v.status === "cancelled" ? "destructive" : "secondary"}>{v.status}</Badge></td>
                        <td className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEdit(v); setOpen(true); }}><FileText className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => window.print()}><Download className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => delM.mutate(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    
  );
}
