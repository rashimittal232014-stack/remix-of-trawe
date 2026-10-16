import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchFlightsLive, searchHotelsLive } from "@/lib/live-search.functions";
import { saveQuotation } from "@/lib/sales.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, Plane, Hotel, AlertTriangle, ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const Disclaimer = () => (
  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
    <div>
      <b>Prices are indicative</b>, sourced live from the web via Gemini Search. Always verify fare, availability
      and baggage on the airline / hotel site before ticketing. TraWe is not the merchant of record.
    </div>
  </div>
);

// ============================================================
// LIVE FLIGHT SEARCH
// ============================================================
export function LiveFlightSearchDialog({
  open, onOpenChange, lead, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchFlightsLive);
  const saveFn = useServerFn(saveQuotation);

  const [from, setFrom] = useState(lead?.from_location ?? "");
  const [to, setTo] = useState(lead?.to_location ?? "");
  const [depart, setDepart] = useState(lead?.travel_date ?? "");
  const [ret, setRet] = useState(lead?.return_date ?? "");
  const [adults, setAdults] = useState(Number(lead?.adults ?? 1));
  const [children, setChildren] = useState(Number(lead?.children ?? 0));
  const [cabin, setCabin] = useState<"ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST">("ECONOMY");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [directOnly, setDirectOnly] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: async () => {
      setError(null);
      const r: any = await searchFn({
        data: {
          from, to, depart_date: depart, return_date: ret || null,
          adults, children, infants: 0, cabin, trip_type: tripType, direct_only: directOnly,
        },
      });
      setResults(r?.flights ?? []);
      setCitations(r?.citations ?? []);
      if (r?.error) setError(r.error);
    },
  });

  const addToQuote = useMutation({
    mutationFn: async (f: any) => {
      return saveFn({
        data: {
          title: `Flight — ${f.airline} ${f.flight_no}`.trim(),
          lead_id: lead.id, customer_id: lead.customer_id ?? null,
          status: "draft", currency: "INR", gst_mode: "cgst_sgst",
          items: [{
            description: `${f.airline} ${f.flight_no} · ${f.from} → ${f.to} · ${f.depart_time} · ${f.duration}${f.stops ? ` · ${f.stops}` : ""}`,
            qty: adults, rate: Number(f.price_inr) || 0, discount: 0, tax_rate: 0,
            service_type: "Flight",
            meta: {
              source: "gemini_research",
              source_url: f.source_url,
              airline: f.airline, flight_no: f.flight_no,
              from_city: f.from, to_city: f.to,
              departure: f.depart_time, arrival: f.arrive_time,
              duration: f.duration, cabin: f.cabin, stops: f.stops,
              adult_cost: Number(f.price_inr) || 0,
              notes: f.notes,
              disclaimer: "Live-researched fare. Verify on airline site before ticketing.",
            },
          }],
        } as any,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      toast.success("Added to quotations");
      onSaved();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live Flight Search
            <Badge variant="secondary" className="ml-1 gap-1"><Plane className="h-3 w-3" /> Gemini Enabled</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Disclaimer />

          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>From</Label><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="DEL / New Delhi" /></div>
              <div><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="BOM / Mumbai" /></div>
              <div><Label>Depart</Label><Input type="date" value={depart} onChange={(e) => setDepart(e.target.value)} /></div>
              <div><Label>Return</Label><Input type="date" value={ret} onChange={(e) => setRet(e.target.value)} disabled={tripType === "one_way"} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>Adults</Label><Input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value) || 1)} /></div>
              <div><Label>Children</Label><Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value) || 0)} /></div>
              <div>
                <Label>Cabin</Label>
                <Select value={cabin} onValueChange={(v: any) => setCabin(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECONOMY">Economy</SelectItem>
                    <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="FIRST">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trip</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={tripType === "one_way" ? "default" : "outline"} onClick={() => setTripType("one_way")}>One-Way</Button>
                  <Button type="button" size="sm" variant={tripType === "round_trip" ? "default" : "outline"} onClick={() => setTripType("round_trip")}>Round</Button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} />
                Direct flights only
              </label>
              <Button onClick={() => search.mutate()} disabled={search.isPending || !from || !to || !depart}>
                {search.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                Search live fares
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-sm text-rose-900 dark:text-rose-200">
              {error}
            </div>
          )}

          {search.isPending && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
              Gemini is searching Google Flights, MakeMyTrip, airline sites…
            </div>
          )}

          {!search.isPending && results.length === 0 && !error && (
            <div className="text-center py-10 border-2 border-dashed rounded-xl text-sm text-muted-foreground">
              Enter route + date and click Search to fetch live fares.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
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
                      <b>{f.from}</b> {f.depart_time?.split("T")[1] ?? ""} → <b>{f.to}</b> {f.arrive_time?.split("T")[1] ?? ""} · {f.duration}
                    </div>
                    {f.notes && <div className="text-xs text-muted-foreground mt-0.5">{f.notes}</div>}
                    {f.source_url && (
                      <a href={f.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold">₹{Number(f.price_inr).toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-muted-foreground">per adult</div>
                    <Button size="sm" className="mt-1" onClick={() => addToQuote.mutate(f)} disabled={addToQuote.isPending}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {citations.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-semibold mb-1">Sources ({citations.length})</div>
              <div className="flex flex-wrap gap-1">
                {citations.slice(0, 8).map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-0.5 rounded bg-background border hover:border-primary/50">
                    {(c.title || c.url).slice(0, 40)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// LIVE HOTEL SEARCH
// ============================================================
export function LiveHotelSearchDialog({
  open, onOpenChange, lead, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const searchFn = useServerFn(searchHotelsLive);
  const saveFn = useServerFn(saveQuotation);

  const [city, setCity] = useState(lead?.to_location ?? "");
  const [area, setArea] = useState("");
  const [checkin, setCheckin] = useState(lead?.travel_date ?? "");
  const [checkout, setCheckout] = useState(lead?.return_date ?? "");
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(Number(lead?.adults ?? 2));
  const [children, setChildren] = useState(Number(lead?.children ?? 0));
  const [minStar, setMinStar] = useState(3);
  const [budget, setBudget] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [citations, setCitations] = useState<{ title: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const nights = (() => {
    if (!checkin || !checkout) return 1;
    const d = (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000;
    return Math.max(1, Math.round(d));
  })();

  const search = useMutation({
    mutationFn: async () => {
      setError(null);
      const r: any = await searchFn({
        data: { city, area: area || null, checkin, checkout, rooms, adults, children, min_star: minStar, budget_max_inr: budget },
      });
      setResults(r?.hotels ?? []);
      setCitations(r?.citations ?? []);
      if (r?.error) setError(r.error);
    },
  });

  const addToQuote = useMutation({
    mutationFn: async (h: any) => {
      const total = Number(h.price_per_night_inr) * nights * rooms;
      return saveFn({
        data: {
          title: `Hotel — ${h.name}`,
          lead_id: lead.id, customer_id: lead.customer_id ?? null,
          status: "draft", currency: "INR", gst_mode: "cgst_sgst",
          items: [{
            description: `${h.name} (${h.star_rating}★) · ${h.area ?? h.city} · ${nights} night${nights > 1 ? "s" : ""} × ${rooms} room · ${h.meal_plan ?? ""}`,
            qty: rooms * nights, rate: Number(h.price_per_night_inr) || 0, discount: 0, tax_rate: 12,
            service_type: "Hotel",
            meta: {
              source: "gemini_research",
              source_url: h.source_url,
              hotel_name: h.name, area: h.area, city: h.city,
              star_rating: h.star_rating, meal_plan: h.meal_plan,
              amenities: h.amenities, checkin, checkout, nights, rooms,
              rate_per_night: Number(h.price_per_night_inr) || 0, total_inr: total,
              notes: h.notes,
              disclaimer: "Live-researched rate. Verify on hotel/OTA site before booking.",
            },
          }],
        } as any,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      toast.success("Added to quotations");
      onSaved();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live Hotel Search
            <Badge variant="secondary" className="ml-1 gap-1"><Hotel className="h-3 w-3" /> Google Places</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Disclaimer />

          <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" /></div>
              <div><Label>Area (optional)</Label><Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Bandra / Colaba" /></div>
              <div><Label>Check-in</Label><Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
              <div><Label>Check-out</Label><Input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div><Label>Rooms</Label><Input type="number" min={1} value={rooms} onChange={(e) => setRooms(Number(e.target.value) || 1)} /></div>
              <div><Label>Adults</Label><Input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value) || 1)} /></div>
              <div><Label>Children</Label><Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value) || 0)} /></div>
              <div>
                <Label>Min ★</Label>
                <Select value={String(minStar)} onValueChange={(v) => setMinStar(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}★+</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Max ₹/night</Label><Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} placeholder="0 = any" /></div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} · {rooms} room{rooms > 1 ? "s" : ""}</div>
              <Button onClick={() => search.mutate()} disabled={search.isPending || !city || !checkin || !checkout}>
                {search.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                Search live rates
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-sm text-rose-900 dark:text-rose-200">
              {error}
            </div>
          )}

          {search.isPending && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
              Searching hotels on Google Places…
            </div>
          )}

          {!search.isPending && results.length === 0 && !error && (
            <div className="text-center py-10 border-2 border-dashed rounded-xl text-sm text-muted-foreground">
              Enter city + dates and click Search to fetch hotels from Google.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((h, i) => {
                const total = Number(h.price_per_night_inr) * nights * rooms;
                return (
                  <div key={i} className="rounded-xl border p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm">{h.name}</div>
                        <Badge variant="secondary" className="text-xs">{h.star_rating}★</Badge>
                        {h.meal_plan && <Badge variant="outline" className="text-xs">{h.meal_plan}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{h.area ? `${h.area}, ` : ""}{h.city}</div>
                      {h.amenities?.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">{h.amenities.slice(0, 4).join(" · ")}</div>
                      )}
                      {h.source_url && (
                        <a href={h.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold">₹{Number(h.price_per_night_inr).toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-muted-foreground">per night · Total ₹{total.toLocaleString("en-IN")}</div>
                      <Button size="sm" className="mt-1" onClick={() => addToQuote.mutate(h)} disabled={addToQuote.isPending}>
                        <Plus className="h-3.5 w-3.5 mr-1" />Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {citations.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs font-semibold mb-1">Sources ({citations.length})</div>
              <div className="flex flex-wrap gap-1">
                {citations.slice(0, 8).map((c, i) => (
                  <a key={i} href={c.url} target="_blank" rel="noreferrer" className="text-[11px] px-2 py-0.5 rounded bg-background border hover:border-primary/50">
                    {(c.title || c.url).slice(0, 40)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}