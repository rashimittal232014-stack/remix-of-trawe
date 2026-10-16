import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import React, { useState } from "react";
import { getLead, listPipelines, updateLeadStage, listActivities, upsertActivity, completeActivity, upsertLead } from "@/lib/crm.functions";
import { listQuotations, listInvoices, listItineraries, cloneItineraryToLead, deleteQuotation, deleteItinerary, getGitInventory, convertQuotationToInvoice, listTimeline, runPendingAutomations, upsertItinerary, recordPayment, deletePayment, updatePaymentStatus } from "@/lib/sales.functions";
import { composeMail } from "@/lib/hub.functions";
import { listSupplierComms, sendSupplierDetail, deleteSupplierComm } from "@/lib/supplier.functions";
import { listWaMessages, sendWhatsAppTestMessage, getWhatsAppDiagnostics } from "@/lib/org.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Users, CheckCircle2, Plus,
  FileText, MessageSquare, StickyNote, Receipt, FolderOpen, Clock, MoreHorizontal,
  Hash, Flag, AlertCircle, Megaphone, Pencil, ChevronDown, Send, Building2, CreditCard, Wallet, ChevronLeft, ChevronRight,
  Download, Trash2, Copy, ImageIcon, Plane, Ship, Sparkles, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { AddFlightDialog, AddCruiseDialog } from "@/components/itinerary/add-flight-dialog";
import { LiveFlightSearchDialog, LiveHotelSearchDialog } from "@/components/itinerary/live-search-dialog";
import { ManualInvoiceDialog } from "@/components/invoice/manual-invoice-dialog";
import { AIBuilderDialog } from "@/components/itinerary/ai-builder-dialog";
import { listMasters } from "@/lib/masters.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "Lead workspace — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: LeadWorkspace,
});

