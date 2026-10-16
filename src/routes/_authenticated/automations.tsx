import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAutomations, upsertAutomation, deleteAutomation, listAutomationLogs, seedDefaultAutomations } from "@/lib/marketing.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Zap, ScrollText, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/automations")({
  head: () => ({ meta: [{ title: "Automations — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: AutomationsPage,
});

const MODULES = [
  "Users","Queries","Organization","Profiles","Client","Roles","Itineraries","Companies","Forms","Activities",
  "Travel Masters","Dashboard Editor","Weather","DOB Greeting","Attendance","Automation Trigger","WhatsApp",
  "Bookings","Marketing","Website Settings","Payments","Invoices","Quotations",
];
const EVENTS_BY_MODULE: Record<string, string[]> = {
  Users: ["Record Created","Record Updated","Created or Updated","Activity Completed","Payment Received","Supplier Payment Saved","Quotation Sent","Itinerary Imported"],
  Queries: ["Record Created","Record Updated","Stage Changed","Query Confirmed / Won","Query Lost","Travel Start Date","Travel End Date","Activity Completed","Quotation Sent","Itinerary Imported"],
  Bookings: ["Record Created","Confirmed","Trip Start","Trip Complete","Cancelled","Travel Start Date","Travel End Date"],
  Payments: ["Payment Received","Overdue","Supplier Payment Saved"],
  Invoices: ["Record Created","Paid","Overdue"],
  Quotations: ["Record Created","Quotation Sent","Approved"],
  Activities: ["Record Created","Activity Completed"],
  Client: ["Record Created","Birthday","Anniversary","Record Updated"],
  Companies: ["Record Created","Record Updated"],
  Forms: ["Record Created"],
  Itineraries: ["Record Created","Itinerary Imported"],
  "Travel Masters": ["Record Created","Record Updated"],
  "Dashboard Editor": ["Record Updated"],
  Weather: ["Record Updated"],
  "DOB Greeting": ["Birthday","Anniversary"],
  Attendance: ["Record Created"],
  "Automation Trigger": ["Record Created"],
  WhatsApp: ["Record Created"],
  Marketing: ["Record Created"],
  "Website Settings": ["Record Updated"],
  Organization: ["Record Updated"],
  Profiles: ["Record Created","Record Updated"],
  Roles: ["Record Created","Record Updated"],
};

const FIELDS_BY_MODULE: Record<string, string[]> = {
  Users: ["Any Record","Id","User Code","Role Id","First Name","Last Name","Display Name","Email","Mobile","Avatar","Initials","Job Title","Profile Name","Email Sharing","Timezone","Language","Status","Invite Status","Invite Sent At","Invite Accepted At","Last Login At"],
  Queries: ["Any Record","Company","Client","Mobile","Email","Destination","Service Type","Stage","Status","Amount","Lead Source","Probability","Owner","Closing Date","Travel Start Date","Travel End Date"],
  Bookings: ["Any Record","Booking Id","Client","Company","Status","Amount","Travel Start Date","Travel End Date","Owner"],
  Payments: ["Any Record","Amount","Status","Mode","Client","Owner","Received On"],
  Invoices: ["Any Record","Invoice No","Client","Amount","Status","Due Date"],
  Quotations: ["Any Record","Quote No","Client","Amount","Status","Owner"],
  Client: ["Any Record","Name","Mobile","Email","City","Country","Owner"],
  Companies: ["Any Record","Name","GST","City","Country","Owner"],
  Activities: ["Any Record","Type","Status","Owner","Due Date"],
};
const OPERATORS = ["Equals","Not Equals","Contains","Does Not Contain","Is Empty","Is Not Empty","Greater Than","Less Than"];

type ActionKind =
  | "Send WhatsApp" | "Send Email" | "Create Task" | "Create Event" | "Create Call"
  | "Create Reminder" | "Add Note" | "Notify User" | "Assign Owner"
  | "Change Query Stage" | "Update Field" | "Create Client" | "Create Company";
const ACTION_KINDS: ActionKind[] = [
  "Send WhatsApp","Send Email","Create Task","Create Event","Create Call",
  "Create Reminder","Add Note","Notify User","Assign Owner",
  "Change Query Stage","Update Field","Create Client","Create Company",
];

const TAGS = ["{{client_name}}","{{company_name}}","{{mobile}}","{{email}}","{{destination}}","{{travel_start_date}}","{{travel_end_date}}","{{start_date}}","{{status}}","{{opportunity_name}}","{{owner_name}}"];

function AutomationsPage() {
  const [tab, setTab] = useState<"rules" | "logs">("rules");
  const [guideOpen, setGuideOpen] = useState(false);
  const seedFn = useServerFn(seedDefaultAutomations);
  const qc = useQueryClient();
  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (r: any) => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success(r?.inserted ? `Installed ${r.inserted} default rules` : "Defaults already installed"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Instrument Serif", ui-serif, Georgia, serif'}}>Automation</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">Create simple event based automations for WhatsApp, Email, Tasks, Events, Calls, Reminders, Notes and owner updates. No cron is required.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setGuideOpen(true)}><HelpCircle className="h-4 w-4 mr-1" />User Guide</Button>
          <Button variant="outline" size="sm" onClick={() => seed.mutate()} disabled={seed.isPending}><Sparkles className="h-4 w-4 mr-1" />Default Automation</Button>
        </div>
      </div>

      <KpiRow />

      <div className="rounded-xl border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">How it works:</span> Choose an event, add optional conditions, then select one or more actions. The rule runs instantly when that CRM event happens.
      </div>

      <div className="flex gap-4 border-b">
        {(["rules", "logs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-1 pb-2 text-sm capitalize border-b-2 -mb-px ${tab === t ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "rules" ? "Automation Rules" : "Execution Logs"}
          </button>
        ))}
      </div>
      {tab === "rules" ? <Rules /> : <Logs />}

      <UserGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}

function KpiRow() {
  const listFn = useServerFn(listAutomations);
  const { data: rows = [] } = useQuery({ queryKey: ["automations"], queryFn: () => listFn() });
  const active = rows.filter((r: any) => r.active).length;
  const actions = rows.reduce((n: number, r: any) => n + (r.actions?.length ?? 0), 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card className="tile-hairline"><CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Rules</div>
        <div className="text-3xl font-semibold mt-1">{rows.length}</div>
        <div className="text-xs text-muted-foreground mt-1">{active} active rules</div>
      </CardContent></Card>
      <Card className="tile-hairline"><CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Actions Ready</div>
        <div className="text-3xl font-semibold mt-1">{actions}</div>
        <div className="text-xs text-muted-foreground mt-1">WhatsApp, Email, Task, Event, Call</div>
      </CardContent></Card>
    </div>
  );
}

function Rules() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAutomations);
  const delFn = useServerFn(deleteAutomation);
  const { data: rows = [] } = useQuery({ queryKey: ["automations"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("all");
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Deleted"); } });
  const filtered = useMemo(() => rows.filter((r: any) => filter === "all" ? true : filter === "active" ? r.active : !r.active), [rows, filter]);
  const counts = { active: rows.filter((r: any) => r.active).length, inactive: rows.filter((r: any) => !r.active).length, all: rows.length };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {(["active","inactive","all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full border capitalize flex items-center gap-1.5 ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              {f} <span className={`text-xs ${filter === f ? "opacity-80" : "text-muted-foreground"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setEdit(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New Automation</Button>
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No automations. Click "Default Automation" to install ready-made travel rules.</Card>}
        {filtered.map((a: any) => (
          <Card key={a.id} className="tile-hairline">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center shrink-0"><Zap className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{a.name}</div>
                    <Badge variant={a.active ? "default" : "secondary"} className="text-[10px]">{a.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  {a.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</div>}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{a.module}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.event}</Badge>
                    <Badge variant="outline" className="text-[10px]">{(a.conditions ?? []).length} Conditions</Badge>
                    {(a.actions ?? []).map((x: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{x.kind}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setEdit(a); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete this automation?") && del.mutate(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <AutomationForm initial={edit} onClose={() => { setOpen(false); setEdit(null); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AutomationForm({ initial, onClose }: { initial: any; onClose: () => void }) {
  const qc = useQueryClient();
  const upFn = useServerFn(upsertAutomation);
  const [f, setF] = useState<any>(initial ?? { name: "", description: "", module: "Queries", event: "Record Created", active: true, conditions: [], actions: [] });
  const fields = FIELDS_BY_MODULE[f.module] ?? ["Any Record"];
  const events = EVENTS_BY_MODULE[f.module] ?? ["Record Created"];
  const addCond = () => setF({ ...f, conditions: [...f.conditions, { field: fields[0], op: "Equals", value: "", join: "AND" }] });
  const updCond = (i: number, k: string, v: any) => setF({ ...f, conditions: f.conditions.map((c: any, idx: number) => idx === i ? { ...c, [k]: v } : c) });
  const rmCond = (i: number) => setF({ ...f, conditions: f.conditions.filter((_: any, idx: number) => idx !== i) });
  const addAct = () => setF({ ...f, actions: [...f.actions, { kind: "Create Task", title: "", template: "", due_days: 1 }] });
  const updAct = (i: number, k: string, v: any) => setF({ ...f, actions: f.actions.map((c: any, idx: number) => idx === i ? { ...c, [k]: v } : c) });
  const rmAct = (i: number) => setF({ ...f, actions: f.actions.filter((_: any, idx: number) => idx !== i) });
  const mut = useMutation({
    mutationFn: () => upFn({ data: f }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["automations"] }); toast.success("Saved"); onClose(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-5 border-b">
        <SheetTitle>{initial ? "Edit Automation" : "New Automation"}</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <FieldRow label="Automation Name">
          <Input value={f.name} placeholder="Example: Send WhatsApp on new query" onChange={(e) => setF({ ...f, name: e.target.value })} />
        </FieldRow>
        <FieldRow label="Description">
          <Textarea rows={2} value={f.description ?? ""} placeholder="Short note for your team" onChange={(e) => setF({ ...f, description: e.target.value })} />
        </FieldRow>
        <FieldRow label="Module">
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.module}
            onChange={(e) => { const m = e.target.value; setF({ ...f, module: m, event: (EVENTS_BY_MODULE[m] ?? ["Record Created"])[0], conditions: [] }); }}>
            {MODULES.map(m => <option key={m}>{m}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="When this happens">
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })}>
            {events.map(m => <option key={m}>{m}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Status">
          <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={f.active ? "Active" : "Inactive"} onChange={(e) => setF({ ...f, active: e.target.value === "Active" })}>
            <option>Active</option><option>Inactive</option>
          </select>
        </FieldRow>

        <section className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Conditions</div>
              <div className="text-xs text-muted-foreground">Optional. Use conditions to run this automation only for matching records.</div>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={addCond}>Add Condition</Button>
          </div>
          {f.conditions.length === 0 && <div className="text-xs text-muted-foreground italic">No conditions — runs on every {f.event.toLowerCase()}.</div>}
          {f.conditions.map((c: any, i: number) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select className="col-span-4 h-9 rounded-md border bg-background px-2 text-sm" value={c.field} onChange={(e) => updCond(i, "field", e.target.value)}>
                {fields.map(k => <option key={k}>{k}</option>)}
              </select>
              <select className="col-span-3 h-9 rounded-md border bg-background px-2 text-sm" value={c.op} onChange={(e) => updCond(i, "op", e.target.value)}>
                {OPERATORS.map(k => <option key={k}>{k}</option>)}
              </select>
              <Input className="col-span-3" value={c.value} onChange={(e) => updCond(i, "value", e.target.value)} placeholder="Value" />
              <select className="col-span-1 h-9 rounded-md border bg-background px-1 text-xs" value={c.join} onChange={(e) => updCond(i, "join", e.target.value)}>
                <option>AND</option><option>OR</option>
              </select>
              <Button size="sm" variant="ghost" className="col-span-1" onClick={() => rmCond(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          ))}
        </section>

        <section className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Actions</div>
              <div className="text-xs text-muted-foreground">These actions run immediately when the event and conditions match. No cron required.</div>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={addAct}>Add Action</Button>
          </div>
          {f.actions.length === 0 && <div className="text-xs text-muted-foreground italic">Add at least one action.</div>}
          {f.actions.map((a: any, i: number) => (
            <div key={i} className="rounded-md border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <select className="flex-1 h-9 rounded-md border bg-background px-2 text-sm" value={a.kind} onChange={(e) => updAct(i, "kind", e.target.value)}>
                  {ACTION_KINDS.map(k => <option key={k}>{k}</option>)}
                </select>
                <Button size="sm" variant="ghost" onClick={() => rmAct(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
              <ActionFields action={a} onUpdate={(k, v) => updAct(i, k, v)} />
            </div>
          ))}
        </section>

        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <span className="font-medium">Useful tags:</span> {TAGS.join(", ")}
        </div>
      </div>

      <SheetFooter className="p-4 border-t bg-background flex items-center justify-between gap-2">
        <div className="text-xs text-primary hidden sm:block">Event based automation will run instantly when matching CRM action happens.</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => mut.mutate()} disabled={!f.name || mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
        </div>
      </SheetFooter>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-4 gap-3 items-start">
      <Label className="pt-2 text-sm text-muted-foreground">{label}</Label>
      <div className="col-span-3">{children}</div>
    </div>
  );
}

function ActionFields({ action, onUpdate }: { action: any; onUpdate: (k: string, v: any) => void }) {
  const kind = action.kind as ActionKind;
  if (kind === "Send WhatsApp" || kind === "Send Email" || kind === "Add Note") {
    return (
      <>
        {kind === "Send Email" && <Input placeholder="Subject" value={action.subject ?? ""} onChange={(e) => onUpdate("subject", e.target.value)} />}
        <Textarea rows={3} placeholder="Message body — use {{client_name}}, {{destination}} etc." value={action.template ?? ""} onChange={(e) => onUpdate("template", e.target.value)} />
      </>
    );
  }
  if (kind === "Create Task" || kind === "Create Call" || kind === "Create Event" || kind === "Create Reminder") {
    return (
      <div className="grid grid-cols-3 gap-2">
        <Input className="col-span-2" placeholder="Title" value={action.title ?? ""} onChange={(e) => onUpdate("title", e.target.value)} />
        <Input type="number" placeholder="Due After Days" value={action.due_days ?? 1} onChange={(e) => onUpdate("due_days", Number(e.target.value))} />
        <Textarea className="col-span-3" rows={2} placeholder="Instruction for the user" value={action.template ?? ""} onChange={(e) => onUpdate("template", e.target.value)} />
      </div>
    );
  }
  if (kind === "Notify User" || kind === "Assign Owner") {
    return <Input placeholder="User email or name" value={action.target ?? ""} onChange={(e) => onUpdate("target", e.target.value)} />;
  }
  if (kind === "Change Query Stage") {
    return <Input placeholder="New stage name (e.g. Won, Follow-Up)" value={action.target ?? ""} onChange={(e) => onUpdate("target", e.target.value)} />;
  }
  if (kind === "Update Field") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Field" value={action.field ?? ""} onChange={(e) => onUpdate("field", e.target.value)} />
        <Input placeholder="Value" value={action.value ?? ""} onChange={(e) => onUpdate("value", e.target.value)} />
      </div>
    );
  }
  if (kind === "Create Client" || kind === "Create Company") {
    return <Textarea rows={2} placeholder="Default field values (JSON or notes)" value={action.template ?? ""} onChange={(e) => onUpdate("template", e.target.value)} />;
  }
  return null;
}

function Logs() {
  const listFn = useServerFn(listAutomationLogs);
  const { data: rows = [] } = useQuery({ queryKey: ["automation-logs"], queryFn: () => listFn({ data: {} }) });
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="text-left p-3">When</th><th className="text-left p-3">Automation</th><th className="text-left p-3">Status</th><th className="text-left p-3">Detail</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-muted-foreground"><ScrollText className="h-6 w-6 mx-auto mb-2 opacity-50" />No executions yet.</td></tr>}
          {rows.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-3 text-xs text-muted-foreground">{new Date(r.ran_at).toLocaleString()}</td>
              <td className="p-3">{r.automations?.name}</td>
              <td className="p-3"><Badge variant={r.status === "success" ? "default" : "destructive"}>{r.status}</Badge></td>
              <td className="p-3 text-xs text-muted-foreground">{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent></Card>
  );
}

function UserGuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automation User Guide</DialogTitle>
          <p className="text-sm text-muted-foreground">Learn how event based automation works in TraWe.</p>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Section title="1. What is automation?">
            When something happens in CRM, the system automatically performs one or more actions. Example: when a new query is created, CRM can send a WhatsApp message and create a call task for the owner.
          </Section>
          <Section title="2. How it works">
            <div className="flex items-center gap-2 my-2">
              <span className="px-3 py-1 border rounded-full text-xs">Trigger</span>
              <span>→</span>
              <span className="px-3 py-1 border rounded-full text-xs">Condition</span>
              <span>→</span>
              <span className="px-3 py-1 border rounded-full text-xs">Action</span>
            </div>
            <b>Trigger</b> is the event, <b>Condition</b> is the rule filter, and <b>Action</b> is what CRM will do.
          </Section>
          <Section title="3. How to add automation">
            <ol className="list-decimal ml-5 space-y-0.5">
              <li>Click <b>New Automation</b>.</li>
              <li>Enter a clear rule name.</li>
              <li>Select the module, such as Queries, Clients, Companies, Activities, Itineraries or Payments.</li>
              <li>Select the event, such as Record Created, Updated, Stage Changed or Payment Received.</li>
              <li>Add conditions if required.</li>
              <li>Add actions like Send WhatsApp, Send Email, Create Task, Create Event, Create Call, Add Note or Notify User.</li>
              <li>Save the rule and keep it Active.</li>
            </ol>
          </Section>
          <Section title="4. Default travel automations">
            Click <b>Default Automation</b> to install ready-made travel rules: Proposal Confirmation, Balance Payment Reminder, Full Payment Received Reminder, Trip Start Reminder and Trip Complete Feedback Form.
          </Section>
          <Section title="5. Important note: no cron required">
            This automation is event based. It runs when the selected event happens. For future follow-ups, use actions like Create Task, Create Call or Create Reminder with a future due date.
          </Section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Example title="Example A: New query follow-up" when="Query Created" iff="Service Type equals GIT Package" doo="Send WhatsApp to client and create a call task after 1 day." />
            <Example title="Example B: Payment received" when="Payment Received" iff="Status equals Paid" doo="Send receipt email and notify the owner." />
            <Example title="Example C: Stage confirmed" when="Query Stage Changed" iff="Status equals won" doo="Create task for supplier confirmation and send booking confirmation WhatsApp." />
            <Example title="Example D: Activity completed" when="Activity Completed" iff="Activity Type equals call" doo="Add a note and create next follow-up task." />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="font-medium mb-1">{title}</div>
      <div className="text-muted-foreground text-sm">{children}</div>
    </div>
  );
}
function Example({ title, when, iff, doo }: { title: string; when: string; iff: string; doo: string }) {
  return (
    <div className="rounded-lg border p-3 text-xs">
      <div className="font-medium text-sm mb-1">{title}</div>
      <div><b>When:</b> {when}</div>
      <div><b>If:</b> {iff}</div>
      <div><b>Do:</b> {doo}</div>
    </div>
  );
}