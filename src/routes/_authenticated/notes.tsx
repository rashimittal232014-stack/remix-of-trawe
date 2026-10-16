import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotes, upsertNote, toggleNotePin, deleteNote } from "@/lib/hub.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StickyNote, Plus, Trash2, Pin, PinOff } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#fef3c7", "#dbeafe", "#dcfce7", "#fee2e2", "#f3e8ff", "#ffedd5"];

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [
    { title: "Notes · TraWe" },
    { name: "description", content: "Sticky-note pinboard for quick ideas, follow-ups and shared team notes." },
  ]}),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data = [], isLoading } = useQuery({ queryKey: ["notes-board"], queryFn: () => listNotes() });

  const save = useMutation({
    mutationFn: useServerFn(upsertNote),
    onSuccess: () => { toast.success("Note saved"); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["notes-board"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const pin = useMutation({
    mutationFn: useServerFn(toggleNotePin),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes-board"] }),
  });
  const del = useMutation({
    mutationFn: useServerFn(deleteNote),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["notes-board"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><StickyNote className="h-6 w-6 text-primary" /> Notes</h1>
          <p className="text-sm text-muted-foreground">Sticky notes and quick reminders. Pin what matters.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1"><Plus className="h-4 w-4" /> New Note</Button>
      </div>
      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!isLoading && data.length === 0 && (
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No notes yet. Tap "New Note" to start jotting.
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((n: any) => (
          <div
            key={n.id}
            className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-black/5 group relative"
            style={{ backgroundColor: n.color || "#fef3c7", color: "#1f2937" }}
          >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                title={n.pinned ? "Unpin" : "Pin"}
                onClick={() => pin.mutate({ data: { id: n.id, pinned: !n.pinned } })}
                className="h-6 w-6 grid place-items-center rounded bg-black/5 hover:bg-black/10"
              >
                {n.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </button>
              <button
                title="Edit"
                onClick={() => { setEditing(n); setOpen(true); }}
                className="h-6 w-6 grid place-items-center rounded bg-black/5 hover:bg-black/10 text-[10px] font-bold"
              >
                ✎
              </button>
              <button
                title="Delete"
                onClick={() => { if (confirm("Delete note?")) del.mutate({ data: { id: n.id } }); }}
                className="h-6 w-6 grid place-items-center rounded bg-black/5 hover:bg-black/10"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            {n.pinned && <Pin className="h-3 w-3 mb-1" />}
            {n.title && <div className="font-semibold text-sm mb-1 pr-16">{n.title}</div>}
            <div className="text-sm whitespace-pre-wrap break-words min-h-[80px]">{n.body}</div>
            {(n.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {n.tags.map((t: string) => (
                  <Badge key={t} variant="outline" className="text-[9px] bg-white/60 border-black/10">{t}</Badge>
                ))}
              </div>
            )}
            <div className="text-[10px] opacity-60 mt-2">{new Date(n.updated_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <NoteForm initial={editing} onSubmit={(v) => save.mutate({ data: v })} pending={save.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteForm({ initial, onSubmit, pending }: { initial: any; onSubmit: (v: any) => void; pending: boolean }) {
  const [f, setF] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    color: initial?.color ?? COLORS[0],
    tags: (initial?.tags ?? []) as string[],
    pinned: initial?.pinned ?? false,
  });
  const [tagInput, setTagInput] = useState("");
  return (
    <div className="space-y-3">
      <Input placeholder="Title (optional)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea rows={6} placeholder="Type your note…" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Color:</span>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setF({ ...f, color: c })}
            className={"h-6 w-6 rounded-full border-2 " + (f.color === c ? "border-primary" : "border-transparent")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                setF({ ...f, tags: [...f.tags, tagInput.trim()] });
                setTagInput("");
              }
            }}
          />
        </div>
        {f.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {f.tags.map((t, i) => (
              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setF({ ...f, tags: f.tags.filter((_, j) => j !== i) })}>
                {t} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} />
        Pin to top
      </label>
      <div className="flex justify-end">
        <Button onClick={() => onSubmit(f)} disabled={pending || !f.body.trim()}>Save Note</Button>
      </div>
    </div>
  );
}