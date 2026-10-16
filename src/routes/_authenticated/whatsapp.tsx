import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getWhatsAppDiagnostics,
  sendWhatsAppTestMessage,
  listWaConversations,
  listWaMessages,
} from "@/lib/org.functions";
import { getTraweWhatsAppStatus } from "@/lib/trawe-whatsapp.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Send, Settings as SettingsIcon, RefreshCw, PlugZap,
  Search, Paperclip, Plus, MoreVertical, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** WhatsApp-style delivery ticks driven by provider receipts. */
function tick(status?: string | null) {
  if (status === "read") return "✓✓";
  if (status === "delivered") return "✓✓";
  if (status === "failed") return "!";
  if (status === "sent") return "✓";
  return "";
}

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Inbox — TraWe" },
      { name: "description", content: "Live WhatsApp chat with your leads and customers." },
    ],
  }),
  component: WhatsAppPage,
});

type Convo = {
  peer_phone: string;
  last_body: string | null;
  last_at: string;
  last_direction: string;
  name: string | null;
  company: string | null;
};
type Msg = { id: string; direction: "in" | "out"; body: string | null; status: string | null; created_at: string };

function initials(s: string) {
  const parts = s.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase() || "?";
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
}

function WhatsAppPage() {
  const qc = useQueryClient();
  const diag = useQuery({ queryKey: ["wa-diag"], queryFn: () => getWhatsAppDiagnostics(), refetchInterval: 20000 });
  // TraWe WhatsApp health, so the badge reflects whichever engine the workspace uses.
  const trawe = useQuery({ queryKey: ["trawe-wa-status"], queryFn: () => getTraweWhatsAppStatus(), refetchInterval: 20000 });
  const convosQ = useQuery({
    queryKey: ["wa-convos"],
    queryFn: () => listWaConversations() as Promise<Convo[]>,
    refetchInterval: 15000,
  });

  const [activePeer, setActivePeer] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "unread" | "clients" | "companies">("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [newPeer, setNewPeer] = useState("");
  const [showNew, setShowNew] = useState(false);

  const convos = convosQ.data ?? [];
  useEffect(() => {
    // Auto-select first convo only on desktop so mobile shows the contact list first.
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches && !activePeer && convos.length) {
      setActivePeer(convos[0].peer_phone);
    }
  }, [convos, activePeer]);

  const filtered = useMemo(() => {
    let list = convos;
    if (tab === "clients") list = list.filter((c) => !!c.name);
    if (tab === "companies") list = list.filter((c) => !!c.company);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        c.peer_phone.toLowerCase().includes(q));
    }
    return list;
  }, [convos, tab, search]);

  const msgsQ = useQuery({
    queryKey: ["wa-msgs", activePeer],
    queryFn: () => listWaMessages({ data: { peer: activePeer! } } as any) as Promise<Msg[]>,
    enabled: !!activePeer,
    refetchInterval: 10000,
  });

  const sendFn = useServerFn(sendWhatsAppTestMessage);
  const sendMut = useMutation({
    mutationFn: sendFn,
    onSuccess: (r: any) => {
      if (r.ok) {
        setDraft("");
        qc.invalidateQueries({ queryKey: ["wa-msgs", activePeer] });
        qc.invalidateQueries({ queryKey: ["wa-convos"] });
      } else toast.error(r.message ?? "Failed to send");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeConvo = convos.find((c) => c.peer_phone === activePeer);
  const d: any = diag.data;
  const t: any = trawe.data;
  const usingTrawe = t?.engine === "trawe";
  const connected = usingTrawe ? t?.status === "connected" : !!d?.connected;
  const engineLabel = usingTrawe ? "TraWe WhatsApp" : "WasenderAPI";

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgsQ.data, activePeer]);

  function send() {
    if (!activePeer || !draft.trim()) return;
    sendMut.mutate({ data: { to: activePeer, message: draft.trim() } } as any);
  }

  function startNew() {
    const p = newPeer.replace(/[^\d+]/g, "");
    if (p.length < 8) { toast.error("Enter a valid phone with country code"); return; }
    setActivePeer(p);
    setNewPeer("");
    setShowNew(false);
  }

  // group messages by day
  const grouped = useMemo(() => {
    const out: Array<{ day: string; items: Msg[] }> = [];
    for (const m of (msgsQ.data ?? [])) {
      const day = fmtDay(m.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [msgsQ.data]);

  return (
    <div className="p-4 md:p-6">
      <div className={cn(
        "flex items-center justify-between gap-3 mb-4 flex-wrap",
        activePeer && "hidden md:flex",
      )}>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-emerald-100 grid place-items-center">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">WhatsApp</div>
            <div className="text-xs text-muted-foreground">Live chat with your leads and customers</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("gap-1", connected ? "border-emerald-500/40 text-emerald-600" : "border-rose-500/40 text-rose-600")}>
            <PlugZap className="h-3 w-3" />
            {connected ? `Connected · ${engineLabel}` : `Disconnected · ${engineLabel}`}
            {usingTrawe && connected && t?.phone ? ` (${t.phone})` : ""}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => { qc.invalidateQueries({ queryKey: ["wa-convos"] }); qc.invalidateQueries({ queryKey: ["wa-msgs", activePeer] }); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings"><SettingsIcon className="h-4 w-4 mr-2" /> Configure</Link>
          </Button>
        </div>
      </div>

      <div className={cn(
        "rounded-xl border bg-card overflow-hidden md:grid md:grid-cols-[340px_1fr]",
        activePeer ? "h-[calc(100vh-120px)] md:h-[calc(100vh-160px)]" : "h-[calc(100vh-220px)] md:h-[calc(100vh-160px)]",
      )}>
        {/* Sidebar */}
        <aside className={cn(
          "border-r flex-col min-h-0 h-full",
          activePeer ? "hidden md:flex" : "flex",
        )}>
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold">WhatsApp</span>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowNew((v) => !v)} title="New chat">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showNew && (
              <div className="flex gap-1">
                <Input value={newPeer} onChange={(e) => setNewPeer(e.target.value)} placeholder="+91 98765 43210" className="h-8 text-sm" />
                <Button size="sm" className="h-8" onClick={startNew}>Start</Button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients, companies, or numbers" className="pl-8 h-9 text-sm" />
            </div>
            <div className="flex gap-1 text-xs">
              {(["all", "unread", "clients", "companies"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "px-3 py-1 rounded-full capitalize transition-colors",
                    tab === k ? "bg-emerald-100 text-emerald-700 font-medium" : "text-muted-foreground hover:bg-muted",
                  )}
                >{k}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : filtered.map((c) => {
              const title = c.name ?? c.peer_phone;
              const active = c.peer_phone === activePeer;
              return (
                <button
                  key={c.peer_phone}
                  onClick={() => setActivePeer(c.peer_phone)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 p-3 border-b hover:bg-muted/50 transition-colors",
                    active && "bg-emerald-50/60",
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center text-xs font-semibold text-emerald-800 shrink-0">
                    {initials(title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm truncate">{title}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">{fmtTime(c.last_at)}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{c.peer_phone}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.last_direction === "out" ? "✓ " : ""}{c.last_body ?? "—"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat */}
        <section className={cn(
          "flex-col min-h-0 h-full",
          activePeer ? "flex" : "hidden md:flex",
        )}>
          {!activePeer ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-8 text-center">
              <div>
                <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <div>Select a conversation to start chatting</div>
                <div className="text-xs mt-1">Or click + to start a new chat with any phone number.</div>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between px-3 py-3 border-b">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:hidden shrink-0"
                    onClick={() => setActivePeer(null)}
                    aria-label="Back to chats"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center text-xs font-semibold text-emerald-800 shrink-0">
                    {initials(activeConvo?.name ?? activePeer)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{activeConvo?.name ?? activePeer}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{activePeer}{activeConvo?.company ? ` · ${activeConvo.company}` : ""}</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
              </header>

              <div ref={scroller} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4 bg-[repeating-linear-gradient(45deg,theme(colors.emerald.50/30)_0_10px,transparent_10px_20px)]">
                {grouped.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-10">No messages yet — say hello 👋</div>
                )}
                {grouped.map((g) => (
                  <div key={g.day} className="space-y-1.5">
                    <div className="flex justify-center"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border text-muted-foreground">{g.day}</span></div>
                    {g.items.map((m) => (
                      <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          m.direction === "out"
                            ? "bg-emerald-100/90 text-emerald-950 rounded-br-md"
                            : "bg-white border rounded-bl-md",
                        )}>
                          <div className="whitespace-pre-wrap break-words">{m.body}</div>
                          <div className="text-[10px] text-muted-foreground text-right mt-0.5">{fmtTime(m.created_at)}{m.direction === "out" ? ` ${tick(m.status)}` : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-t p-3 flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled title="Attach (coming soon)">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  className="flex-1 resize-none rounded-full border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 max-h-40"
                />
                <Button
                  className="h-9 w-9 rounded-full p-0 bg-emerald-600 hover:bg-emerald-700"
                  disabled={sendMut.isPending || !draft.trim()}
                  onClick={send}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}