import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTriggerData, upsertTrigger, deleteTrigger, runTriggersOnce } from "@/lib/automation-trigger.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_MSG = `Dear {client_name},

Thank you for contacting {company_name}. Your query {query_id} is currently in {stage_name} stage. Our travel expert will assist you shortly.

Regards,
{company_name}`;

type Trigger = {
  id?: string; name: string; stage_id: string; message: string;
  send_type: "once" | "daily" | "repeat";
  send_per_day: number; max_send: number; send_interval_hours: number;
  start_time: string; end_time: string; status: "active" | "inactive";
};

const EMPTY: Trigger = {
  name: "", stage_id: "", message: DEFAULT_MSG,
  send_type: "once", send_per_day: 1, max_send: 1, send_interval_hours: 24,
  start_time: "10:00", end_time: "19:00", status: "active",
};

export function AutomationTrigger() {
  const qc = useQueryClient();
  const fetchData = useServerFn(listTriggerData);
  const save = useServerFn(upsertTrigger);
  const remove = useServerFn(deleteTrigger);
  const runNow = useServerFn(runTriggersOnce);

  const { data, isLoading } = useQuery({ queryKey: ["automation-triggers"], queryFn: () => fetchData() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Trigger>(EMPTY);

  // AJAX poller — every 60s
  useEffect(() => {
    const iv = setInterval(() => {
      runNow().then(() => qc.invalidateQueries({ queryKey: ["automation-triggers"] })).catch(() => {});
    }, 60_000);
    return () => clearInterval(iv);
  }, [runNow, qc]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: {
      ...form,
      send_per_day: Number(form.send_per_day),
      max_send: Number(form.max_send),
      send_interval_hours: Number(form.send_interval_hours),
    } }),
    onSuccess: () => { toast.success("Trigger saved"); setOpen(false); setForm(EMPTY); qc.invalidateQueries({ queryKey: ["automation-triggers"] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Trigger deleted"); qc.invalidateQueries({ queryKey: ["automation-triggers"] }); },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  const runMut = useMutation({
    mutationFn: () => runNow(),
    onSuccess: (r: any) => { toast.success(r?.message || "Run complete"); qc.invalidateQueries({ queryKey: ["automation-triggers"] }); },
    onError: (e: any) => toast.error(e?.message || "Run failed"),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading automation triggers…</div>;

  const triggers = (data?.triggers ?? []) as any[];
  const stages = (data?.stages ?? []) as any[];
  const logs = (data?.logs ?? []) as any[];
  const stats = data?.stats;

  const stageName = (id: string) => stages.find((s) => s.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Automation Trigger</h2>
          <p className="text-sm text-muted-foreground">Send query stage based WhatsApp follow-up messages without cron. CRM browser checks every minute and sends max 5 WhatsApp messages per minute.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runMut.mutate()} disabled={runMut.isPending}>
            <Play className="h-4 w-4 mr-1" /> Run Now
          </Button>
          <Button onClick={() => { setForm(EMPTY); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Trigger
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 text-sm px-4 py-2">
        Background runner is AJAX based, no cron required. Logs older than 2 days are cleaned automatically. Every run sends maximum 5 WhatsApp messages.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label={`Active Triggers / Total ${stats?.total ?? 0}`} value={stats?.active ?? 0} />
        <Kpi label="Messages Sent Today" value={stats?.sentToday ?? 0} />
        <Kpi label="Pending Eligible Messages" value={stats?.pending ?? 0} />
        <Kpi label="Failed Today" value={stats?.failedToday ?? 0} />
      </div>

      <div className="rounded-xl border bg-card/60 p-4">
        <div className="mb-2">
          <div className="font-semibold">Automation Triggers</div>
          <div className="text-xs text-muted-foreground">Create one trigger per query stage. Add/Edit popup follows CRM drawer style.</div>
        </div>
        {triggers.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground bg-muted/30 rounded-md">No automation triggers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="pr-3">Stage</th>
                  <th className="pr-3">Type</th>
                  <th className="pr-3">Max</th>
                  <th className="pr-3">Window</th>
                  <th className="pr-3">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {triggers.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{t.name}</td>
                    <td className="pr-3">{stageName(t.stage_id)}</td>
                    <td className="pr-3 capitalize">{t.send_type}</td>
                    <td className="pr-3">{t.max_send}</td>
                    <td className="pr-3">{t.start_time?.slice(0,5)}–{t.end_time?.slice(0,5)}</td>
                    <td className="pr-3">
                      <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge>
                    </td>
                    <td className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({
                        id: t.id, name: t.name, stage_id: t.stage_id, message: t.message,
                        send_type: t.send_type, send_per_day: t.send_per_day, max_send: t.max_send,
                        send_interval_hours: t.send_interval_hours,
                        start_time: (t.start_time || "10:00").slice(0,5),
                        end_time: (t.end_time || "19:00").slice(0,5),
                        status: t.status,
                      }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this trigger?")) delMut.mutate(t.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card/60 p-4">
        <div className="mb-2">
          <div className="font-semibold">Recent Logs</div>
          <div className="text-xs text-muted-foreground">Only last 2 days are retained automatically.</div>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground bg-muted/30 rounded-md">No logs found in last 2 days.</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b sticky top-0 bg-card">
                <tr>
                  <th className="py-2 pr-3">Sent At</th>
                  <th className="pr-3">Phone</th>
                  <th className="pr-3">Status</th>
                  <th>Message / Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 align-top">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(l.sent_at).toLocaleString()}</td>
                    <td className="pr-3">{l.phone || "—"}</td>
                    <td className="pr-3">
                      <Badge variant={l.status === "sent" ? "default" : l.status === "failed" ? "destructive" : "secondary"}>{l.status}</Badge>
                    </td>
                    <td className="text-xs text-muted-foreground">{l.error || (l.message || "").slice(0, 140)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{form.id ? "Edit Trigger" : "Add Trigger"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="text-sm font-semibold">Automation Trigger Information</div>
            <Field label="Trigger Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Stage (Query Status) *">
              <Select value={form.stage_id} onValueChange={(v) => setForm({ ...form, stage_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="WhatsApp Message *">
              <Textarea rows={7} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <div className="text-[11px] text-muted-foreground mt-1">
                Tags: {"{client_name}, {first_name}, {query_id}, {destination}, {travel_date}, {company_name}, {owner_name}, {owner_mobile}, {total_amount}, {stage_name}"}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Send Type *">
                <Select value={form.send_type} onValueChange={(v: any) => setForm({ ...form, send_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="repeat">Repeat Interval</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Send Per Day" hint="Maximum per query per day.">
                <Input type="number" min={1} value={form.send_per_day} onChange={(e) => setForm({ ...form, send_per_day: Number(e.target.value) })} />
              </Field>
              <Field label="Max Send" hint="Total maximum per query.">
                <Input type="number" min={1} value={form.max_send} onChange={(e) => setForm({ ...form, max_send: Number(e.target.value) })} />
              </Field>
              <Field label="Send Interval" hint="(Hours)">
                <Input type="number" min={1} value={form.send_interval_hours} onChange={(e) => setForm({ ...form, send_interval_hours: Number(e.target.value) })} />
              </Field>
              <Field label="Start Time">
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </Field>
              <Field label="End Time">
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name || !form.stage_id}>Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card/60 p-4">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}