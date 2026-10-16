import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPackages, upsertPackage, deletePackage } from "@/lib/ops.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Globe2, Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { SingleImagePicker } from "@/components/masters/single-image-picker";

export const Route = createFileRoute("/_authenticated/packages")({
  head: () => ({ meta: [
    { title: "Tour Packages — TraWe" },
    { name: "description", content: "Reusable tour package catalog for your agency." },
    { name: "robots", content: "noindex" },
  ]}),
  component: PackagesPage,
});

function PackagesPage() {
  const list = useServerFn(listPackages);
  const save = useServerFn(upsertPackage);
  const del = useServerFn(deletePackage);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["packages"], queryFn: () => list() });
  const saveM = useMutation({ mutationFn: (d: any) => save({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); toast.success("Saved"); setOpen(false); } });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); toast.success("Deleted"); } });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  function openNew() {
    setEdit({ title: "", destination: "", duration_days: 5, duration_nights: 4, type: "customizable", base_price: 0, currency: "INR", is_published: false, highlights: [], inclusions: [], exclusions: [] });
    setOpen(true);
  }

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Tour Packages</h1>
            <p className="text-sm text-muted-foreground">Reusable packages you can quote in seconds and publish to your website.</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New package</Button>
        </div>

        {data.length === 0 ? (
          <Card><CardContent className="py-14 text-center text-sm text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-40" />No packages yet. Create your first one.</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data as any[]).map(p => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 relative">
                  {p.cover_image && <img src={p.cover_image} alt="" className="h-full w-full object-cover" />}
                  {p.is_published && <Badge className="absolute top-2 right-2"><Globe2 className="h-3 w-3 mr-1" />Published</Badge>}
                </div>
                <CardContent className="p-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.destination}</div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{p.duration_days}D {p.duration_nights}N · {p.type}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="font-bold">{formatCurrency(Number(p.base_price ?? 0))}</div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => delM.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} package</DialogTitle></DialogHeader>
            {edit && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Title</Label><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
                <div><Label>Destination</Label><Input value={edit.destination ?? ""} onChange={(e) => setEdit({ ...edit, destination: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={edit.category ?? ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} placeholder="Honeymoon / Family / Adventure" /></div>
                <div><Label>Days</Label><Input type="number" value={edit.duration_days} onChange={(e) => setEdit({ ...edit, duration_days: Number(e.target.value) })} /></div>
                <div><Label>Nights</Label><Input type="number" value={edit.duration_nights} onChange={(e) => setEdit({ ...edit, duration_nights: Number(e.target.value) })} /></div>
                <div><Label>Type</Label>
                  <Select value={edit.type} onValueChange={(v) => setEdit({ ...edit, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customizable">Customizable</SelectItem>
                      <SelectItem value="fixed">Fixed Departure</SelectItem>
                      <SelectItem value="group">Group Tour</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label>Base Price</Label><Input type="number" value={edit.base_price} onChange={(e) => setEdit({ ...edit, base_price: Number(e.target.value) })} /></div>
                <div className="col-span-2"><Label>Cover image</Label>
                  <SingleImagePicker value={edit.cover_image ?? ""} onChange={(url) => setEdit({ ...edit, cover_image: url })} folder="packages" />
                </div>
                <div className="col-span-2"><Label>Summary</Label><Textarea value={edit.summary ?? ""} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} rows={2} /></div>
                <div className="col-span-2"><Label>Highlights (one per line)</Label>
                  <Textarea rows={3} value={(edit.highlights ?? []).join("\n")} onChange={(e) => setEdit({ ...edit, highlights: e.target.value.split("\n").filter(Boolean) })} /></div>
                <div><Label>Inclusions (one per line)</Label>
                  <Textarea rows={4} value={(edit.inclusions ?? []).join("\n")} onChange={(e) => setEdit({ ...edit, inclusions: e.target.value.split("\n").filter(Boolean) })} /></div>
                <div><Label>Exclusions (one per line)</Label>
                  <Textarea rows={4} value={(edit.exclusions ?? []).join("\n")} onChange={(e) => setEdit({ ...edit, exclusions: e.target.value.split("\n").filter(Boolean) })} /></div>
                <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg border">
                  <Switch checked={edit.is_published} onCheckedChange={(v) => setEdit({ ...edit, is_published: v })} />
                  <div>
                    <div className="text-sm font-medium">Publish to public website</div>
                    <div className="text-xs text-muted-foreground">Makes the package visible on your public site.</div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => saveM.mutate(edit)}>Save package</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
