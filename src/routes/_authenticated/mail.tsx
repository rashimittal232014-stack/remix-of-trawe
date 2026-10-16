import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMail, composeMail, deleteMail } from "@/lib/hub.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Plus, Trash2, Send, Inbox, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mail")({
  head: () => ({ meta: [
    { title: "Mail · TraWe" },
    { name: "description", content: "Unified email inbox — track every conversation with customers and leads." },
  ]}),
  component: MailPage,
});

function MailPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<"all" | "inbound" | "outbound">("all");
  const { data = [], isLoading } = useQuery({ queryKey: ["mail"], queryFn: () => listMail() });
  const compose = useMutation({
    mutationFn: useServerFn(composeMail),
    onSuccess: () => { toast.success("Message queued"); setOpen(false); qc.invalidateQueries({ queryKey: ["mail"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: useServerFn(deleteMail),
    onSuccess: () => { toast.success("Removed"); setSelected(null); qc.invalidateQueries({ queryKey: ["mail"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = data.filter((m: any) => tab === "all" || m.direction === tab);
  const counts = {
    all: data.length,
    inbound: data.filter((m: any) => m.direction === "inbound").length,
    outbound: data.filter((m: any) => m.direction === "outbound").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Mail</h1>
          <p className="text-sm text-muted-foreground">Unified inbox for lead and customer conversations.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> Compose</Button>
      </div>
      <div className="flex gap-2">
        {(["all", "inbound", "outbound"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors",
              tab === t ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent/50",
            )}
          >
            {t} · {counts[t]}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        <Card className="bg-card/60 backdrop-blur-xl border-border/60 max-h-[70vh] overflow-y-auto">
          <CardContent className="p-0 divide-y">
            {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No messages yet.
              </div>
            )}
            {filtered.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-accent/30 transition-colors",
                  selected?.id === m.id && "bg-primary/5",
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium truncate flex-1">
                    {m.direction === "outbound" ? `To: ${(m.to_addrs || []).join(", ")}` : `From: ${m.from_addr}`}
                  </span>
                  <Badge variant="outline" className="text-[9px] shrink-0">{m.direction}</Badge>
                </div>
                <div className="text-sm font-medium truncate">{m.subject || "(no subject)"}</div>
                <div className="text-xs text-muted-foreground truncate">{(m.body || "").slice(0, 80)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/60 backdrop-blur-xl border-border/60">
          <CardContent className="p-6">
            {!selected && <div className="text-sm text-muted-foreground text-center py-12">Select a message to view.</div>}
            {selected && (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.subject || "(no subject)"}</h2>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selected.direction === "outbound"
                        ? `To ${(selected.to_addrs || []).join(", ")}`
                        : `From ${selected.from_addr}`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => del.mutate({ data: { id: selected.id } })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="rounded-lg border bg-background p-4 text-sm whitespace-pre-wrap min-h-[200px]">
                  {selected.body || <span className="text-muted-foreground italic">(empty body)</span>}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  Status: <Badge variant="outline" className="text-[9px]">{selected.status || "sent"}</Badge>
                  {selected.lead_id && <span>· <ArrowUpRight className="inline h-3 w-3" /> linked to lead</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Compose Message</DialogTitle></DialogHeader>
          <ComposeForm onSubmit={(v) => compose.mutate({ data: v })} pending={compose.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComposeForm({ onSubmit, pending }: { onSubmit: (v: any) => void; pending: boolean }) {
  const [f, setF] = useState({ to: "", cc: "", subject: "", body: "" });
  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label className="text-xs">To (comma-separated)</Label>
        <Input value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} placeholder="client@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Cc</Label>
        <Input value={f.cc} onChange={(e) => setF({ ...f, cc: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Subject</Label>
        <Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Message</Label>
        <Textarea rows={8} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => onSubmit(f)} disabled={pending || !f.to.trim() || !f.subject.trim()} className="gap-1">
          <Send className="h-4 w-4" /> Queue Message
        </Button>
      </div>
    </div>
  );
}