function LeadWorkspace() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getLead);
  const pipesFn = useServerFn(listPipelines);
  const stageFn = useServerFn(updateLeadStage);
  const quotesFn = useServerFn(listQuotations);
  const invFn = useServerFn(listInvoices);
  const itinFn = useServerFn(listItineraries);
  const { data: lead, isLoading } = useQuery({ queryKey: ["lead", id], queryFn: () => getFn({ data: { id } }) });
  const { data: pipelines = [] } = useQuery({ queryKey: ["pipelines"], queryFn: () => pipesFn(), staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: allQuotes = [] } = useQuery({ queryKey: ["quotes-all"], queryFn: () => quotesFn() });
  const { data: allInvoices = [] } = useQuery({ queryKey: ["invoices-all"], queryFn: () => invFn() });
  const { data: allItins = [] } = useQuery({ queryKey: ["itins-all"], queryFn: () => itinFn() });
  const { data: acts = [] } = useQuery({ queryKey: ["acts", id], queryFn: () => (useServerFn(listActivities))({ data: { leadId: id } }) as any, enabled: false });
  const stages = (pipelines[0] as any)?.pipeline_stages ?? [];

  const mutateStage = useMutation({
    mutationFn: (stage_id: string) => stageFn({ data: { id, stage_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!lead) return <div className="p-8">Lead not found. <Link to="/leads" className="text-primary">Back</Link></div>;

  const leadQuotes = (allQuotes as any[]).filter((q) => q.lead_id === id);
  const leadInvoices = (allInvoices as any[]).filter((i) => i.lead_id === id);
  const leadItins = (allItins as any[]).filter((i) => i.lead_id === id);
  const bookedSlot = leadItins.find((i: any) => i.slot_id);
  const stageType = (lead as any).pipeline_stages?.type as string | undefined;
  const isWon = stageType === "won";
  const isLost = stageType === "lost";
  const statusColor = isWon ? "bg-emerald-500 text-white" : isLost ? "bg-rose-500 text-white" : "bg-primary text-primary-foreground";
  const statusLabel = isWon ? "Confirmed" : isLost ? "Lost" : (lead as any).pipeline_stages?.name ?? "Open";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/leads" })} className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center text-primary font-bold text-lg shrink-0">
          {lead.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate flex items-center gap-2">
            <span>{lead.full_name}</span>
            {lead.service_type && <><span className="text-muted-foreground">-</span><span>{lead.service_type}</span></>}
            {lead.to_location && <><span className="text-muted-foreground">-</span><span className="text-primary">{lead.to_location}</span></>}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="font-mono">{lead.code}</span>
            <a className="text-sky-600 hover:underline">{lead.full_name}</a>
            {(lead as any).owner_id && <span className="flex items-center gap-1">👤 Owner</span>}
            {bookedSlot?.slot_id && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-medium">
                🎯 Departure {new Date(bookedSlot.slot_id).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
          <Select value={lead.stage_id ?? undefined} onValueChange={(v) => mutateStage.mutate(v)}>
            <SelectTrigger className="h-8 w-[170px] rounded-full bg-emerald-50 border-emerald-100 text-xs font-medium">
              <SelectValue placeholder="Change stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SendEmailButton lead={lead} />
          <Button variant="ghost" size="icon" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Pencil className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate({ to: "/leads" })}>Back to Queries</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Pipeline Stepper */}
      <div className="relative py-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-orange-400 to-emerald-500 -z-0 opacity-40" />
        <div className="relative flex items-start justify-between gap-1 z-10">
          {stages.map((s: any) => {
            const active = s.id === lead.stage_id;
            const done = stages.findIndex((x: any) => x.id === lead.stage_id) > stages.indexOf(s);
            const filled = active || done;
            return (
              <button key={s.id} onClick={() => mutateStage.mutate(s.id)} className="flex flex-col items-center gap-1.5 group flex-1 min-w-0">
                <div className={`h-7 w-7 rounded-full grid place-items-center border-2 transition-all ${filled ? "text-white" : "bg-background text-muted-foreground"}`}
                  style={{ background: filled ? s.color : "transparent", borderColor: s.color }}>
                  {filled ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                </div>
                <span className={`text-[11px] font-medium truncate max-w-full ${active ? "" : "text-muted-foreground"}`} style={{ color: active ? s.color : undefined }}>{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* LEFT SIDEBAR */}
        <div className="space-y-3">
          <SidebarCard title="Stats">
            <div className="space-y-2 text-sm">
              <StatRow color="bg-rose-500" label="Open Activities" value={(acts as any[]).filter?.((a: any) => a.status !== "completed").length ?? 0} />
              <StatRow color="bg-sky-500" label="Quotation" value={leadQuotes.length + leadItins.length} />
              <StatRow color="bg-emerald-500" label="Invoice" value={leadInvoices.length} />
            </div>
          </SidebarCard>

          <SidebarCard title="Travel Info">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MiniField icon={FileText} label="Query Type" value={lead.query_type} />
              <MiniField icon={Building2} label="Service Type" value={lead.service_type} />
              <MiniField icon={MapPin} label="From Destination" value={lead.from_location} />
              <MiniField icon={MapPin} label="To Destination" value={lead.to_location} />
              <MiniField icon={Calendar} label="Travel Date" value={lead.travel_date ? new Date(lead.travel_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
              <MiniField icon={Clock} label="Nights" value={`${lead.nights ?? 0} Nights`} />
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-emerald-600 font-medium mb-1">Travellers</div>
              <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-emerald-600" />{lead.adults ?? 0} Adult - {lead.children ?? 0} Children - {lead.infants ?? 0} Infant</div>
            </div>
          </SidebarCard>

          <SidebarCard title="Basic Info">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{lead.full_name}</div>
              {lead.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{lead.email}</div>}
              {lead.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{lead.phone}</div>}
            </div>
          </SidebarCard>

          <SidebarCard title="Query Info">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" /><span className="font-mono">{lead.code}</span></div>
              <div className="flex items-center gap-2">🧭 {(lead as any).pipelines?.name ?? "Package Booking"}</div>
              <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-muted-foreground" />{statusLabel}</div>
              <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-muted-foreground capitalize" />{lead.priority}</div>
              <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-muted-foreground" />{lead.source ?? "—"}</div>
            </div>
          </SidebarCard>

          <SidebarCard title="Description">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes || "--"}</div>
          </SidebarCard>

          <SidebarCard title="Other Info">
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Status</span><span className="font-medium">{isWon ? "Won" : isLost ? "Lost" : "Open"}</span>
              <span className="text-muted-foreground">Value</span><span className="font-medium">{formatCurrency(lead.estimated_value)}</span>
              <span className="text-muted-foreground">Probability</span><span className="font-medium">{lead.probability ?? 0}%</span>
              <span className="text-muted-foreground">Created At</span><span className="font-medium">{new Date(lead.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </SidebarCard>

          <div className="text-xs text-muted-foreground flex items-center gap-2 px-1">
            <span className="h-5 w-5 rounded-full bg-emerald-500 text-white grid place-items-center text-[10px]">•</span>
            Last Modified on {new Date(lead.updated_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* RIGHT: TABS */}
        <div>
          <Tabs defaultValue="quotation">
            <TabsList className="flex flex-wrap h-auto justify-start bg-transparent border-b rounded-none w-full gap-2 p-0">
              <WsTab value="quotation" icon={FileText} label="Quotation" count={leadQuotes.length + leadItins.length} />
              <WsTab value="activity" icon={CheckCircle2} label="Activity" />
              <WsTab value="whatsapp" icon={MessageSquare} label="WhatsApp" count={0} />
              <WsTab value="notes" icon={StickyNote} label="Notes" count={lead.notes ? 1 : 0} />
              <WsTab value="invoice" icon={Receipt} label="Invoice" count={leadInvoices.length} />
              <WsTab value="billing" icon={CreditCard} label="Billing" count={leadInvoices.reduce((a, i) => a + (i.payments?.length ?? 0), 0)} />
              <WsTab value="document" icon={FolderOpen} label="Document" count={0} />
              <WsTab value="timeline" icon={Clock} label="Timeline" />
              <WsTab value="emails" icon={Send} label="Emails" />
              <WsTab value="supplier" icon={Building2} label="Supplier Comm." />
            </TabsList>

            <TabsContent value="quotation" className="mt-4"><QuotationTab quotes={leadQuotes} itineraries={leadItins} lead={lead} /></TabsContent>
            <TabsContent value="activity" className="mt-4"><ActivityTab leadId={id} /></TabsContent>
            <TabsContent value="whatsapp" className="mt-4"><WhatsAppTab lead={lead} /></TabsContent>
            <TabsContent value="notes" className="mt-4"><NotesTab lead={lead} /></TabsContent>
            <TabsContent value="invoice" className="mt-4"><InvoiceTab invoices={leadInvoices} /></TabsContent>
            <TabsContent value="billing" className="mt-4"><BillingTab invoices={leadInvoices} /></TabsContent>
            <TabsContent value="document" className="mt-4"><DocumentTab lead={lead} /></TabsContent>
            <TabsContent value="timeline" className="mt-4"><TimelineTab leadId={id} lead={lead} /></TabsContent>
            <TabsContent value="emails" className="mt-4"><EmailsTab lead={lead} /></TabsContent>
            <TabsContent value="supplier" className="mt-4"><SupplierCommTab lead={lead} quotes={leadQuotes} itineraries={leadItins} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ------------------- Sidebar helpers ------------------------
function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </CardContent></Card>
  );
}
function StatRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
function MiniField({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-emerald-600 font-medium">{label}</div>
        <div className="text-sm truncate">{value || "—"}</div>
      </div>
    </div>
  );
}
function WsTab({ value, icon: Icon, label, count }: { value: string; icon: any; label: string; count?: number }) {
  return (
    <TabsTrigger value={value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-3 py-2.5 gap-1.5 text-sm">
      <Icon className="h-4 w-4" />
      {label}
      {typeof count === "number" && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold">{count}</span>}
    </TabsTrigger>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-sm">{value ?? "—"}</div></div>
    </div>
  );
}

function EmptyTab({ label, hint }: { label: string; hint: string }) {
  return <Card><CardContent className="p-10 text-center"><div className="font-medium">{label}</div><div className="text-xs text-muted-foreground mt-1">{hint}</div></CardContent></Card>;
}

function ActivityTab({ leadId }: { leadId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listActivities);
  const saveFn = useServerFn(upsertActivity);
  const doneFn = useServerFn(completeActivity);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<"task" | "event" | "call">("task");
  const [form, setForm] = useState<any>({ type: "task", title: "", description: "", due_at: "" });
  const { data: acts = [] } = useQuery({ queryKey: ["acts", leadId], queryFn: () => listFn({ data: { leadId } }) });
  const save = useMutation({
    mutationFn: () => saveFn({ data: { ...form, lead_id: leadId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acts", leadId] }); setOpen(false); setForm({ type: "task", title: "", description: "", due_at: "" }); },
  });
  const done = useMutation({
    mutationFn: (id: string) => doneFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acts", leadId] }),
  });
  const filtered = (acts as any[]).filter((a) => a.type === sub);
  const openSheetFor = (t: "task" | "event" | "call") => { setSub(t); setForm({ type: t, title: "", description: "", due_at: "" }); setOpen(true); };
  return (
    <Card><CardContent className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        {(["task","event","call"] as const).map((t) => (
          <button key={t} onClick={() => setSub(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1.5 ${sub === t ? "bg-primary/10 border-primary text-primary" : "border-input"}`}>
            <span className="capitalize">{t}s</span>
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px]">{(acts as any[]).filter((a) => a.type === t).length}</span>
          </button>
        ))}
        <div className="ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button size="sm" onClick={() => openSheetFor(sub)}><Plus className="h-4 w-4 mr-1" />Add {sub}</Button></SheetTrigger>
            <SheetContent className="w-[420px] sm:max-w-md">
              <SheetHeader><SheetTitle>Add {sub === "task" ? "Task" : sub === "event" ? "Event" : "Call"}</SheetTitle></SheetHeader>
              <div className="space-y-3 mt-4">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Due Date &amp; Time</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate()} disabled={!form.title}>Save</Button></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="text-sm font-semibold">All {sub}s</div>
      {filtered.length === 0 ? <div className="text-sm text-muted-foreground text-center py-10">No all {sub}s found.</div> : (
        <ul className="divide-y border rounded-lg">
          {filtered.map((a: any) => (
            <li key={a.id} className={`p-3 flex items-center gap-3 ${a.status === "completed" ? "opacity-60" : ""}`}>
              <div className="flex-1"><div className="font-medium text-sm">{a.title}</div><div className="text-xs text-muted-foreground">{a.due_at ? new Date(a.due_at).toLocaleString() : "No due date"}</div></div>
              {a.status !== "completed" && <Button size="sm" variant="outline" onClick={() => done.mutate(a.id)}><CheckCircle2 className="h-4 w-4" /></Button>}
            </li>
          ))}
        </ul>
      )}
    </CardContent></Card>
  );
}

function QuotationTab({ quotes, itineraries, lead }: { quotes: any[]; itineraries: any[]; lead: any }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const itinFn = useServerFn(listItineraries);
  const cloneFn = useServerFn(cloneItineraryToLead);
  const createItinFn = useServerFn(upsertItinerary);
  const { data: allItins = [] } = useQuery({ queryKey: ["itins-all"], queryFn: () => itinFn() });
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addItinOpen, setAddItinOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const clone = useMutation({
    mutationFn: (args: { source_id: string; slot_id?: string | null; source_template_id?: string | null }) =>
      cloneFn({ data: { ...args, lead_id: lead.id, customer_id: lead.customer_id ?? null } }),
    onSuccess: ({ id }) => {
      toast.success("Itinerary imported");
      qc.invalidateQueries({ queryKey: ["itins-all"] });
      qc.invalidateQueries({ queryKey: ["lead", lead.id] });
      setImportOpen(false);
      navigate({ to: "/itineraries/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to import"),
  });
  const openBuilder = { isPending: false, mutate: () => setAddItinOpen(true) };
  // Templates = itineraries not linked to this lead
  const templates = (allItins as any[]).filter((t) => t.id !== lead.id && t.lead_id !== lead.id);
  const filtered = templates.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (t.title ?? "").toLowerCase().includes(q)
      || (t.destinations ?? []).join(" ").toLowerCase().includes(q);
  });
  const service = lead.service_type ?? lead.query_type ?? "Full Package";
  const title = `${service} Quotation`;
  const isFlight = /flight/i.test(service);
  const isCruise = /cruise/i.test(service);
  const isHotel = /hotel/i.test(service);
  const isGit = /\bgit\b/i.test(service);
  const [addOpen, setAddOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);

  // TYPED (Flight / Cruise) — one quotation card per stored quotation with its item(s)
  if (isFlight || isCruise || isHotel) {
    return (
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-base">{title}</div>
              <p className="text-xs text-muted-foreground mt-0.5">You can create multiple quotations for this query. Invoice will be created automatically after quotation confirmation.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(isFlight || isHotel) && (
                <Button size="sm" variant="outline" onClick={() => setLiveOpen(true)} className="border-primary/40 text-primary hover:bg-primary/5">
                  <Sparkles className="h-4 w-4 mr-1.5" />Live {isFlight ? "Flight" : "Hotel"} Search
                </Button>
              )}
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />Add Quotation
              </Button>
            </div>
          </div>
          {quotes.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed rounded-xl">
              {isFlight ? <Plane className="h-10 w-10 mx-auto text-muted-foreground/50" /> : isCruise ? <Ship className="h-10 w-10 mx-auto text-muted-foreground/50" /> : <Plus className="h-10 w-10 mx-auto text-muted-foreground/50" />}
              <div className="mt-3 text-sm font-medium">No quotations yet</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(isFlight || isHotel)
                  ? <>Try <b>Live {isFlight ? "Flight" : "Hotel"} Search</b> to research current fares, or Add Quotation to enter manually.</>
                  : <>Click Add Quotation to add {isCruise ? "cruise" : "service"} details.</>}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((q) => <TypedQuotationCard key={q.id} q={q} kind={isFlight ? "flight" : isCruise ? "cruise" : "flight"} lead={lead} />)}
            </div>
          )}
          {isFlight && <AddFlightDialog open={addOpen} onOpenChange={setAddOpen} lead={lead} onSaved={() => {}} />}
          {isCruise && <AddCruiseDialog open={addOpen} onOpenChange={setAddOpen} lead={lead} onSaved={() => {}} />}
          {isHotel && <AddFlightDialog open={addOpen} onOpenChange={setAddOpen} lead={lead} onSaved={() => {}} />}
          {isFlight && <LiveFlightSearchDialog open={liveOpen} onOpenChange={setLiveOpen} lead={lead} onSaved={() => setLiveOpen(false)} />}
          {isHotel && <LiveHotelSearchDialog open={liveOpen} onOpenChange={setLiveOpen} lead={lead} onSaved={() => setLiveOpen(false)} />}
        </CardContent>
      </Card>
    );
  }

  // GIT PACKAGE — import from published GIT itinerary slots
  if (isGit) {
    const gitTemplates = templates.filter((t: any) => /git/i.test(t.package_type ?? ""));
    const gitFiltered = gitTemplates.filter((t: any) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (t.title ?? "").toLowerCase().includes(q)
        || (t.destinations ?? []).join(" ").toLowerCase().includes(q);
    });
    const requestedPax = (lead.adults ?? 0) + (lead.children ?? 0);
    return (
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="font-semibold text-base">GIT Package Quotation</div>
              <p className="text-xs text-muted-foreground mt-0.5">You can create multiple quotations for this query. Invoice will be created automatically after quotation confirmation.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Download className="h-4 w-4 mr-1.5" />Import GIT Package
            </Button>
          </div>

          {itineraries.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed rounded-xl">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <div className="mt-3 text-sm font-medium">No GIT package imported</div>
              <p className="text-xs text-muted-foreground mt-1">Import an available GIT package slot for this query.</p>
              <Button size="sm" className="mt-4" onClick={() => setImportOpen(true)}>
                <Download className="h-4 w-4 mr-1.5" />Import GIT Package
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {itineraries.map((it: any) => (
                <QuoteCard key={`itin-${it.id}`} lead={lead} c={{
                  kind: "itin" as const,
                  id: it.id,
                  name: it.title,
                  cover: it.cover_url,
                  status: it.status ?? "draft",
                  destinations: (it.destinations ?? []) as string[],
                  nights: it.nights ?? 0,
                  adults: it.adults ?? lead.adults ?? 0,
                  children: it.children ?? lead.children ?? 0,
                  infants: it.infants ?? lead.infants ?? 0,
                  total: computeItinTotal(it),
                }} />
              ))}
            </div>
          )}

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Import GIT Package</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Select a GIT package slot with available seats. Only future slots with remaining seats are shown.</p>
              </DialogHeader>
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <Input placeholder="Search GIT package…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="overflow-y-auto -mx-1 px-1 space-y-3">
                  {gitFiltered.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                      No GIT packages found. Create one in Itineraries with package type “GIT”.
                    </div>
                ) : gitFiltered.map((t: any) => (
                    <GitTemplateSlots key={t.id} template={t} requestedPax={requestedPax} onInsert={(slot_id) => clone.mutate({ source_id: t.id, slot_id, source_template_id: t.id })} inserting={clone.isPending} />
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        <AIBuilderDialog open={aiOpen} onOpenChange={setAiOpen} lead={lead} />
        </CardContent>
      </Card>
    );
  }

  const dest = lead.to_location ?? (Array.isArray(lead.destinations) ? lead.destinations[0] : null);

  // Cards = itineraries linked to this lead, then any quotations without a matching itinerary
  const itinCards = itineraries.map((it) => ({
    kind: "itin" as const,
    id: it.id,
    name: it.title,
    cover: it.cover_url,
    status: it.status ?? "draft",
    destinations: (it.destinations ?? []) as string[],
    nights: it.nights ?? 0,
    adults: it.adults ?? lead.adults ?? 0,
    children: it.children ?? lead.children ?? 0,
    infants: it.infants ?? lead.infants ?? 0,
    total: computeItinTotal(it),
  }));
  const quoteCards = quotes.map((q) => ({
    kind: "quote" as const,
    id: q.id,
    name: q.title,
    cover: null as string | null,
    status: q.status ?? "draft",
    destinations: dest ? [dest] : [],
    nights: lead.nights ?? 0,
    adults: lead.adults ?? 0,
    children: lead.children ?? 0,
    infants: lead.infants ?? 0,
    total: q.total ?? 0,
  }));
  const cards = [...itinCards, ...quoteCards];

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="font-semibold text-base">{title}</div>
            <p className="text-xs text-muted-foreground mt-0.5">You can create multiple quotations for this query. Invoice will be created automatically after quotation confirmation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Download className="h-4 w-4 mr-1.5" />Import Itinerary
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="border-primary/40 text-primary hover:bg-primary/5">
              <Sparkles className="h-4 w-4 mr-1.5" />AI Itinerary Builder
            </Button>
            <Button size="sm" onClick={() => openBuilder.mutate()} disabled={openBuilder.isPending}>
              <Sparkles className="h-4 w-4 mr-1.5" />{openBuilder.isPending ? "Opening…" : "Itinerary Builder"}
            </Button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed rounded-xl">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <div className="mt-3 text-sm font-medium">No quotations yet</div>
            <p className="text-xs text-muted-foreground mt-1">Import an itinerary template or add a new one to build the first quotation.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Download className="h-4 w-4 mr-1.5" />Import from Templates</Button>
              <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="border-primary/40 text-primary hover:bg-primary/5"><Sparkles className="h-4 w-4 mr-1.5" />AI Itinerary Builder</Button>
              <Button size="sm" onClick={() => openBuilder.mutate()} disabled={openBuilder.isPending}><Sparkles className="h-4 w-4 mr-1.5" />{openBuilder.isPending ? "Opening…" : "Itinerary Builder"}</Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {cards.map((c) => <QuoteCard key={`${c.kind}-${c.id}`} c={c} lead={lead} />)}
          </div>
        )}

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Import itinerary from templates</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <Input placeholder="Search by title or destination…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="overflow-y-auto -mx-1 px-1 space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                    No itineraries found. Create one in the Itineraries module first.
                  </div>
                ) : filtered.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40">
                    <div className="w-14 h-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      {t.cover_url ? <img src={t.cover_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 text-muted-foreground/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {(t.destinations ?? []).join(", ") || "—"} · {t.nights ?? 0}N · {t.package_type ?? "FIT"}
                        {t.lead_id ? <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">· used</span> : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(Number(t.total_amount ?? t.basic_cost ?? 0))}</div>
                      <Button size="sm" className="mt-1" onClick={() => clone.mutate({ source_id: t.id })} disabled={clone.isPending}>
                        <Download className="h-3.5 w-3.5 mr-1" />Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <AddItineraryDialog
          open={addItinOpen}
          onOpenChange={setAddItinOpen}
          lead={lead}
          onCreated={(row: any) => {
            qc.invalidateQueries({ queryKey: ["itins-all"] });
            qc.invalidateQueries({ queryKey: ["lead", lead.id] });
            setAddItinOpen(false);
            navigate({ to: "/itineraries/$id", params: { id: row.id } });
          }}
        />
        <AIBuilderDialog open={aiOpen} onOpenChange={setAiOpen} lead={lead} />
      </CardContent>
    </Card>
    );
  }

function GitTemplateSlots({ template, requestedPax, onInsert, inserting }: { template: any; requestedPax: number; onInsert: (slot_id: string) => void; inserting: boolean }) {
  const invFn = useServerFn(getGitInventory);
  const { data: inv = {} } = useQuery({
    queryKey: ["git-inv", template.id],
    queryFn: () => invFn({ data: { template_id: template.id } }),
  });
  const rawSlots: any[] = Array.isArray(template.slots) ? template.slots : [];
  const now = Date.now();
  const slots = rawSlots
    .map((s, i) => ({ ...s, __i: i, __key: s.start_date ?? `slot-${i}` }))
    .filter((s) => !s.start_date || new Date(s.start_date).getTime() >= now - 86400000)
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
  const nights = template.nights ?? 0;
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Flexible";
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-start gap-3 p-3 bg-muted/30">
        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
          {template.cover_url ? <img src={template.cover_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-4 text-muted-foreground/40" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-sm uppercase tracking-wide">{template.title}</div>
            <Badge variant="destructive" className="text-[10px]">GIT</Badge>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {(template.destinations ?? []).slice(0, 4).map((d: string) => (
              <span key={d} className="text-[11px] px-2 py-0.5 rounded-full border">{d}</span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">{nights} Nights / {nights + 1} Days · {slots.length} upcoming departure{slots.length === 1 ? "" : "s"}</div>
        </div>
      </div>
      {slots.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground border-t">No upcoming slots. Add a date slot on the template first.</div>
      ) : (
        <div className="divide-y">
          {slots.map((s: any) => {
            const capacity = Number(s.group_pax ?? 0);
            const bucket = (inv as any)[s.__key] ?? { confirmed_pax: 0, tentative_pax: 0 };
            const booked = Number(s.booked ?? 0) + bucket.confirmed_pax;
            const remaining = Math.max(0, capacity - booked);
            const end = s.start_date && nights ? new Date(new Date(s.start_date).getTime() + nights * 86400000) : null;
            const insufficient = requestedPax > 0 && capacity > 0 && remaining < requestedPax;
            const doubleRate = Number(s.rooms?.double ?? 0);
            return (
              <div key={s.__key} className="flex items-center justify-between gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{fmtDate(s.start_date)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {nights + 1} Days Tour {end ? `• Ends ${fmtDate(end)}` : ""}
                  </div>
                  {doubleRate > 0 && (
                    <div className="text-xs text-primary mt-0.5">From Double {formatCurrency(doubleRate)}</div>
                  )}
                  {bucket.tentative_pax > 0 && (
                    <div className="text-[10px] text-amber-700 mt-0.5">+{bucket.tentative_pax} pax in tentative queries</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md border">Cap {capacity || "—"}</span>
                    <span className={`px-2 py-0.5 rounded-md border ${remaining === 0 && capacity > 0 ? "text-destructive border-destructive/40" : "text-primary"}`}>Left {capacity ? remaining : "∞"}</span>
                  </div>
                  <Button size="sm" onClick={() => onInsert(s.__key)} disabled={inserting || insufficient || (capacity > 0 && remaining === 0)}>
                    Insert
                  </Button>
                  {insufficient && <div className="text-[10px] text-destructive">Need {requestedPax}, only {remaining} left</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TypedQuotationCard({ q, kind, lead }: { q: any; kind: "flight" | "cruise"; lead: any }) {
  const item = (q.quotation_items ?? [])[0] ?? {};
  const meta = item.meta ?? {};
  const isConfirmed = q.status === "confirmed";
  const supplierCost = Number(meta.supplier_cost ?? item.taxable ?? 0);
  const markup = Math.max(0, Number(q.total ?? 0) - supplierCost - Number(q.tax_amount ?? 0));
  return (
    <div className="border rounded-xl bg-card">
      <div className="p-4 flex flex-wrap items-start justify-between gap-3 border-b">
        <div>
          <div className="font-semibold flex items-center gap-2">
            {kind === "flight" ? <Plane className="h-4 w-4 text-primary" /> : <Ship className="h-4 w-4 text-primary" />}
            {kind === "flight"
              ? `Flight - ${meta.from_city ?? "—"} to ${meta.to_city ?? "—"}${meta.airline ? " - " + meta.airline : ""}`
              : `Cruise - ${meta.from_port ?? "—"} to ${meta.to_port ?? "—"}${meta.cruise_line ? " - " + meta.cruise_line : ""}`}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 font-mono">{q.code} · {item.supplier ?? "Self Supplier"}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${isConfirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700 border border-amber-300"}`}>
            {isConfirmed ? "Confirmed" : "Unconfirm"}
          </span>
          <Button size="sm" variant="outline">{kind === "flight" ? "View Flight Ticket" : "View Voucher"}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline">Options <ChevronDown className="h-3 w-3 ml-1" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>View on Map</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-b">
        <MoneyBox label="Supplier Cost" value={supplierCost} />
        <MoneyBox label="Markup" value={markup} />
        <MoneyBox label="Tax" value={Number(q.tax_amount ?? 0)} />
        <MoneyBox label="Total" value={Number(q.total ?? 0)} highlight />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
            {kind === "flight" ? (
              <tr><th className="text-left p-3">From</th><th className="text-left p-3">To</th><th className="text-left p-3">Departure</th><th className="text-left p-3">Arrival</th><th className="text-left p-3">Trip Type</th></tr>
            ) : (
              <tr><th className="text-left p-3">From</th><th className="text-left p-3">To</th><th className="text-left p-3">Sailing Date</th><th className="text-left p-3">End / Return Date</th><th className="text-left p-3">Cabin / Ship</th></tr>
            )}
          </thead>
          <tbody>
            {kind === "flight" ? (
              <tr className="border-t">
                <td className="p-3">{meta.from_city ?? "—"}</td>
                <td className="p-3">{meta.to_city ?? "—"}</td>
                <td className="p-3">{meta.departure ? new Date(meta.departure).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="p-3">{meta.arrival ? new Date(meta.arrival).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="p-3 capitalize">{(meta.trip_type ?? "one_way").replace("_", " ")}</td>
              </tr>
            ) : (
              <tr className="border-t">
                <td className="p-3">{meta.from_port ?? "—"}</td>
                <td className="p-3">{meta.to_port ?? "—"}</td>
                <td className="p-3">{meta.sailing_date ? new Date(meta.sailing_date).toLocaleDateString("en-GB") : "—"}</td>
                <td className="p-3">{meta.return_date ? new Date(meta.return_date).toLocaleDateString("en-GB") : "—"}</td>
                <td className="p-3">{meta.cabin ?? meta.ship ?? "—"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoneyBox({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>INR {value.toFixed(2)}</div>
    </div>
  );
}

function QuoteCard({ c, lead }: { c: any; lead: any }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const delQuote = useServerFn(deleteQuotation);
  const delItin = useServerFn(deleteItinerary);
  const convertFn = useServerFn(convertQuotationToInvoice);
  const delMut = useMutation({
    mutationFn: async () => c.kind === "itin" ? delItin({ data: { id: c.id } }) : delQuote({ data: { id: c.id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      qc.invalidateQueries({ queryKey: ["itins-all"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });
  const convertMut = useMutation({
    mutationFn: () => convertFn({ data: { quotation_id: c.id } }),
    onSuccess: ({ invoice_id }) => {
      toast.success("Invoice created from quotation");
      qc.invalidateQueries({ queryKey: ["invoices-all"] });
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      qc.invalidateQueries({ queryKey: ["timeline", lead.id] });
      navigate({ to: "/invoices/$id", params: { id: invoice_id } });
    },
    onError: (e: any) => toast.error(e?.message || "Conversion failed"),
  });
  const nights = c.nights || 0;
  const days = nights ? nights + 1 : 0;
  const statusStyle =
    c.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
    c.status === "sent" || c.status === "published" ? "bg-sky-100 text-sky-700" :
    "bg-slate-100 text-slate-600";
  return (
    <div className="border rounded-2xl overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5">
        {c.cover ? (
          <img src={c.cover} alt={c.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-primary/40"><ImageIcon className="h-10 w-10" /></div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold truncate">{c.name}</div>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${statusStyle}`}>{c.status}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link to={c.kind === "itin" ? "/itineraries/$id" : "/quotations/$id"} params={{ id: c.id }}>Open</Link></DropdownMenuItem>
              {c.kind === "quote" && (
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); convertMut.mutate(); }}
                  disabled={convertMut.isPending}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {convertMut.isPending ? "Converting…" : "Convert to Invoice"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
              <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download PDF</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  if (confirm(`Delete "${c.name}"? This cannot be undone.`)) delMut.mutate();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {c.destinations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {c.destinations.slice(0, 3).map((d: string) => (
              <span key={d} className="px-2 py-0.5 rounded-md bg-muted text-xs">{d}</span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <Stat label="Duration" value={nights ? `${nights} Nights` : "—"} sub={days ? `${days} Days` : undefined} />
          <Stat label="Pax" value={`${c.adults}A ${c.children}C ${c.infants}I`} />
          <Stat label="Total Price" value={formatCurrency(c.total)} highlight />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? "text-emerald-600" : ""}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function computeItinTotal(it: any): number {
  const services = (it?.itinerary_services ?? []) as Array<{ price?: number }>;
  const subtotal = services.reduce((s, r) => s + Number(r?.price ?? 0), 0);
  const markupType = it?.markup_type ?? "flat";
  const markupVal = Number(it?.markup_value ?? 0);
  const withMarkup = subtotal + (markupType === "pct" ? subtotal * (markupVal / 100) : markupVal);
  const gstRate = Number(it?.cgst_rate ?? 0) + Number(it?.sgst_rate ?? 0);
  const tcsRate = Number(it?.tcs_rate ?? 0);
  const gst = withMarkup * (gstRate / 100);
  const tcs = withMarkup * (tcsRate / 100);
  return withMarkup + gst + tcs;
}

function InvoiceTab({ invoices }: { invoices: any[] }) {
  const [open, setOpen] = useState(false);
  const { id: leadId } = Route.useParams();
  const lead = (invoices[0] as any) ?? null;
  const customerId = lead?.customer_id ?? null;
  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Invoice</div>
          <p className="text-xs text-muted-foreground">Invoice is created automatically when a quotation is confirmed. You can also create a manual invoice.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Manual Invoice</Button>
      </div>
      <ManualInvoiceDialog open={open} onOpenChange={setOpen} leadId={leadId} customerId={customerId} />
      {invoices.length === 0 ? <div className="text-center text-sm text-muted-foreground py-10">No invoices yet.</div> : (
        <div className="border rounded-xl divide-y">
          {invoices.map((i) => (
            <div key={i.id} className="p-4 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center text-sm">
              <div><div className="text-xs text-muted-foreground">Invoice Number</div><div className="font-mono">{i.code}</div></div>
              <div><div className="text-xs text-muted-foreground">Amount</div><div>{formatCurrency(i.total ?? 0)}</div></div>
              <div><div className="text-xs text-muted-foreground">Created Date</div><div>{new Date(i.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div></div>
              <div><div className="text-xs text-muted-foreground">Status</div><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">{i.status ?? "Partial"}</span></div>
              <Link to="/invoices/$id" params={{ id: i.id }}><Button size="sm" variant="ghost">View</Button></Link>
            </div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}

function BillingTab({ invoices }: { invoices: any[] }) {
  const qc = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const invoiceTotal = invoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
  const allPayments = invoices.flatMap((i) => (i.payments ?? []).map((p: any) => ({ ...p, invoice_code: i.code, invoice_total: i.total })));
  const received = allPayments.filter((p) => p.status !== "refunded").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const refunded = allPayments.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const net = received - refunded;
  const pending = Math.max(0, invoiceTotal - net);

  const delFn = useServerFn(deletePayment);
  const statusFn = useServerFn(updatePaymentStatus);
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Payment deleted"); qc.invalidateQueries({ queryKey: ["invoices-all"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => statusFn({ data: { id, status } }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["invoices-all"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Update failed"),
  });

  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Billing</div>
          <p className="text-xs text-muted-foreground">Client payment schedule, partial payments and refunds.</p>
        </div>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 rounded-full" onClick={() => setOpenAdd(true)} disabled={invoices.length === 0}>
          <Plus className="h-4 w-4 mr-1" />Add Payment
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="Total Payment" value={formatCurrency(invoiceTotal)} />
        <KPI label="Received" value={formatCurrency(received)} />
        <KPI label="Refunded" value={formatCurrency(refunded)} />
        <KPI label="Net Received" value={formatCurrency(net)} />
        <KPI label="Pending Amount" value={formatCurrency(pending)} />
      </div>

      {invoices.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-10">Confirm a quotation or add a manual invoice to record payments.</div>
      ) : allPayments.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-10">No payments recorded yet. Click "Add Payment" to log one.</div>
      ) : (
        <div className="divide-y rounded-lg border">
          {allPayments.map((p) => (
            <div key={p.id} className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
              <div>
                <div className="text-xs text-muted-foreground">Reference</div>
                <div className="font-mono text-sm">{p.reference ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Reminder: {p.reminder ? `Yes (${p.reminder_days}d)` : "No"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-semibold">{formatCurrency(p.amount)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Bank</div>
                <div className="text-xs">{p.bank_name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid Date</div>
                <div className="text-sm">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                {p.due_date && <><div className="text-[11px] text-muted-foreground mt-1">Due</div><div className="text-xs">{new Date(p.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div></>}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Mode</div>
                <div className="text-sm capitalize">{(p.mode ?? "").replace(/_/g, " ")}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Invoice</div>
                <div className="text-xs font-mono">{p.invoice_code}</div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <Select value={p.status ?? "received"} onValueChange={(v) => statusMut.mutate({ id: p.id, status: v })}>
                  <SelectTrigger className={`h-8 w-28 rounded-full text-xs ${p.status === "refunded" ? "bg-rose-50 text-rose-700 border-rose-200" : p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Paid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-rose-600 hover:bg-rose-50" onClick={() => delMut.mutate(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {p.comment && <div className="md:col-span-5 text-xs text-muted-foreground italic">"{p.comment}"</div>}
            </div>
          ))}
        </div>
      )}

      <AddPaymentSheet
        open={openAdd}
        onOpenChange={setOpenAdd}
        invoices={invoices}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["invoices-all"] })}
      />
    </CardContent></Card>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return <div className="p-3 rounded-lg bg-muted/40 border"><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm font-bold mt-0.5">{value}</div></div>;
}

function AddPaymentSheet({ open, onOpenChange, invoices, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; invoices: any[]; onSuccess: () => void }) {
  const defaultInv = invoices[0];
  const [invoiceId, setInvoiceId] = useState<string>(defaultInv?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("received");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState("bank");
  const [bankName, setBankName] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [reminder, setReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState("1");
  const [comment, setComment] = useState("");

  React.useEffect(() => { if (open && defaultInv && !invoiceId) setInvoiceId(defaultInv.id); }, [open, defaultInv, invoiceId]);

  const payFn = useServerFn(recordPayment);
  const mut = useMutation({
    mutationFn: () => payFn({ data: {
      invoice_id: invoiceId,
      amount: Number(amount || 0),
      paid_at: paidDate,
      mode, reference: reference || undefined,
      bank_name: bankName || null,
      due_date: dueDate || null,
      status,
      reminder,
      reminder_days: Number(reminderDays || 1),
      proof_url: proofUrl || null,
      comment: comment || null,
    } }),
    onSuccess: () => {
      toast.success("Payment recorded");
      onSuccess();
      onOpenChange(false);
      setAmount(""); setReference(""); setBankName(""); setComment(""); setProofUrl(""); setDueDate("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save payment"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Add Payment</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-4">
          {invoices.length > 1 && (
            <Field label="Invoice">
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {invoices.map((i) => <SelectItem key={i.id} value={i.id}>{i.code} — {formatCurrency(i.total)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Amount"><Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Due Date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          <Field label="Status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Paid Date"><Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></Field>
          <Field label="Payment Mode">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online Payment</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="qr">QR Payment</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Received In Bank"><Input placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
          <Field label="Reference No"><Input placeholder="Transaction ID / UTR / Cheque No" value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
          <Field label="Payment Proof URL"><Input placeholder="https://..." value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
            Reminder
          </label>
          {reminder && (
            <Field label="Reminder Days Before"><Input type="number" min={1} value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} /></Field>
          )}
          <Field label="Comment"><Textarea placeholder="Payment note / client comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600" disabled={!invoiceId || !amount || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-3">
      <Label className="text-xs text-muted-foreground text-right">{label}</Label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function WhatsAppTab({ lead }: { lead: any }) {
  const [msg, setMsg] = useState("");
  const listMsgs = useServerFn(listWaMessages);
  const sendFn = useServerFn(sendWhatsAppTestMessage);
  const diagFn = useServerFn(getWhatsAppDiagnostics);
  const digits = (lead.phone ?? "").replace(/\D/g, "");
  const suffix = digits.slice(-10);
  const diag = useQuery({ queryKey: ["wa-diag-lead"], queryFn: () => diagFn() });
  const cloudReady = !!(diag.data as any)?.provider_configured && (diag.data as any)?.enabled !== false;

  const msgsQ = useQuery({
    queryKey: ["wa-msgs-lead", suffix],
    queryFn: async () => {
      if (!suffix) return [] as any[];
      // Try several likely peer formats (raw digits, with 91, +91).
      const candidates = Array.from(new Set([digits, suffix, `91${suffix}`, `+91${suffix}`, `+${digits}`]));
      const results = await Promise.all(candidates.map((p) => listMsgs({ data: { peer: p } } as any).catch(() => [])));
      const merged = ([] as any[]).concat(...results);
      const seen = new Set<string>();
      return merged.filter((m: any) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
        .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
    },
    enabled: !!suffix,
    refetchInterval: 15000,
  });
  const messages = (msgsQ.data ?? []) as Array<{ id: string; direction: string; body: string | null; status: string | null; created_at: string }>;

  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: async () => {
      if (!digits || !msg.trim()) return { ok: false, fallback: false };
      if (cloudReady) {
        const r: any = await sendFn({ data: { to: digits, message: msg.trim() } } as any);
        if (r?.ok) return { ok: true, fallback: false };
        // fall through to wa.me if provider failed
      }
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg.trim())}`, "_blank");
      return { ok: true, fallback: true };
    },
    onSuccess: (r) => {
      if (r?.ok) { setMsg(""); qc.invalidateQueries({ queryKey: ["wa-msgs-lead", suffix] }); }
    },
  });

  return (
    <Card><CardContent className="p-0">
      <div className="p-4 border-b flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-semibold">{lead.full_name?.[0]}</div>
        <div className="flex-1">
          <div className="font-semibold">{lead.full_name}</div>
          <div className="text-xs text-muted-foreground">{lead.phone ?? "No phone"}</div>
        </div>
        {!cloudReady && (
          <Badge variant="outline" className="text-[10px]">wa.me mode</Badge>
        )}
      </div>
      <div className="h-80 bg-[#efeae2] p-3 overflow-y-auto flex flex-col gap-2">
        {!digits ? (
          <div className="m-auto text-sm text-muted-foreground">Add a phone number to this lead to start chatting.</div>
        ) : messages.length === 0 ? (
          <div className="m-auto text-sm text-muted-foreground">No WhatsApp thread yet.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cnClass("max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm", m.direction === "out" ? "self-end bg-emerald-100" : "self-start bg-white")}>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input placeholder="Type a message…" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !send.isPending && send.mutate()} disabled={!digits} />
        <Button onClick={() => send.mutate()} disabled={!digits || !msg.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
      </div>
    </CardContent></Card>
  );
}

function cnClass(...xs: (string | false | null | undefined)[]) { return xs.filter(Boolean).join(" "); }

function NotesTab({ lead }: { lead: any }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(upsertLead);
  const [entry, setEntry] = useState("");
  const notesList = (lead.notes ?? "").split("\n---\n").filter(Boolean);
  const add = useMutation({
    mutationFn: () => saveFn({ data: { id: lead.id, full_name: lead.full_name, notes: `${new Date().toLocaleString()} — ${entry}${lead.notes ? "\n---\n" + lead.notes : ""}` } as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lead", lead.id] }); setEntry(""); },
  });
  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="font-semibold">All Notes</div>
      <div className="flex gap-2">
        <Input placeholder="What's this note about?" value={entry} onChange={(e) => setEntry(e.target.value)} />
        <Button onClick={() => add.mutate()} disabled={!entry}>Add</Button>
      </div>
      {notesList.length === 0 ? <div className="text-center text-sm text-muted-foreground py-10">No notes found.</div> : (
        <ul className="divide-y border rounded-lg">
          {notesList.map((n: string, i: number) => <li key={i} className="p-3 text-sm whitespace-pre-wrap">{n}</li>)}
        </ul>
      )}
    </CardContent></Card>
  );
}

function DocumentTab({ lead }: { lead: any }) {
  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Document</div>
          <p className="text-xs text-muted-foreground">Client, company and traveller documents upload / download.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Traveller</Button>
      </div>
      <div className="border rounded-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold">{lead.full_name?.[0]}</div>
        <div className="flex-1"><div className="font-medium text-sm">{lead.full_name}</div><div className="text-xs text-muted-foreground">Client</div></div>
        <Button size="sm" variant="outline">Upload Document</Button>
      </div>
      <div className="text-center text-sm text-muted-foreground py-6">No documents found.</div>
    </CardContent></Card>
  );
}

function TimelineTab({ leadId, lead }: { leadId: string; lead: any }) {
  const tlFn = useServerFn(listTimeline);
  const { data: events = [] } = useQuery({
    queryKey: ["timeline", leadId],
    queryFn: () => tlFn({ data: { leadId } }),
    refetchInterval: 30_000,
  });
  const dotColor = (k: string) =>
    k.startsWith("payment") ? "bg-emerald-500" :
    k.startsWith("invoice") ? "bg-sky-500" :
    k.startsWith("quotation") ? "bg-violet-500" :
    k.startsWith("booking") ? "bg-amber-500" :
    k.startsWith("automation") ? "bg-fuchsia-500" :
    k.startsWith("lead.stage") ? "bg-primary" : "bg-slate-400";
  const items: any[] = (events as any[]).length
    ? (events as any[])
    : [{
        id: "seed",
        kind: "lead.created",
        title: "Query created",
        body: `${lead.code ?? ""} · ${(lead as any).pipeline_stages?.name ?? ""}`,
        created_at: lead.created_at,
      }];
  return (
    <Card><CardContent className="p-6">
      <div className="font-semibold mb-4">Activity Timeline</div>
      <ol className="relative border-l ml-2 space-y-4">
        {items.map((i: any) => (
          <li key={i.id} className="pl-4 relative">
            <span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${dotColor(i.kind)} border-2 border-background`} />
            <div className="text-[11px] text-muted-foreground">
              {new Date(i.created_at).toLocaleString()} · <span className="uppercase tracking-wider">{i.kind}</span>
            </div>
            <div className="font-medium text-sm">{i.title}</div>
            {i.body && <div className="text-xs text-muted-foreground">{i.body}</div>}
            {i.amount != null && Number(i.amount) > 0 && (
              <div className="text-xs mt-0.5 font-semibold text-emerald-700">{formatCurrency(Number(i.amount))}</div>
            )}
          </li>
        ))}
      </ol>
    </CardContent></Card>
  );
}

function EmailsTab({ lead }: { lead: any }) {
  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Email History</div>
          <p className="text-xs text-muted-foreground">Query-related sent email records.</p>
        </div>
        <SendEmailButton lead={lead} label="+ Send Email" />
      </div>
      <div className="text-center text-sm text-muted-foreground py-10">No emails sent yet.</div>
    </CardContent></Card>
  );
}

function SendEmailButton({ lead, label }: { lead: any; label?: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const composeFn = useServerFn(composeMail);
  const send = useMutation({
    mutationFn: () => composeFn({ data: { to: lead.email ?? "", subject, body, lead_id: lead.id } }),
    onSuccess: () => { setOpen(false); setSubject(""); setBody(""); },
  });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {label
          ? <Button variant="outline" size="sm">{label}</Button>
          : <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"><Mail className="h-4 w-4" />Send Email</Button>}
      </SheetTrigger>
      <SheetContent className="w-[520px] sm:max-w-lg">
        <SheetHeader><SheetTitle>Send Email</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <div><Label>To</Label><Input value={lead.email ?? ""} readOnly /></div>
          <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><Label>Message</Label><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => send.mutate()} disabled={!subject || !lead.email}>Send</Button></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupplierCommTab({ lead, quotes, itineraries }: { lead: any; quotes: any[]; itineraries: any[] }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMasters);
  const listCommsFn = useServerFn(listSupplierComms);
  const delFn = useServerFn(deleteSupplierComm);
  const [open, setOpen] = useState(false);
  const { data: suppliers = [] } = useQuery({ queryKey: ["masters", "supplier"], queryFn: () => listFn({ data: { kind: "supplier" } }) });
  const { data: comms = [] } = useQuery({ queryKey: ["supplier-comms", lead.id], queryFn: () => listCommsFn({ data: { lead_id: lead.id } }) });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-comms", lead.id] }),
  });

  return (
    <Card><CardContent className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Supplier Communication</div>
          <p className="text-xs text-muted-foreground">Supplier wise service details sent by email or WhatsApp from this query.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Send Detail
        </Button>
      </div>

      {(comms as any[]).length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-16">
          No supplier communication sent yet.
        </div>
      ) : (
        <div className="space-y-2">
          {(comms as any[]).map((c) => (
            <div key={c.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{c.supplier_name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{c.channel}</Badge>
                  {c.supplier_email && <span className="text-xs text-muted-foreground">{c.supplier_email}</span>}
                  {c.supplier_phone && <span className="text-xs text-muted-foreground">· {c.supplier_phone}</span>}
                </div>
                {c.subject && <div className="text-sm mt-0.5">{c.subject}</div>}
                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 whitespace-pre-wrap">{c.body}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleString()} · {(c.service_ids ?? []).length} service(s)
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <SendSupplierDetailSheet
        open={open}
        onOpenChange={setOpen}
        lead={lead}
        quotes={quotes}
        itineraries={itineraries}
        suppliers={suppliers as any[]}
        onSent={() => qc.invalidateQueries({ queryKey: ["supplier-comms", lead.id] })}
      />
    </CardContent></Card>
  );
}

function SendSupplierDetailSheet({
  open, onOpenChange, lead, quotes, itineraries, suppliers, onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  quotes: any[];
  itineraries: any[];
  suppliers: any[];
  onSent: () => void;
}) {
  const sendFn = useServerFn(sendSupplierDetail);

  // Build unified source list: quotations + itineraries
  const sources = React.useMemo(() => {
    const q = (quotes ?? []).map((x: any) => ({
      key: `q:${x.id}`,
      kind: "quotation" as const,
      id: x.id,
      label: `Quotation - ${x.title ?? x.code ?? x.id.slice(0, 8)}`,
      services: (x.quotation_items ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? i.service_type ?? "Service",
        detail: i.description ?? "",
        service_type: i.service_type ?? "",
      })),
    }));
    const it = (itineraries ?? []).map((x: any) => ({
      key: `i:${x.id}`,
      kind: "itinerary" as const,
      id: x.id,
      label: `Itinerary - ${x.title ?? x.id.slice(0, 8)}`,
      services: (x.itinerary_services ?? []).map((i: any) => ({
        id: i.id,
        title: i.title ?? i.service_type ?? "Service",
        detail: i.description ?? "",
        service_type: i.service_type ?? "",
      })),
    }));
    return [...q, ...it];
  }, [quotes, itineraries]);

  const [sourceKey, setSourceKey] = useState<string>("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");

  React.useEffect(() => {
    if (open) {
      setSourceKey(sources[0]?.key ?? "");
      setServiceIds([]);
      setSupplierIds([]);
      setServiceSearch("");
      setSupplierSearch("");
      setChannel("email");
    }
  }, [open, sources]);

  const activeSource = sources.find((s) => s.key === sourceKey);
  const services = activeSource?.services ?? [];
  const filteredServices = services.filter((s: any) =>
    !serviceSearch || s.title?.toLowerCase().includes(serviceSearch.toLowerCase()),
  );
  const filteredSuppliers = (suppliers ?? []).filter((s: any) =>
    !supplierSearch || s.name?.toLowerCase().includes(supplierSearch.toLowerCase()),
  );

  const allServicesSelected = services.length > 0 && serviceIds.length === services.length;
  const toggleAllServices = () => setServiceIds(allServicesSelected ? [] : services.map((s: any) => s.id));

  const send = useMutation({
    mutationFn: async () => {
      if (!activeSource) throw new Error("Select a quotation or itinerary");
      if (serviceIds.length === 0) throw new Error("Select at least one service");
      if (supplierIds.length === 0) throw new Error("Select at least one supplier");
      const chosenServices = services.filter((s: any) => serviceIds.includes(s.id));
      const chosenSuppliers = (suppliers ?? []).filter((s: any) => supplierIds.includes(s.id));

      const linesTxt = chosenServices.map((s: any) => `• ${s.title}${s.detail ? ` — ${s.detail}` : ""}`).join("\n");
      const subject = `Booking request — ${lead.full_name ?? "Client"} — ${lead.to_location ?? ""}`.trim();
      const commonBody =
`Please confirm availability and rates for the following service(s):

${linesTxt}

Travel Date: ${lead.travel_date ?? "-"}
Nights: ${lead.nights ?? "-"}
Pax: ${lead.adults ?? 0} Adult / ${lead.children ?? 0} Child / ${lead.infants ?? 0} Infant

Regards,
TraWe`;

      for (const sup of chosenSuppliers) {
        const email = sup.meta?.email ?? sup.description ?? null;
        const phone = sup.meta?.phone ?? null;
        await sendFn({
          data: {
            lead_id: lead.id,
            quotation_id: activeSource.kind === "quotation" ? activeSource.id : null,
            itinerary_id: activeSource.kind === "itinerary" ? activeSource.id : null,
            supplier_name: sup.name,
            supplier_email: email,
            supplier_phone: phone,
            channel,
            service_ids: serviceIds,
            subject,
            body: `Hi ${sup.name},\n\n${commonBody}`,
          },
        });

        // Open wa.me for whatsapp channel per supplier
        if (channel === "whatsapp" && phone) {
          const num = String(phone).replace(/\D/g, "");
          const url = `https://wa.me/${num}?text=${encodeURIComponent(`Hi ${sup.name},\n\n${commonBody}`)}`;
          window.open(url, "_blank", "noopener");
        }
      }
    },
    onSuccess: () => {
      toast.success("Supplier detail sent");
      onSent();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to send"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader><SheetTitle>Send Supplier Detail</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-xs">Quotation / Itinerary</Label>
            <Select value={sourceKey} onValueChange={setSourceKey}>
              <SelectTrigger><SelectValue placeholder="Select a quotation or itinerary" /></SelectTrigger>
              <SelectContent>
                {sources.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No quotations or itineraries on this query yet.</div>
                ) : sources.map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Services */}
            <div className="rounded-lg border p-3 flex flex-col">
              <div className="font-medium text-sm mb-2">Services</div>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={allServicesSelected} onChange={toggleAllServices} disabled={services.length === 0} />
                <span className="text-xs">Select All</span>
                <Input placeholder="Search service…" value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className="h-8 text-xs ml-auto max-w-[180px]" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[380px]">
                {filteredServices.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">No services.</div>
                ) : filteredServices.map((s: any) => {
                  const checked = serviceIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-start gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" checked={checked} onChange={(e) => setServiceIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{s.service_type || "Service"}</div>
                        <div className="text-xs">{s.title}</div>
                        {s.detail && <div className="text-[11px] text-muted-foreground">Details: {s.detail}</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Suppliers */}
            <div className="rounded-lg border p-3 flex flex-col">
              <div className="font-medium text-sm mb-2">Suppliers</div>
              <Input placeholder="Search supplier…" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} className="h-8 text-xs mb-2" />
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[380px]">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">No suppliers in Masters.</div>
                ) : filteredSuppliers.map((s: any) => {
                  const email = s.meta?.email ?? s.description ?? "";
                  const phone = s.meta?.phone ?? "";
                  const canEmail = !!email;
                  const canWa = !!phone;
                  const disabled = channel === "email" ? !canEmail : !canWa;
                  const checked = supplierIds.includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-start gap-2 rounded-md border p-2 ${disabled ? "opacity-50" : "cursor-pointer hover:bg-muted/50"}`}>
                      <input type="checkbox" disabled={disabled} checked={checked} onChange={(e) => setSupplierIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} className="mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {email || "No email"} · {phone || "No WhatsApp number"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="ch" checked={channel === "email"} onChange={() => setChannel("email")} /> Email
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="ch" checked={channel === "whatsapp"} onChange={() => setChannel("whatsapp")} /> WhatsApp
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => send.mutate()} disabled={send.isPending || !sourceKey || serviceIds.length === 0 || supplierIds.length === 0}>
                {send.isPending ? "Sending…" : "Send Detail"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupplierMailButton({ lead, supplier, email, service, title, amount }: { lead: any; supplier: string; email: string; service: string; title: string; amount: number }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(email);
  const [subject, setSubject] = useState(`${service} booking request — ${title} — ${lead?.customer?.name ?? lead?.name ?? ""}`);
  const [body, setBody] = useState(
    `Hi ${supplier},\n\nPlease confirm availability & final rate for:\n\nService: ${service}\nDetails: ${title}\nQuoted Amount: ₹ ${amount.toFixed(2)}\nTravel Date: ${lead?.travel_date ?? "-"}\nPAX: ${lead?.pax ?? "-"}\n\nRegards,\nTraWe`,
  );
  const composeFn = useServerFn(composeMail);
  const send = useMutation({
    mutationFn: () => composeFn({ data: { to, subject, body, lead_id: lead.id } }),
    onSuccess: () => setOpen(false),
  });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Email Supplier</Button>
      </SheetTrigger>
      <SheetContent className="w-[560px] sm:max-w-xl">
        <SheetHeader><SheetTitle>Email {supplier}</SheetTitle></SheetHeader>
        <div className="space-y-3 mt-4">
          <div><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="supplier@example.com" /></div>
          <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div><Label>Message</Label><Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => send.mutate()} disabled={!to || !subject || send.isPending}>
              {send.isPending ? "Sending…" : "Send Email"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddItineraryDialog({
  open, onOpenChange, lead, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  onCreated: (row: any) => void;
}) {
  const createItinFn = useServerFn(upsertItinerary);
  const defaultTitle = `${lead.full_name ?? "Lead"} - ${lead.service_type ?? lead.query_type ?? "Full Package"}${lead.to_location ? ` - ${lead.to_location}` : ""}`;
  const [packageType, setPackageType] = useState<string>("FIT");
  const [currency, setCurrency] = useState<string>("INR");
  const [costingType, setCostingType] = useState<string>("service_wise");
  const [title, setTitle] = useState<string>(defaultTitle);
  const [nights, setNights] = useState<number>(lead.nights ?? 2);
  const [adults, setAdults] = useState<number>(lead.adults ?? 1);
  const [children, setChildren] = useState<number>(lead.children ?? 0);
  const [infants, setInfants] = useState<number>(lead.infants ?? 0);
  const dest0 = lead.to_location ?? (Array.isArray(lead.destinations) ? lead.destinations[0] : null);
  const [destinations, setDestinations] = useState<string[]>(dest0 ? [dest0] : []);
  const [destInput, setDestInput] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Reset when reopened for a fresh flow
  React.useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setNights(lead.nights ?? 2);
      setAdults(lead.adults ?? 1);
      setChildren(lead.children ?? 0);
      setInfants(lead.infants ?? 0);
      setDestinations(dest0 ? [dest0] : []);
      setPackageType("FIT");
      setCurrency("INR");
      setCostingType("service_wise");
      setDescription("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Package title is required");
      const row = await createItinFn({
        data: {
          title: title.trim(),
          lead_id: lead.id,
          customer_id: lead.customer_id ?? null,
          destinations,
          start_date: lead.travel_date ?? null,
          end_date: lead.return_date ?? null,
          nights, adults, children, infants,
          currency,
          description: description || null,
          package_type: packageType,
          hotel_category: "3_star",
          package_option: "Basic",
          travel_style: "Relaxed",
          interests: [],
          gst_apply_on: "total",
          tcs_rate: 0,
          per_adult: 0, per_child: 0, per_infant: 0,
          costing_type: costingType,
          basic_cost: 0, markup_type: "flat", markup_value: 0, tax_rate: 5,
        } as any,
      });
      return row;
    },
    onSuccess: (row: any) => {
      toast.success("Itinerary created");
      onCreated(row);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create itinerary"),
  });

  function addDest() {
    const v = destInput.trim();
    if (!v) return;
    if (!destinations.includes(v)) setDestinations([...destinations, v]);
    setDestInput("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Add Itinerary</SheetTitle></SheetHeader>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Package Type</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIT">FIT Package</SelectItem>
                  <SelectItem value="GIT">GIT Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["INR","USD","EUR","GBP","AED","SGD","AUD"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Costing Type</Label>
            <Select value={costingType} onValueChange={setCostingType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="service_wise">Service Wise Cost</SelectItem>
                <SelectItem value="one_time">One Time Package Cost</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Service Wise keeps service supplier/cost. One Time uses Package Options cost.
            </p>
          </div>

          <div>
            <Label className="text-xs">Package Title *</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Nights</Label>
            <Input className="mt-1" type="number" min={0} value={nights}
              onChange={(e) => setNights(Math.max(0, Number(e.target.value) || 0))} />
            <p className="text-[11px] text-muted-foreground mt-1">Days auto calculate: nights + 1 = {nights + 1}</p>
          </div>

          <div>
            <div className="text-sm font-semibold">Pax Information</div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <Label className="text-xs">Adult</Label>
                <Input className="mt-1" type="number" min={0} value={adults}
                  onChange={(e) => setAdults(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <Label className="text-xs">Child</Label>
                <Input className="mt-1" type="number" min={0} value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div>
                <Label className="text-xs">Infant</Label>
                <Input className="mt-1" type="number" min={0} value={infants}
                  onChange={(e) => setInfants(Math.max(0, Number(e.target.value) || 0))} />
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Destination Information</div>
            <Label className="text-xs mt-2 block">Destinations</Label>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5">
              {destinations.map((d) => (
                <span key={d} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {d}
                  <button type="button" onClick={() => setDestinations(destinations.filter((x) => x !== d))} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm py-0.5"
                placeholder="Type destination and press Enter"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addDest(); }
                  if (e.key === "Backspace" && !destInput && destinations.length) {
                    setDestinations(destinations.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea className="mt-1" rows={4} placeholder="Package description"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !title.trim()}>
              {create.isPending ? "Creating…" : "Add & Open Builder"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
