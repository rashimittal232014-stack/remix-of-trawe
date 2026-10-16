import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTargets, upsertTarget, deleteTarget, leaderboard, listMembers } from "@/lib/hr.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Trophy, Plus, Edit, Trash2, Target } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/targets")({
  head: () => ({ meta: [
    { title: "Sales Targets — TraWe" },
    { name: "description", content: "Set monthly sales targets and track achievement." },
    { name: "robots", content: "noindex" },
  ]}),
  component: TargetsPage,
});

function TargetsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const tList = useServerFn(listTargets);
  const save = useServerFn(upsertTarget);
  const del = useServerFn(deleteTarget);
  const lb = useServerFn(leaderboard);
  const membersFn = useServerFn(listMembers);
  const qc = useQueryClient();

  const { data: targets = [] } = useQuery({ queryKey: ["targets", month], queryFn: () => tList({ data: { month } }) });
  const { data: board = [] } = useQuery({ queryKey: ["leaderboard", month], queryFn: () => lb({ data: { month } }) });
  const { data: members = [] } = useQuery({ queryKey: ["members"], queryFn: () => membersFn() });

  const saveM = useMutation({ mutationFn: (d: any) => save({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); qc.invalidateQueries({ queryKey: ["leaderboard"] }); toast.success("Saved"); setOpen(false); } });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["targets"] }) });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  function openNew() {
    setEdit({ user_id: (members as any[])[0]?.id, period_month: `${month}-01`, target_amount: 500000, target_leads: 30, target_bookings: 10, currency: "INR" });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Sales Targets</h1>
          <p className="text-sm text-muted-foreground">Set per-agent monthly targets and watch the leaderboard.</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New target</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />Leaderboard · {month}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(board as any[]).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No data for this month yet.</div> :
            (board as any[]).map((r, i) => {
              const pct = r.target_amount > 0 ? Math.min(100, Math.round((r.revenue / r.target_amount) * 100)) : 0;
              return (
                <div key={r.user_id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted"}`}>{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(r.revenue)} / {formatCurrency(r.target_amount)} · {r.bookings} bookings · {r.leads} leads</div>
                    </div>
                    <div className="text-sm font-semibold">{pct}%</div>
                  </div>
                  <Progress value={pct} className="h-2 mt-2" />
                </div>
              );
            })
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Configured targets</CardTitle></CardHeader>
        <CardContent>
          {(targets as any[]).length === 0 ? <div className="text-sm text-muted-foreground py-6 text-center">No targets set for this month.</div> :
            <div className="divide-y">
              {(targets as any[]).map(t => {
                const m = (members as any[]).find(x => x.id === t.user_id);
                return (
                  <div key={t.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m?.display_name || m?.email || t.user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(Number(t.target_amount))} · {t.target_leads} leads · {t.target_bookings} bookings</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(t); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => delM.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "New"} target</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>User</Label>
                <Select value={edit.user_id} onValueChange={(v) => setEdit({ ...edit, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {(members as any[]).map(m => <SelectItem key={m.id} value={m.id}>{m.display_name || m.email}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label>Month</Label><Input type="month" value={String(edit.period_month).slice(0,7)} onChange={(e) => setEdit({ ...edit, period_month: e.target.value + "-01" })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Revenue</Label><Input type="number" value={edit.target_amount} onChange={(e) => setEdit({ ...edit, target_amount: Number(e.target.value) })} /></div>
                <div><Label>Leads</Label><Input type="number" value={edit.target_leads} onChange={(e) => setEdit({ ...edit, target_leads: Number(e.target.value) })} /></div>
                <div><Label>Bookings</Label><Input type="number" value={edit.target_bookings} onChange={(e) => setEdit({ ...edit, target_bookings: Number(e.target.value) })} /></div>
              </div>
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