import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listQuotations, deleteQuotation, saveQuotation, deleteItinerary } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({ meta: [{ title: "Quotations — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: QuotationsPage,
});

function QuotationsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const listFn = useServerFn(listQuotations);
  const delFn = useServerFn(deleteQuotation);
  const delItinFn = useServerFn(deleteItinerary);
  const saveFn = useServerFn(saveQuotation);
  const { data: rows = [] } = useQuery({ queryKey: ["quotations"], queryFn: () => listFn({ data: {} }) });
  const [openNew, setOpenNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const del = useMutation({
    mutationFn: (r: { id: string; source?: string }) =>
      r.source === "itinerary" ? delItinFn({ data: { id: r.id } }) : delFn({ data: { id: r.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotations"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });
  const emptyDrafts = (rows as any[]).filter((r) => r.source !== "itinerary" && r.status === "draft" && Number(r.total ?? 0) === 0 && (!r.quotation_items || r.quotation_items.length === 0));
  const cleanEmpty = useMutation({
    mutationFn: async () => { for (const r of emptyDrafts) await delFn({ data: { id: r.id } }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotations"] }); toast.success(`Cleaned ${emptyDrafts.length} empty draft(s)`); },
  });
  const create = useMutation({
    mutationFn: (title: string) => saveFn({ data: { title, items: [] } as any }),
    onSuccess: ({ id }) => { setOpenNew(false); setNewTitle(""); nav({ to: "/quotations/$id", params: { id: id! } }); },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });
  const statusColor: Record<string,string> = { draft: "bg-slate-200 text-slate-700", sent: "bg-blue-100 text-blue-700", accepted: "bg-emerald-100 text-emerald-700", confirmed: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Quotations</h1><p className="text-sm text-muted-foreground">{rows.length} quotations</p></div>
        <div className="ml-auto flex items-center gap-2">
          {emptyDrafts.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => cleanEmpty.mutate()} disabled={cleanEmpty.isPending}>
              Clean {emptyDrafts.length} empty draft{emptyDrafts.length > 1 ? "s" : ""}
            </Button>
          )}
          <Button size="sm" onClick={() => setOpenNew(true)}><Plus className="h-4 w-4 mr-1" />New Quotation</Button>
        </div>
      </div>
      <Dialog open={openNew} onOpenChange={(o) => { setOpenNew(o); if (!o) setNewTitle(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Bali Family 5N/6D — Sharma" onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) create.mutate(newTitle.trim()); }} />
            <p className="text-xs text-muted-foreground">A quotation is only created after you confirm a title — this prevents empty drafts.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNew(false)}>Cancel</Button>
            <Button disabled={!newTitle.trim() || create.isPending} onClick={() => create.mutate(newTitle.trim())}>Create & Open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Code</th><th className="text-left p-3">Title</th><th className="text-left p-3">Client / Lead</th><th className="text-left p-3">Status</th><th className="text-left p-3">Valid till</th><th className="text-left p-3">Total</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-3">
                  {r.source === "itinerary" ? (
                    <Link to="/itineraries/$id" params={{ id: r.id }} className="font-mono text-xs text-primary hover:underline">{r.code}</Link>
                  ) : (
                    <Link to="/quotations/$id" params={{ id: r.id }} className="font-mono text-xs text-primary hover:underline">{r.code}</Link>
                  )}
                </td>
                <td className="p-3 font-medium">
                  {r.title}
                  {r.source === "itinerary" && <Badge variant="outline" className="ml-2 text-[10px]">Itinerary</Badge>}
                </td>
                <td className="p-3 text-xs">
                  {r.customers?.full_name || r.leads?.full_name || "—"}
                  {r.leads?.id && (
                    <div className="text-[10px] text-muted-foreground">
                      <Link to="/leads/$id" params={{ id: r.leads.id }} className="hover:underline">{r.leads.code || "View query"}</Link>
                    </div>
                  )}
                </td>
                <td className="p-3"><Badge className={statusColor[r.status] ?? ""}>{r.status}</Badge></td>
                <td className="p-3 text-xs">{r.valid_till ?? "—"}</td>
                <td className="p-3 font-medium">{formatCurrency(r.total)}</td>
                <td className="p-3"><Button variant="ghost" size="icon" onClick={() => del.mutate({ id: r.id, source: r.source })}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No quotations yet.</td></tr>}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
