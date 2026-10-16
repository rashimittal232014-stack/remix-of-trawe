import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLeads, listPipelines, upsertLead, updateLeadStage, deleteLead, listTeam } from "@/lib/crm.functions";
import { listCompanies } from "@/lib/hub.functions";
import { listCustomers, listQuotations, listInvoices } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Filter, Trash2, Pencil, Building2, User as UserIcon, MapPin } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { DESTINATIONS } from "@/lib/destinations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads/")({
  head: () => ({
    meta: [
      { title: "Queries — TraWe" },
      { name: "description", content: "Manage every travel query in one workspace." },
      { property: "og:title", content: "Queries — TraWe" },
      { property: "og:description", content: "Manage every travel query in one workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState<AdvFilters>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const listFn = useServerFn(listLeads);
  const pipesFn = useServerFn(listPipelines);
  const stageFn = useServerFn(updateLeadStage);
  const delFn = useServerFn(deleteLead);
  const teamFn = useServerFn(listTeam);
  const quotesFn = useServerFn(listQuotations);
  const invoicesFn = useServerFn(listInvoices);

  const { data: leads = [] } = useQuery({ queryKey: ["leads", search], queryFn: () => listFn({ data: { search } }) });
  const { data: pipelines = [] } = useQuery({ queryKey: ["pipelines"], queryFn: () => pipesFn(), staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => teamFn() });
  const needsBilling = Boolean(
    filters.hasQuotation || filters.quotationStatus || filters.quotationAmountMin != null || filters.quotationAmountMax != null ||
    filters.hasInvoice || filters.invoiceStatus || filters.invoiceDueFrom || filters.invoiceDueTo ||
    filters.balanceMin != null || filters.balanceMax != null,
  );
  const { data: quotations = [] } = useQuery({ queryKey: ["quotations-all"], queryFn: () => quotesFn({ data: {} }), enabled: needsBilling });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices-all"], queryFn: () => invoicesFn(), enabled: needsBilling });
  const enrichedLeads = useMemo(() => {
    if (!needsBilling) return leads as any[];
    const qByLead: Record<string, any[]> = {};
    (quotations as any[]).forEach((q) => { if (q.lead_id) (qByLead[q.lead_id] ??= []).push(q); });
    const iByLead: Record<string, any[]> = {};
    (invoices as any[]).forEach((i) => { if (i.lead_id) (iByLead[i.lead_id] ??= []).push(i); });
    return (leads as any[]).map((l) => ({ ...l, __quotations: qByLead[l.id] ?? [], __invoices: iByLead[l.id] ?? [] }));
  }, [leads, quotations, invoices, needsBilling]);
  const allStages = useMemo(
    () => (pipelines as any[]).flatMap((p) => (p.pipeline_stages ?? []).map((s: any) => ({ ...s, pipelineName: p.name }))),
    [pipelines],
  );
  const stageMap = useMemo(() => new Map(allStages.map((s: any) => [s.id, s])), [allStages]);
  const pipelineMap = useMemo(() => new Map((pipelines as any[]).map((p) => [p.id, p])), [pipelines]);
  const teamMap = useMemo(() => new Map((team as any[]).map((t) => [t.id, t])), [team]);
  const stagesForKanban = (pipelines[0] as any)?.pipeline_stages ?? [];

  const activeFilterCount = useMemo(() => Object.values(filters).filter((v) => v !== undefined && v !== "" && v !== null).length, [filters]);
  const filteredLeads = useMemo(
    () => applyAdvancedFilters(enrichedLeads, filters, stageMap),
    [enrichedLeads, filters, stageMap],
  );

  const mutateStage = useMutation({
    mutationFn: (v: { id: string; stage_id: string }) => stageFn({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueriesData({ queryKey: ["leads"] });
      qc.setQueriesData({ queryKey: ["leads"] }, (old: any) =>
        Array.isArray(old) ? old.map((l: any) => l.id === v.id ? { ...l, stage_id: v.stage_id, pipeline_stages: stageMap.get(v.stage_id) ?? l.pipeline_stages } : l) : old
      );
      return { prev };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Stage updated");
    },
    onError: (e: any, _v, ctx: any) => {
      if (ctx?.prev) ctx.prev.forEach(([key, data]: any) => qc.setQueryData(key, data));
      console.error("updateLeadStage failed", e);
      toast.error(e?.message ?? "Failed to update stage");
    },
  });
  const mutateDel = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Query deleted"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Queries</h1>
          <p className="text-sm text-muted-foreground">{leads.length} active queries</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-36 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queries</SelectItem>
              <SelectItem value="mine">My Queries</SelectItem>
              <SelectItem value="hot">Hot Queries</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search queries, client, company, destination…" className="pl-8 w-80 rounded-full" />
          </div>
          <Button variant={activeFilterCount ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setAdvanced(true)}>
            <Filter className="h-4 w-4 mr-1.5" />Advance Search{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full gap-1"><Plus className="h-4 w-4" />Query</Button></DialogTrigger>
            <LeadForm initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[1700px]">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 w-8"><input type="checkbox" className="rounded border-border" /></th>
                    <th className="text-left p-3 whitespace-nowrap">Query ID</th>
                    <th className="text-left p-3 whitespace-nowrap">Service</th>
                    <th className="text-left p-3 whitespace-nowrap">Customer Name</th>
                    <th className="text-left p-3 whitespace-nowrap">Travel</th>
                    <th className="text-left p-3 whitespace-nowrap">Travel Date</th>
                    <th className="text-left p-3 whitespace-nowrap">Value</th>
                    <th className="text-left p-3 whitespace-nowrap">Pax</th>
                    <th className="text-left p-3 whitespace-nowrap">Stage</th>
                    <th className="text-left p-3 whitespace-nowrap">Stage Group</th>
                    <th className="text-left p-3 whitespace-nowrap">Priority</th>
                    <th className="text-left p-3 whitespace-nowrap">Client / Company</th>
                    <th className="text-left p-3 whitespace-nowrap">Owner</th>
                    <th className="text-left p-3 whitespace-nowrap">Created</th>
                    <th className="text-left p-3 whitespace-nowrap">Modified</th>
                    <th className="p-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l: any) => (
                    <LeadRow
                      key={l.id}
                      lead={l}
                      stageMap={stageMap}
                      pipelineMap={pipelineMap}
                      teamMap={teamMap}
                      allStages={allStages}
                      onStage={(stage_id: string) => mutateStage.mutate({ id: l.id, stage_id })}
                      onEdit={() => { setEditing(l); setOpen(true); }}
                      onDelete={() => { if (confirm("Delete this query?")) mutateDel.mutate(l.id); }}
                    />
                  ))}
                  {filteredLeads.length === 0 && <tr><td colSpan={16} className="p-10 text-center text-muted-foreground">
                    {leads.length === 0 ? <>No queries yet. Click <b>+ Query</b> to add one.</> : <>No queries match the current filters.</>}
                  </td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {stagesForKanban.map((s: any) => {
              const items = filteredLeads.filter((l: any) => l.stage_id === s.id);
              return (
                <div key={s.id} className="w-72 shrink-0">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-lg" style={{ background: `${s.color}20` }}>
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.map((l: any) => (
                      <Link key={l.id} to="/leads/$id" params={{ id: l.id }} className="block">
                        <Card className="hover:shadow-md transition-shadow"><CardContent className="p-3 space-y-1">
                          <div className="font-mono text-[10px] text-muted-foreground">{l.code}</div>
                          <div className="font-medium text-sm">{l.full_name}</div>
                          <div className="text-xs text-muted-foreground">{l.from_location} → {l.to_location}</div>
                          <div className="text-xs font-medium text-primary">{formatCurrency(l.estimated_value)}</div>
                        </CardContent></Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <AdvanceSearchDialog
        open={advanced}
        onOpenChange={setAdvanced}
        value={filters}
        onApply={setFilters}
        pipelines={pipelines as any[]}
        allStages={allStages}
        team={team as any[]}
      />
    </div>
  );
}

function LeadRow({ lead, stageMap, pipelineMap, teamMap, allStages, onStage, onEdit, onDelete }: any) {
  const stage = stageMap.get(lead.stage_id);
  const pipeline = pipelineMap.get(lead.pipeline_id);
  const owner = teamMap.get(lead.owner_id);
  const pax = (lead.adults ?? 0) + (lead.children ?? 0) + (lead.infants ?? 0);
  const isCompany = !!lead.company;
  const created = lead.created_at ? new Date(lead.created_at) : null;
  const modified = lead.updated_at ? new Date(lead.updated_at) : created;
  const fmtDT = (d: Date | null) => d ? d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <tr className="border-t hover:bg-muted/30">
      <td className="p-3"><input type="checkbox" className="rounded border-border" /></td>
      <td className="p-3 whitespace-nowrap">
        <Link to="/leads/$id" params={{ id: lead.id }} className="text-primary hover:underline font-mono text-xs">{lead.code}</Link>
      </td>
      <td className="p-3">
        <Badge variant="secondary" className="rounded-full text-[10px] font-medium bg-primary/10 text-primary border-0">
          {lead.service_type || "Full Package"}
        </Badge>
      </td>
      <td className="p-3 font-medium whitespace-nowrap">{lead.full_name}</td>
      <td className="p-3 text-xs whitespace-nowrap">
        {(lead.from_location || lead.to_location)
          ? <>{lead.from_location || "—"} → {lead.to_location || "—"}</>
          : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="p-3 text-xs whitespace-nowrap">{lead.travel_date || <span className="text-muted-foreground">—</span>}</td>
      <td className="p-3 whitespace-nowrap font-medium">{lead.estimated_value ? formatCurrency(lead.estimated_value) : <span className="text-muted-foreground">—</span>}</td>
      <td className="p-3 text-xs whitespace-nowrap">{pax > 0 ? `${pax}A` : "—"}</td>
      <td className="p-3">
        <Select value={lead.stage_id ?? ""} onValueChange={onStage}>
          <SelectTrigger className="h-7 min-w-[110px] text-xs rounded-full border-0" style={{ background: `${stage?.color || "#94a3b8"}22`, color: stage?.color || "inherit" }}>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>{allStages.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="p-3 text-xs whitespace-nowrap">{pipeline?.name || <span className="text-muted-foreground">—</span>}</td>
      <td className="p-3">
        <Badge variant="outline" className={cn(
          "rounded-full text-[10px] capitalize border-0",
          lead.priority === "hot" && "bg-red-500/15 text-red-600",
          lead.priority === "high" && "bg-orange-500/15 text-orange-600",
          lead.priority === "medium" && "bg-amber-500/15 text-amber-700",
          lead.priority === "low" && "bg-slate-500/15 text-slate-600",
        )}>{lead.priority || "medium"}</Badge>
      </td>
      <td className="p-3 text-xs">
        <div className="flex items-center gap-1.5">
          {isCompany ? <Building2 className="h-3 w-3 text-muted-foreground shrink-0" /> : <UserIcon className="h-3 w-3 text-muted-foreground shrink-0" />}
          <div className="min-w-0 max-w-[180px]">
            <div className="font-medium truncate">{isCompany ? lead.company : lead.full_name}</div>
            <div className="text-muted-foreground text-[10px] truncate">{lead.phone || lead.email}</div>
          </div>
        </div>
      </td>
      <td className="p-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center">
            {(owner?.display_name || owner?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <span className="whitespace-nowrap">{owner?.display_name || owner?.email || "—"}</span>
        </div>
      </td>
      <td className="p-3 text-[11px] whitespace-nowrap text-muted-foreground">{fmtDT(created)}</td>
      <td className="p-3 text-[11px] whitespace-nowrap text-muted-foreground">{fmtDT(modified)}</td>
      <td className="p-3">
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </td>
    </tr>
  );
}

function DestinationInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = (value || "").toLowerCase().trim();
    const list = q ? DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q)) : DESTINATIONS;
    return list.slice(0, 40);
  }, [value]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={value}
            onFocus={() => setOpen(true)}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            placeholder={placeholder ?? "Type city or destination"}
            className="pl-8"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-64 overflow-y-auto"
      >
        {filtered.length === 0 && <div className="p-2 text-xs text-muted-foreground">No matches — keep typing to use custom value.</div>}
        {filtered.map((d) => (
          <button
            key={d.name}
            type="button"
            className="w-full text-left px-2.5 py-1.5 hover:bg-muted/60 flex items-center justify-between gap-2"
            onClick={() => { onChange(d.name); setOpen(false); }}
          >
            <span className="text-sm font-medium truncate">{d.name}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground shrink-0">{d.section}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function CompanySearchInput({ value, onSelect }: { value: string; onSelect: (c: any) => void }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listCompanies);
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => listFn() });
  const filtered = useMemo(() => {
    const s = (q || "").toLowerCase().trim();
    const arr = companies as any[];
    if (!s) return arr.slice(0, 20);
    return arr.filter((c) => [c.name, c.phone, c.email, c.gstin].some((v) => (v || "").toLowerCase().includes(s))).slice(0, 20);
  }, [q, companies]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder="Type company name, phone, email or GST"
        />
      </PopoverTrigger>
      <PopoverContent align="start" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[var(--radix-popover-trigger-width)] p-0 max-h-64 overflow-y-auto">
        {filtered.length === 0 && <div className="p-3 text-xs text-muted-foreground">No companies. Fill fields below to add.</div>}
        {filtered.map((c: any) => (
          <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b last:border-b-0"
            onClick={() => { onSelect(c); setQ(c.name); setOpen(false); }}>
            <div className="text-sm font-medium">{c.name}</div>
            <div className="text-[11px] text-muted-foreground">{[c.phone, c.email, c.gstin].filter(Boolean).join(" · ")}</div>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ClientSearchInput({ value, onSelect }: { value: string; onSelect: (c: any) => void }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const listFn = useServerFn(listCustomers);
  const { data: customers = [] } = useQuery({ queryKey: ["customers-lookup"], queryFn: () => listFn({ data: {} }) });
  const filtered = useMemo(() => {
    const s = (q || "").toLowerCase().trim();
    const arr = customers as any[];
    if (!s) return arr.slice(0, 6);
    return arr.filter((c) =>
      [c.full_name, c.first_name, c.last_name, c.phone, c.email, c.code].some((v) => (v || "").toLowerCase().includes(s)),
    ).slice(0, 6);
  }, [q, customers]);
  return (
    <div className="relative">
      <Input
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        placeholder="Type name, mobile, email or code"
      />
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 border rounded-lg bg-background shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No matching clients. Fill fields below to add a new one.</div>
          ) : filtered.map((c: any) => (
            <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(c); setQ([c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name || ""); setOpen(false); }}>
              <div className="text-sm font-medium truncate">{[c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{[c.phone, c.email, c.code].filter(Boolean).join(" · ")}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadForm({ initial, onClose }: { initial?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertLead);
  const pipesFn = useServerFn(listPipelines);
  const teamFn = useServerFn(listTeam);
  const { data: pipelines = [] } = useQuery({ queryKey: ["pipelines"], queryFn: () => pipesFn(), staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => teamFn() });
  const [travelFor, setTravelFor] = useState<"client" | "company">(initial?.company ? "company" : "client");
  const [form, setForm] = useState<any>({
    id: initial?.id,
    full_name: initial?.full_name ?? "",
    first_name: initial?.full_name?.split(" ")[0] ?? "",
    last_name: initial?.full_name?.split(" ").slice(1).join(" ") ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    company: initial?.company ?? "",
    company_gstin: "",
    service_type: initial?.service_type ?? "Full Package",
    from_location: initial?.from_location ?? "",
    to_location: initial?.to_location ?? "",
    travel_date: initial?.travel_date ?? "",
    return_date: initial?.return_date ?? "",
    nights: initial?.nights ?? 0,
    adults: initial?.adults ?? 1,
    children: initial?.children ?? 0,
    infants: initial?.infants ?? 0,
    source: initial?.source ?? "Website",
    priority: initial?.priority ?? "medium",
    estimated_value: initial?.estimated_value ?? 0,
    notes: initial?.notes ?? "",
    pipeline_id: initial?.pipeline_id ?? null,
    stage_id: initial?.stage_id ?? null,
    owner_id: initial?.owner_id ?? null,
  });
  const activePipeline: any = (pipelines as any[]).find((p) => p.id === form.pipeline_id)
    ?? (pipelines as any[]).find((p) => p.is_default)
    ?? (pipelines as any[])[0];
  const stages = activePipeline?.pipeline_stages ?? [];
  const mut = useMutation({
    mutationFn: () => {
      const full_name = travelFor === "client"
        ? [form.first_name, form.last_name].filter(Boolean).join(" ").trim() || form.full_name
        : form.company;
      return upsertFn({ data: {
        id: form.id,
        full_name,
        email: form.email,
        phone: form.phone,
        company: travelFor === "company" ? form.company : "",
        service_type: form.service_type,
        query_type: form.service_type,
        from_location: form.from_location,
        to_location: form.to_location,
        travel_date: form.travel_date,
        return_date: form.return_date,
        nights: Number(form.nights) || 0,
        adults: Number(form.adults) || 0,
        children: Number(form.children) || 0,
        infants: Number(form.infants) || 0,
        source: form.source,
        priority: form.priority,
        estimated_value: Number(form.estimated_value) || 0,
        notes: form.notes,
        pipeline_id: activePipeline?.id ?? null,
        stage_id: form.stage_id ?? stages[0]?.id ?? null,
      } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success(form.id ? "Query updated" : "Query created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const canSave = travelFor === "client"
    ? Boolean((form.first_name || form.full_name || "").trim())
    : Boolean((form.company || "").trim());

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{form.id ? "Edit Query" : "Create Query"}</DialogTitle></DialogHeader>

      <SectionCard title="Travel For">
        <RadioGroup value={travelFor} onValueChange={(v) => setTravelFor(v as any)} className="flex items-center gap-6 mb-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <RadioGroupItem value="client" id="tf-client" /> Client
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <RadioGroupItem value="company" id="tf-company" /> Company
          </label>
        </RadioGroup>
        <div className="rounded-lg bg-muted/40 p-4 space-y-3">
          {travelFor === "client" ? (
            <>
              <div>
                <Label>Search Client</Label>
                <ClientSearchInput
                  value={form.full_name}
                  onSelect={(c) => setForm({
                    ...form,
                    full_name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.full_name || "",
                    first_name: c.first_name || (c.full_name || "").split(" ")[0] || "",
                    last_name: c.last_name || (c.full_name || "").split(" ").slice(1).join(" ") || "",
                    phone: c.phone || form.phone,
                    email: c.email || form.email,
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
                <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
                <div><Label>Mobile</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>Search Company</Label>
                <CompanySearchInput value={form.company} onSelect={(c) => setForm({ ...form, company: c.name, phone: c.phone ?? form.phone, email: c.email ?? form.email, company_gstin: c.gstin ?? "" })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Company Name</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>GST Number</Label><Input value={form.company_gstin} onChange={(e) => setForm({ ...form, company_gstin: e.target.value })} /></div>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Trip Details">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Service Type</Label>
            <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
              <SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>{["Full Package","Flight","Hotel","Transport","Sightseeing","Visa","Passport","Cruise","Bus","Train","GIT Package","Ferry","Insurance","Other"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Travel Date</Label><Input type="date" value={form.travel_date} onChange={(e) => {
            const travel_date = e.target.value;
            const next: any = { ...form, travel_date };
            if (travel_date && form.return_date) {
              const diff = Math.max(0, Math.round((new Date(form.return_date).getTime() - new Date(travel_date).getTime()) / 86400000));
              next.nights = diff;
            }
            setForm(next);
          }} /></div>
          <div><Label>From Destination</Label><DestinationInput value={form.from_location} onChange={(v) => setForm({ ...form, from_location: v })} /></div>
          <div><Label>To Destination</Label><DestinationInput value={form.to_location} onChange={(v) => setForm({ ...form, to_location: v })} /></div>
          <div><Label>Return Date</Label><Input type="date" value={form.return_date} onChange={(e) => {
            const return_date = e.target.value;
            const next: any = { ...form, return_date };
            if (return_date && form.travel_date) {
              const diff = Math.max(0, Math.round((new Date(return_date).getTime() - new Date(form.travel_date).getTime()) / 86400000));
              next.nights = diff;
            }
            setForm(next);
          }} /></div>
          <div><Label>Nights</Label><Input type="number" value={form.nights} onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Pax Info">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Adult</Label><Input type="number" min={0} value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} /></div>
          <div><Label>Child</Label><Input type="number" min={0} value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} /></div>
          <div><Label>Infant</Label><Input type="number" min={0} value={form.infants} onChange={(e) => setForm({ ...form, infants: Number(e.target.value) })} /></div>
        </div>
      </SectionCard>

      <SectionCard title="Query Setup">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Lead Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Website","Phone Call","WhatsApp","Referral","Walk-in","Instagram","Facebook","Google Ads","Direct","Other"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["low","medium","high","hot"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Lead Owner</Label>
            <Select value={form.owner_id ?? ""} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
              <SelectTrigger><SelectValue placeholder="Assign owner" /></SelectTrigger>
              <SelectContent>{(team as any[]).map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Stage Group (Pipeline)</Label>
            <Select value={activePipeline?.id ?? ""} onValueChange={(v) => setForm({ ...form, pipeline_id: v, stage_id: null })}>
              <SelectTrigger><SelectValue placeholder="Choose pipeline" /></SelectTrigger>
              <SelectContent>{(pipelines as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Stage</Label>
            <Select value={form.stage_id ?? stages[0]?.id ?? ""} onValueChange={(v) => setForm({ ...form, stage_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose stage" /></SelectTrigger>
              <SelectContent>{stages.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Estimated Value (₹)</Label><Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })} /></div>
          <div className="col-span-2"><Label>Comment / Description</Label><Textarea rows={3} placeholder="Describe requirement, hotel preference, transport note, special request, etc." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !canSave} className="rounded-full">Save Query</Button>
      </div>
    </DialogContent>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0 rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

// ---------------- Advance Search ----------------

type TriState = "" | "yes" | "no";
type AdvFilters = {
  keyword?: string;
  queryType?: string; // client / company
  serviceType?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string; // open/won/lost from stage type
  itineraryStatus?: string;
  priority?: string;
  source?: string;
  ownerId?: string;
  fromDest?: string;
  toDest?: string;
  destination?: string;
  travelMonth?: string; // YYYY-MM
  travelFrom?: string;
  travelTo?: string;
  nightsMin?: number;
  nightsMax?: number;
  adultsMin?: number;
  childrenMin?: number;
  infantsMin?: number;
  createdFrom?: string;
  createdTo?: string;
  modifiedFrom?: string;
  modifiedTo?: string;
  followupFrom?: string;
  followupTo?: string;
  hasQuotation?: TriState;
  quotationStatus?: string;
  quotationAmountMin?: number;
  quotationAmountMax?: number;
  hasInvoice?: TriState;
  invoiceStatus?: string;
  invoiceDueFrom?: string;
  invoiceDueTo?: string;
  balanceMin?: number;
  balanceMax?: number;
};

function applyAdvancedFilters(leads: any[], f: AdvFilters, stageMap: Map<string, any>) {
  const kw = (f.keyword || "").toLowerCase().trim();
  const inRange = (val: string | null | undefined, from?: string, to?: string) => {
    if (!from && !to) return true;
    if (!val) return false;
    const t = +new Date(val);
    if (from && t < +new Date(from)) return false;
    if (to && t > +new Date(to) + 86_400_000) return false;
    return true;
  };
  return leads.filter((l) => {
    if (kw) {
      const hay = [l.code, l.full_name, l.email, l.phone, l.company, l.to_location, l.from_location].join(" ").toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    if (f.queryType === "client" && l.company) return false;
    if (f.queryType === "company" && !l.company) return false;
    if (f.serviceType && f.serviceType !== "all" && (l.service_type || "") !== f.serviceType) return false;
    if (f.pipelineId && l.pipeline_id !== f.pipelineId) return false;
    if (f.stageId && l.stage_id !== f.stageId) return false;
    if (f.status && f.status !== "all") {
      const st = stageMap.get(l.stage_id)?.type ?? "open";
      if (st !== f.status) return false;
    }
    if (f.itineraryStatus && f.itineraryStatus !== "all" && (l.itinerary_status || "none") !== f.itineraryStatus) return false;
    if (f.priority && f.priority !== "all" && (l.priority || "medium") !== f.priority) return false;
    if (f.source && f.source !== "all" && (l.source || "") !== f.source) return false;
    if (f.ownerId && f.ownerId !== "all" && l.owner_id !== f.ownerId) return false;
    if (f.fromDest && !(l.from_location || "").toLowerCase().includes(f.fromDest.toLowerCase())) return false;
    if (f.toDest && !(l.to_location || "").toLowerCase().includes(f.toDest.toLowerCase())) return false;
    if (f.destination) {
      const d = f.destination.toLowerCase();
      if (!(l.to_location || "").toLowerCase().includes(d) && !(l.from_location || "").toLowerCase().includes(d)) return false;
    }
    if (f.travelMonth && l.travel_date) {
      if (!l.travel_date.startsWith(f.travelMonth)) return false;
    }
    if (!inRange(l.travel_date, f.travelFrom, f.travelTo)) return false;
    if (f.nightsMin != null && (l.nights ?? 0) < f.nightsMin) return false;
    if (f.nightsMax != null && (l.nights ?? 0) > f.nightsMax) return false;
    if (f.adultsMin != null && (l.adults ?? 0) < f.adultsMin) return false;
    if (f.childrenMin != null && (l.children ?? 0) < f.childrenMin) return false;
    if (f.infantsMin != null && (l.infants ?? 0) < f.infantsMin) return false;
    if (!inRange(l.created_at, f.createdFrom, f.createdTo)) return false;
    if (!inRange(l.updated_at, f.modifiedFrom, f.modifiedTo)) return false;
    if (!inRange(l.next_followup_at, f.followupFrom, f.followupTo)) return false;

    // Quotation-side filters
    if (f.hasQuotation === "yes" && !(l.__quotations?.length)) return false;
    if (f.hasQuotation === "no" && l.__quotations?.length) return false;
    if (f.quotationStatus && f.quotationStatus !== "any") {
      if (!l.__quotations?.some((q: any) => (q.status || "").toLowerCase() === f.quotationStatus)) return false;
    }
    if (f.quotationAmountMin != null || f.quotationAmountMax != null) {
      const amounts: number[] = (l.__quotations ?? []).map((q: any) => Number(q.total ?? q.grand_total ?? 0));
      const max = amounts.length ? Math.max(...amounts) : 0;
      if (f.quotationAmountMin != null && max < f.quotationAmountMin) return false;
      if (f.quotationAmountMax != null && max > f.quotationAmountMax) return false;
    }

    // Invoice-side filters
    if (f.hasInvoice === "yes" && !(l.__invoices?.length)) return false;
    if (f.hasInvoice === "no" && l.__invoices?.length) return false;
    if (f.invoiceStatus && f.invoiceStatus !== "any") {
      if (!l.__invoices?.some((i: any) => (i.status || "").toLowerCase() === f.invoiceStatus)) return false;
    }
    if (f.invoiceDueFrom || f.invoiceDueTo) {
      if (!l.__invoices?.some((i: any) => inRange(i.due_date, f.invoiceDueFrom, f.invoiceDueTo))) return false;
    }
    if (f.balanceMin != null || f.balanceMax != null) {
      const balances: number[] = (l.__invoices ?? []).map((i: any) => Number(i.balance_due ?? (Number(i.total ?? 0) - Number(i.paid_amount ?? 0))));
      const bal = balances.length ? Math.max(...balances) : 0;
      if (f.balanceMin != null && bal < f.balanceMin) return false;
      if (f.balanceMax != null && bal > f.balanceMax) return false;
    }
    return true;
  });
}

function AdvanceSearchDialog({
  open, onOpenChange, value, onApply, pipelines, allStages, team,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: AdvFilters;
  onApply: (v: AdvFilters) => void;
  pipelines: any[];
  allStages: any[];
  team: any[];
}) {
  const [f, setF] = useState<AdvFilters>(value);
  const set = <K extends keyof AdvFilters>(k: K, v: AdvFilters[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const stagesForPipeline = f.pipelineId
    ? (pipelines.find((p) => p.id === f.pipelineId)?.pipeline_stages ?? [])
    : allStages;
  const num = (v: string) => (v === "" ? undefined : Number(v));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Advance Search</DialogTitle>
          <p className="text-sm text-muted-foreground">Find queries by travel, customer, quotation, supplier, invoice and billing filters.</p>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          <FilterGroup title="Basic Search">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FilterField label="Keyword" className="md:col-span-3"><Input placeholder="Query ID, customer, mobile, email, destination" value={f.keyword ?? ""} onChange={(e) => set("keyword", e.target.value)} /></FilterField>
              <FilterField label="Query Type">
                <Select value={f.queryType ?? "all"} onValueChange={(v) => set("queryType", v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Service Type">
                <Select value={f.serviceType ?? "all"} onValueChange={(v) => set("serviceType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {["Full Package","Flight","Hotel","Visa","Transport","Cruise","Insurance","Other"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <div />
              <FilterField label="Stage Group">
                <Select value={f.pipelineId ?? "all"} onValueChange={(v) => { set("pipelineId", v === "all" ? "" : v); set("stageId", ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stage Groups</SelectItem>
                    {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Stage">
                <Select value={f.stageId ?? "all"} onValueChange={(v) => set("stageId", v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stagesForPipeline.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
            </div>
          </FilterGroup>

          <FilterGroup title="Status & Ownership">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterField label="Query Status">
                <Select value={f.status ?? "all"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="won">Won / Confirmed</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Itinerary Status">
                <Select value={f.itineraryStatus ?? "all"} onValueChange={(v) => set("itineraryStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="none">No Itinerary</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Priority">
                <Select value={f.priority ?? "all"} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {["low","medium","high","hot"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Source">
                <Select value={f.source ?? "all"} onValueChange={(v) => set("source", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {["Website","Phone Call","WhatsApp","Referral","Walk-in","Instagram","Facebook","Google Ads","Direct","Other"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Owner">
                <Select value={f.ownerId ?? "all"} onValueChange={(v) => set("ownerId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
            </div>
          </FilterGroup>

          <FilterGroup title="Travel Filters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterField label="From Destination"><Input value={f.fromDest ?? ""} onChange={(e) => set("fromDest", e.target.value)} /></FilterField>
              <FilterField label="To Destination"><Input value={f.toDest ?? ""} onChange={(e) => set("toDest", e.target.value)} /></FilterField>
              <FilterField label="Destination (any)"><Input value={f.destination ?? ""} onChange={(e) => set("destination", e.target.value)} /></FilterField>
              <FilterField label="Travel Month"><Input type="month" value={f.travelMonth ?? ""} onChange={(e) => set("travelMonth", e.target.value)} /></FilterField>
              <FilterField label="Travel Date From"><Input type="date" value={f.travelFrom ?? ""} onChange={(e) => set("travelFrom", e.target.value)} /></FilterField>
              <FilterField label="Travel Date To"><Input type="date" value={f.travelTo ?? ""} onChange={(e) => set("travelTo", e.target.value)} /></FilterField>
              <FilterField label="Nights Min"><Input type="number" value={f.nightsMin ?? ""} onChange={(e) => set("nightsMin", num(e.target.value))} /></FilterField>
              <FilterField label="Nights Max"><Input type="number" value={f.nightsMax ?? ""} onChange={(e) => set("nightsMax", num(e.target.value))} /></FilterField>
              <FilterField label="Adults Min"><Input type="number" value={f.adultsMin ?? ""} onChange={(e) => set("adultsMin", num(e.target.value))} /></FilterField>
              <FilterField label="Children Min"><Input type="number" value={f.childrenMin ?? ""} onChange={(e) => set("childrenMin", num(e.target.value))} /></FilterField>
              <FilterField label="Infants Min"><Input type="number" value={f.infantsMin ?? ""} onChange={(e) => set("infantsMin", num(e.target.value))} /></FilterField>
            </div>
          </FilterGroup>

          <FilterGroup title="Date Filters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterField label="Created From"><Input type="date" value={f.createdFrom ?? ""} onChange={(e) => set("createdFrom", e.target.value)} /></FilterField>
              <FilterField label="Created To"><Input type="date" value={f.createdTo ?? ""} onChange={(e) => set("createdTo", e.target.value)} /></FilterField>
              <FilterField label="Modified From"><Input type="date" value={f.modifiedFrom ?? ""} onChange={(e) => set("modifiedFrom", e.target.value)} /></FilterField>
              <FilterField label="Modified To"><Input type="date" value={f.modifiedTo ?? ""} onChange={(e) => set("modifiedTo", e.target.value)} /></FilterField>
              <FilterField label="Follow-up From"><Input type="date" value={f.followupFrom ?? ""} onChange={(e) => set("followupFrom", e.target.value)} /></FilterField>
              <FilterField label="Follow-up To"><Input type="date" value={f.followupTo ?? ""} onChange={(e) => set("followupTo", e.target.value)} /></FilterField>
            </div>
          </FilterGroup>

          <FilterGroup title="Quotation & Supplier">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterField label="Has Quotation">
                <Select value={f.hasQuotation ?? "any"} onValueChange={(v) => set("hasQuotation", v === "any" ? "" : v as TriState)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Quotation Status">
                <Select value={f.quotationStatus ?? "any"} onValueChange={(v) => set("quotationStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {["draft","sent","accepted","rejected","expired"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Quotation Amount Min"><Input type="number" value={f.quotationAmountMin ?? ""} onChange={(e) => set("quotationAmountMin", num(e.target.value))} /></FilterField>
              <FilterField label="Quotation Amount Max"><Input type="number" value={f.quotationAmountMax ?? ""} onChange={(e) => set("quotationAmountMax", num(e.target.value))} /></FilterField>
            </div>
          </FilterGroup>

          <FilterGroup title="Invoice & Billing">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterField label="Has Invoice">
                <Select value={f.hasInvoice ?? "any"} onValueChange={(v) => set("hasInvoice", v === "any" ? "" : v as TriState)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Invoice Status">
                <Select value={f.invoiceStatus ?? "any"} onValueChange={(v) => set("invoiceStatus", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {["draft","sent","paid","partial","overdue","cancelled"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Invoice Due From"><Input type="date" value={f.invoiceDueFrom ?? ""} onChange={(e) => set("invoiceDueFrom", e.target.value)} /></FilterField>
              <FilterField label="Invoice Due To"><Input type="date" value={f.invoiceDueTo ?? ""} onChange={(e) => set("invoiceDueTo", e.target.value)} /></FilterField>
              <FilterField label="Balance Min"><Input type="number" value={f.balanceMin ?? ""} onChange={(e) => set("balanceMin", num(e.target.value))} /></FilterField>
              <FilterField label="Balance Max"><Input type="number" value={f.balanceMax ?? ""} onChange={(e) => set("balanceMax", num(e.target.value))} /></FilterField>
            </div>
          </FilterGroup>
        </div>

        <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-3 flex sm:justify-between items-center gap-2">
          <Button variant="ghost" onClick={() => setF({})} className="text-primary">Reset</Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={() => { onApply(f); onOpenChange(false); }}>
              <Search className="h-4 w-4 mr-1.5" />Search
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function FilterField({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}