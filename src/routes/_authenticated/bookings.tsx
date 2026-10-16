import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listBookings, upsertBooking, deleteBooking, listCustomers } from "@/lib/sales.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Search, Plane, Hotel, FileText, Receipt, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "Bookings — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBookings);
  const delFn = useServerFn(deleteBooking);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [mode, setMode] = useState<"flight" | "hotel">("flight");
  const [q, setQ] = useState("");
  const { data: rows = [] } = useQuery({ queryKey: ["bookings"], queryFn: () => listFn() });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Deleted"); },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (rows as any[]).filter((b) => {
      if ((b.booking_type ?? "flight") !== mode) return false;
      if (tab !== "all") {
        const s = String(b.status ?? "").toLowerCase();
        if (tab === "pending" && !["draft", "in-progress", "pending"].includes(s)) return false;
        if (tab === "confirmed" && !["confirmed", "completed"].includes(s)) return false;
        if (tab === "cancelled" && s !== "cancelled") return false;
      }
      if (!query) return true;
      const c = b.customers ?? b.leads ?? {};
      const m = b.meta ?? {};
      const hay = [b.code, b.title, b.destination, c.full_name, c.email, c.phone, m.pnr, m.airline, m.sector, m.hotel_name, m.city].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [rows, tab, q, mode]);

  const counts = useMemo(() => {
    const list = rows as any[];
    return {
      all: list.length,
      pending: list.filter((b) => ["draft", "in-progress", "pending"].includes(String(b.status).toLowerCase())).length,
      confirmed: list.filter((b) => ["confirmed", "completed"].includes(String(b.status).toLowerCase())).length,
      cancelled: list.filter((b) => String(b.status).toLowerCase() === "cancelled").length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{ fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif' }}>Bookings</h1>
          <p className="text-sm text-muted-foreground">{counts.all} total · {counts.confirmed} confirmed · {counts.pending} pending</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Booking</Button></DialogTrigger>
          <BookingForm initial={edit} onClose={() => { setOpen(false); setEdit(null); }} />
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Search + Tabs + Mode toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search booking, customer, mobile, email, PNR, voucher…"
                className="pl-9 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
              />
              {q && (
                <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {(["all", "pending", "confirmed", "cancelled"] as const).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-1.5 text-sm rounded-full border transition ${active ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-background text-foreground/70 border-border hover:bg-muted"}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setMode("flight")}
                className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border transition ${mode === "flight" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-background border-border hover:bg-muted"}`}
              >
                <Plane className="h-4 w-4" /> Flight Bookings
              </button>
              <button
                onClick={() => setMode("hotel")}
                className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border transition ${mode === "hotel" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-background border-border hover:bg-muted"}`}
              >
                <Hotel className="h-4 w-4" /> Hotel Bookings
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Booking Date</th>
                  <th className="text-left px-4 py-3">Customer Name</th>
                  <th className="text-left px-4 py-3">Mobile / Email</th>
                  <th className="text-left px-4 py-3">{mode === "flight" ? "Airline / Sector" : "Hotel / City"}</th>
                  <th className="text-left px-4 py-3">{mode === "flight" ? "PNR / Type" : "Room / Nights"}</th>
                  <th className="text-left px-4 py-3">Travel Date</th>
                  <th className="text-left px-4 py-3">Buying</th>
                  <th className="text-left px-4 py-3">Selling</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => {
                  const c = b.customers ?? b.leads ?? {};
                  const m = b.meta ?? {};
                  const dt = new Date(b.created_at);
                  const bookingDate = `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                  const statusLower = String(b.status ?? "").toLowerCase();
                  const statusClass =
                    statusLower === "confirmed" || statusLower === "completed"
                      ? "text-emerald-600"
                      : statusLower === "cancelled"
                      ? "text-rose-600"
                      : "text-amber-600";
                  const flightType = m.trip_type ?? (b.adults + b.children > 1 ? "Round Trip" : "One Way");
                  return (
                    <tr key={b.id} className="border-t hover:bg-muted/20 align-top">
                      <td className="px-4 py-3">
                        <div className="text-[10px] font-mono text-muted-foreground">{b.code ?? "—"}</div>
                        <div className="text-xs font-medium text-foreground">{bookingDate}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{c.full_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">{c.phone ?? "—"}</div>
                        <div className="text-xs text-emerald-600">{c.email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{mode === "flight" ? (m.airline || b.title) : (m.hotel_name || b.title)}</div>
                        <div className="text-xs text-muted-foreground">{mode === "flight" ? (m.sector || b.destination || "—") : (m.city || b.destination || "—")}</div>
                      </td>
                      <td className="px-4 py-3">
                        {mode === "flight" ? (
                          <div>
                            {m.pnr && <div className="text-[10px] font-mono text-muted-foreground">{m.pnr}</div>}
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">{flightType}</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-medium">{m.room_type || "—"}</div>
                            <div className="text-[11px] text-muted-foreground">{m.nights ? `${m.nights} nights` : ""}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {b.travel_from ? new Date(b.travel_from).toLocaleDateString("en-GB").replace(/\//g, "-") : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold">{b.currency} {Number(b.net_cost ?? 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 font-semibold">{b.currency} {Number(b.gross_value ?? 0).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        {b.lead_id ? (
                          <Link to="/leads/$id" params={{ id: b.lead_id }} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                            From Query <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">Manual</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-medium capitalize ${statusClass}`}>{b.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 rounded-full text-xs"><FileText className="h-3 w-3 mr-1" />Ticket</Button>
                          <Button variant="outline" size="sm" className="h-7 rounded-full text-xs"><Receipt className="h-3 w-3 mr-1" />Invoice</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEdit(b); setOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" onClick={() => del.mutate(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">No bookings match this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingForm({ initial, onClose }: { initial: any; onClose: () => void }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(upsertBooking);
  const custFn = useServerFn(listCustomers);
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => custFn({ data: {} }) });
  const [form, setForm] = useState<any>(initial ?? {
    booking_type: "flight",
    source: "manual",
    title: "", status: "confirmed", customer_id: null, destination: "",
    travel_from: "", travel_to: "", adults: 1, children: 0,
    gross_value: 0, net_cost: 0, currency: "INR", notes: "",
    meta: {},
  });
  const meta = form.meta ?? {};
  const setMeta = (patch: any) => setForm({ ...form, meta: { ...meta, ...patch } });
  const isFlight = form.booking_type === "flight";

  const handleSave = () => {
    const auto =
      isFlight
        ? `${meta.airline || "Flight"} · ${meta.sector || ""}`.trim()
        : `${meta.hotel_name || "Hotel"} · ${meta.city || ""}`.trim();
    save.mutate({ ...form, title: form.title?.trim() || auto || "Booking" });
  };

  const save = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Saved"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initial ? "Edit" : "New"} {isFlight ? "Flight" : "Hotel"} Booking</DialogTitle>
      </DialogHeader>

      {/* Type toggle */}
      <div className="inline-flex rounded-full border p-1 bg-muted/40 w-fit">
        <button type="button" onClick={() => setForm({ ...form, booking_type: "flight" })}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full transition ${isFlight ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground"}`}>
          <Plane className="h-3.5 w-3.5" /> Flight
        </button>
        <button type="button" onClick={() => setForm({ ...form, booking_type: "hotel" })}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full transition ${!isFlight ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground"}`}>
          <Hotel className="h-3.5 w-3.5" /> Hotel
        </button>
      </div>

      {/* Customer + status */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <Label>Customer *</Label>
          <Select value={form.customer_id ?? ""} onValueChange={(v) => setForm({ ...form, customer_id: v || null })}>
            <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent className="max-h-64">{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name} {c.phone ? `· ${c.phone}` : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["draft","pending","confirmed","in-progress","completed","cancelled"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {isFlight ? (
        <div className="mt-2 rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flight Details</div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Airline</Label><Input value={meta.airline ?? ""} onChange={(e) => setMeta({ airline: e.target.value })} placeholder="Air India (AI)" /></div>
            <div><Label>Flight No.</Label><Input value={meta.flight_no ?? ""} onChange={(e) => setMeta({ flight_no: e.target.value })} placeholder="AI-864" /></div>
            <div><Label>PNR</Label><Input value={meta.pnr ?? ""} onChange={(e) => setMeta({ pnr: e.target.value })} placeholder="ABCDEF" className="font-mono uppercase" /></div>
            <div className="col-span-2"><Label>Sector</Label><Input value={meta.sector ?? ""} onChange={(e) => setMeta({ sector: e.target.value })} placeholder="DEL → CCU" /></div>
            <div>
              <Label>Trip type</Label>
              <Select value={meta.trip_type ?? "One Way"} onValueChange={(v) => setMeta({ trip_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["One Way","Round Trip","Multi City"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Class</Label>
              <Select value={meta.cabin ?? "Economy"} onValueChange={(v) => setMeta({ cabin: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Economy","Premium Economy","Business","First"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Departure</Label><Input type="date" value={form.travel_from ?? ""} onChange={(e) => setForm({ ...form, travel_from: e.target.value })} /></div>
            <div><Label>Return</Label><Input type="date" value={form.travel_to ?? ""} onChange={(e) => setForm({ ...form, travel_to: e.target.value })} /></div>
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded-lg border bg-muted/20 p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hotel Details</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Hotel name</Label><Input value={meta.hotel_name ?? ""} onChange={(e) => setMeta({ hotel_name: e.target.value })} placeholder="Taj Palace" /></div>
            <div><Label>City</Label><Input value={meta.city ?? ""} onChange={(e) => setMeta({ city: e.target.value })} placeholder="Goa" /></div>
            <div><Label>Room type</Label><Input value={meta.room_type ?? ""} onChange={(e) => setMeta({ room_type: e.target.value })} placeholder="Deluxe" /></div>
            <div><Label>Meal plan</Label>
              <Select value={meta.meal_plan ?? "CP"} onValueChange={(v) => setMeta({ meal_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["EP","CP","MAP","AP"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Rooms</Label><Input type="number" value={meta.rooms ?? 1} onChange={(e) => setMeta({ rooms: Number(e.target.value) })} /></div>
            <div><Label>Check-in</Label><Input type="date" value={form.travel_from ?? ""} onChange={(e) => setForm({ ...form, travel_from: e.target.value })} /></div>
            <div><Label>Check-out</Label><Input type="date" value={form.travel_to ?? ""} onChange={(e) => setForm({ ...form, travel_to: e.target.value })} /></div>
            <div><Label>Nights</Label><Input type="number" value={meta.nights ?? ""} onChange={(e) => setMeta({ nights: Number(e.target.value) })} /></div>
            <div><Label>Confirmation #</Label><Input value={meta.confirmation ?? ""} onChange={(e) => setMeta({ confirmation: e.target.value })} className="font-mono" /></div>
          </div>
        </div>
      )}

      {/* Pax + Pricing */}
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Adults</Label><Input type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} /></div>
        <div><Label>Children</Label><Input type="number" value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} /></div>
        <div><Label>Supplier</Label><Input value={meta.supplier ?? ""} onChange={(e) => setMeta({ supplier: e.target.value })} placeholder="Vendor / GDS" /></div>
        <div><Label>Currency</Label>
          <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["INR","USD","EUR","AED","GBP"].map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Buying (Net cost)</Label><Input type="number" value={form.net_cost} onChange={(e) => setForm({ ...form, net_cost: Number(e.target.value) })} /></div>
        <div className="col-span-2"><Label>Selling (Gross)</Label><Input type="number" value={form.gross_value} onChange={(e) => setForm({ ...form, gross_value: Number(e.target.value) })} /></div>
      </div>

      <div><Label>Notes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special requests, remarks…" /></div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          Margin: <span className="font-semibold text-emerald-600">{form.currency} {(Number(form.gross_value || 0) - Number(form.net_cost || 0)).toLocaleString("en-IN")}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save booking"}</Button>
        </div>
      </div>
    </DialogContent>
  );
}
