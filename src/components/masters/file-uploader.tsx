import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { assertUploadAllowed } from "@/lib/storage-upload";

type Attachment = { name: string; url: string; size?: number };

export function FileUploader({
  value = [],
  onChange,
  bucket = "masters-media",
  folder = "files",
  accept = "image/*,application/pdf",
  label = "Upload file",
}: {
  value?: Attachment[];
  onChange: (v: Attachment[]) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
  label?: string;
}) {
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
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (!signed?.signedUrl) throw new Error("No URL");
      onChange([...value, { name: file.name, url: signed.signedUrl, size: file.size }]);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 border border-dashed rounded-md p-3 cursor-pointer hover:bg-muted/40 text-sm">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span>{busy ? "Uploading…" : label}</span>
        <input type="file" accept={accept} disabled={busy}
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((a, i) => (
            <li key={i} className="flex items-center gap-2 text-xs border rounded-md px-2 py-1.5 bg-muted/30">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate flex-1">{a.name}</span>
              <a href={a.url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="h-3 w-3" /></a>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}