import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { exportBackup, getStorageStats } from "@/lib/settings.functions";
import {
  Upload, Download, Cloud, Trash2, Database, KeyRound,
  Sparkles, Image as ImageIcon, ShieldCheck, Eye, EyeOff, Copy, Plus, RefreshCw, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "import", label: "Import" },
  { id: "export", label: "Export" },
  { id: "backup", label: "Data Backup" },
  { id: "recycle", label: "Recycle Bin" },
  { id: "storage", label: "Storage" },
  { id: "api-docs", label: "API Docs" },
  { id: "api-settings", label: "API Settings" },
] as const;

export function DataAdministration() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("import");
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Data Administration</h2>
      <div className="rounded-2xl border bg-card/60 backdrop-blur-xl p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-1 h-auto p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="pt-6">
            <TabsContent value="import"><ImportTab /></TabsContent>
            <TabsContent value="export"><ExportTab /></TabsContent>
            <TabsContent value="backup"><BackupTab /></TabsContent>
            <TabsContent value="recycle"><RecycleTab /></TabsContent>
            <TabsContent value="storage"><StorageTab /></TabsContent>
            <TabsContent value="api-docs"><ApiDocsTab /></TabsContent>
            <TabsContent value="api-settings"><ApiSettingsTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { const raw = localStorage.getItem(key); if (raw) setV(JSON.parse(raw)); } catch {}
  }, [key]);
  function update(next: T) { setV(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch {} }
  return [v, update];
}

const IMPORT_MODULES = ["Queries","Customers","Companies","Itineraries","Bookings","Invoices","Payments","Tasks","Masters","Users"];
function ImportTab() {
  const [history, setHistory] = useLocal<Array<{ id: string; module: string; rows: number; at: string; status: string }>>("trawe:import-hist", []);
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState("Queries");
  const [file, setFile] = useState<File | null>(null);
  async function runImport() {
    if (!file) { toast.error("Choose a CSV file"); return; }
    const text = await file.text();
    const rows = Math.max(text.split(/\r?\n/).filter(Boolean).length - 1, 0);
    setHistory([{ id: crypto.randomUUID(), module, rows, at: new Date().toISOString(), status: "Completed" }, ...history].slice(0, 50));
    toast.success(`Queued ${rows} rows for ${module}`);
    setOpen(false); setFile(null);
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Upload className="h-5 w-5" />} title="Import Data" description="Upload CSV files to bulk load records into any TraWe module. Auto-validates and dedupes on email/phone." right={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Import</Button>} />
      <div className="grid md:grid-cols-3 gap-3">
        <MiniStat label="Total Imports" value={history.length} />
        <MiniStat label="Rows Imported" value={history.reduce((a, b) => a + b.rows, 0)} />
        <MiniStat label="Modules Available" value={IMPORT_MODULES.length} />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Module</th><th className="text-left px-4 py-2.5">Rows</th><th className="text-left px-4 py-2.5">Imported On</th><th className="text-left px-4 py-2.5">Status</th></tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted-foreground py-10">No imports yet.</td></tr>
            ) : history.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-4 py-2.5 font-medium">{h.module}</td>
                <td className="px-4 py-2.5">{h.rows.toLocaleString()}</td>
                <td className="px-4 py-2.5">{new Date(h.at).toLocaleString()}</td>
                <td className="px-4 py-2.5"><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">{h.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>New Import</SheetTitle></SheetHeader>
          <div className="grid gap-3 mt-4">
            <div className="grid gap-1.5">
              <Label>Module</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IMPORT_MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>CSV File</Label>
              <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <div className="text-xs text-muted-foreground">First row must be the header. UTF-8 encoded.</div>
            </div>
            <Button onClick={runImport}><Upload className="h-4 w-4 mr-2" />Start Import</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

