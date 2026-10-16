import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listBranches, upsertBranch, deleteBranch } from "@/lib/hr.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/branches")({
  head: () => ({ meta: [
    { title: "Branches — TraWe" },
    { name: "description", content: "Manage multi-branch setup and per-branch numbering." },
    { name: "robots", content: "noindex" },
  ]}),
  component: BranchesPage,
});

function BranchesPage() {
  const list = useServerFn(listBranches);
  const save = useServerFn(upsertBranch);
  const del = useServerFn(deleteBranch);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["branches"], queryFn: () => list() });
  const saveM = useMutation({ mutationFn: (d: any) => save({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); toast.success("Saved"); setOpen(false); } });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); toast.success("Deleted"); } });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  function openNew() {
    setEdit({ name: "", code: "", country: "India", is_default: false, is_active: true });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Branches</h1>
          <p className="text-sm text-muted-foreground">Set up multi-branch operations with per-branch invoice numbering.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New branch</Button>
      </div>

      {data.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />No branches yet.</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data as any[]).map(b => (
            <Card key={b.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{b.name}</div>
                      {b.is_default && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Default</Badge>}
                      {!b.is_active && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{[b.city, b.state, b.country].filter(Boolean).join(", ")}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(b); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => delM.mutate(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 text-xs gap-1 pt-2 border-t">
                  <div><span className="text-muted-foreground">Code:</span> {b.code || "—"}</div>
                  <div><span className="text-muted-foreground">Prefix:</span> {b.invoice_prefix || "—"}</div>
                  <div><span className="text-muted-foreground">GSTIN:</span> {b.gstin || "—"}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {b.phone || "—"}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} branch</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Code</Label><Input value={edit.code ?? ""} onChange={(e) => setEdit({ ...edit, code: e.target.value })} /></div>
              <div><Label>Invoice Prefix</Label><Input value={edit.invoice_prefix ?? ""} onChange={(e) => setEdit({ ...edit, invoice_prefix: e.target.value })} placeholder="INV-DEL-" /></div>
              <div className="col-span-2"><Label>Address</Label><Input value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></div>
              <div><Label>City</Label><Input value={edit.city ?? ""} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={edit.state ?? ""} onChange={(e) => setEdit({ ...edit, state: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={edit.country ?? ""} onChange={(e) => setEdit({ ...edit, country: e.target.value })} /></div>
              <div><Label>GSTIN</Label><Input value={edit.gstin ?? ""} onChange={(e) => setEdit({ ...edit, gstin: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={edit.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
              <div className="col-span-2 flex items-center gap-6 p-3 rounded-lg border">
                <label className="flex items-center gap-2"><Switch checked={edit.is_default} onCheckedChange={(v) => setEdit({ ...edit, is_default: v })} /><span className="text-sm">Set as default branch</span></label>
                <label className="flex items-center gap-2"><Switch checked={edit.is_active} onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /><span className="text-sm">Active</span></label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveM.mutate(edit)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}