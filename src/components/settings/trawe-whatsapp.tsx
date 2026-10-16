import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTraweWhatsAppStatus, startTraweWhatsApp, logoutTraweWhatsApp,
  removeTraweWhatsApp, updateTraweWhatsAppLimits,
} from "@/lib/trawe-whatsapp.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrCode, RefreshCw, LogOut, Trash2, ShieldCheck, AlertTriangle, Smartphone, Clock, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; tone: string }> = {
  connected: { label: "Connected", tone: "border-emerald-500/40 text-emerald-600" },
  qr_pending: { label: "Waiting for QR scan", tone: "border-amber-500/40 text-amber-600" },
  connecting: { label: "Connecting…", tone: "border-amber-500/40 text-amber-600" },
  disconnected: { label: "Not connected", tone: "border-muted-foreground/30 text-muted-foreground" },
  logged_out: { label: "Signed out", tone: "border-muted-foreground/30 text-muted-foreground" },
  error: { label: "Problem", tone: "border-rose-500/40 text-rose-600" },
};

export function TraweWhatsAppPanel() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["trawe-wa-status"],
    queryFn: () => getTraweWhatsAppStatus(),
    refetchInterval: (q) => {
      const st = (q.state.data as any)?.status;
      return st === "qr_pending" || st === "connecting" ? 2500 : 8000;
    },
  });
  const s: any = status.data ?? {};
  const meta = STATUS_META[s.status as string] ?? STATUS_META.disconnected;

  const [limits, setLimits] = useState<{ dailyCap: number; hourlyCap: number; quietStart: number; quietEnd: number } | null>(null);
  const L = limits ?? s.limits ?? { dailyCap: 250, hourlyCap: 40, quietStart: 22, quietEnd: 8 };
  const setL = (k: string, v: number) => setLimits({ ...L, [k]: v });

  const refresh = () => qc.invalidateQueries({ queryKey: ["trawe-wa-status"] });

  const startMut = useMutation({
    mutationFn: useServerFn(startTraweWhatsApp),
    onSuccess: (r: any) => {
      if (r.ok) toast.success("Scan the QR code with WhatsApp on your phone");
      else toast.error(r.message ?? "Could not start the connection");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });
  const logoutMut = useMutation({
    mutationFn: useServerFn(logoutTraweWhatsApp),
    onSuccess: () => { toast.success("Signed out of WhatsApp"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeMut = useMutation({
    mutationFn: useServerFn(removeTraweWhatsApp),
    onSuccess: () => { toast.success("Connection removed"); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });
  const limitsMut = useMutation({
    mutationFn: useServerFn(updateTraweWhatsAppLimits),
    onSuccess: () => { toast.success("Safety limits saved"); setLimits(null); refresh(); },
    onError: (e: any) => toast.error(e.message),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.trawe.in";
  const connected = s.status === "connected";

  // Live QR countdown: WhatsApp rotates the code roughly every minute.
  const QR_LIFE = 60;
  const [left, setLeft] = useState(QR_LIFE);
  const lastQr = useRef<string | null>(null);
  useEffect(() => {
    if (s.qr && s.qr !== lastQr.current) { lastQr.current = s.qr; setLeft(QR_LIFE); }
    if (!s.qr) lastQr.current = null;
  }, [s.qr]);
  useEffect(() => {
    if (!s.qr) return;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [s.qr]);
  // Refresh the code automatically the moment it expires, so scanning never fails silently.
  useEffect(() => {
    if (s.qr && left === 0 && !startMut.isPending) startMut.mutate({ data: { origin } } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, s.qr]);

  const since = useMemo(() => {
    if (!s.lastSeenAt) return null;
    const mins = Math.round((Date.now() - new Date(s.lastSeenAt).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    return hrs < 24 ? `${hrs} hr ago` : new Date(s.lastSeenAt).toLocaleString();
  }, [s.lastSeenAt]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" /> TraWe WhatsApp
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Connect your own WhatsApp number by scanning a QR code — no monthly provider fee. Best for one-to-one
            conversations with travellers. Not for bulk marketing or OTP.
          </p>
        </div>
        <Badge variant="outline" className={cn("text-[11px]", meta.tone)}>{meta.label}</Badge>
      </div>

      {s.serviceConfigured === false && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>The TraWe WhatsApp service isn't switched on for this workspace yet. Contact TraWe support to activate it, then come back and scan your QR code.</span>
        </div>
      )}

      <Separator className="my-5" />

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <div className="rounded-xl border border-border/60 bg-background p-3 flex items-center justify-center min-h-[220px]">
          {s.qr ? (
            <div className="text-center">
              <img src={s.qr} alt="WhatsApp QR code" className="w-[190px] h-[190px]" />
              <Progress value={(left / QR_LIFE) * 100} className="h-1 mt-3" />
              <div className="mt-1.5 text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {left > 0 ? `Code expires in ${left}s` : "Refreshing code…"}
              </div>
            </div>
          ) : connected ? (
            <div className="text-center">
              <ShieldCheck className="h-8 w-8 mx-auto text-emerald-600" />
              <div className="mt-2 text-sm font-medium">{s.phone || "Number connected"}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{since ? `Active ${since}` : "Active"}</div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <QrCode className="h-8 w-8 mx-auto opacity-60" />
              <div className="text-[11px] mt-2 px-3">Start the connection to get a QR code</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
            <li>Click <b>Start / Refresh QR</b>.</li>
            <li>On your phone open WhatsApp → Settings → Linked devices → Link a device.</li>
            <li>Scan the code. The QR expires in about a minute — refresh if it does.</li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full"
              onClick={() => startMut.mutate({ data: { origin } } as any)}
              disabled={startMut.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", startMut.isPending && "animate-spin")} />
              {connected ? "Reconnect" : "Start / Refresh QR"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={logoutMut.isPending}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign this number out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    TraWe will stop sending and receiving WhatsApp messages on {s.phone || "this number"}. You can
                    reconnect any time by scanning a new QR code.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep connected</AlertDialogCancel>
                  <AlertDialogAction onClick={() => logoutMut.mutate({} as any)}>Sign out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-rose-600" disabled={removeMut.isPending}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this connection?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The saved connection is deleted permanently, and the warm-up progress for this number starts over
                    when you connect again. Past chats stay in your inbox.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => removeMut.mutate({} as any)}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Number</div>
              <div className="text-sm font-medium truncate">{s.phone || "—"}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Connected since</div>
              <div className="text-sm font-medium truncate">
                {s.connectedAt ? new Date(s.connectedAt).toLocaleDateString() : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Last activity
              </div>
              <div className="text-sm font-medium truncate">{since ?? "—"}</div>
            </div>
          </div>

          {s.lastError && (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-2.5 text-[11px] text-rose-700 dark:text-rose-300 break-words">
              {s.lastError}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-5" />

      <div>
        <div className="text-sm font-medium">Number safety limits</div>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
          TraWe paces messages, pauses at night and refuses mass identical sends so your number behaves like a normal
          person's phone. A freshly connected number automatically starts slow and ramps up over three weeks.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Warm-up</div>
            <div className="mt-1 text-sm font-medium">Day {s.warmup?.day ?? 21} of 21</div>
            <Progress value={s.warmup?.progress ?? 100} className="mt-2 h-1.5" />
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-3">
            <div className="text-[10px] uppercase text-muted-foreground">This hour</div>
            <div className="mt-1 text-sm font-medium">{s.usage?.sentHour ?? 0} / {s.effectiveLimits?.hourlyCap ?? L.hourlyCap}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Effective safe limit</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Today</div>
            <div className="mt-1 text-sm font-medium">{s.usage?.sentDay ?? 0} / {s.effectiveLimits?.dailyCap ?? L.dailyCap}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {s.warmup?.nextIncreaseDay ? `Next increase after day ${s.warmup.nextIncreaseDay}` : "Full limit active"}
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3 mt-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Messages per hour</Label>
            <Input type="number" min={3} max={200} value={L.hourlyCap} onChange={(e) => setL("hourlyCap", Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Messages per day</Label>
            <Input type="number" min={10} max={1000} value={L.dailyCap} onChange={(e) => setL("dailyCap", Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Quiet from (hour)</Label>
            <Input type="number" min={0} max={23} value={L.quietStart} onChange={(e) => setL("quietStart", Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Quiet until (hour)</Label>
            <Input type="number" min={0} max={23} value={L.quietEnd} onChange={(e) => setL("quietEnd", Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button className="rounded-full" onClick={() => limitsMut.mutate({ data: L } as any)} disabled={limitsMut.isPending || !limits}>
            Save limits
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
        Honest note: this uses a personal WhatsApp connection, not WhatsApp's official business service. It can
        disconnect, and WhatsApp can still restrict a number that people report as spam. For guaranteed delivery,
        bulk campaigns or OTP, keep using WasenderAPI or the official service.
      </div>
    </div>
  );
}
