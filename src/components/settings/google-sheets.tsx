import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSheets, upsertSheet, deleteSheet, toggleSheet, syncSheet, CRM_MODULES } from "@/lib/gsheets.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Sheet as SheetIcon, ExternalLink, Pencil, Trash2, RefreshCw, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GoogleSheets() {
  const qc = useQueryClient();
  const load = useServerFn(listSheets);
  const upsertFn = useServerFn(upsertSheet);
  const deleteFn = useServerFn(deleteSheet);
  const toggleFn = useServerFn(toggleSheet);
  const syncFn = useServerFn(syncSheet);

  const { data } = useQuery({ queryKey: ["gsheets"], queryFn: () => load() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["gsheets"] });

  const [tab, setTab] = useState("sheets");
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [module, setModule] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);

  const sheets = data?.sheets ?? [];
  const logs = data?.logs ?? [];
  const totals = data?.totals ?? { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  const filtered = useMemo(() => {
    return sheets.filter((s: any) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (module !== "all" && s.crm_module !== module) return false;
      if (q && !s.connection_name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [sheets, filter, module, q]);

  const counts = {
    active: sheets.filter((s: any) => s.status === "active").length,
    inactive: sheets.filter((s: any) => s.status === "inactive").length,
    all: sheets.length,
  };

  const doSync = useMutation({
    mutationFn: (id: string) => syncFn({ data: { id } }),
    onSuccess: (r: any) => { toast.success(`Sync complete · ${r.created} created, ${r.updated} updated, ${r.skipped} skipped, ${r.failed} failed`); invalidate(); },
    onError: (e: any) => toast.error(e?.message || "Sync failed"),
  });
  const doDelete = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
  });
  const doToggle = useMutation({
    mutationFn: ({ id, status }: any) => toggleFn({ data: { id, status } }),
    onSuccess: () => invalidate(),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Google Sheet</h2>
          <p className="text-sm text-muted-foreground">Connect multiple Google Sheets, map sheet columns with CRM fields and fetch data without duplicate records.</p>
        </div>
        <Button onClick={() => { setEdit(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Google Sheet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi label="Total Sheets" value={totals.total} sub={`${counts.active} active`} tone="ok" />
        <Kpi label="Created Records" value={totals.created} sub={`${totals.updated} updated`} tone="ok" />
        <Kpi label="Skipped / Failed" value={totals.skipped + totals.failed} sub={`${totals.skipped} skipped, ${totals.failed} failed`} tone={totals.failed ? "warn" : "muted"} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sheets">Sheets</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="sheets" className="space-y-4">
          <Card><CardContent className="p-3 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1">
              {(["active", "inactive", "all"] as const).map((k) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={cn("px-3 py-1 text-xs rounded-full capitalize", filter === k ? "bg-background shadow-sm" : "text-muted-foreground")}>
                  {k} <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">{counts[k]}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select value={module} onChange={(e) => setModule(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="all">All Modules</option>
                {CRM_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sheet" className="pl-8 w-56" />
              </div>
            </div>
          </CardContent></Card>

          {filtered.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
              No sheets yet. Click <b>Add Google Sheet</b> to connect your first spreadsheet.
            </CardContent></Card>
          ) : filtered.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-200 grid place-items-center">
                    <SheetIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{s.connection_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.crm_module} module · fetched into CRM.</div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className={cn(s.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-muted-foreground")}>
                          {s.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-1">Last Sync</div>
                        <div className="text-[11px]">{s.last_sync_at ? new Date(s.last_sync_at).toLocaleString() : "Not synced yet"}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <MetaChip>Sheet: {s.sheet_name || "Default"}</MetaChip>
                      <MetaChip>Header Row: {s.header_row}</MetaChip>
                      <MetaChip>Start Row: {s.start_row}</MetaChip>
                      <MetaChip>Duplicate: {s.duplicate_check_field || "—"}</MetaChip>
                      <MetaChip>Action: {s.duplicate_action === "update" ? "Update" : "Skip"}</MetaChip>
                      <MetaChip>{Object.keys(s.field_mapping || {}).length} Mapped Fields</MetaChip>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <a href={s.sheet_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Open Google Sheet
                      </a>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-1.5 text-[11px]">
                          <Badge variant="outline">Created {s.created_count || 0}</Badge>
                          <Badge variant="outline">Updated {s.updated_count || 0}</Badge>
                          <Badge variant="outline">Skipped {s.skipped_count || 0}</Badge>
                          <Badge variant="outline" className={s.failed_count ? "text-destructive" : ""}>Failed {s.failed_count || 0}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <IconBtn title="Edit" onClick={() => { setEdit(s); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn title="Sync now" onClick={() => doSync.mutate(s.id)}><RefreshCw className={cn("h-3.5 w-3.5", doSync.isPending && "animate-spin")} /></IconBtn>
                          <IconBtn title={s.status === "active" ? "Deactivate" : "Activate"} onClick={() => doToggle.mutate({ id: s.id, status: s.status === "active" ? "inactive" : "active" })}><Power className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn title="Delete" onClick={() => { if (confirm("Delete this sheet connection?")) doDelete.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs">
          <Card><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Started</th>
                  <th className="text-left p-3">Sheet</th>
                  <th className="text-right p-3">Rows</th>
                  <th className="text-right p-3">Created</th>
                  <th className="text-right p-3">Updated</th>
                  <th className="text-right p-3">Skipped</th>
                  <th className="text-right p-3">Failed</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No sync runs yet.</td></tr>
                ) : logs.map((l: any) => {
                  const sh = sheets.find((s: any) => s.id === l.connection_id);
                  return (
                    <tr key={l.id} className="border-t">
                      <td className="p-3">{new Date(l.started_at).toLocaleString()}</td>
                      <td className="p-3">{sh?.connection_name || "—"}</td>
                      <td className="p-3 text-right">{l.rows_processed}</td>
                      <td className="p-3 text-right">{l.created_count}</td>
                      <td className="p-3 text-right">{l.updated_count}</td>
                      <td className="p-3 text-right">{l.skipped_count}</td>
                      <td className="p-3 text-right">{l.failed_count}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={l.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : l.status === "failed" ? "border-destructive/30 bg-destructive/10 text-destructive" : ""}>{l.status}</Badge>
                        {l.error && <div className="text-[11px] text-destructive mt-1 max-w-md truncate" title={l.error}>{l.error}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <AddSheetSheet open={open} onClose={() => setOpen(false)} initial={edit} onSaved={() => { setOpen(false); invalidate(); }} upsertFn={upsertFn} />
    </div>
  );
}

function Kpi({ label, value, sub, tone }: any) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className={cn("text-[11px] mt-1", tone === "warn" ? "text-amber-600" : "text-emerald-600")}>{sub}</div>
    </CardContent></Card>
  );
}
function MetaChip({ children }: any) {
  return <span className="text-[11px] rounded-full bg-muted/50 border px-2 py-0.5">{children}</span>;
}
function IconBtn({ children, ...rest }: any) {
  return <button className="h-7 w-7 grid place-items-center rounded-full border bg-background hover:bg-muted transition" {...rest}>{children}</button>;
}

function AddSheetSheet({ open, onClose, initial, onSaved, upsertFn }: any) {
  const [f, setF] = useState<any>(() => initial ?? {
    connection_name: "", crm_module: "", sheet_url: "", spreadsheet_id: "", sheet_gid: "0",
    sheet_name: "", status: "active", header_row: 1, start_row: 2,
    duplicate_check_field: "", duplicate_action: "skip", field_mapping: {},
  });
  useMemo(() => { if (open) setF(initial ?? {
    connection_name: "", crm_module: "", sheet_url: "", spreadsheet_id: "", sheet_gid: "0",
    sheet_name: "", status: "active", header_row: 1, start_row: 2,
    duplicate_check_field: "", duplicate_action: "skip", field_mapping: {},
  }); }, [open, initial]);

  const save = useMutation({
    mutationFn: () => upsertFn({ data: f }),
    onSuccess: () => { toast.success(f.id ? "Sheet updated" : "Sheet added"); onSaved(); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-[720px] overflow-y-auto">
        <SheetHeader><SheetTitle>{f.id ? "Edit" : "Add"} Google Sheet</SheetTitle></SheetHeader>
        <div className="space-y-4 pt-4">
          <FormRow label="Connection Name" required><Input value={f.connection_name} onChange={(e) => setF({ ...f, connection_name: e.target.value })} /></FormRow>
          <FormRow label="CRM Module" required>
            <select value={f.crm_module} onChange={(e) => setF({ ...f, crm_module: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">Select Module</option>
              {CRM_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormRow>
          <FormRow label="Google Sheet URL" required><Input value={f.sheet_url} onChange={(e) => setF({ ...f, sheet_url: e.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." /></FormRow>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Sheet ID"><Input value={f.spreadsheet_id} onChange={(e) => setF({ ...f, spreadsheet_id: e.target.value })} placeholder="Auto detect from URL" /></FormRow>
            <FormRow label="Sheet GID"><Input value={f.sheet_gid} onChange={(e) => setF({ ...f, sheet_gid: e.target.value })} /></FormRow>
            <FormRow label="Sheet Name"><Input value={f.sheet_name ?? ""} onChange={(e) => setF({ ...f, sheet_name: e.target.value })} placeholder="Optional" /></FormRow>
            <FormRow label="Status">
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </FormRow>
            <FormRow label="Header Row"><Input type="number" value={f.header_row} onChange={(e) => setF({ ...f, header_row: Number(e.target.value) })} /></FormRow>
            <FormRow label="Start Row"><Input type="number" value={f.start_row} onChange={(e) => setF({ ...f, start_row: Number(e.target.value) })} /></FormRow>
            <FormRow label="Duplicate Check Field">
              <select value={f.duplicate_check_field ?? ""} onChange={(e) => setF({ ...f, duplicate_check_field: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                <option value="">Select Field</option>
                <option value="email">email</option>
                <option value="phone">phone</option>
                <option value="full_name">full_name</option>
                <option value="company">company</option>
              </select>
            </FormRow>
            <FormRow label="Duplicate Action">
              <select value={f.duplicate_action} onChange={(e) => setF({ ...f, duplicate_action: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                <option value="skip">Skip Duplicate</option>
                <option value="update">Update Existing</option>
              </select>
            </FormRow>
          </div>
          <div className="text-[11px] text-muted-foreground border rounded-lg p-3 bg-muted/30">
            After first sync, rows are matched with CRM fields by header name (case-insensitive). Recommended headers for Queries: <b>full_name, email, phone, company, source</b>.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{f.id ? "Save" : "Save"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormRow({ label, required, children }: any) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3">
      <Label className="text-xs text-right text-muted-foreground">{required && <span className="text-destructive mr-0.5">*</span>}{label}</Label>
      <div>{children}</div>
    </div>
  );
}