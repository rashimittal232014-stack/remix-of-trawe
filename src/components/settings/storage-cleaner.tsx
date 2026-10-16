import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { scanStorage, moveToTrash, restoreFromTrash, emptyTrash } from "@/lib/storage-cleaner.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  FolderOpen, Clock, Shield, Database, RefreshCw, Eye, Trash2, ArchiveRestore,
  CheckCircle2, CloudUpload,
} from "lucide-react";
import { toast } from "sonner";

function bytesHuman(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const AGE_OPTIONS = [
  { label: "Temp older than 6 hours", value: 6 },
  { label: "Temp older than 24 hours", value: 24 },
  { label: "Temp older than 3 days", value: 72 },
  { label: "Temp older than 7 days", value: 168 },
  { label: "Temp older than 30 days", value: 720 },
];

type Item = { bucket: string; path: string; size: number };

export function StorageCleaner() {
  const qc = useQueryClient();
  const scan = useServerFn(scanStorage);
  const move = useServerFn(moveToTrash);
  const restore = useServerFn(restoreFromTrash);
  const purge = useServerFn(emptyTrash);

  const [age, setAge] = useState(24);
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const q = useQuery({
    queryKey: ["storage-scan", age],
    queryFn: () => scan({ data: { ageHours: age } }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const data = q.data;

  const key = (i: Item) => `${i.bucket}/${i.path}`;
  const toggle = (i: Item) => setSelected((s) => ({ ...s, [key(i)]: !s[key(i)] }));
  const toggleAll = (items: Item[]) => {
    const allSelected = items.every((i) => selected[key(i)]);
    const next = { ...selected };
    for (const i of items) next[key(i)] = !allSelected;
    setSelected(next);
  };
  const chosen = (items: Item[]) => items.filter((i) => selected[key(i)]).map((i) => ({ bucket: i.bucket, path: i.path }));

  const moveMut = useMutation({
    mutationFn: (items: { bucket: string; path: string }[]) => move({ data: { items: items as any } }),
    onSuccess: (r) => {
      toast.success(`Moved ${r.moved} file(s) to trash`);
      if (r.errors?.length) toast.error(r.errors.slice(0, 2).join("\n"));
      setSelected({});
      qc.invalidateQueries({ queryKey: ["storage-scan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const restoreMut = useMutation({
    mutationFn: (items: { bucket: string; path: string }[]) => restore({ data: { items: items as any } }),
    onSuccess: (r) => {
      toast.success(`Restored ${r.restored} file(s)`);
      setSelected({});
      qc.invalidateQueries({ queryKey: ["storage-scan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const purgeMut = useMutation({
    mutationFn: () => purge(),
    onSuccess: (r) => {
      toast.success(`Emptied trash — ${r.removed} file(s) permanently deleted`);
      qc.invalidateQueries({ queryKey: ["storage-scan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ready = !q.isFetching && !!data;
  const percent = useMemo(() => {
    if (!data || !data.totalBytes) return 0;
    return Math.min(100, Math.round((data.potentialBytes / data.totalBytes) * 100));
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Storage Cleaner</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze uploads, detect unused media, clean temporary files, and safely recover storage space.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" /> Enabled
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <InfoTile icon={FolderOpen} title="Uploads Folder Analysis" text="Deep scan uploads directory and all sub-folders without touching CRM source files." />
        <InfoTile icon={Clock} title="Temp / Import Cleanup" text="Clean old generated PDFs, import CSVs, exports and cache files with age filter." />
        <InfoTile icon={Shield} title="Safe Trash First" text="Cleanup moves files to Storage Cleaner Trash first. Permanent delete is separate." />
      </div>

      <Card className="tile-hairline">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div className="font-semibold">Smart Storage Cleaner</div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(age)} onValueChange={(v) => setAge(Number(v))}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => q.refetch()} disabled={q.isFetching} variant="outline" className="gap-2">
                <RefreshCw className={"h-4 w-4 " + (q.isFetching ? "animate-spin" : "")} /> Scan
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="unused">Unused Media {data ? `(${data.unusedCount})` : ""}</TabsTrigger>
              <TabsTrigger value="temp">Temporary Files {data ? `(${data.tempCount})` : ""}</TabsTrigger>
              <TabsTrigger value="trash">Safe Trash {data ? `(${data.trashCount})` : ""}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid md:grid-cols-[220px_1fr_260px] gap-4">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/40 p-6">
                  <div className="text-4xl font-serif text-primary">{percent}%</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {q.isFetching ? "Scanning" : "Ready"}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="font-semibold text-sm">
                      {ready ? "Scan complete — review below." : "Ready to scan uploads and database references."}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-primary">
                      <span>{data?.totalFiles ?? 0} images scanned</span>
                      <span>{data?.unusedCount ?? 0} unused media</span>
                      <span>{data?.tempCount ?? 0} old temp</span>
                      <span>{bytesHuman(data?.potentialBytes ?? 0)} recoverable</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="font-semibold text-sm">Bucket-wise Summary</div>
                      <Badge variant="secondary" className="text-[10px]">All uploads</Badge>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Bucket</th>
                          <th className="text-right px-3 py-2 font-medium">Total</th>
                          <th className="text-right px-3 py-2 font-medium">Images</th>
                          <th className="text-right px-3 py-2 font-medium">Unused</th>
                          <th className="text-right px-3 py-2 font-medium">Recoverable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!data && (
                          <tr><td colSpan={5} className="px-3 py-4 text-muted-foreground">Click Scan to analyze files.</td></tr>
                        )}
                        {data?.byBucket.map((b) => (
                          <tr key={b.bucket} className="border-t">
                            <td className="px-3 py-2 font-medium">{b.bucket}</td>
                            <td className="px-3 py-2 text-right">{b.total}</td>
                            <td className="px-3 py-2 text-right">{b.images}</td>
                            <td className="px-3 py-2 text-right">{b.unused}</td>
                            <td className="px-3 py-2 text-right">{bytesHuman(b.unusedBytes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <MiniStat label="Total Files" value={data?.totalFiles ?? 0} />
                    <MiniStat label="Unused Media" value={data?.unusedCount ?? 0} />
                    <MiniStat label="Old Temp Files" value={data?.tempCount ?? 0} />
                    <MiniStat label="Files in Trash" value={data?.trashCount ?? 0} />
                  </div>
                </div>

                <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex flex-col items-center justify-center text-center">
                  <CloudUpload className="h-10 w-10 opacity-80" />
                  <div className="mt-3 font-semibold">Potential Space Recovery</div>
                  <div className="text-4xl font-serif mt-2">{bytesHuman(data?.potentialBytes ?? 0)}</div>
                  <div className="text-xs opacity-80 mt-2">Unused media + old temporary files</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="unused" className="mt-4">
              <FileTable
                items={data?.unusedItems ?? []}
                selected={selected}
                onToggle={toggle}
                onToggleAll={() => data && toggleAll(data.unusedItems)}
                emptyText="Run a scan — no unused media detected yet."
              />
            </TabsContent>
            <TabsContent value="temp" className="mt-4">
              <FileTable
                items={data?.tempItems ?? []}
                selected={selected}
                onToggle={toggle}
                onToggleAll={() => data && toggleAll(data.tempItems)}
                emptyText="No old temp files found."
              />
            </TabsContent>
            <TabsContent value="trash" className="mt-4">
              <FileTable
                items={data?.trashItems ?? []}
                selected={selected}
                onToggle={toggle}
                onToggleAll={() => data && toggleAll(data.trashItems)}
                emptyText="Trash is empty."
                showRestore
                onRestore={() => data && restoreMut.mutate(chosen(data.trashItems))}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between gap-3 pt-4 border-t flex-wrap">
            <div className="text-xs text-muted-foreground">
              Clean action moves files to safe trash first. It does not delete CRM code or files outside uploads.
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" className="gap-2" onClick={() => q.refetch()} disabled={q.isFetching}>
                <RefreshCw className={"h-4 w-4 " + (q.isFetching ? "animate-spin" : "")} /> Scan Now
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setTab("unused")}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button
                className="gap-2"
                onClick={() => data && moveMut.mutate(chosen(data.unusedItems))}
                disabled={!data || moveMut.isPending}
              >
                <Trash2 className="h-4 w-4" /> Move Unused Media
              </Button>
              <Button
                className="gap-2"
                onClick={() => data && moveMut.mutate(chosen(data.tempItems))}
                disabled={!data || moveMut.isPending}
              >
                <Trash2 className="h-4 w-4" /> Move Old Temp
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => {
                  if (confirm("Permanently delete all files in Safe Trash? This cannot be undone.")) purgeMut.mutate();
                }}
                disabled={purgeMut.isPending}
              >
                <ArchiveRestore className="h-4 w-4" /> Empty Trash
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoTile({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{text}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-center">
      <div className="text-2xl font-serif">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function FileTable({
  items, selected, onToggle, onToggleAll, emptyText, showRestore, onRestore,
}: {
  items: Item[];
  selected: Record<string, boolean>;
  onToggle: (i: Item) => void;
  onToggleAll: () => void;
  emptyText: string;
  showRestore?: boolean;
  onRestore?: () => void;
}) {
  if (!items.length) {
    return <div className="text-sm text-muted-foreground py-8 text-center">{emptyText}</div>;
  }
  const allSelected = items.every((i) => selected[`${i.bucket}/${i.path}`]);
  return (
    <div className="space-y-3">
      {showRestore && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onRestore} className="gap-2">
            <ArchiveRestore className="h-3.5 w-3.5" /> Restore selected
          </Button>
        </div>
      )}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2"><Checkbox checked={allSelected} onCheckedChange={onToggleAll} /></th>
              <th className="text-left px-3 py-2 font-medium">Bucket</th>
              <th className="text-left px-3 py-2 font-medium">Path</th>
              <th className="text-right px-3 py-2 font-medium">Size</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const k = `${i.bucket}/${i.path}`;
              return (
                <tr key={k} className="border-t hover:bg-accent/30">
                  <td className="px-3 py-2"><Checkbox checked={!!selected[k]} onCheckedChange={() => onToggle(i)} /></td>
                  <td className="px-3 py-2 font-medium">{i.bucket}</td>
                  <td className="px-3 py-2 truncate max-w-[420px]" title={i.path}>{i.path}</td>
                  <td className="px-3 py-2 text-right">{bytesHuman(i.size)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}