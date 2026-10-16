import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listAttendance, punchIn, punchOut, upsertAttendance, listLeaves, upsertLeave, reviewLeave, listMembers } from "@/lib/hr.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LogIn, LogOut, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [
    { title: "Attendance & Leaves — TraWe" },
    { name: "description", content: "Daily attendance, punch in/out, and leave management." },
    { name: "robots", content: "noindex" },
  ]}),
  component: AttendancePage,
});

function AttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const attList = useServerFn(listAttendance);
  const pIn = useServerFn(punchIn);
  const pOut = useServerFn(punchOut);
  const upsert = useServerFn(upsertAttendance);
  const leavesFn = useServerFn(listLeaves);
  const saveLeave = useServerFn(upsertLeave);
  const review = useServerFn(reviewLeave);
  const membersFn = useServerFn(listMembers);
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({ queryKey: ["attendance", month], queryFn: () => attList({ data: { month } }) });
  const { data: leaves = [] } = useQuery({ queryKey: ["leaves"], queryFn: () => leavesFn() });
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => membersFn() });

  const inM = useMutation({ mutationFn: () => pIn(), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Punched in"); } });
  const outM = useMutation({ mutationFn: () => pOut(), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Punched out"); }, onError: (e: any) => toast.error(e.message) });
  const editM = useMutation({ mutationFn: (d: any) => upsert({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast.success("Saved"); setOpen(false); } });
  const leaveM = useMutation({ mutationFn: (d: any) => saveLeave({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves"] }); toast.success("Requested"); setLeaveOpen(false); } });
  const revM = useMutation({ mutationFn: (v: any) => review({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves"] }) });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leave, setLeave] = useState<any>({ leave_type: "casual", from_date: "", to_date: "", reason: "" });

  const nameOf = (id: string) => (members as any[]).find(m => m.id === id)?.display_name || (members as any[]).find(m => m.id === id)?.email || id.slice(0, 6);

  const grid = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const byUserDay: Record<string, Record<string, any>> = {};
    for (const r of rows as any[]) {
      byUserDay[r.user_id] ??= {};
      byUserDay[r.user_id][r.date] = r;
    }
    const users = Array.from(new Set([...(members as any[]).map(m => m.id), ...Object.keys(byUserDay)]));
    return { days, users, byUserDay, y, m };
  }, [rows, members, month]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Attendance & Leaves</h1>
          <p className="text-sm text-muted-foreground">Punch in/out, view the monthly grid, and manage leave requests.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => inM.mutate()}><LogIn className="h-4 w-4 mr-2" />Punch in</Button>
          <Button variant="outline" onClick={() => outM.mutate()}><LogOut className="h-4 w-4 mr-2" />Punch out</Button>
          <Button onClick={() => setLeaveOpen(true)}><Plus className="h-4 w-4 mr-2" />Request leave</Button>
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Monthly grid</TabsTrigger>
          <TabsTrigger value="leaves">Leave requests</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          </div>
          <Card>
            <CardContent className="p-2 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-card text-left p-2 min-w-[160px]">User</th>
                    {Array.from({ length: grid.days }, (_, i) => i + 1).map(d => (
                      <th key={d} className="p-1 text-center min-w-[28px] text-muted-foreground">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.users.map(uid => (
                    <tr key={uid} className="border-t">
                      <td className="sticky left-0 bg-card p-2 font-medium">{nameOf(uid)}</td>
                      {Array.from({ length: grid.days }, (_, i) => i + 1).map(d => {
                        const date = `${grid.y}-${String(grid.m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                        const r = grid.byUserDay[uid]?.[date];
                        const color = !r ? "bg-muted/30" : r.status === "present" ? "bg-emerald-500/20 text-emerald-700" : r.status === "leave" ? "bg-amber-500/20 text-amber-700" : r.status === "absent" ? "bg-rose-500/20 text-rose-700" : "bg-slate-500/20";
                        return (
                          <td key={d} className="p-0.5 text-center">
                            <button
                              className={`w-6 h-6 rounded text-[10px] ${color} hover:ring-1 ring-primary`}
                              onClick={() => { setEdit(r ?? { user_id: uid, date, status: "present" }); setOpen(true); }}
                              title={r ? `${r.status}${r.hours ? ` · ${r.hours}h` : ""}` : "Click to add"}
                            >
                              {r ? (r.status === "present" ? "P" : r.status === "leave" ? "L" : r.status === "absent" ? "A" : "•") : ""}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {grid.users.length === 0 && (
                    <tr><td colSpan={grid.days + 1} className="text-center text-muted-foreground py-10">No members yet.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card>
            <CardHeader><CardTitle className="text-base">Leave requests</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(leaves as any[]).length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">No leave requests.</div> :
                (leaves as any[]).map(l => (
                  <div key={l.id} className="flex items-center gap-3 border rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{nameOf(l.user_id)} · <span className="capitalize">{l.leave_type}</span></div>
                      <div className="text-xs text-muted-foreground">{l.from_date} → {l.to_date} · {l.reason || "No reason"}</div>
                    </div>
                    <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"}>{l.status}</Badge>
                    {l.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => revM.mutate({ id: l.id, status: "approved" })}><Check className="h-4 w-4 text-emerald-600" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => revM.mutate({ id: l.id, status: "rejected" })}><X className="h-4 w-4 text-rose-600" /></Button>
                      </div>
                    )}
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Attendance</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Date</Label><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="half_day">Half day</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Punch in</Label><Input type="datetime-local" value={edit.punch_in ? String(edit.punch_in).slice(0,16) : ""} onChange={(e) => setEdit({ ...edit, punch_in: e.target.value })} /></div>
                <div><Label>Punch out</Label><Input type="datetime-local" value={edit.punch_out ? String(edit.punch_out).slice(0,16) : ""} onChange={(e) => setEdit({ ...edit, punch_out: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => editM.mutate(edit)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Type</Label>
              <Select value={leave.leave_type} onValueChange={(v) => setLeave({ ...leave, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>From</Label><Input type="date" value={leave.from_date} onChange={(e) => setLeave({ ...leave, from_date: e.target.value })} /></div>
              <div><Label>To</Label><Input type="date" value={leave.to_date} onChange={(e) => setLeave({ ...leave, to_date: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea rows={3} value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
            <Button onClick={() => leaveM.mutate(leave)}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}