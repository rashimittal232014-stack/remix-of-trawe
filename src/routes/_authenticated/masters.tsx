import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listMasters, upsertMaster, deleteMaster,
  listPrices, upsertPrice, deletePrice, MASTER_KINDS,
} from "@/lib/masters.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Tag, ImageIcon, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker } from "@/components/masters/image-picker";
import { FileUploader } from "@/components/masters/file-uploader";
import { ImportExportMenu } from "@/components/masters/import-export-menu";
import { KIND_FIELDS, type FieldDef } from "@/lib/service-fields";

export const Route = createFileRoute("/_authenticated/masters")({
  head: () => ({ meta: [{ title: "Travel Masters — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: MastersPage,
});

const KIND_LABELS: Record<string, string> = {
  day_detail: "Day Detail", hotel: "Hotel", transfer: "Transfer",
  sightseeing: "Sightseeing", cruise: "Cruise", ferry: "Ferry",
  bus: "Bus", train: "Train", complementary: "Complementary",
  visa: "Visa", passport: "Passport", supplier: "Supplier",
  meal_plan: "Meal Plan", room_type: "Room Type", bank: "Bank",
};

// Field schemas live in @/lib/service-fields so the Itinerary Builder
// reuses the same fields when adding services.

function MastersPage() {
  const [kind, setKind] = useState<string>("hotel");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [priceItem, setPriceItem] = useState<any>(null);
  const qc = useQueryClient();
  const listFn = useServerFn(listMasters);
  const delFn = useServerFn(deleteMaster);
  const upFn = useServerFn(upsertMaster);
  const { data: rows = [] } = useQuery({ queryKey: ["masters", kind], queryFn: () => listFn({ data: { kind } }) });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["masters"] }); toast.success("Deleted"); },
  });
  const fieldDefs = KIND_FIELDS[kind] ?? [];
  const sampleColumns = ["name", "city", "country", "location", "duration", "description", "status", ...fieldDefs.filter(f => f.path === "meta" && !["images","attachments"].includes(f.key)).map(f => f.key)];
  const importRows = async (imported: Record<string, any>[]) => {
    for (const r of imported) {
      const meta: any = {};
      const root: any = { kind, status: "active" };
      for (const [k, v] of Object.entries(r)) {
        if (v === "" || v === null || v === undefined) continue;
        if (["name","city","country","location","duration","description","status","image_url"].includes(k)) root[k] = v;
        else meta[k] = v;
      }
      if (!root.name) continue;
      await upFn({ data: { ...root, meta } });
    }
    qc.invalidateQueries({ queryKey: ["masters"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Travel Masters</h1>
          <p className="text-sm text-muted-foreground">Central catalog for services, suppliers and tariffs</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ImportExportMenu
            kindLabel={KIND_LABELS[kind]}
            sampleColumns={sampleColumns}
            rows={rows}
            onImport={importRows}
          />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add {KIND_LABELS[kind]}</Button></DialogTrigger>
            <ItemForm kind={kind} initial={edit} onClose={() => { setOpen(false); setEdit(null); }} />
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b pb-2 overflow-x-auto">
        {MASTER_KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${kind === k ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"}`}>
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          No {KIND_LABELS[kind]} yet — click "Add {KIND_LABELS[kind]}" to create your first.
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r: any) => (
            <Card key={r.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted grid place-items-center relative">
                {r.image_url ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                  : <ImageIcon className="h-8 w-8 text-muted-foreground/40" />}
                <Badge className="absolute top-2 right-2" variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {(r.city || r.country) && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[r.city, r.country].filter(Boolean).join(", ")}</div>}
                  {r.duration && <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.duration}</div>}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setPriceItem(r)}><Tag className="h-3 w-3 mr-1" />Prices</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!priceItem} onOpenChange={(v) => !v && setPriceItem(null)}>
        {priceItem && <PricesDialog item={priceItem} onClose={() => setPriceItem(null)} />}
      </Dialog>
    </div>
  );
}

function ItemForm({ kind, initial, onClose }: { kind: string; initial: any; onClose: () => void }) {
  const qc = useQueryClient();
  const fields = KIND_FIELDS[kind] ?? KIND_FIELDS.hotel;
  const [f, setF] = useState<any>(() => {
    const base: any = { kind, name: "", location: "", city: "", country: "", duration: "", image_url: "", description: "", status: "active", meta: { images: [], attachments: [] } };
    if (!initial) return base;
    return { ...base, ...initial, meta: { images: [], attachments: [], ...(initial.meta ?? {}) } };
  });
  const getVal = (fd: FieldDef) => (fd.path === "meta" ? f.meta?.[fd.key] ?? "" : f[fd.key] ?? "");
  const setVal = (fd: FieldDef, v: any) => {
    if (fd.path === "meta") setF({ ...f, meta: { ...(f.meta ?? {}), [fd.key]: v } });
    else setF({ ...f, [fd.key]: v });
  };
  const upFn = useServerFn(upsertMaster);
  const missingRequired = fields.some((fd) => fd.required && !String(getVal(fd) ?? "").trim());
  const mut = useMutation({
    mutationFn: () => {
      // sync first image to image_url for card thumbnail
      const imgs: string[] = f.meta?.images ?? [];
      const image_url = imgs[0] ?? f.image_url ?? "";
      return upFn({ data: { ...f, kind, image_url } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["masters"] }); toast.success("Saved"); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const renderField = (fd: FieldDef) => {
    const val = getVal(fd);
    const common = "w-full h-9 rounded-md border bg-background px-2 text-sm";
    const inner =
      fd.type === "images" ? (
        <ImagePicker value={Array.isArray(val) ? val : []} onChange={(urls) => setVal(fd, urls)} folder={kind} />
      ) : fd.type === "files" ? (
        <FileUploader value={Array.isArray(val) ? val : []} onChange={(files) => setVal(fd, files)} accept={fd.accept} folder={kind} />
      ) : fd.type === "textarea" ? (
        <Textarea rows={3} value={val} placeholder={fd.placeholder} onChange={(e) => setVal(fd, e.target.value)} />
      ) : fd.type === "select" ? (
        <select className={common} value={val} onChange={(e) => setVal(fd, e.target.value)}>
          <option value="">Select…</option>
          {(fd.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <Input type={
            fd.type === "number" ? "number"
            : fd.type === "time" ? "time"
            : fd.type === "date" ? "date"
            : fd.type === "datetime" ? "datetime-local"
            : "text"}
          value={val} placeholder={fd.placeholder}
          onChange={(e) => setVal(fd, fd.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
      );
    return (
      <div key={`${fd.path ?? "root"}:${fd.key}`} className={fd.span === 2 ? "col-span-2" : ""}>
        <Label>{fd.label}{fd.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
        {inner}
      </div>
    );
  };
  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial ? "Edit" : "New"} {KIND_LABELS[kind]}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(renderField)}
        <div>
          <Label>Status</Label>
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || missingRequired}>{mut.isPending ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PricesDialog({ item, onClose }: { item: any; onClose: () => void }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listPrices);
  const upFn = useServerFn(upsertPrice);
  const delFn = useServerFn(deletePrice);
  const [f, setF] = useState<any>({ label: "", price: 0, currency: "INR", valid_from: "", valid_to: "", notes: "" });
  const { data: prices = [] } = useQuery({ queryKey: ["prices", item.id], queryFn: () => listFn({ data: { item_id: item.id } }) });
  const add = useMutation({
    mutationFn: () => upFn({ data: { ...f, price: Number(f.price), item_id: item.id, valid_from: f.valid_from || null, valid_to: f.valid_to || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["prices", item.id] }); setF({ label: "", price: 0, currency: "INR", valid_from: "", valid_to: "", notes: "" }); toast.success("Added"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices", item.id] }),
  });
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader><DialogTitle>Prices — {item.name}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-6 gap-2 items-end">
        <div className="col-span-2"><Label className="text-xs">Label</Label><Input placeholder="e.g. Adult / Deluxe / Peak" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
        <div><Label className="text-xs">Price</Label><Input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        <div><Label className="text-xs">Currency</Label><Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></div>
        <div><Label className="text-xs">Valid From</Label><Input type="date" value={f.valid_from} onChange={(e) => setF({ ...f, valid_from: e.target.value })} /></div>
        <div><Label className="text-xs">Valid To</Label><Input type="date" value={f.valid_to} onChange={(e) => setF({ ...f, valid_to: e.target.value })} /></div>
        <div className="col-span-5"><Label className="text-xs">Notes</Label><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <Button onClick={() => add.mutate()} disabled={!f.label || add.isPending}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-2">Label</th><th className="text-right p-2">Price</th><th className="text-left p-2">Validity</th><th className="text-left p-2">Notes</th><th></th></tr>
          </thead>
          <tbody>
            {prices.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No tariffs added yet.</td></tr>}
            {prices.map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-medium">{p.label}</td>
                <td className="p-2 text-right">{p.currency} {Number(p.price).toLocaleString()}</td>
                <td className="p-2 text-xs text-muted-foreground">{p.valid_from ?? "—"} → {p.valid_to ?? "—"}</td>
                <td className="p-2 text-xs text-muted-foreground">{p.notes}</td>
                <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DialogFooter><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  );
}