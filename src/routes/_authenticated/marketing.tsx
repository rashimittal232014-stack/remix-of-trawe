import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCampaigns, upsertCampaign, deleteCampaign, launchCampaign,
  listGroups, upsertGroup, deleteGroup,
  getMarketingSettings, saveMarketingSettings,
} from "@/lib/marketing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Send, Users, Megaphone, Gauge, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({ meta: [{ title: "Marketing — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: MarketingPage,
});

const TABS = ["dashboard", "campaigns", "groups", "logs", "settings"] as const;
type Tab = (typeof TABS)[number];

function MarketingPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Marketing Hub</h1>
          <p className="text-sm text-muted-foreground">Campaigns, audience groups, and safety guardrails</p>
        </div>
      </div>
      <div className="flex gap-1.5 border-b pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted/40 hover:bg-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "dashboard" && <Dashboard />}
      {tab === "campaigns" && <Campaigns />}
      {tab === "groups" && <Groups />}
      {tab === "logs" && <Logs />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function Dashboard() {
  const listFn = useServerFn(listCampaigns);
  const { data: rows = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => listFn() });
  const sent = rows.reduce((s: number, r: any) => s + (r.sent_count ?? 0), 0);
  const failed = rows.reduce((s: number, r: any) => s + (r.failed_count ?? 0), 0);
  const stats = [
    { k: "Campaigns", v: rows.length, i: Megaphone },
    { k: "Sent", v: sent, i: Send },
    { k: "Failed", v: failed, i: Gauge },
    { k: "Drafts", v: rows.filter((r: any) => r.status === "draft").length, i: Mail },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(s => {
        const I = s.i;
        return (
          <Card key={s.k} className="p-5 bg-gradient-to-br from-muted/40 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</div>
                <div className="text-3xl font-semibold mt-1">{s.v}</div>
              </div>
              <I className="h-5 w-5 text-primary" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Campaigns() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampaigns);
  const groupsFn = useServerFn(listGroups);
  const delFn = useServerFn(deleteCampaign);
  const launchFn = useServerFn(launchCampaign);
  const { data: rows = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => listFn() });
  const { data: groups = [] } = useQuery({ queryKey: ["groups"], queryFn: () => groupsFn() });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Deleted"); } });
  const launch = useMutation({
    mutationFn: (id: string) => launchFn({ data: { id } }),
    onSuccess: (r: any) => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success(`Launched — ${r.sent} recipients`); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Campaign</Button></DialogTrigger>
          <CampaignForm initial={edit} groups={groups} onClose={() => { setOpen(false); setEdit(null); }} />
        </Dialog>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Channel</th><th className="text-left p-3">Status</th><th className="text-left p-3">Group</th><th className="text-right p-3">Sent</th><th></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No campaigns yet.</td></tr>}
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-xs">
                  <Badge variant="secondary">{r.channel === "email" ? <Mail className="h-3 w-3 mr-1 inline" /> : <MessageSquare className="h-3 w-3 mr-1 inline" />}{r.channel}</Badge>
                </td>
                <td className="p-3 text-xs"><Badge variant={r.status === "sent" ? "default" : "outline"}>{r.status}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground">{r.contact_groups?.name ?? "—"}</td>
                <td className="p-3 text-right">{r.sent_count}</td>
                <td className="p-3 text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => launch.mutate(r.id)} disabled={r.status === "sent"}><Send className="h-3.5 w-3.5 mr-1" />Launch</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete?") && del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}

function CampaignForm({ initial, groups, onClose }: { initial: any; groups: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const upFn = useServerFn(upsertCampaign);
  const [f, setF] = useState<any>(initial ?? { name: "", channel: "email", subject: "", body: "", status: "draft", scheduled_at: "", group_id: "" });
  const mut = useMutation({
    mutationFn: () => upFn({ data: { ...f, scheduled_at: f.scheduled_at || null, group_id: f.group_id || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Saved"); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{initial ? "Edit" : "New"} Campaign</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>Channel</Label>
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
            <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option>
          </select>
        </div>
        <div><Label>Group</Label>
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.group_id ?? ""} onChange={(e) => setF({ ...f, group_id: e.target.value })}>
            <option value="">All contacts</option>
            {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {f.channel === "email" && <div className="col-span-2"><Label>Subject</Label><Input value={f.subject ?? ""} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>}
        <div className="col-span-2"><Label>Body</Label><Textarea rows={6} value={f.body ?? ""} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
        <div><Label>Schedule</Label><Input type="datetime-local" value={f.scheduled_at ?? ""} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => mut.mutate()} disabled={!f.name || mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
    </DialogContent>
  );
}

function Groups() {
  const qc = useQueryClient();
  const listFn = useServerFn(listGroups);
  const upFn = useServerFn(upsertGroup);
  const delFn = useServerFn(deleteGroup);
  const { data: rows = [] } = useQuery({ queryKey: ["groups"], queryFn: () => listFn() });
  const [f, setF] = useState<any>({ name: "", description: "" });
  const add = useMutation({
    mutationFn: () => upFn({ data: f }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["groups"] }); setF({ name: "", description: "" }); toast.success("Group added"); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }) });
  return (
    <div className="space-y-3">
      <Card><CardContent className="p-4 grid grid-cols-6 gap-2 items-end">
        <div className="col-span-2"><Label className="text-xs">Group name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="col-span-3"><Label className="text-xs">Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <Button onClick={() => add.mutate()} disabled={!f.name}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </CardContent></Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-10">No groups yet.</div>}
        {rows.map((g: any) => (
          <Card key={g.id} className="p-4">
            <div className="flex items-start gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><Users className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-muted-foreground">{g.description || "No description"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Logs() {
  const listFn = useServerFn(listCampaigns);
  const { data: rows = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => listFn() });
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="text-left p-3">Campaign</th><th className="text-left p-3">Channel</th><th className="text-left p-3">Status</th><th className="text-right p-3">Sent</th><th className="text-right p-3">Failed</th><th className="text-left p-3">Updated</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No campaign activity yet.</td></tr>}
          {rows.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-xs">{r.channel}</td>
              <td className="p-3 text-xs"><Badge variant={r.status === "sent" ? "default" : "outline"}>{r.status}</Badge></td>
              <td className="p-3 text-right">{r.sent_count}</td>
              <td className="p-3 text-right">{r.failed_count}</td>
              <td className="p-3 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent></Card>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMarketingSettings);
  const saveFn = useServerFn(saveMarketingSettings);
  const { data } = useQuery({ queryKey: ["marketing-settings"], queryFn: () => getFn() });
  const [s, setS] = useState<any>({});
  useEffect(() => { if (data) setS(data.data ?? {}); }, [data]);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { data: s } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["marketing-settings"] }); toast.success("Saved"); },
  });
  return (
    <Card>
      <CardHeader><CardTitle>Safety & Throttling</CardTitle></CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        <div><Label>WhatsApp batch size</Label><Input type="number" value={s.wa_batch ?? 50} onChange={(e) => setS({ ...s, wa_batch: Number(e.target.value) })} /></div>
        <div><Label>Email batch size</Label><Input type="number" value={s.email_batch ?? 100} onChange={(e) => setS({ ...s, email_batch: Number(e.target.value) })} /></div>
        <div><Label>Delay between messages (sec)</Label><Input type="number" value={s.delay_sec ?? 3} onChange={(e) => setS({ ...s, delay_sec: Number(e.target.value) })} /></div>
        <div><Label>Daily send cap</Label><Input type="number" value={s.daily_cap ?? 500} onChange={(e) => setS({ ...s, daily_cap: Number(e.target.value) })} /></div>
        <div><Label>Repeat guard (days)</Label><Input type="number" value={s.repeat_days ?? 7} onChange={(e) => setS({ ...s, repeat_days: Number(e.target.value) })} /></div>
        <div><Label>Opt-out keyword</Label><Input value={s.optout ?? "STOP"} onChange={(e) => setS({ ...s, optout: e.target.value })} /></div>
        <div className="col-span-full"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save settings"}</Button></div>
      </CardContent>
    </Card>
  );
}