import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDobData, saveDobSettings, sendPendingDobGreetings } from "@/lib/dob.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageCircle, Mail, Send, Cake } from "lucide-react";
import { toast } from "sonner";

export function DobGreeting() {
  const qc = useQueryClient();
  const fetchData = useServerFn(getDobData);
  const save = useServerFn(saveDobSettings);
  const sendNow = useServerFn(sendPendingDobGreetings);

  const { data, isLoading } = useQuery({ queryKey: ["dob-data"], queryFn: () => fetchData() });

  const [form, setForm] = useState({
    enabled: true,
    whatsapp_enabled: true,
    email_enabled: true,
    whatsapp_template: "",
    email_subject: "",
    email_html: "",
  });
  const [showHtml, setShowHtml] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    const s = data.settings as any;
    setForm({
      enabled: !!s.enabled,
      whatsapp_enabled: !!s.whatsapp_enabled,
      email_enabled: !!s.email_enabled,
      whatsapp_template: s.whatsapp_template ?? "",
      email_subject: s.email_subject ?? "",
      email_html: s.email_html ?? "",
    });
  }, [data?.settings]);

  const saveMut = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => { toast.success("DOB Greeting settings saved"); qc.invalidateQueries({ queryKey: ["dob-data"] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const sendMut = useMutation({
    mutationFn: () => sendNow(),
    onSuccess: (r: any) => {
      toast.success(r?.message || "Greetings sent");
      qc.invalidateQueries({ queryKey: ["dob-data"] });
    },
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });

  const stats = data?.stats;
  const today = data?.today;
  const list = data?.todaysList ?? [];
  const totalWithDob = data?.totalWithDob ?? 0;

  const notSentTotal = useMemo(() => (stats ? (stats.notSentToday.whatsapp + stats.notSentToday.email) : 0), [stats]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading DOB settings…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">DOB Greeting</h2>
        <p className="text-sm text-muted-foreground">Send birthday wishes to clients and traveller-created clients by WhatsApp and Email.</p>
      </div>

      {/* status pills */}
      <div className="grid gap-3 md:grid-cols-3">
        <StatusPill icon={<CheckCircle2 className="h-5 w-5" />} title={form.enabled ? "DOB Greeting Active" : "DOB Greeting Disabled"}
          subtitle="Master switch controls birthday automation." active={form.enabled} />
        <StatusPill icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp Greeting"
          subtitle={form.whatsapp_enabled ? "Enabled" : "Disabled"} active={form.whatsapp_enabled} />
        <StatusPill icon={<Mail className="h-5 w-5" />} title="Email Greeting"
          subtitle={form.email_enabled ? "Enabled" : "Disabled"} active={form.email_enabled} />
      </div>

      <div className="rounded-lg border border-teal-200 bg-teal-50/50 px-4 py-2.5 text-sm text-teal-900">
        This page reads DOB directly from <b>customers.dob</b>. Server date: <b>{today}</b>.
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard value={stats?.birthdaysToday ?? 0} label="Birthdays Today" sub={`Total clients with DOB: ${totalWithDob}`} />
        <KpiCard value={stats?.whatsappSentToday ?? 0} label="WhatsApp Sent Today" sub={`Total WhatsApp greetings sent: ${stats?.whatsappSentToday ?? 0}`} />
        <KpiCard value={stats?.emailSentToday ?? 0} label="Email Sent Today" sub={`Total email greetings sent: ${stats?.emailSentToday ?? 0}`} />
        <KpiCard value={notSentTotal} label="Not Sent Today" sub={`WhatsApp: ${stats?.notSentToday.whatsapp ?? 0} • Email: ${stats?.notSentToday.email ?? 0}`} />
      </div>

      {/* Delivery status */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Today's DOB Greeting Delivery Status</div>
            <div className="text-xs text-muted-foreground">Shows clients whose Date of Birth matches today.</div>
          </div>
          <Button size="sm" onClick={() => sendMut.mutate()} disabled={sendMut.isPending || list.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            {sendMut.isPending ? "Sending…" : "Send Pending Greetings Now"}
          </Button>
        </div>
        <div className="mt-3 rounded-lg border bg-muted/30 p-4">
          {list.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">No client DOB found for today.</div>
          ) : (
            <div className="divide-y">
              {list.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Cake className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">{c.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.email || "—"} · {c.phone || "—"} {c.company ? `· ${c.company}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.sent.whatsapp ? "default" : "outline"} className="gap-1">
                      <MessageCircle className="h-3 w-3" /> {c.sent.whatsapp ? "Sent" : c.phone ? "Pending" : "No phone"}
                    </Badge>
                    <Badge variant={c.sent.email ? "default" : "outline"} className="gap-1">
                      <Mail className="h-3 w-3" /> {c.sent.email ? "Sent" : c.email ? "Pending" : "No email"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* toggles */}
      <Card className="p-5 space-y-4">
        <ToggleRow title="Enable DOB Greeting" desc="Turn this on to allow CRM birthday greeting automation."
          value={form.enabled} onChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
        <ToggleRow title="Send WhatsApp Greeting" desc="Send WhatsApp birthday greeting when the client has a mobile number."
          value={form.whatsapp_enabled} onChange={(v) => setForm((f) => ({ ...f, whatsapp_enabled: v }))} />
        <ToggleRow title="Send Email Greeting" desc="Send email birthday greeting when the client has an email address."
          value={form.email_enabled} onChange={(v) => setForm((f) => ({ ...f, email_enabled: v }))} />
      </Card>

      {/* Templates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 space-y-3">
          <div>
            <div className="font-semibold">WhatsApp Greeting Template</div>
            <div className="text-xs text-muted-foreground">Available tags: {"{name}, {first_name}, {company_name}, {mobile}, {email}"}</div>
          </div>
          <div className="grid gap-1.5">
            <Label>WhatsApp Message</Label>
            <Textarea rows={10} value={form.whatsapp_template}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_template: e.target.value }))} />
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <div className="font-semibold">Email Greeting Template</div>
            <div className="text-xs text-muted-foreground">You can paste HTML directly. Available tags: {"{name}, {first_name}, {company_name}, {mobile}, {email}"}</div>
          </div>
          <div className="grid gap-1.5">
            <Label>Email Subject</Label>
            <Input value={form.email_subject} onChange={(e) => setForm((f) => ({ ...f, email_subject: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Email HTML Body</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowHtml((v) => !v)}>
                {showHtml ? "Preview" : "Edit HTML"}
              </Button>
            </div>
            {showHtml ? (
              <Textarea rows={12} value={form.email_html}
                onChange={(e) => setForm((f) => ({ ...f, email_html: e.target.value }))} className="font-mono text-xs" />
            ) : (
              <div className="rounded-md border bg-white p-3 min-h-[240px]"
                dangerouslySetInnerHTML={{ __html: renderPreview(form.email_html, { name: "Traveller", company_name: data?.companyName || "TraWe" }) }} />
            )}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Use "Send Pending Greetings Now" to send today's pending WhatsApp/email greetings. Duplicate sending is blocked by greeting logs.
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function renderPreview(tpl: string, ctx: Record<string, string>): string {
  return (tpl || "").replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
}

function StatusPill({ icon, title, subtitle, active }: { icon: React.ReactNode; title: string; subtitle: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${active ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50/60"}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{icon}</div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function KpiCard({ value, label, sub }: { value: number; label: string; sub: string }) {
  return (
    <Card className="p-4">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </Card>
  );
}

function ToggleRow({ title, desc, value, onChange }: { title: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}