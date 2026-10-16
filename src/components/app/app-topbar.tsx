import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Plus, Bell, Plane, Hotel, Clock, StickyNote, Settings, LogOut, User, Globe2, CalendarCheck, AlarmClock, CheckSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/lib/crm.functions";
import { globalSearch, listNotifications, markNotificationsRead, getReminders, getAttendanceToday } from "@/lib/topbar.functions";
import { runPendingAutomations } from "@/lib/sales.functions";
import { punchIn, punchOut } from "@/lib/hr.functions";
import { useServerFn } from "@tanstack/react-start";
import { searchFlightsLive, searchHotelsLive } from "@/lib/live-search.functions";
import { AirportPicker } from "@/components/app/airport-picker";
import { CountryPicker, StatePicker, CityPicker, AnyCityPicker } from "@/components/app/location-picker";
import { Sparkles, Search as SearchIcon, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function useWorkTimer() {
  const [start] = useState(() => {
    if (typeof window === "undefined") return Date.now();
    const s = sessionStorage.getItem("trawe:clockin");
    if (s) return Number(s);
    const now = Date.now();
    sessionStorage.setItem("trawe:clockin", String(now));
    return now;
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor((now - start) / 60_000);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}h ${String(mins % 60).padStart(2, "0")}m`;
}

export function AppTopbar() {
  const navigate = useNavigate();
  const timer = useWorkTimer();
  const qc = useQueryClient();
  const [flight, setFlight] = useState(false);
  const [hotel, setHotel] = useState(false);
  const [note, setNote] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [attOpen, setAttOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [cmdQ, setCmdQ] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setNotes(JSON.parse(localStorage.getItem("trawe:notes") ?? "[]")); } catch {}
  }, []);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
  const initials = (me?.profile?.display_name ?? me?.profile?.email ?? "U").slice(0, 2).toUpperCase();

  const notif = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications(), refetchInterval: 60_000 });
  // Drain queued automations (from stage-change / payment triggers) into activities.
  useQuery({
    queryKey: ["auto-drain"],
    queryFn: () => runPendingAutomations(),
    refetchInterval: 90_000,
  });
  const reminders = useQuery({ queryKey: ["reminders"], queryFn: () => getReminders(), enabled: remindOpen });
  const attToday = useQuery({ queryKey: ["att-today"], queryFn: () => getAttendanceToday(), enabled: attOpen });
  const search = useQuery({
    queryKey: ["gsearch", cmdQ],
    queryFn: () => globalSearch({ data: { q: cmdQ } }),
    enabled: cmdOpen && cmdQ.trim().length > 1,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const punchMut = useMutation({
    mutationFn: async (kind: "in" | "out") => (kind === "in" ? punchIn() : punchOut()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["att-today"] }); toast.success("Attendance updated"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const readMut = useMutation({
    mutationFn: () => markNotificationsRead({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function saveNote() {
    if (!newNote.trim()) return;
    const next = [newNote.trim(), ...notes].slice(0, 20);
    setNotes(next);
    localStorage.setItem("trawe:notes", JSON.stringify(next));
    setNewNote("");
  }

  function go(to: string) { setCmdOpen(false); navigate({ to }); }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#e8ecf1] bg-white/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 sm:px-6 h-14">
          <div className="lg:hidden flex items-center gap-2 font-semibold"><Plane className="h-5 w-5 text-primary" /> TraWe</div>
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md h-9 rounded-md border bg-background/50 px-3 text-sm text-muted-foreground hover:bg-background transition"
          >
            <Search className="h-4 w-4" />
            <span>Search leads, invoices, customers…</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setFlight(true)}><Plane className="h-4 w-4 mr-1.5" />Flight</Button>
            <Button variant="ghost" size="sm" onClick={() => setHotel(true)}><Hotel className="h-4 w-4 mr-1.5" />Hotel</Button>
            <Button variant="ghost" size="icon" title="World clock" onClick={() => setClockOpen(true)}><Globe2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Attendance" onClick={() => setAttOpen(true)}><CalendarCheck className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" title="Reminders" onClick={() => setRemindOpen(true)}><AlarmClock className="h-4 w-4" /></Button>
            <button className="hidden md:flex items-center gap-1.5 text-xs px-3 h-8 rounded-full bg-primary/10 text-primary" onClick={() => setAttOpen(true)}>
              <Clock className="h-3.5 w-3.5" /> {timer}
            </button>
            <Button variant="ghost" size="icon" onClick={() => setNote(true)}><StickyNote className="h-4 w-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" />New</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/leads">New Lead</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/quotations">New Quotation</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/invoices">New Invoice</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/activities">New Task</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/companies">New Company</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/mail">Compose Mail</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/notes">New Note</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setBellOpen(true)}>
              <Bell className="h-4 w-4" />
              {(notif.data?.unread ?? 0) > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground grid place-items-center">
                  {notif.data!.unread}
                </span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1">
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="text-sm">{me?.profile?.display_name ?? me?.profile?.email}</div>
                  <div className="text-xs text-muted-foreground font-normal">{me?.tenant?.name}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <FlightModal open={flight} onOpenChange={setFlight} />
      <HotelModal open={hotel} onOpenChange={setHotel} />
      <WorldClockModal open={clockOpen} onOpenChange={setClockOpen} />

      <Dialog open={attOpen} onOpenChange={setAttOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Today's Attendance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground">Session</div>
              <div className="text-lg font-semibold">{timer}</div>
            </div>
            {attToday.data?.record ? (
              <div className="text-sm space-y-1">
                <div>Punch in: <b>{attToday.data.record.punch_in ? new Date(attToday.data.record.punch_in).toLocaleTimeString() : "—"}</b></div>
                <div>Punch out: <b>{attToday.data.record.punch_out ? new Date(attToday.data.record.punch_out).toLocaleTimeString() : "—"}</b></div>
                <div>Hours: <b>{attToday.data.record.hours ?? "—"}</b></div>
              </div>
            ) : <div className="text-sm text-muted-foreground">Not punched in yet today.</div>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => punchMut.mutate("in")} disabled={!!attToday.data?.record?.punch_in}>Punch In</Button>
              <Button className="flex-1" variant="outline" onClick={() => punchMut.mutate("out")} disabled={!attToday.data?.record?.punch_in || !!attToday.data?.record?.punch_out}>Punch Out</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={remindOpen} onOpenChange={setRemindOpen}>
        <SheetContent className="w-[400px] sm:w-[420px]">
          <SheetHeader><SheetTitle>Reminders</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-5 overflow-y-auto max-h-[calc(100vh-6rem)] pr-1">
            <ReminderBlock title="Overdue" items={reminders.data?.overdue ?? []} tone="bg-destructive/10 text-destructive" />
            <ReminderBlock title="Today" items={reminders.data?.today ?? []} tone="bg-primary/10 text-primary" />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={bellOpen} onOpenChange={setBellOpen}>
        <SheetContent className="w-[380px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {(notif.data?.unread ?? 0) > 0 && (
                <Button size="sm" variant="ghost" onClick={() => readMut.mutate()}>Mark all read</Button>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-6rem)] pr-1">
            {(notif.data?.items ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-10">You're all caught up.</div>
            )}
            {(notif.data?.items ?? []).map((n: any) => (
              <a key={n.id} href={n.href ?? "#"} className={`block rounded-lg border p-3 text-sm hover:bg-accent/40 ${!n.read_at ? "bg-primary/5 border-primary/20" : ""}`}>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{n.kind}</Badge>
                  <span className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <div className="font-medium mt-1">{n.title}</div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
              </a>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search leads, customers, quotations, invoices, itineraries…" value={cmdQ} onValueChange={setCmdQ} />
            <CommandList className="max-h-[420px]">
              {cmdQ.length < 2 && (
                <CommandGroup heading="Quick actions">
                  <CommandItem onSelect={() => go("/leads")}>New Lead</CommandItem>
                  <CommandItem onSelect={() => go("/quotations")}>New Quotation</CommandItem>
                  <CommandItem onSelect={() => go("/invoices")}>New Invoice</CommandItem>
                  <CommandItem onSelect={() => go("/dashboard")}>Go to Dashboard</CommandItem>
                </CommandGroup>
              )}
              {cmdQ.length >= 2 && search.isLoading && <div className="p-4 text-sm text-muted-foreground">Searching…</div>}
              {cmdQ.length >= 2 && !search.isLoading && (
                <>
                  <CommandEmpty>No matches.</CommandEmpty>
                  {(search.data?.leads ?? []).length > 0 && (
                    <CommandGroup heading="Leads">
                      {search.data!.leads.map((l: any) => (
                        <CommandItem key={l.id} onSelect={() => go(`/leads/${l.id}`)}>
                          <span className="font-medium">{l.full_name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{l.code} · {l.email ?? l.phone ?? ""}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {(search.data?.customers ?? []).length > 0 && (
                    <><CommandSeparator /><CommandGroup heading="Customers">
                      {search.data!.customers.map((c: any) => (
                        <CommandItem key={c.id} onSelect={() => go(`/customers`)}>
                          <span className="font-medium">{c.full_name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{c.email ?? c.phone ?? ""}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup></>
                  )}
                  {(search.data?.quotations ?? []).length > 0 && (
                    <><CommandSeparator /><CommandGroup heading="Quotations">
                      {search.data!.quotations.map((q: any) => (
                        <CommandItem key={q.id} onSelect={() => go(`/quotations/${q.id}`)}>
                          <span className="font-medium">{q.title ?? q.code}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{q.code}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup></>
                  )}
                  {(search.data?.invoices ?? []).length > 0 && (
                    <><CommandSeparator /><CommandGroup heading="Invoices">
                      {search.data!.invoices.map((i: any) => (
                        <CommandItem key={i.id} onSelect={() => go(`/invoices/${i.id}`)}>
                          <span className="font-medium">{i.code}</span>
                          <span className="ml-2 text-xs text-muted-foreground">₹{i.total}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup></>
                  )}
                  {(search.data?.itineraries ?? []).length > 0 && (
                    <><CommandSeparator /><CommandGroup heading="Itineraries">
                      {search.data!.itineraries.map((i: any) => (
                        <CommandItem key={i.id} onSelect={() => go(`/itineraries/${i.id}`)}>
                          <span className="font-medium">{i.title ?? i.code}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{i.code}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup></>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <Dialog open={note} onOpenChange={setNote}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sticky Notes</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Quick note…" onKeyDown={(e) => e.key === "Enter" && saveNote()} />
            <Button onClick={saveNote}>Add</Button>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {notes.map((n, i) => (
              <li key={i} className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-sm">{n}</li>
            ))}
            {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReminderBlock({ title, items, tone }: { title: string; items: any[]; tone: string }) {
  return (
    <div>
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${tone}`}>
        <CheckSquare className="h-3 w-3" /> {title} · {items.length}
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.length === 0 && <li className="text-xs text-muted-foreground py-3">Nothing here.</li>}
        {items.map((a) => (
          <li key={a.id} className="p-2.5 rounded-lg border text-sm">
            <div className="font-medium">{a.title}</div>
            <div className="text-[11px] text-muted-foreground">{a.due_at ? new Date(a.due_at).toLocaleString() : "—"} · {a.type}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FlightModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [from, setFrom] = useState("DEL"); const [to, setTo] = useState("BOM");
  const [date, setDate] = useState(""); const [ret, setRet] = useState("");
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState<"ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST">("ECONOMY");
  const [directOnly, setDirectOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchFn = useServerFn(searchFlightsLive);

  const skyscanner = useMemo(() => {
    const d = date ? date.replaceAll("-", "").slice(2) : ""; const r = ret ? ret.replaceAll("-", "").slice(2) : "";
    return `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${d}${r ? "/" + r : ""}/?adults=${pax}`;
  }, [from, to, date, ret, pax]);
  const google = `https://www.google.com/travel/flights?q=Flights%20from%20${from}%20to%20${to}${date ? "%20on%20" + date : ""}`;

  const run = useMutation({
    mutationFn: async () => {
      setError(null);
      const r: any = await searchFn({
        data: {
          from, to, depart_date: date, return_date: ret || null,
          adults: pax, children: 0, infants: 0, cabin,
          trip_type: ret ? "round_trip" : "one_way", direct_only: directOnly,
        },
      });
      setResults(r?.flights ?? []); setCitations(r?.citations ?? []);
      if (r?.error) setError(r.error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Live Flight Search
            <Badge variant="secondary" className="gap-1"><Plane className="h-3 w-3" /> Gemini Enabled</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div><b>Indicative fares</b> researched live from Google Flights, MakeMyTrip, Cleartrip & airline sites via Gemini. Verify before ticketing.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="min-w-0"><Label className="text-xs mb-1 block">From</Label><AirportPicker value={from} onChange={setFrom} placeholder="Origin airport" /></div>
          <div className="min-w-0"><Label className="text-xs mb-1 block">To</Label><AirportPicker value={to} onChange={setTo} placeholder="Destination airport" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 items-end">
          <div className="min-w-0"><Label className="text-xs mb-1 block">Depart</Label><Input type="date" className="w-full" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="min-w-0"><Label className="text-xs mb-1 block">Return</Label><Input type="date" className="w-full" value={ret} onChange={(e) => setRet(e.target.value)} /></div>
          <div className="min-w-0"><Label className="text-xs mb-1 block">Pax</Label><Input type="number" min={1} value={pax} onChange={(e) => setPax(Number(e.target.value) || 1)} /></div>
          <div className="min-w-0">
            <Label className="text-xs mb-1 block">Cabin</Label>
            <select className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={cabin} onChange={(e) => setCabin(e.target.value as any)}>
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Prem. Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} /> Direct only
          </label>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => run.mutate()} disabled={run.isPending || !from || !to || !date}>
              {run.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <SearchIcon className="h-4 w-4 mr-1.5" />}
              Search with Gemini
            </Button>
            <Button variant="outline" asChild><a href={skyscanner} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1.5" />Skyscanner</a></Button>
            <Button variant="outline" asChild><a href={google} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1.5" />Google Flights</a></Button>
          </div>
        </div>

        {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-sm text-rose-900 dark:text-rose-200">{error}</div>}

        {run.isPending && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Gemini is searching live fares across Google Flights, MakeMyTrip, Cleartrip & airline sites…
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto">
            {results.map((f, i) => (
              <div key={i} className="rounded-xl border p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-sm">{f.airline}</div>
                    <Badge variant="outline" className="text-xs">{f.flight_no}</Badge>
                    <Badge variant="secondary" className="text-xs">{f.cabin ?? "Economy"}</Badge>
                    {f.stops && <Badge variant="outline" className="text-xs">{f.stops}</Badge>}
                  </div>
                  <div className="text-sm mt-1">
                    <b>{f.from}</b> {f.depart_time?.split("T")[1] ?? f.depart_time ?? ""} → <b>{f.to}</b> {f.arrive_time?.split("T")[1] ?? f.arrive_time ?? ""} · {f.duration}
                  </div>
                  {f.notes && <div className="text-xs text-muted-foreground mt-0.5">{f.notes}</div>}
                  {f.source_url && (
                    <a href={f.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold">₹{Number(f.price_inr || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[10px] text-muted-foreground">per adult</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {citations.length > 0 && (
          <div className="mt-3 rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-semibold mb-1">Sources ({citations.length})</div>
            <div className="flex flex-wrap gap-1">
              {citations.slice(0, 10).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-0.5 rounded bg-background border hover:border-primary/50">
                  {(c.title || c.url).slice(0, 42)}
                </a>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function HotelModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [country, setCountry] = useState(""); const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState(""); const [area, setArea] = useState("");
  const [ci, setCi] = useState(""); const [co, setCo] = useState("");
  const [rooms, setRooms] = useState(1); const [adults, setAdults] = useState(2); const [children, setChildren] = useState(0);
  const [minStar, setMinStar] = useState(3); const [budget, setBudget] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchFn = useServerFn(searchHotelsLive);

  const nights = useMemo(() => {
    if (!ci || !co) return 1;
    const d = (new Date(co).getTime() - new Date(ci).getTime()) / 86400000;
    return Math.max(1, Math.round(d));
  }, [ci, co]);

  const booking = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}${ci ? "&checkin=" + ci : ""}${co ? "&checkout=" + co : ""}&group_adults=${adults}&no_rooms=${rooms}`;
  const google = `https://www.google.com/travel/hotels?q=Hotels%20in%20${encodeURIComponent(city)}`;

  const run = useMutation({
    mutationFn: async () => {
      setError(null);
      const r: any = await searchFn({
        data: {
          city: [city, stateCode, country].filter(Boolean).join(", ") || city,
          area: area || null,
          checkin: ci, checkout: co, rooms, adults, children, min_star: minStar, budget_max_inr: budget,
        },
      });
      setResults(r?.hotels ?? []); setCitations(r?.citations ?? []);
      if (r?.error) setError(r.error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Live Hotel Search
            <Badge variant="secondary" className="gap-1"><Hotel className="h-3 w-3" /> Gemini Enabled</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div><b>Indicative rates</b> researched live from Booking, MakeMyTrip, Agoda, Goibibo & hotel sites via Gemini. Verify before booking.</div>
        </div>

        <div className="mt-2">
          <Label className="text-xs">Quick city search</Label>
          <AnyCityPicker
            value={city}
            onPick={({ city: c, countryCode, stateCode }) => {
              setCountry(countryCode);
              setStateCode(stateCode);
              setCity(c);
            }}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Search any city worldwide — country and state fill in automatically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
          <div>
            <Label className="text-xs">Country</Label>
            <CountryPicker value={country} onChange={(v) => { setCountry(v); setStateCode(""); setCity(""); }} />
          </div>
          <div>
            <Label className="text-xs">State / Region</Label>
            <StatePicker value={stateCode} onChange={(v) => { setStateCode(v); setCity(""); }} countryCode={country} />
          </div>
          <div>
            <Label className="text-xs">City</Label>
            <CityPicker value={city} onChange={setCity} countryCode={country} stateCode={stateCode} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><Label className="text-xs">Area (optional)</Label><Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Baga / Calangute" /></div>
          <div><Label className="text-xs">Check-in</Label><Input type="date" value={ci} onChange={(e) => setCi(e.target.value)} /></div>
          <div><Label className="text-xs">Check-out</Label><Input type="date" value={co} onChange={(e) => setCo(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div><Label className="text-xs">Rooms</Label><Input type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value) || 1)} /></div>
          <div><Label className="text-xs">Adults</Label><Input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value) || 1)} /></div>
          <div><Label className="text-xs">Children</Label><Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value) || 0)} /></div>
          <div>
            <Label className="text-xs">Min ★</Label>
            <select className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={minStar} onChange={(e) => setMinStar(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★+</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Max ₹/night</Label><Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} placeholder="0 = any" /></div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} · {rooms} room{rooms > 1 ? "s" : ""}</div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => run.mutate()} disabled={run.isPending || !city || !ci || !co}>
              {run.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <SearchIcon className="h-4 w-4 mr-1.5" />}
              Search with Gemini
            </Button>
            <Button variant="outline" asChild disabled={!city}><a href={booking} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1.5" />Booking.com</a></Button>
            <Button variant="outline" asChild disabled={!city}><a href={google} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1.5" />Google Hotels</a></Button>
          </div>
        </div>

        {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-sm text-rose-900 dark:text-rose-200">{error}</div>}

        {run.isPending && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Gemini is searching Booking, MakeMyTrip, Agoda, Goibibo & hotel sites…
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-3 space-y-2 max-h-[45vh] overflow-y-auto">
            {results.map((h, i) => (
              <div key={i} className="rounded-xl border p-3 flex items-start justify-between gap-3 hover:border-primary/50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-sm">{h.name}</div>
                    <Badge variant="secondary" className="text-xs">{h.star_rating}★</Badge>
                    {h.meal_plan && <Badge variant="outline" className="text-xs">{h.meal_plan}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{[h.area, h.city].filter(Boolean).join(" · ")}</div>
                  {Array.isArray(h.amenities) && h.amenities.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-1">{h.amenities.slice(0, 6).join(" · ")}</div>
                  )}
                  {h.notes && <div className="text-xs mt-1">{h.notes}</div>}
                  {h.source_url && (
                    <a href={h.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold">₹{Number(h.price_per_night_inr || 0).toLocaleString("en-IN")}</div>
                  <div className="text-[10px] text-muted-foreground">per night</div>
                  <div className="text-[11px] text-muted-foreground mt-1">Total ₹{(Number(h.price_per_night_inr || 0) * nights * rooms).toLocaleString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {citations.length > 0 && (
          <div className="mt-3 rounded-lg border p-3 bg-muted/30">
            <div className="text-xs font-semibold mb-1">Sources ({citations.length})</div>
            <div className="flex flex-wrap gap-1">
              {citations.slice(0, 10).map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-0.5 rounded bg-background border hover:border-primary/50">
                  {(c.title || c.url).slice(0, 42)}
                </a>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const CLOCK_CITIES = [
  { name: "Mumbai", tz: "Asia/Kolkata" },
  { name: "London", tz: "Europe/London" },
  { name: "New York", tz: "America/New_York" },
  { name: "Dubai", tz: "Asia/Dubai" },
  { name: "Singapore", tz: "Asia/Singapore" },
  { name: "Sydney", tz: "Australia/Sydney" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Los Angeles", tz: "America/Los_Angeles" },
];
function WorldClockModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>World Time Clock</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CLOCK_CITIES.map((c) => (
            <div key={c.name} className="rounded-xl border p-3 bg-muted/20">
              <div className="text-xs text-muted-foreground">{c.name}</div>
              <div className="text-lg font-semibold tabular-nums">
                {now.toLocaleTimeString("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {now.toLocaleDateString("en-GB", { timeZone: c.tz, weekday: "short", day: "numeric", month: "short" })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
