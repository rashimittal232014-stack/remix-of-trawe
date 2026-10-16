import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCompanies, listCompanyOwners, upsertCompany, deleteCompany } from "@/lib/hub.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Pencil, Search, Columns, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [
    { title: "Companies · TraWe" },
    { name: "description", content: "B2B accounts, agencies and corporate partners in your workspace." },
  ]}),
  component: CompaniesPage,
});

const ALL_COLUMNS = [
  { key: "name", label: "Company Name", default: true, always: true },
  { key: "email", label: "Email", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "website", label: "Website", default: true },
  { key: "industry", label: "Industry", default: false },
  { key: "city", label: "City", default: false },
  { key: "country", label: "Country", default: false },
  { key: "gstin", label: "GSTIN", default: false },
  { key: "owner", label: "Owner", default: false },
] as const;

function CompaniesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "clients" | "open">("all");
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.default])),
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const listFn = useServerFn(listCompanies);
  const { data, isLoading } = useQuery({ queryKey: ["companies"], queryFn: () => listFn() });
  const rows: any[] = (data as any)?.items ?? [];
  const totals = (data as any)?.totals ?? { total: 0, withClients: 0, withOpenPipelines: 0 };

  const save = useMutation({
    mutationFn: useServerFn(upsertCompany),
    onSuccess: () => { toast.success("Company saved"); setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: useServerFn(deleteCompany),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["companies"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return rows.filter((c: any) => {
      if (filter === "clients" && !c._hasClient) return false;
      if (filter === "open" && !c._hasOpenPipeline) return false;
      if (!q) return true;
      const hay = [c.name, c.gstin, c.email, c.phone, c.website, c.city, c.industry].join(" ").toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, q, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const allChecked = pageRows.length > 0 && pageRows.every((r: any) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) pageRows.forEach((r: any) => next.delete(r.id));
    else pageRows.forEach((r: any) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Remove ${selected.size} companies?`)) return;
    for (const id of Array.from(selected)) await del.mutateAsync({ data: { id } });
    setSelected(new Set());
  };

  const shownCols = ALL_COLUMNS.filter((c) => visible[c.key]);
  const colspan = shownCols.length + 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">Companies</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={(v: any) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] rounded-full bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            <SelectItem value="clients">With Clients</SelectItem>
            <SelectItem value="open">With Open Pipelines</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search company, email, phone, website" className="pl-9 rounded-full bg-white" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <Button variant="outline" size="sm" onClick={bulkDelete} className="rounded-full">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete ({selected.size})
            </Button>
          )}
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="btn-brand text-sm rounded-full">
            <Plus className="h-4 w-4" /> Company
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("Import coming soon")}>Import from CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Export coming soon")}>Export CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="tile-hairline rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[13px] text-[#334155] border-b border-[#e8ecf1] bg-white/60">
                <th className="w-10 px-4 py-3"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                {shownCols.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>
                ))}
                <th className="w-14 px-2 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Columns className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ALL_COLUMNS.map((c: any) => (
                        <DropdownMenuCheckboxItem
                          key={c.key}
                          checked={visible[c.key]}
                          disabled={!!c.always}
                          onCheckedChange={(v) => setVisible({ ...visible, [c.key]: !!v })}
                        >
                          {c.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={colspan} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && pageRows.length === 0 && (
                <tr><td colSpan={colspan} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  No companies found. Click <span className="font-semibold text-[#48a890]">+ Company</span> to add one.
                </td></tr>
              )}
              {pageRows.map((c: any) => (
                <tr key={c.id} className="border-b border-[#eef1f5] hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3"><Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} /></td>
                  {visible.name && <td className="px-4 py-3 font-semibold text-[#001830]">{c.name}</td>}
                  {visible.email && <td className="px-4 py-3">{c.email ? <a className="text-[#2563eb] hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : <span className="text-muted-foreground">--</span>}</td>}
                  {visible.phone && <td className="px-4 py-3">{c.phone ? <a className="text-[#2563eb] hover:underline" href={`tel:${c.phone}`}>{c.phone}</a> : <span className="text-muted-foreground">--</span>}</td>}
                  {visible.website && <td className="px-4 py-3">{c.website ? <a className="text-[#2563eb] hover:underline" href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">{c.website}</a> : <span className="text-muted-foreground">--</span>}</td>}
                  {visible.industry && <td className="px-4 py-3">{c.industry || <span className="text-muted-foreground">--</span>}</td>}
                  {visible.city && <td className="px-4 py-3">{c.city || <span className="text-muted-foreground">--</span>}</td>}
                  {visible.country && <td className="px-4 py-3">{c.country || <span className="text-muted-foreground">--</span>}</td>}
                  {visible.gstin && <td className="px-4 py-3 font-mono text-xs">{c.gstin || <span className="text-muted-foreground">--</span>}</td>}
                  {visible.owner && <td className="px-4 py-3">{c.owner?.display_name || c.owner?.email || <span className="text-muted-foreground">--</span>}</td>}
                  <td className="px-2 py-3 text-right">
                    <div className="inline-flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Remove company?")) del.mutate({ data: { id: c.id } }); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#e8ecf1] bg-[#001830] text-white/90 px-5 py-3 flex flex-wrap items-center gap-6 text-xs">
          <span>Total Companies <b className="ml-1 text-white">{totals.total}</b></span>
          <span>With Clients <b className="ml-1 text-white">{totals.withClients}</b></span>
          <span>With Open Pipelines <b className="ml-1 text-white">{totals.withOpenPipelines}</b></span>
          <div className="ml-auto flex items-center gap-3">
            <span>Records per page</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <span>{filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)}</span>
            <div className="inline-flex gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/10" disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-[#e8ecf1]">
            <SheetTitle className="text-xl">{editing ? "Edit Company" : "Create Company"}</SheetTitle>
          </SheetHeader>
          <CompanyForm initial={editing} onSubmit={(v) => save.mutate({ data: v })} pending={save.isPending} onCancel={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CompanyForm({ initial, onSubmit, pending, onCancel }: { initial: any; onSubmit: (v: any) => void; pending: boolean; onCancel: () => void }) {
  const ownersFn = useServerFn(listCompanyOwners);
  const { data: owners = [] } = useQuery({ queryKey: ["company-owners"], queryFn: () => ownersFn() });
  const [f, setF] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    owner_id: initial?.owner_id ?? "",
    gstin: initial?.gstin ?? "",
    pan: initial?.pan ?? "",
    description: initial?.description ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    country: initial?.country ?? "India",
    pincode: initial?.pincode ?? "",
    notes: initial?.notes ?? "",
  });
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const industries = ["Travel Agency", "Tour Operator", "Corporate", "MICE", "DMC", "Hotel", "Airline", "Education", "Healthcare", "Pharma", "Manufacturing", "IT & Software", "Retail", "Media", "Other"];
  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#001830]">Company Information</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Owner</span>
              <Select value={f.owner_id || "none"} onValueChange={(v) => set("owner_id", v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 min-w-[160px]"><SelectValue placeholder="Select owner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {(owners as any[]).map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3">
            <Field label="Company Name *"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Website"><Input placeholder="https://" value={f.website} onChange={(e) => set("website", e.target.value)} /></Field>
            <Field label="Description"><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="GST No"><Input value={f.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} /></Field>
            <Field label="PAN No"><Input value={f.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} maxLength={10} /></Field>
            <Field label="Industry">
              <Select value={f.industry || "none"} onValueChange={(v) => set("industry", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Choose Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#001830] mb-4">Address Information</h3>
          <div className="grid gap-3">
            <Field label="Billing Street"><Textarea rows={2} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Billing City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Billing State"><Input value={f.state} onChange={(e) => set("state", e.target.value)} /></Field>
            <Field label="Billing Country"><Input value={f.country} onChange={(e) => set("country", e.target.value)} /></Field>
            <Field label="Billing Code"><Input value={f.pincode} onChange={(e) => set("pincode", e.target.value)} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[#001830] mb-3">Internal Notes</h3>
          <Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Only visible to your team" />
        </section>
      </div>

      <div className="border-t border-[#e8ecf1] px-6 py-3 flex items-center justify-end gap-2 bg-white/60">
        <Button variant="outline" className="rounded-full" onClick={onCancel}>Cancel</Button>
        <Button className="btn-brand rounded-full" onClick={() => onSubmit(f)} disabled={pending || !f.name.trim()}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <Label className="text-xs text-[#334155] pt-2 text-right">{label}</Label>
      <div>{children}</div>
    </div>
  );
}