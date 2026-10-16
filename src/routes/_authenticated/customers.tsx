import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCustomers, upsertCustomer, deleteCustomer } from "@/lib/sales.functions";
import { listTeam } from "@/lib/crm.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Search, Trash2, Edit, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: CustomersPage,
});

const VIEWS = [
  "All Clients",
  "Custom Search",
  "Mailing Labels",
  "My Clients",
  "New Last Week",
  "New This Week",
  "Recently Created Clients",
  "Recently Modified Clients",
  "Not Yet Viewed",
  "Untouched Clients",
  "Unsubscribed Clients",
];

function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [view, setView] = useState("All Clients");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const listFn = useServerFn(listCustomers);
  const delFn = useServerFn(deleteCustomer);
  const teamFn = useServerFn(listTeam);
  const { data: rows = [] } = useQuery({ queryKey: ["customers", search], queryFn: () => listFn({ data: { search } }) });
  const { data: team = [] } = useQuery({ queryKey: ["team"], queryFn: () => teamFn() });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Deleted"); },
  });

  const filtered = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    switch (view) {
      case "New Last Week":
        return (rows as any[]).filter((r) => {
          const d = new Date(r.created_at).getTime();
          return now - d >= 7 * day && now - d <= 14 * day;
        });
      case "New This Week":
        return (rows as any[]).filter((r) => now - new Date(r.created_at).getTime() <= 7 * day);
      case "Recently Created Clients":
        return [...(rows as any[])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 50);
      case "Recently Modified Clients":
        return [...(rows as any[])].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 50);
      case "Untouched Clients":
        return (rows as any[]).filter((r) => now - new Date(r.updated_at).getTime() > 30 * day);
      case "My Clients":
      case "Custom Search":
      case "Mailing Labels":
      case "Not Yet Viewed":
      case "Unsubscribed Clients":
      case "All Clients":
      default:
        return rows as any[];
    }
  }, [rows, view]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => {
    const all = rows as any[];
    const withPhone = all.filter((r) => r.phone).length;
    return {
      total: all.length,
      withContact: withPhone,
      untouched: all.filter((r) => Date.now() - new Date(r.updated_at).getTime() > 30 * 86400000).length,
      recent: all.filter((r) => Date.now() - new Date(r.created_at).getTime() <= 7 * 86400000).length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Customers</h1>
          <p className="text-sm text-muted-foreground">{stats.total} clients in your directory</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 rounded-full gap-1 min-w-[150px] justify-between">
                <span className="truncate text-left">{view}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>All Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {VIEWS.map((v) => (
                <DropdownMenuItem key={v} onSelect={() => { setView(v); setPage(1); }} className={v === view ? "bg-primary/10 text-primary font-medium" : ""}>
                  {v}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search client, email, mobile, phone, title" className="pl-8 w-80 rounded-full" />
          </div>
          <Button size="sm" className="rounded-full gap-1" onClick={() => { setEdit(null); setOpen(true); }}>
            <Plus className="h-4 w-4" />Client
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" className="rounded border-border" /></th>
                <th className="text-left p-3">First Name</th>
                <th className="text-left p-3">Last Name</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Mobile</th>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Owner</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-muted/30">
                  <td className="p-3"><input type="checkbox" className="rounded border-border" /></td>
                  <td className="p-3 font-semibold">{c.first_name || <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3">{c.last_name || <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3">{c.title || c.full_name || <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3 text-muted-foreground">{c.email || <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3 whitespace-nowrap">{c.phone ? (c.phone.startsWith("+") ? c.phone : `+91 ${c.phone}`) : <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3 max-w-[240px] truncate text-muted-foreground">{c.description || <span className="text-muted-foreground">--</span>}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center">
                        {(c.owner?.display_name || c.owner?.email || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <span className="whitespace-nowrap text-xs">{c.owner?.display_name || c.owner?.email || "—"}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEdit(c); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Delete this client?")) del.mutate(c.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">No clients found. Click <b>+ Client</b> to add one.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-xs text-muted-foreground">
        <span><span className="font-semibold text-foreground">Total Clients</span> {stats.total}</span>
        <span><span className="font-semibold text-foreground">With Contact</span> {stats.withContact}</span>
        <span><span className="font-semibold text-foreground">Recently Added</span> {stats.recent}</span>
        <span><span className="font-semibold text-foreground">Untouched</span> {stats.untouched}</span>
        <div className="ml-auto flex items-center gap-3">
          <span>Records per page {perPage}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</Button>
            <span className="text-xs">{(page - 1) * perPage + 1} to {Math.min(page * perPage, total)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</Button>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <CustomerForm initial={edit} team={team as any[]} onClose={() => { setOpen(false); setEdit(null); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerForm({ initial, team, onClose }: { initial: any; team: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(upsertCustomer);
  const [form, setForm] = useState<any>(
    initial ?? {
      first_name: "", last_name: "", title: "", email: "", phone: "", company: "",
      dob: "", description: "", gstin: "", address: "", city: "", state: "",
      country: "India", pincode: "", notes: "", owner_id: null,
    },
  );
  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      ...form,
      full_name: [form.first_name, form.last_name].filter(Boolean).join(" ").trim() || form.title || form.email || "Unnamed",
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success(initial ? "Client updated" : "Client created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  const canSave = Boolean((form.first_name || form.last_name || form.title || form.email || form.phone || "").toString().trim());
  return (
    <>
      <SheetHeader className="mb-4">
        <SheetTitle>{initial ? "Edit Client" : "Create Client"}</SheetTitle>
      </SheetHeader>
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Client Information</h3>
            <div className="flex items-center gap-2 text-xs">
              <Label className="text-xs text-muted-foreground">Client Owner</Label>
              <Select value={form.owner_id ?? ""} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Me" /></SelectTrigger>
                <SelectContent>
                  {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Last Name"><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Title" className="col-span-2"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mr / Ms / Team Lead / Preferred display title" /></Field>
            <Field label="Email" className="col-span-2"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Company Name"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Search Company" /></Field>
            <Field label="Mobile"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91" /></Field>
            <Field label="Description" className="col-span-2"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Date of Birth"><Input type="date" value={form.dob ?? ""} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
            <Field label="GSTIN"><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3">Address Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mailing Street" className="col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="State"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
            <Field label="Pincode"><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold mb-3">Internal Notes</h3>
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </section>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-3 border-t bg-background flex justify-end gap-2">
        <Button variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
        <Button className="rounded-full" onClick={() => save.mutate()} disabled={!canSave || save.isPending}>Save</Button>
      </div>
    </>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
