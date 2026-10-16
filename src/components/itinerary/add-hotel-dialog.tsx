import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMasters } from "@/lib/masters.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Sparkles, Search, Loader2, AlertTriangle, ExternalLink, Plus, Hotel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { searchHotelsLive } from "@/lib/live-search.functions";
import { ImagePicker } from "@/components/masters/image-picker";

type Attachment = { url: string };

export type HotelPayload = {
  supplier?: string;
  title: string;
  address?: string;
  package_option: string;
  star?: string;
  room_type?: string;
  meal_plan?: string;
  nights: number;
  checkin_time?: string;
  checkout_time?: string;
  rooms: { type: string; count: number; rate: number; total: number }[];
  supplier_cost: number;
  selling_total: number;
  description?: string;
  image_url?: string;
  images: string[];
};

const ROOM_TYPES = ["Single", "Double", "Triple", "Quad", "CNB", "CWB", "Extra Bed"];
const PACKAGE_OPTIONS = ["Basic", "Standard", "Deluxe", "Premium", "Luxury"];
const STARS = ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star", "5+ Star"];

/** Step 1: choose Manual vs API */
export function AddHotelChooser({
  open,
  onOpenChange,
  onManual,
  onGemini,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onManual: () => void;
  onGemini: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Add Hotel</DialogTitle></DialogHeader>
        <div className="space-y-1">
          <div className="text-base font-semibold">Add Hotel Service</div>
          <div className="text-sm text-muted-foreground">Choose how you want to add hotel service in this itinerary day.</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button onClick={onManual} className="text-left rounded-xl border p-4 hover:border-primary hover:bg-primary/5 transition">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary mb-3"><Pencil className="h-5 w-5" /></div>
            <div className="font-semibold">Add Hotel Manual</div>
            <div className="text-xs text-muted-foreground mt-1">Open the existing manual hotel service form for this itinerary day.</div>
          </button>
          <button onClick={onGemini} className="text-left rounded-xl border p-4 hover:border-primary hover:bg-primary/5 transition">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary mb-3"><Sparkles className="h-5 w-5" /></div>
            <div className="font-semibold">Add Hotel Via Gemini AI</div>
            <div className="text-xs text-muted-foreground mt-1">Search live hotels with Gemini AI grounding and insert the selected room and rate into this itinerary day.</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Step 2: manual hotel form */
export function AddHotelManualDialog({
  open,
  onOpenChange,
  defaultLocation,
  defaultNights = 1,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultLocation?: string;
  defaultNights?: number;
  onSave: (payload: HotelPayload) => void;
}) {
  const listFn = useServerFn(listMasters);
  const { data: hotels = [] } = useQuery({
    queryKey: ["masters", "hotel"],
    queryFn: () => listFn({ data: { kind: "hotel" } }),
    enabled: open,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["masters", "supplier"],
    queryFn: () => listFn({ data: { kind: "supplier" } }),
    enabled: open,
  });
  const { data: mealPlans = [] } = useQuery({
    queryKey: ["masters", "meal_plan"],
    queryFn: () => listFn({ data: { kind: "meal_plan" } }),
    enabled: open,
  });
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["masters", "room_type"],
    queryFn: () => listFn({ data: { kind: "room_type" } }),
    enabled: open,
  });

  const [supplierId, setSupplierId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [hotelSearch, setHotelSearch] = useState(false);
  const [packageOption, setPackageOption] = useState("Basic");
  const [location, setLocation] = useState(defaultLocation ?? "");
  const [star, setStar] = useState("");
  const [roomType, setRoomType] = useState("");
  const [mealPlan, setMealPlan] = useState("");
  const [nights, setNights] = useState<number>(defaultNights);
  const [checkinTime, setCheckinTime] = useState<string>("14:00");
  const [checkoutTime, setCheckoutTime] = useState<string>("11:00");
  const [autoUseSelling, setAutoUseSelling] = useState(true);
  const [rows, setRows] = useState<Record<string, { count: number; rate: number }>>(
    Object.fromEntries(ROOM_TYPES.map((r) => [r, { count: 0, rate: 0 }])),
  );
  const [supplierCostOverride, setSupplierCostOverride] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Attachment[]>([]);

  const filteredHotels = useMemo(
    () => (title.trim().length > 0
      ? (hotels as any[]).filter((h) => h.name?.toLowerCase().includes(title.toLowerCase())).slice(0, 6)
      : []),
    [hotels, title],
  );

  const totals = useMemo(() => {
    let selling = 0;
    for (const t of ROOM_TYPES) {
      const r = rows[t];
      selling += (r?.count ?? 0) * (r?.rate ?? 0) * nights;
    }
    const supplier = autoUseSelling ? selling : Number(supplierCostOverride || 0);
    return { selling, supplier };
  }, [rows, nights, autoUseSelling, supplierCostOverride]);

  const pickHotel = (h: any) => {
    setTitle(h.name);
    setLocation(h.location || h.city || location);
    if (h.meta?.star) setStar(String(h.meta.star));
    if (h.image_url) setImages((prev) => (prev.length ? prev : [{ url: h.image_url }]));
    if (h.description) setDescription(h.description);
    setHotelSearch(false);
  };

  const supplierName = (suppliers as any[]).find((s) => s.id === supplierId)?.name;

  const submit = () => {
    const roomsOut = ROOM_TYPES
      .map((t) => ({ type: t, count: rows[t].count, rate: rows[t].rate, total: rows[t].count * rows[t].rate * nights }))
      .filter((r) => r.count > 0 || r.rate > 0);
    onSave({
      supplier: supplierName,
      title: title.trim(),
      address: location.trim() || undefined,
      package_option: packageOption,
      star: star || undefined,
      room_type: roomType || undefined,
      meal_plan: mealPlan || undefined,
      nights,
      checkin_time: checkinTime || undefined,
      checkout_time: checkoutTime || undefined,
      rooms: roomsOut,
      supplier_cost: totals.supplier,
      selling_total: totals.selling,
      description: description.trim() || undefined,
      image_url: images[0]?.url,
      images: images.map((i) => i.url),
    });
  };

  const resetForm = () => {
    setSupplierId("");
    setTitle("");
    setPackageOption("Basic");
    setLocation(defaultLocation ?? "");
    setStar("");
    setRoomType("");
    setMealPlan("");
    setNights(defaultNights);
    setCheckinTime("14:00");
    setCheckoutTime("11:00");
    setRows(Object.fromEntries(ROOM_TYPES.map((r) => [r, { count: 0, rate: 0 }])));
    setSupplierCostOverride(0);
    setDescription("");
    setImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Hotel Manual</DialogTitle></DialogHeader>

        <div className="grid grid-cols-[100px_1fr] items-center gap-3">
          <Label>Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger><SelectValue placeholder="Choose Supplier" /></SelectTrigger>
            <SelectContent>
              {(suppliers as any[]).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border p-4 space-y-4 mt-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Hotel 1</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHotelSearch(true)}
                className="border-primary text-primary hover:bg-primary/5"
              >
                Import from Master
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-1 relative">
            <Label>Hotel Name / Item Title <span className="text-red-500">*</span></Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHotelSearch(true); }}
              onFocus={() => setHotelSearch(true)}
              placeholder="Search from Masters or type new"
            />
            {hotelSearch && filteredHotels.length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
                {filteredHotels.map((h) => (
                  <button key={h.id} type="button" onClick={() => pickHotel(h)} className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0">
                    <div className="font-medium text-sm">{h.name}</div>
                    {(h.location || h.city) && <div className="text-xs text-muted-foreground">{h.location || h.city}</div>}
                    {h.meta?.star && <div className="text-xs text-primary mt-0.5">{h.meta.star}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div><Label>Package Option <span className="text-red-500">*</span></Label>
              <Select value={packageOption} onValueChange={setPackageOption}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PACKAGE_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Hotel / Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
            <div><Label>Check-in Time <span className="text-red-500">*</span></Label>
              <Input type="time" value={checkinTime} onChange={(e) => setCheckinTime(e.target.value)} />
            </div>
            <div><Label>Check-out Time <span className="text-red-500">*</span></Label>
              <Input type="time" value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div><Label>Star Category</Label>
              <Select value={star} onValueChange={setStar}>
                <SelectTrigger><SelectValue placeholder="Select Star" /></SelectTrigger>
                <SelectContent>{STARS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Room Type <span className="text-red-500">*</span></Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger><SelectValue placeholder="Select Room Type" /></SelectTrigger>
                <SelectContent>
                  {((roomTypes as any[]).length ? (roomTypes as any[]).map((r) => r.name) : ROOM_TYPES).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Meal Plan <span className="text-red-500">*</span></Label>
              <Select value={mealPlan} onValueChange={setMealPlan}>
                <SelectTrigger><SelectValue placeholder="Select Meal Plan" /></SelectTrigger>
                <SelectContent>
                  {((mealPlans as any[]).length ? (mealPlans as any[]).map((m) => m.name) : ["EP", "CP", "MAP", "AP"]).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nights</Label><Input type="number" min={1} value={nights} onChange={(e) => setNights(Number(e.target.value) || 1)} /></div>
          </div>

          <div className="flex justify-end">
            <a
              href="/masters"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary border border-primary/40 rounded-full px-3 py-1 hover:bg-primary/5"
            >
              Manage Room Type / Meal Plan
            </a>
          </div>

          <div className="rounded-xl border">
            <div className="p-3 border-b">
              <div className="font-semibold text-sm">Cost Details (INR)</div>
              <label className="flex items-center gap-2 mt-2 text-sm">
                <Checkbox checked={autoUseSelling} onCheckedChange={(v) => setAutoUseSelling(!!v)} />
                Auto use selling cost as supplier cost
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-2 w-32">Room Type</th>
                    <th className="text-left p-2">No. of Rooms</th>
                    <th className="text-left p-2">Room Cost / Night</th>
                    <th className="text-right p-2 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ROOM_TYPES.map((t) => {
                    const r = rows[t];
                    const total = (r.count ?? 0) * (r.rate ?? 0) * nights;
                    return (
                      <tr key={t} className="border-t">
                        <td className="p-2 font-medium">{t}</td>
                        <td className="p-2"><Input type="number" min={0} value={r.count} onChange={(e) => setRows({ ...rows, [t]: { ...r, count: Number(e.target.value) || 0 } })} /></td>
                        <td className="p-2"><Input type="number" min={0} value={r.rate} onChange={(e) => setRows({ ...rows, [t]: { ...r, rate: Number(e.target.value) || 0 } })} /></td>
                        <td className="p-2 text-right text-muted-foreground">{total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>Supplier Cost</Label>
                <Input type="number" value={autoUseSelling ? totals.selling : supplierCostOverride}
                  disabled={autoUseSelling}
                  onChange={(e) => setSupplierCostOverride(Number(e.target.value) || 0)} />
              </div>
              <div className="text-right text-sm">
                <div className="text-muted-foreground">Selling Total</div>
                <div className="font-bold text-lg text-primary">₹ {totals.selling.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter quotation item description" />
          </div>

          <div>
            <Label>Images</Label>
            <ImagePicker
              value={images.map((i) => i.url)}
              onChange={(urls) => setImages(urls.map((url) => ({ url })))}
              folder="hotels"
              max={10}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-primary" disabled={!title.trim()} onClick={submit}>Save Hotel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
/** Step 2 alt: Gemini AI live hotel search → insert into itinerary day */
export function AddHotelGeminiDialog({
  open,
  onOpenChange,
  defaultCity,
  defaultCheckin,
  defaultCheckout,
  defaultRooms = 1,
  defaultAdults = 2,
  defaultChildren = 0,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultCity?: string;
  defaultCheckin?: string;
  defaultCheckout?: string;
  defaultRooms?: number;
  defaultAdults?: number;
  defaultChildren?: number;
  onSave: (payload: HotelPayload) => void;
}) {
  const searchFn = useServerFn(searchHotelsLive);
  const [city, setCity] = useState(defaultCity ?? "");
  const [area, setArea] = useState("");
  const [checkin, setCheckin] = useState(defaultCheckin ?? "");
  const [checkout, setCheckout] = useState(defaultCheckout ?? "");
  const [rooms, setRooms] = useState(defaultRooms);
  const [adults, setAdults] = useState(defaultAdults);
  const [childrenCount, setChildrenCount] = useState(defaultChildren);
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
        data: { city, area: area || null, checkin, checkout, rooms, adults, children: childrenCount, min_star: minStar, budget_max_inr: budget },
      });
      setResults(r?.hotels ?? []);
      setCitations(r?.citations ?? []);
      if (r?.error) setError(r.error);
    },
  });

  const insertHotel = (h: any) => {
    const rate = Number(h.price_per_night_inr) || 0;
    const selling = rate * rooms * nights;
    onSave({
      title: h.name,
      address: [h.area, h.city].filter(Boolean).join(", ") || undefined,
      package_option: "Standard",
      star: h.star_rating ? `${h.star_rating} Star` : undefined,
      room_type: "Double",
      meal_plan: h.meal_plan || undefined,
      nights,
      rooms: [{ type: "Double", count: rooms, rate, total: selling }],
      supplier_cost: selling,
      selling_total: selling,
      description: [
        h.notes,
        h.amenities?.length ? `Amenities: ${h.amenities.join(", ")}` : "",
        h.source_url ? `Source: ${h.source_url}` : "",
        "Live-researched rate via Gemini AI. Verify on hotel/OTA site before booking.",
      ].filter(Boolean).join("\n"),
      images: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add Hotel Via Gemini AI
            <Badge variant="secondary" className="ml-1 gap-1"><Hotel className="h-3 w-3" /> Gemini Enabled</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div><b>Prices are indicative</b>, sourced live via Gemini Search. Verify rate and availability on the hotel / OTA site before confirming.</div>
        </div>

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
            <div><Label>Children</Label><Input type="number" min={0} value={childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value) || 0)} /></div>
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
              Search with Gemini
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 px-3 py-2 text-sm text-rose-900 dark:text-rose-200">{error}</div>
        )}

        {search.isPending && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
            Gemini is searching Booking, MakeMyTrip, Agoda, hotel sites…
          </div>
        )}

        {!search.isPending && results.length === 0 && !error && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl text-sm text-muted-foreground">
            Enter city + dates and click Search to fetch live rates.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((h, i) => {
              const rate = Number(h.price_per_night_inr) || 0;
              const total = rate * nights * rooms;
              return (
                <div key={i} className="rounded-xl border p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-sm">{h.name}</div>
                      {h.star_rating && <Badge variant="outline" className="text-xs">{h.star_rating}★</Badge>}
                      {h.meal_plan && <Badge variant="secondary" className="text-xs">{h.meal_plan}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{[h.area, h.city].filter(Boolean).join(" · ")}</div>
                    {h.amenities?.length > 0 && <div className="text-xs text-muted-foreground mt-0.5 truncate">{h.amenities.slice(0, 5).join(" · ")}</div>}
                    {h.source_url && (
                      <a href={h.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1">
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold">₹{rate.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-muted-foreground">per night · total ₹{total.toLocaleString("en-IN")}</div>
                    <Button size="sm" className="mt-1" onClick={() => insertHotel(h)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Insert
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
      </DialogContent>
    </Dialog>
  );
}
