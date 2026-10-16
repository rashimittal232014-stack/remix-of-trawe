import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listActivitiesRange, upsertActivity, toggleActivity } from "@/lib/reports.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarClock, PhoneCall, StickyNote, CalendarRange } from "lucide-react";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth } from "date-fns";

export const Route = createFileRoute("/_authenticated/activities")({
  head: () => ({
    meta: [
      { title: "Activities — TraWe" },
      { name: "description", content: "Tasks, calls, events and calendar." },
      { property: "og:title", content: "Activities — TraWe" },
      { property: "og:description", content: "Manage all follow-ups from one calendar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivitiesPage,
});

const TYPE_COLORS: Record<string, string> = {
  task: "bg-blue-500",
  call: "bg-emerald-500",
  event: "bg-violet-500",
  note: "bg-amber-500",
};

function ActivitiesPage() {
  const [tab, setTab] = useState("tasks");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [open, setOpen] = useState(false);
  const fetcher = useServerFn(listActivitiesRange);
  const rangeFrom = startOfWeek(startOfMonth(month)).toISOString();
  const rangeTo = endOfWeek(endOfMonth(month)).toISOString();
  const { data = [] } = useQuery({
    queryKey: ["activities", rangeFrom, rangeTo],
    queryFn: () => fetcher({ data: { from: rangeFrom, to: rangeTo } }),
  });

  const filtered = useMemo(() => {
    if (tab === "calendar") return data;
    const map: Record<string, string> = { tasks: "task", calls: "call", events: "event" };
    return (data as any[]).filter((a) => a.type === map[tab]);
  }, [data, tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Activities</h1>
          <p className="text-sm text-muted-foreground">All tasks, calls and events with a calendar view</p>
        </div>
        <NewActivityDialog open={open} onOpenChange={setOpen} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tasks"><CalendarClock className="h-4 w-4 mr-1.5" />Tasks</TabsTrigger>
          <TabsTrigger value="calls"><PhoneCall className="h-4 w-4 mr-1.5" />Calls</TabsTrigger>
          <TabsTrigger value="events"><CalendarRange className="h-4 w-4 mr-1.5" />Events</TabsTrigger>
          <TabsTrigger value="calendar"><StickyNote className="h-4 w-4 mr-1.5" />Calendar</TabsTrigger>
        </TabsList>

        {(["tasks", "calls", "events"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <ActivityList items={filtered as any[]} />
          </TabsContent>
        ))}

        <TabsContent value="calendar" className="mt-4">
          <CalendarView month={month} setMonth={setMonth} items={data as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityList({ items }: { items: any[] }) {
  const qc = useQueryClient();
  const toggle = useServerFn(toggleActivity);
  const m = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activities"] }),
  });
  if (!items.length) return <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">No activities</div>;
  return (
    <div className="space-y-2">
      {items.map((a) => {
        const done = a.status === "completed";
        return (
          <Card key={a.id}>
            <CardContent className="p-3 flex items-start gap-3">
              <Checkbox checked={done} onCheckedChange={(v) => m.mutate({ id: a.id, done: !!v })} />
              <div className={`h-8 w-8 rounded-lg ${TYPE_COLORS[a.type] ?? "bg-muted"} text-white grid place-items-center text-[10px] uppercase`}>{a.type[0]}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{a.title}</div>
                {a.description && <div className="text-xs text-muted-foreground truncate">{a.description}</div>}
                <div className="text-[11px] text-muted-foreground mt-1 flex gap-2 items-center">
                  {a.due_at && <span>{format(new Date(a.due_at), "PPp")}</span>}
                  {a.leads?.full_name && <Badge variant="outline">{a.leads.full_name}</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CalendarView({ month, setMonth, items }: { month: Date; setMonth: (d: Date) => void; items: any[] }) {
  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  }), [month]);
  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const a of items) {
      if (!a.due_at) continue;
      const k = format(new Date(a.due_at), "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return map;
  }, [items]);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{format(month, "MMMM yyyy")}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setMonth(addMonths(month, -1))}>Prev</Button>
          <Button size="sm" variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => setMonth(addMonths(month, 1))}>Next</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden text-xs">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="bg-muted/60 py-1.5 text-center font-medium">{d}</div>
          ))}
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const cell = byDay.get(key) ?? [];
            const dim = !isSameMonth(d, month);
            const today = isSameDay(d, new Date());
            return (
              <div key={key} className={`bg-card min-h-[92px] p-1.5 ${dim ? "opacity-40" : ""}`}>
                <div className={`text-[10px] font-semibold mb-1 ${today ? "text-primary" : ""}`}>{format(d, "d")}</div>
                <div className="space-y-0.5">
                  {cell.slice(0, 3).map((a) => (
                    <div key={a.id} className={`truncate text-[10px] px-1.5 py-0.5 rounded text-white ${TYPE_COLORS[a.type] ?? "bg-muted-foreground"}`}>{a.title}</div>
                  ))}
                  {cell.length > 3 && <div className="text-[10px] text-muted-foreground">+{cell.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function NewActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const qc = useQueryClient();
  const save = useServerFn(upsertActivity);
  const [form, setForm] = useState({ type: "task", title: "", description: "", due_at: "" });
  const m = useMutation({
    mutationFn: () => save({ data: { ...form, due_at: form.due_at ? new Date(form.due_at).toISOString() : null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      onOpenChange(false);
      setForm({ type: "task", title: "", description: "", due_at: "" });
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />New Activity</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Activity</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
        </div>
        <DialogFooter>
          <Button disabled={!form.title || m.isPending} onClick={() => m.mutate()}>{m.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}