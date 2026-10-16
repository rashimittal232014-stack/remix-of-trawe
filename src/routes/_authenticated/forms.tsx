import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listForms, upsertForm, deleteForm, listSubmissions } from "@/lib/marketing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Copy, Eye, ExternalLink, Type, Mail, Phone, AlignLeft, Hash, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/forms")({
  head: () => ({ meta: [{ title: "Forms — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: FormsPage,
});

const FIELD_LIBRARY = [
  { type: "text", label: "Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "tel", label: "Phone", icon: Phone },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "textarea", label: "Long Text", icon: AlignLeft },
];

function FormsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listForms);
  const delFn = useServerFn(deleteForm);
  const { data: rows = [] } = useQuery({ queryKey: ["forms"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [subs, setSubs] = useState<any>(null);
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["forms"] }); toast.success("Deleted"); } });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Forms Builder</h1>
          <p className="text-sm text-muted-foreground">Public lead-capture forms that auto-create leads</p>
        </div>
        <div className="ml-auto">
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Form</Button></DialogTrigger>
            <FormBuilder initial={edit} onClose={() => { setOpen(false); setEdit(null); }} />
          </Dialog>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.length === 0 && <Card className="col-span-full p-10 text-center text-sm text-muted-foreground">No forms yet — build your first one.</Card>}
        {rows.map((r: any) => {
          const url = typeof window !== "undefined" ? `${window.location.origin}/f/${r.slug}` : `/f/${r.slug}`;
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{(r.schema ?? []).length} fields</div>
                  </div>
                  <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Active" : "Off"}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1 truncate">
                  <ExternalLink className="h-3 w-3 shrink-0" /><span className="truncate">/f/{r.slug}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                  <Button size="sm" variant="outline" onClick={() => setSubs(r)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Dialog open={!!subs} onOpenChange={(v) => !v && setSubs(null)}>
        {subs && <SubmissionsDialog form={subs} onClose={() => setSubs(null)} />}
      </Dialog>
    </div>
  );
}

function FormBuilder({ initial, onClose }: { initial: any; onClose: () => void }) {
  const qc = useQueryClient();
  const upFn = useServerFn(upsertForm);
  const [f, setF] = useState<any>(initial ?? {
    title: "", slug: "", description: "",
    schema: [{ type: "text", name: "full_name", label: "Full name", required: true }, { type: "email", name: "email", label: "Email", required: true }],
    theme: { bg: "#ffffff", card: "#f9fafb", button: "#48a890", button_text: "#ffffff", branding: true },
    active: true,
  });
  const add = (type: string) => setF({ ...f, schema: [...f.schema, { type, name: `field_${f.schema.length + 1}`, label: type, required: false }] });
  const remove = (i: number) => setF({ ...f, schema: f.schema.filter((_: any, idx: number) => idx !== i) });
  const upd = (i: number, k: string, v: any) => setF({ ...f, schema: f.schema.map((s: any, idx: number) => idx === i ? { ...s, [k]: v } : s) });
  const mut = useMutation({
    mutationFn: () => upFn({ data: f }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["forms"] }); toast.success("Saved"); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{initial ? "Edit form" : "New form"}</DialogTitle></DialogHeader>
      <div className="grid lg:grid-cols-[220px_1fr_260px] gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Field library</div>
          {FIELD_LIBRARY.map(fl => {
            const I = fl.icon;
            return <button key={fl.type} onClick={() => add(fl.type)} className="w-full flex items-center gap-2 px-2.5 py-1.5 border rounded-lg text-sm hover:bg-muted"><I className="h-3.5 w-3.5" />{fl.label}</button>;
          })}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          </div>
          <div className="border rounded-xl p-4 space-y-3" style={{ background: f.theme?.card, color: "#111" }}>
            <div className="text-sm font-semibold">{f.title || "Untitled form"}</div>
            {f.schema.map((s: any, i: number) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-center">
                <Input className="col-span-2" value={s.label} onChange={(e) => upd(i, "label", e.target.value)} placeholder="Label" />
                <Input className="col-span-2" value={s.name} onChange={(e) => upd(i, "name", e.target.value.replace(/\s+/g, "_"))} placeholder="name" />
                <label className="text-xs flex items-center gap-1 col-span-1"><input type="checkbox" checked={s.required} onChange={(e) => upd(i, "required", e.target.checked)} />Req</label>
                <Button size="sm" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {f.schema.length === 0 && <div className="text-xs text-muted-foreground">Add fields from the left library.</div>}
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Theme</div>
          <div><Label className="text-xs">Card BG</Label><Input type="color" value={f.theme?.card ?? "#f9fafb"} onChange={(e) => setF({ ...f, theme: { ...f.theme, card: e.target.value } })} /></div>
          <div><Label className="text-xs">Button color</Label><Input type="color" value={f.theme?.button ?? "#48a890"} onChange={(e) => setF({ ...f, theme: { ...f.theme, button: e.target.value } })} /></div>
          <div><Label className="text-xs">Button text</Label><Input type="color" value={f.theme?.button_text ?? "#ffffff"} onChange={(e) => setF({ ...f, theme: { ...f.theme, button_text: e.target.value } })} /></div>
          <div className="flex items-center gap-2"><Switch checked={!!f.theme?.branding} onCheckedChange={(v) => setF({ ...f, theme: { ...f.theme, branding: v } })} /><Label className="text-xs">TraWe branding</Label></div>
          <div className="flex items-center gap-2"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /><Label className="text-xs">Active</Label></div>
        </div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => mut.mutate()} disabled={!f.title || !f.slug || mut.isPending}>{mut.isPending ? "Saving…" : "Save form"}</Button></DialogFooter>
    </DialogContent>
  );
}

function SubmissionsDialog({ form, onClose }: { form: any; onClose: () => void }) {
  const listFn = useServerFn(listSubmissions);
  const { data: rows = [] } = useQuery({ queryKey: ["submissions", form.id], queryFn: () => listFn({ data: { form_id: form.id } }) });
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader><DialogTitle>Submissions — {form.title}</DialogTitle></DialogHeader>
      <div className="border rounded-lg divide-y max-h-[60vh] overflow-y-auto">
        {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No submissions yet.</div>}
        {rows.map((s: any) => (
          <div key={s.id} className="p-3 text-sm">
            <div className="text-xs text-muted-foreground mb-1">{new Date(s.created_at).toLocaleString()}</div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(s.payload ?? {}).map(([k, v]: any) => <div key={k}><span className="text-muted-foreground text-xs mr-1">{k}:</span>{String(v)}</div>)}
            </div>
          </div>
        ))}
      </div>
      <DialogFooter><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  );
}