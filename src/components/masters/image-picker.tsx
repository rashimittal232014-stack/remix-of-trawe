import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchPexels } from "@/lib/media.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Upload, Link2, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assertUploadAllowed } from "@/lib/storage-upload";

type Props = {
  value?: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  max?: number;
};

export function ImagePicker({ value = [], onChange, bucket = "masters-media", folder = "images", max = 10 }: Props) {
  const [open, setOpen] = useState(false);
  const add = (url: string) => {
    if (!url) return;
    if (value.includes(url)) return;
    if (value.length >= max) return toast.warning(`Max ${max} images`);
    onChange([...value, url]);
  };
  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="relative group h-20 w-28 rounded-md overflow-hidden border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 h-5 w-5 grid place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-20 w-28 rounded-md border border-dashed grid place-items-center text-muted-foreground hover:bg-muted/40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">Use Pexels suggested images, upload your own, or paste a URL.</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Add image</DialogTitle></DialogHeader>
          <Tabs defaultValue="pexels" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="pexels"><ImageIcon className="h-3.5 w-3.5 mr-1.5" />Pexels</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</TabsTrigger>
              <TabsTrigger value="url"><Link2 className="h-3.5 w-3.5 mr-1.5" />URL</TabsTrigger>
            </TabsList>
            <TabsContent value="pexels" className="flex-1 overflow-auto">
              <PexelsTab onPick={(u) => { add(u); setOpen(false); }} />
            </TabsContent>
            <TabsContent value="upload" className="flex-1 overflow-auto">
              <UploadTab bucket={bucket} folder={folder} onPick={(u) => { add(u); setOpen(false); }} />
            </TabsContent>
            <TabsContent value="url" className="flex-1 overflow-auto">
              <UrlTab onPick={(u) => { add(u); setOpen(false); }} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PexelsTab({ onPick }: { onPick: (u: string) => void }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("hotel");
  const fn = useServerFn(searchPexels);
  const { data, isLoading } = useQuery({
    queryKey: ["pexels", term],
    queryFn: () => fn({ data: { query: term } }),
    enabled: !!term,
  });
  const photos = data?.photos ?? [];
  return (
    <div className="space-y-3 pt-3">
      <form
        onSubmit={(e) => { e.preventDefault(); setTerm(q || "hotel"); }}
        className="flex gap-2"
      >
        <Input placeholder="Search Pexels (e.g. beach, mountain, hotel)" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit"><Search className="h-4 w-4" /></Button>
      </form>
      {data?.error && <p className="text-xs text-amber-600">{data.error}</p>}
      {isLoading ? (
        <div className="py-8 grid place-items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p: any) => (
            <button key={p.id} type="button" onClick={() => onPick(p.url)} className="relative aspect-video overflow-hidden rounded-md group">
              <img src={p.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">{p.photographer}</span>
            </button>
          ))}
          {!isLoading && photos.length === 0 && <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No results</p>}
        </div>
      )}
    </div>
  );
}

function UploadTab({ bucket, folder, onPick }: { bucket: string; folder: string; onPick: (u: string) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      await assertUploadAllowed(file);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      const { data: prof } = uid
        ? await supabase.from("profiles").select("tenant_id").eq("id", uid).maybeSingle()
        : { data: null as any };
      const tenantId = prof?.tenant_id;
      if (!tenantId) throw new Error("No tenant context");
      const path = `${tenantId}/${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      const url = signed?.signedUrl;
      if (!url) throw new Error("Failed to get URL");
      onPick(url);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <label className="mt-4 border-2 border-dashed rounded-lg p-10 grid place-items-center gap-2 cursor-pointer hover:bg-muted/40">
      {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
      <span className="text-sm">{busy ? "Uploading…" : "Click to upload image"}</span>
      <span className="text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
    </label>
  );
}

function UrlTab({ onPick }: { onPick: (u: string) => void }) {
  const [u, setU] = useState("");
  return (
    <div className="pt-4 space-y-3">
      <Input placeholder="https://…" value={u} onChange={(e) => setU(e.target.value)} />
      <Button onClick={() => u && onPick(u)}>Add image</Button>
    </div>
  );
}