import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTasks, upsertTask, toggleTask, deleteTask } from "@/lib/ops.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Flag, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [
    { title: "Tasks & Reminders — TraWe" },
    { name: "description", content: "Assign tasks, track priorities, and never miss a follow-up." },
    { name: "robots", content: "noindex" },
  ]}),
  component: TasksPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-rose-100 text-rose-700",
};

function TasksPage() {
  const [filter, setFilter] = useState<{ status?: string; priority?: string }>({});
  const list = useServerFn(listTasks);
  const save = useServerFn(upsertTask);
  const tog = useServerFn(toggleTask);
  const del = useServerFn(deleteTask);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tasks", filter], queryFn: () => list({ data: filter }) });
  const saveM = useMutation({ mutationFn: (d: any) => save({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Saved"); setOpen(false); } });
  const togM = useMutation({ mutationFn: (v: { id: string; done: boolean }) => tog({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }) });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }) });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  function openNew() { setEdit({ title: "", priority: "medium", status: "open", checklist: [] }); setOpen(true); }

  const groups: Record<string, any[]> = { open: [], in_progress: [], completed: [], cancelled: [] };
  for (const t of data as any[]) (groups[t.status] ??= []).push(t);

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Tasks & Reminders</h1>
            <p className="text-sm text-muted-foreground">Assign work, set priorities, and get reminders.</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter.priority ?? "all"} onValueChange={(v) => setFilter({ ...filter, priority: v === "all" ? undefined : v })}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New task</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {(["open","in_progress","completed","cancelled"] as const).map(col => (
            <Card key={col}>
              <CardHeader><CardTitle className="text-sm capitalize flex items-center justify-between">{col.replace("_"," ")}<Badge variant="secondary">{groups[col].length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {groups[col].length === 0 ? <div className="text-xs text-muted-foreground py-6 text-center">Empty</div> :
                  groups[col].map(t => (
                    <div key={t.id} className="rounded-lg border p-3 group hover:shadow-sm bg-card">
                      <div className="flex items-start gap-2">
                        <Checkbox checked={t.status === "completed"} onCheckedChange={(v) => togM.mutate({ id: t.id, done: !!v })} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                          {t.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-[10px] ${PRIORITY_COLORS[t.priority]}`}><Flag className="h-2.5 w-2.5 mr-1" />{t.priority}</Badge>
                            {t.due_at && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.due_at).toLocaleString()}</span>}
                            {(t.checklist?.length ?? 0) > 0 && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><ListChecks className="h-3 w-3" />{t.checklist.length}</span>}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEdit(t); setOpen(true); }}><Edit className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => delM.mutate(t.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} task</DialogTitle></DialogHeader>
            {edit && (
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={3} value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Priority</Label>
                    <Select value={edit.priority} onValueChange={(v) => setEdit({ ...edit, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div><Label>Status</Label>
                    <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div><Label>Due</Label><Input type="datetime-local" value={edit.due_at ? String(edit.due_at).slice(0,16) : ""} onChange={(e) => setEdit({ ...edit, due_at: e.target.value })} /></div>
                <div><Label>Recurrence</Label>
                  <Select value={edit.recurrence ?? "none"} onValueChange={(v) => setEdit({ ...edit, recurrence: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label>Checklist (one item per line)</Label>
                  <Textarea rows={4} value={(edit.checklist ?? []).map((c: any) => (typeof c === "string" ? c : c.text)).join("\n")}
                    onChange={(e) => setEdit({ ...edit, checklist: e.target.value.split("\n").filter(Boolean).map(t => ({ text: t, done: false })) })} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => saveM.mutate(edit)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