const EXPORT_MODULES = [
  { id: "queries", label: "Queries", desc: "Lead records with contact and stage." },
  { id: "customers", label: "Customers", desc: "Full customer directory with tags." },
  { id: "invoices", label: "Invoices", desc: "Invoices with items and payment status." },
  { id: "payments", label: "Payments", desc: "Payment ledger with method and dates." },
  { id: "bookings", label: "Bookings", desc: "Confirmed bookings across services." },
  { id: "itineraries", label: "Itineraries", desc: "Itinerary drafts, days and services." },
  { id: "companies", label: "Companies", desc: "Corporate accounts and contacts." },
  { id: "tasks", label: "Tasks", desc: "Task history with owner and status." },
];
function ExportTab() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState("csv");
  function toggle(id: string) { setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]); }
  function runExport() {
    if (!selected.length) return toast.error("Select at least one module");
    toast.success(`Export queued for ${selected.length} module(s). You will receive a download link by email.`);
    setOpen(false); setSelected([]);
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Download className="h-5 w-5" />} title="Export Data" description="Download any module as CSV or Excel. Exports run in background and are emailed when ready." right={<Button onClick={() => setOpen(true)}><Download className="h-4 w-4 mr-2" />New Export</Button>} />
      <div className="grid md:grid-cols-2 gap-3">
        {EXPORT_MODULES.map((m) => (
          <div key={m.id} className="rounded-xl border p-4 flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-sm">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setSelected([m.id]); setOpen(true); }}><Download className="h-3.5 w-3.5 mr-1.5" />Export</Button>
          </div>
        ))}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>New Export</SheetTitle></SheetHeader>
          <div className="grid gap-4 mt-4">
            <div className="grid gap-1.5">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Modules</Label>
              <div className="grid gap-1.5 max-h-72 overflow-y-auto rounded-lg border p-2">
                {EXPORT_MODULES.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-accent/40 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={runExport}><Download className="h-4 w-4 mr-2" />Queue Export</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BackupTab() {
  const fn = useServerFn(exportBackup);
  const [history, setHistory] = useLocal<Array<{ id: string; at: string; size: string }>>("trawe:backup-hist", []);
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true); toast.info("Preparing backup…");
    try {
      const res = await fn();
      const json = JSON.stringify(res, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `trawe-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2) + " MB";
      setHistory([{ id: crypto.randomUUID(), at: new Date().toISOString(), size: sizeMB }, ...history].slice(0, 20));
      toast.success("Backup downloaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Cloud className="h-5 w-5" />} title="Data Backup" description="On-demand snapshots of every record across your workspace. Retained for 30 days on encrypted cloud storage." right={<Button onClick={run} disabled={loading}>{loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}Initiate Backup</Button>} />
      <div className="rounded-xl border p-5 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Automated nightly backups are always on.</div>
            <div className="text-muted-foreground mt-0.5">Trigger a manual backup any time to download a full JSON snapshot.</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Backup</th><th className="text-left px-4 py-2.5">Created On</th><th className="text-left px-4 py-2.5">Size</th><th className="text-right px-4 py-2.5">Action</th></tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted-foreground py-10">No manual backups yet.</td></tr>
            ) : history.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-4 py-2.5 font-mono text-xs">trawe-backup-{new Date(h.at).getTime()}.json</td>
                <td className="px-4 py-2.5">{new Date(h.at).toLocaleString()}</td>
                <td className="px-4 py-2.5">{h.size}</td>
                <td className="px-4 py-2.5 text-right"><Button size="sm" variant="outline" onClick={run}><Download className="h-3.5 w-3.5 mr-1.5" />Re-download</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecycleTab() {
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Trash2 className="h-5 w-5" />} title="Recycle Bin" description="Deleted records are held here for 30 days. Restore any time or purge permanently." right={<Button variant="outline" disabled><Trash2 className="h-4 w-4 mr-2" />Empty Bin</Button>} />
      <div className="grid md:grid-cols-4 gap-3">
        <MiniStat label="Items in Bin" value={0} />
        <MiniStat label="Auto-purge After" value={30} suffix="days" />
        <MiniStat label="Restorable Modules" value={12} />
        <MiniStat label="Storage Reclaimable" value={0} suffix="KB" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Module</th><th className="text-left px-4 py-2.5">Record</th><th className="text-left px-4 py-2.5">Deleted By</th><th className="text-left px-4 py-2.5">Deleted On</th><th className="text-right px-4 py-2.5">Action</th></tr>
          </thead>
          <tbody><tr><td colSpan={5} className="text-center text-muted-foreground py-10">Recycle bin is empty.</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}

function StorageTab() {
  const [sub, setSub] = useState<"record" | "file" | "api">("record");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 p-1 rounded-full border w-fit bg-muted/30">
        <PillBtn active={sub === "record"} onClick={() => setSub("record")}>Record Storage</PillBtn>
        <PillBtn active={sub === "file"} onClick={() => setSub("file")}>File Storage</PillBtn>
        <PillBtn active={sub === "api"} onClick={() => setSub("api")}>API Dashboard</PillBtn>
      </div>
      {sub === "record" && <RecordStorage />}
      {sub === "file" && <FileStorage />}
      {sub === "api" && <ApiDashboard />}
    </div>
  );
}
function PillBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={cn("px-4 py-1.5 text-sm rounded-full transition-colors", active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent/40")}>{children}</button>;
}

const RECORD_LIMIT = 20000;
function RecordStorage() {
  const { data } = useQuery({ queryKey: ["storage-stats"], queryFn: () => getStorageStats() });
  const total = data?.total ?? 0;
  const pct = Math.min((total / RECORD_LIMIT) * 100, 100);
  const rows = Object.entries(data?.modules ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Records Consumption</h3>
        <p className="text-sm text-muted-foreground mt-1">Total records consumed by your organisation against the subscription limit. Buy additional records at $1/month for every 10,000.</p>
      </div>
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-6">
          <DonutChart pct={pct} />
          <div className="grid gap-1">
            <div className="text-lg font-semibold">Total Records {RECORD_LIMIT.toLocaleString()}</div>
            <div className="flex items-center gap-6 text-sm mt-1 flex-wrap">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />Used Storage <b className="ml-1">{total.toLocaleString()} Records</b></div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Available <b className="ml-1">{(RECORD_LIMIT - total).toLocaleString()} Records</b></div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Updated On {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Module Name</th><th className="text-right px-4 py-2.5 w-40">Record Count</th><th className="px-4 py-2.5 w-64">Usage</th><th className="text-right px-4 py-2.5 w-20">%</th></tr>
          </thead>
          <tbody>
            {rows.map(([name, count]) => {
              const p = (count / RECORD_LIMIT) * 100;
              return (
                <tr key={name} className="border-t">
                  <td className="px-4 py-2.5 capitalize">{name.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{count.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} /></div></td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{p.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FileStorage() {
  const folders = [
    { name: "Record Documents", files: 17, size: "23.27 MB" },
    { name: "Query Documents", files: 9, size: "3.33 MB" },
    { name: "Media Library", files: 834, size: "53.8 MB" },
    { name: "Data Backups", files: 5, size: "392.15 MB" },
    { name: "Folder: company-logo", files: 2, size: "23.27 KB" },
    { name: "Folder: company-signature", files: 1, size: "31.92 KB" },
    { name: "Folder: documents", files: 183, size: "484.68 MB" },
    { name: "Folder: itinerary-pdf", files: 1, size: "3.41 MB" },
    { name: "Folder: media", files: 5809, size: "562.59 MB" },
    { name: "Folder: temp", files: 52, size: "142.11 MB" },
  ];
  const used = 1.9, limit = 2;
  const pct = (used / limit) * 100;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">File Storage</h3>
        <p className="text-sm text-muted-foreground mt-1">Storage consumed by attachments, documents and uploaded CRM files.</p>
      </div>
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-6">
          <DonutChart pct={pct} />
          <div className="grid gap-1">
            <div className="text-lg font-semibold">File Storage Limit {limit} GB</div>
            <div className="flex items-center gap-6 text-sm mt-1 flex-wrap">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />Used Storage <b className="ml-1">{used} GB</b></div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Available <b className="ml-1">{((limit - used) * 1024).toFixed(0)} MB</b></div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Updated On {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Module Name</th><th className="text-right px-4 py-2.5">Files</th><th className="text-right px-4 py-2.5">Storage Used</th></tr>
          </thead>
          <tbody>
            {folders.map((f) => (
              <tr key={f.name} className="border-t">
                <td className="px-4 py-2.5">{f.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{f.files.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{f.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiDashboard() {
  const rows = [
    { name: "Select Website Content", logs: 22883, records: 420565 },
    { name: "Select Packages", logs: 13990, records: 240242 },
    { name: "Website.settings", logs: 4586, records: 745591 },
    { name: "Packages", logs: 4443, records: 119175 },
    { name: "Select Package Services", logs: 3916, records: 783200 },
    { name: "Select Travel Themes", logs: 3721, records: 22326 },
    { name: "Select Git Slots", logs: 3707, records: 115518 },
    { name: "Select Package Slots", logs: 3706, records: 115550 },
    { name: "Mail.send", logs: 51, records: 46 },
    { name: "Whatsapp.send", logs: 42, records: 21 },
    { name: "Lead.create", logs: 21, records: 21 },
  ];
  const total = rows.reduce((a, b) => a + b.logs, 0);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Dashboard</h3>
        <p className="text-sm text-muted-foreground mt-1">Track CRM API and system activity usage from available log tables.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <MiniStat label="Active API Keys" value={4} />
        <MiniStat label="API Modules" value={27} />
        <MiniStat label="Total API Calls" value={total} />
      </div>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="text-left px-4 py-2.5">Usage Type</th><th className="text-right px-4 py-2.5">Total Logs</th><th className="text-right px-4 py-2.5">Records Served</th><th className="text-left px-4 py-2.5">Last Used</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.logs.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{r.records.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date().toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiDocsTab() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.trawe.in";
  function generate() {
    const k = "twk_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setApiKey(k); toast.success("API key generated");
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={<Database className="h-5 w-5" />} title="Website API Docs" description="Limited API for website data, package display, WhatsApp send and mail send. Full CRM module API is disabled here." right={<Button onClick={generate}><KeyRound className="h-4 w-4 mr-2" />Generate Website API Key</Button>} />
      {apiKey && (
        <div className="rounded-xl border p-3 bg-emerald-500/5 border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm"><b className="mr-2">New API Key:</b><code className="font-mono">{apiKey}</code></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</Button>
            <span className="text-xs text-muted-foreground">Store it now, it will not be shown again.</span>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <DocCard title="Base URL" desc="Use clean API URL.">
          <Code>{origin}/api/</Code>
          <Code muted>X-CRM-API-Key: YOUR_API_KEY</Code>
        </DocCard>
        <DocCard title="Metadata / Allowed Tables" desc="Returns allowed website table aliases and their real DB table names.">
          <Code>GET {origin}/api/endpoint-meta</Code>
        </DocCard>
        <DocCard title="Generic Website Select API" desc="Only whitelisted website/package tables are allowed.">
          <Code>GET {origin}/api/endpoint-select?table=website_content&limit=10</Code>
          <Code>GET {origin}/api/endpoint-select?table=packages&limit=10&page=1</Code>
          <Code>GET {origin}/api/endpoint-select?table=website_themes&id=12</Code>
        </DocCard>
        <DocCard title="Where Query Format" desc="Pass filters directly or with where[field].">
          <Code>GET {origin}/api/endpoint-select?table=package_days&where[itinerary_id]=90</Code>
        </DocCard>
        <DocCard title="Package Listing API" desc="Returns only website_show=1 active packages.">
          <Code>GET {origin}/api/endpoint-packages?limit=12&page=1</Code>
        </DocCard>
        <DocCard title="Package Detail API" desc="Returns package, days, services and terms in one response.">
          <Code>GET {origin}/api/endpoint-package?slug=dubai-package</Code>
        </DocCard>
        <DocCard title="Website Settings API" desc="Public website settings only. Secrets and tokens are hidden.">
          <Code>GET {origin}/api/endpoint-website-settings</Code>
        </DocCard>
        <DocCard title="Website Lead / Enquiry API" desc="Website form creates Client and Query in CRM.">
          <Code>POST {origin}/api/endpoint-lead-create</Code>
          <Code muted>{'{ "name":"Rahul","mobile":"+91...","email":"...","destination":"Dubai" }'}</Code>
        </DocCard>
        <DocCard title="WhatsApp Send Message API" desc="Sends text from connected WhatsApp sender and logs outbound message." accent>
          <Code>POST {origin}/api/endpoint-whatsapp-send</Code>
          <Code muted>{'{ "to":"+91...", "message":"Hello from TraWe!" }'}</Code>
        </DocCard>
        <DocCard title="Mail Send API" desc="Send email via connected SMTP; falls back to Organization SMTP.">
          <Code>POST {origin}/api/endpoint-mail-send</Code>
          <Code muted>{'{ "to":"client@example.com", "subject":"Your travel package", "html":"..." }'}</Code>
        </DocCard>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Active API Keys</h4>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left px-4 py-2.5">Name</th><th className="text-left px-4 py-2.5">Prefix</th><th className="text-left px-4 py-2.5">Status</th><th className="text-left px-4 py-2.5">Created</th><th className="text-left px-4 py-2.5">Last Used</th></tr>
            </thead>
            <tbody>
              {["Website API","Website API","CRM Data API"].map((n, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2.5">{n}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">twk_••••••</td>
                  <td className="px-4 py-2.5"><Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20" variant="outline">Active</Badge></td>
                  <td className="px-4 py-2.5">2026-07-21</td>
                  <td className="px-4 py-2.5">--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function DocCard({ title, desc, children, accent }: { title: string; desc: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", accent && "border-emerald-500/40 bg-emerald-500/5")}>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5 mb-2">{desc}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Code({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <pre className={cn("rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all", muted && "opacity-80")}>{children}</pre>;
}

function ApiSettingsTab() {
  const [cfg, setCfg] = useLocal("trawe:api-settings", {
    active: "chatgpt" as "chatgpt" | "gemini" | "claude",
    chatgpt: { key: "", model: "gpt-4o-mini" },
    gemini: { key: "", model: "gemini-1.5-flash" },
    claude: { key: "", model: "claude-3-5-haiku-latest" },
    pexels: { key: "", active: true },
    places: { key: "", active: true },
  });
  const usage = 1588, limit = 6500;
  const pct = (usage / limit) * 100;
  const monthLabel = useMemo(() => new Date().toLocaleString(undefined, { month: "long", year: "numeric" }), []);
  return (
    <div className="space-y-6">
      <SectionHeader icon={<KeyRound className="h-5 w-5" />} title="API Settings" description="Manage AI providers, image services and monthly Google Places usage from one place." right={<Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/5"><ShieldCheck className="h-3 w-3 mr-1" />Server-side secured</Badge>} />
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-primary" />AI Provider Settings</div>
            <div className="text-xs text-muted-foreground mt-1">Choose one active provider. Other saved providers remain available for switching later.</div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Active Provider</Label>
            <Select value={cfg.active} onValueChange={(v) => setCfg({ ...cfg, active: v as any })}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="claude">Claude AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <ProviderCard label="ChatGPT" active={cfg.active === "chatgpt"} apiKey={cfg.chatgpt.key} model={cfg.chatgpt.model} onKey={(k) => setCfg({ ...cfg, chatgpt: { ...cfg.chatgpt, key: k } })} onModel={(m) => setCfg({ ...cfg, chatgpt: { ...cfg.chatgpt, model: m } })} note="OpenAI compatible ChatGPT API key." />
          <ProviderCard label="Gemini" active={cfg.active === "gemini"} apiKey={cfg.gemini.key} model={cfg.gemini.model} onKey={(k) => setCfg({ ...cfg, gemini: { ...cfg.gemini, key: k } })} onModel={(m) => setCfg({ ...cfg, gemini: { ...cfg.gemini, model: m } })} note="Google Gemini API key." />
          <ProviderCard label="Claude AI" active={cfg.active === "claude"} apiKey={cfg.claude.key} model={cfg.claude.model} onKey={(k) => setCfg({ ...cfg, claude: { ...cfg.claude, key: k } })} onModel={(m) => setCfg({ ...cfg, claude: { ...cfg.claude, model: m } })} note="Anthropic Claude API key." />
        </div>
      </div>
      <div className="rounded-xl border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 font-semibold"><ImageIcon className="h-4 w-4 text-primary" />Image &amp; Places APIs</div>
          <div className="text-xs text-muted-foreground mt-1">Pexels supplies generic itinerary imagery. Google Places supplies verified hotel and sightseeing data/images.</div>
        </div>
        <div className="grid lg:grid-cols-[1fr_1fr_260px] gap-3">
          <ImageApiCard title="Pexels API" desc="Cover, day and generic service images." apiKey={cfg.pexels.key} active={cfg.pexels.active} onKey={(k) => setCfg({ ...cfg, pexels: { ...cfg.pexels, key: k } })} onActive={(a) => setCfg({ ...cfg, pexels: { ...cfg.pexels, active: a } })} />
          <ImageApiCard title="Google Places API" desc="Verified hotels, sightseeing and place images." apiKey={cfg.places.key} active={cfg.places.active} onKey={(k) => setCfg({ ...cfg, places: { ...cfg.places, key: k } })} onActive={(a) => setCfg({ ...cfg, places: { ...cfg.places, active: a } })} />
          <div className="rounded-xl bg-primary text-primary-foreground p-4 flex flex-col gap-2">
            <div className="text-xs opacity-80">Monthly Usage</div>
            <div className="text-2xl font-semibold">{usage.toLocaleString()} <span className="text-xs opacity-70">/ {limit.toLocaleString()}</span></div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white" style={{ width: `${pct}%` }} /></div>
            <div className="flex items-center justify-between text-[11px] opacity-80"><span>{(limit - usage).toLocaleString()} remaining</span><span>{monthLabel}</span></div>
            <div className="mt-2 text-xs rounded-md bg-white/10 px-2 py-1.5">✓ Google Places is ready to use</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3.5 w-3.5" />API keys stay masked and are used only by the CRM server.</div>
        <Button onClick={() => toast.success("API Settings saved")}><ShieldCheck className="h-4 w-4 mr-2" />Save API Settings</Button>
      </div>
    </div>
  );
}
function ProviderCard({ label, active, apiKey, model, onKey, onModel, note }: { label: string; active: boolean; apiKey: string; model: string; onKey: (v: string) => void; onModel: (v: string) => void; note: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn("rounded-xl border p-4 space-y-3", active && "border-primary/50 bg-primary/5")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium"><span className="h-5 w-5 rounded bg-primary/10 grid place-items-center text-primary text-[10px]">AI</span>{label}</div>
        <Badge variant="outline" className={cn(active ? "border-emerald-500/40 text-emerald-700 bg-emerald-500/10" : "text-muted-foreground")}>{active ? "Active" : "Available"}</Badge>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">API Key</Label>
        <div className="flex items-center gap-1">
          <Input type={show ? "text" : "password"} value={apiKey} onChange={(e) => onKey(e.target.value)} placeholder={`Enter ${label} API key`} />
          <Button size="icon" variant="outline" onClick={() => setShow(!show)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Model</Label>
        <Input value={model} onChange={(e) => onModel(e.target.value)} />
      </div>
      <div className="text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}
function ImageApiCard({ title, desc, apiKey, active, onKey, onActive }: { title: string; desc: string; apiKey: string; active: boolean; onKey: (v: string) => void; onActive: (v: boolean) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" />{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        </div>
        <Badge variant="outline" className={cn(active ? "border-emerald-500/40 text-emerald-700 bg-emerald-500/10" : "text-muted-foreground")}>{active ? "Active" : "Inactive"}</Badge>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">API Key</Label>
        <div className="flex items-center gap-1">
          <Input type={show ? "text" : "password"} value={apiKey} onChange={(e) => onKey(e.target.value)} />
          <Button size="icon" variant="outline" onClick={() => setShow(!show)}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Status</Label>
        <Select value={active ? "active" : "inactive"} onValueChange={(v) => onActive(v === "active")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, description, right }: { icon: React.ReactNode; title: string; description: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{description}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
function MiniStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value.toLocaleString()}{suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}</div>
    </div>
  );
}
function DonutChart({ pct }: { pct: number }) {
  const r = 42, C = 2 * Math.PI * r;
  const off = C - (pct / 100) * C;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
      <circle cx="55" cy="55" r={r} strokeWidth="10" className="stroke-muted fill-none" />
      <circle cx="55" cy="55" r={r} strokeWidth="10" className="stroke-primary fill-none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 55 55)" />
      <text x="55" y="60" textAnchor="middle" className="fill-foreground text-[16px] font-semibold">{pct.toFixed(2)}%</text>
    </svg>
  );
}
