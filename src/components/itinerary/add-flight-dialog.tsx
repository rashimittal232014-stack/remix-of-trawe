import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMasters, upsertMaster } from "@/lib/masters.functions";
import { saveQuotation } from "@/lib/sales.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Ship, Plus, X } from "lucide-react";

type Master = { id: string; name: string; meta?: any; city?: string | null };

/** Combobox: pick from Masters or type new; adds to masters on save. */
function MasterCombo({
  kind, value, onChange, placeholder,
}: { kind: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const listFn = useServerFn(listMasters);
  const { data = [] } = useQuery({ queryKey: ["masters", kind], queryFn: () => listFn({ data: { kind } }) });
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () => (value.trim().length
      ? (data as Master[]).filter((m) => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
      : (data as Master[]).slice(0, 8)),
    [data, value],
  );
  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 border rounded-lg bg-background shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((m) => (
            <button key={m.id} type="button" onMouseDown={(e) => { e.preventDefault(); onChange(m.name); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-muted text-sm">
              <div className="font-medium">{m.name}</div>
              {m.city && <div className="text-xs text-muted-foreground">{m.city}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ensures a master exists for (kind, name); returns the row id. */
function useEnsureMaster() {
  const listFn = useServerFn(listMasters);
  const saveFn = useServerFn(upsertMaster);
  return async (kind: string, name: string, extra: Record<string, any> = {}) => {
    const n = name.trim();
    if (!n) return null;
    const rows = await listFn({ data: { kind, search: n } });
    const hit = (rows as Master[]).find((r) => r.name.toLowerCase() === n.toLowerCase());
    if (hit) return hit.id;
    const created: any = await saveFn({ data: { kind, name: n, ...extra } as any });
    return created?.id ?? null;
  };
}

// ============================================================
// FLIGHT
// ============================================================
export function AddFlightDialog({
  open, onOpenChange, lead, quotation, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  quotation?: any;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const saveQuoteFn = useServerFn(saveQuotation);
  const ensure = useEnsureMaster();

  const [title, setTitle] = useState("Flight Quotation");
  const [supplier, setSupplier] = useState("");
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");

  const [sectorTitle, setSectorTitle] = useState("");
  const [airline, setAirline] = useState("");
  const [flightNo, setFlightNo] = useState("");
  const [aircraft, setAircraft] = useState("");
  const [fromCity, setFromCity] = useState(lead?.from_location ?? "");
  const [fromTerminal, setFromTerminal] = useState("");
  const [toCity, setToCity] = useState(lead?.to_location ?? "");
  const [toTerminal, setToTerminal] = useState("");
  const [departure, setDeparture] = useState(lead?.travel_date ? `${lead.travel_date}T00:00` : "");
  const [arrival, setArrival] = useState("");
  const [duration, setDuration] = useState("");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [layover, setLayover] = useState("");
  const [baggage, setBaggage] = useState("ADULT");
  const [checkin, setCheckin] = useState("15 Kgs (1 piece only)");
  const [cabin, setCabin] = useState("7 Kgs (1 piece only)");
  const [layout, setLayout] = useState("");
  const [meal, setMeal] = useState("");

  const pax = Number(lead?.adults ?? 1);
  const [adultCost, setAdultCost] = useState(0);
  const rowTotal = pax * adultCost;
  const [autoSupplierCost, setAutoSupplierCost] = useState(true);
  const [supplierCost, setSupplierCost] = useState(0);
  const finalSupplierCost = autoSupplierCost ? rowTotal : supplierCost;
  const [description, setDescription] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (supplier.trim()) {
        await ensure("supplier", supplier.trim(), {
          meta: { phone: supPhone || undefined, email: supEmail || undefined },
        });
      }
      if (airline.trim()) await ensure("airline", airline.trim(), { meta: { code: flightNo?.split(" ")[0] } });
      const meta = {
        sector_title: sectorTitle, airline, flight_no: flightNo, aircraft,
        from_city: fromCity, from_terminal: fromTerminal, to_city: toCity, to_terminal: toTerminal,
        departure, arrival, duration, trip_type: tripType,
        layover, baggage, checkin_baggage: checkin, cabin_baggage: cabin, layout, meal,
        pax, adult_cost: adultCost, supplier_cost: finalSupplierCost,
      };
      return saveQuoteFn({
        data: {
          id: quotation?.id,
          title, lead_id: lead.id, customer_id: lead.customer_id ?? null,
          status: "draft", currency: "INR", gst_mode: "cgst_sgst",
          items: [{
            description: sectorTitle || `Flight - ${fromCity} to ${toCity} - ${airline}`,
            qty: pax, rate: adultCost, discount: 0, tax_rate: 0,
            service_type: "Flight", supplier: supplier || undefined, meta,
          }],
        } as any,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      qc.invalidateQueries({ queryKey: ["masters", "supplier"] });
      qc.invalidateQueries({ queryKey: ["masters", "airline"] });
      onOpenChange(false);
      onSaved();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Plane className="h-5 w-5" /> Add Flight Manual</SheetTitle></SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="font-semibold text-sm">Add Flight Quotation</div>
            <div className="text-xs text-muted-foreground">Pax: {lead?.adults ?? 0} Adult, {lead?.children ?? 0} Child, {lead?.infants ?? 0} Infant</div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Quotation Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quotation Title<span className="text-red-500">*</span></Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div>
                <Label>Supplier</Label>
                <MasterCombo kind="supplier" value={supplier} onChange={setSupplier} placeholder="Choose Supplier" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">Supplier</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowQuickSupplier((s) => !s)} className="text-primary">
                {showQuickSupplier ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Quick Add Supplier
              </Button>
            </div>
            {showQuickSupplier && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Supplier Name</Label><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Enter supplier name" /></div>
                <div><Label>Supplier Phone</Label><Input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="Enter phone number" /></div>
                <div><Label>Supplier Email</Label><Input value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="Enter email address" /></div>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Quotation Items</div>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">Flight 1</div>
              </div>
              <div>
                <Label>Sector / Ticket Title<span className="text-red-500">*</span></Label>
                <Input value={sectorTitle} onChange={(e) => setSectorTitle(e.target.value)} placeholder="e.g. DEL to NMI - Air India Express" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Airline</Label><MasterCombo kind="airline" value={airline} onChange={setAirline} placeholder="IndiGo / Air India" /></div>
                <div><Label>Flight No</Label><Input value={flightNo} onChange={(e) => setFlightNo(e.target.value)} placeholder="6E 6829" /></div>
                <div><Label>Aircraft</Label><Input value={aircraft} onChange={(e) => setAircraft(e.target.value)} placeholder="Airbus A321" /></div>
                <div><Label>From</Label><Input value={fromCity} onChange={(e) => setFromCity(e.target.value)} placeholder="New Delhi" /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>From Terminal</Label><Input value={fromTerminal} onChange={(e) => setFromTerminal(e.target.value)} placeholder="Terminal T1" /></div>
                <div><Label>To</Label><Input value={toCity} onChange={(e) => setToCity(e.target.value)} placeholder="Mumbai" /></div>
                <div><Label>To Terminal</Label><Input value={toTerminal} onChange={(e) => setToTerminal(e.target.value)} placeholder="Terminal T2" /></div>
                <div><Label>Departure</Label><Input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Arrival</Label><Input type="datetime-local" value={arrival} onChange={(e) => setArrival(e.target.value)} /></div>
                <div><Label>Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="01 h 25 m" /></div>
                <div className="col-span-2">
                  <Label>Trip Type</Label>
                  <div className="flex gap-2 mt-1">
                    <Button type="button" variant={tripType === "one_way" ? "default" : "outline"} size="sm" onClick={() => setTripType("one_way")}>One Way</Button>
                    <Button type="button" variant={tripType === "round_trip" ? "default" : "outline"} size="sm" onClick={() => setTripType("round_trip")}>Round Trip</Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Layover</Label><Input value={layover} onChange={(e) => setLayover(e.target.value)} placeholder="3h35 Layover in Indore" /></div>
                <div><Label>Baggage</Label><Input value={baggage} onChange={(e) => setBaggage(e.target.value)} /></div>
                <div><Label>Check-in</Label><Input value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
                <div><Label>Cabin</Label><Input value={cabin} onChange={(e) => setCabin(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Layout</Label><Input value={layout} onChange={(e) => setLayout(e.target.value)} placeholder="3-3 Layout" /></div>
                <div><Label>Meal / Beverage</Label><Input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="Beverage Available" /></div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="font-semibold text-sm">Pricing (INR)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Adult Cost × {pax}</Label><Input type="number" min={0} value={adultCost} onChange={(e) => setAdultCost(Number(e.target.value) || 0)} /></div>
                  <div><Label>Row Total</Label><Input value={rowTotal.toFixed(2)} disabled /></div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="font-semibold text-sm">Supplier Cost (INR)</div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={autoSupplierCost} onCheckedChange={(v) => setAutoSupplierCost(!!v)} />
                  Auto use selling cost as supplier cost
                </label>
                <div>
                  <Label>Supplier Cost</Label>
                  <Input type="number" min={0} disabled={autoSupplierCost}
                    value={autoSupplierCost ? rowTotal : supplierCost}
                    onChange={(e) => setSupplierCost(Number(e.target.value) || 0)} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter quotation item description" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!sectorTitle.trim() || save.isPending}>Save Quotation</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// CRUISE
// ============================================================
export function AddCruiseDialog({
  open, onOpenChange, lead, quotation, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: any;
  quotation?: any;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const saveQuoteFn = useServerFn(saveQuotation);
  const ensure = useEnsureMaster();

  const [title, setTitle] = useState("Cruise Quotation");
  const [supplier, setSupplier] = useState("");
  const [sectorTitle, setSectorTitle] = useState("");
  const [cruiseLine, setCruiseLine] = useState("");
  const [ship, setShip] = useState("");
  const [cabin, setCabin] = useState("");
  const [fromPort, setFromPort] = useState(lead?.from_location ?? "");
  const [toPort, setToPort] = useState(lead?.to_location ?? "");
  const [sailingDate, setSailingDate] = useState(lead?.travel_date ?? "");
  const [returnDate, setReturnDate] = useState("");
  const pax = Number(lead?.adults ?? 1);
  const [rate, setRate] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [taxRate, setTaxRate] = useState(5);
  const supplierCost = pax * rate;
  const description = "";

  const save = useMutation({
    mutationFn: async () => {
      if (supplier.trim()) await ensure("supplier", supplier.trim());
      if (cruiseLine.trim()) await ensure("cruise_line", cruiseLine.trim());
      const meta = { sector_title: sectorTitle, cruise_line: cruiseLine, ship, cabin, from_port: fromPort, to_port: toPort, sailing_date: sailingDate, return_date: returnDate, supplier_cost: supplierCost, markup };
      return saveQuoteFn({
        data: {
          id: quotation?.id,
          title, lead_id: lead.id, customer_id: lead.customer_id ?? null,
          status: "draft", currency: "INR", gst_mode: "cgst_sgst",
          items: [{
            description: sectorTitle || `Cruise - ${fromPort} to ${toPort} - ${cruiseLine}`,
            qty: pax, rate: rate + markup / Math.max(1, pax), discount: 0, tax_rate: taxRate,
            service_type: "Cruise", supplier: supplier || undefined, meta,
          }],
        } as any,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes-all"] });
      qc.invalidateQueries({ queryKey: ["masters", "supplier"] });
      qc.invalidateQueries({ queryKey: ["masters", "cruise_line"] });
      onOpenChange(false);
      onSaved();
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Ship className="h-5 w-5" /> Add Cruise Manual</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quotation Title<span className="text-red-500">*</span></Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Supplier</Label><MasterCombo kind="supplier" value={supplier} onChange={setSupplier} placeholder="Choose Supplier" /></div>
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="font-semibold text-sm">Cruise 1</div>
            <div><Label>Sector / Title<span className="text-red-500">*</span></Label><Input value={sectorTitle} onChange={(e) => setSectorTitle(e.target.value)} placeholder="e.g. Dubai Cruise" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Cruise Line</Label><MasterCombo kind="cruise_line" value={cruiseLine} onChange={setCruiseLine} placeholder="Costa / Royal Caribbean" /></div>
              <div><Label>Ship</Label><Input value={ship} onChange={(e) => setShip(e.target.value)} /></div>
              <div><Label>Cabin / Ship</Label><Input value={cabin} onChange={(e) => setCabin(e.target.value)} placeholder="Balcony" /></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>From</Label><Input value={fromPort} onChange={(e) => setFromPort(e.target.value)} /></div>
              <div><Label>To</Label><Input value={toPort} onChange={(e) => setToPort(e.target.value)} /></div>
              <div><Label>Sailing Date</Label><Input type="date" value={sailingDate} onChange={(e) => setSailingDate(e.target.value)} /></div>
              <div><Label>End / Return Date</Label><Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Rate × {pax}</Label><Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} /></div>
              <div><Label>Markup</Label><Input type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value) || 0)} /></div>
              <div><Label>Tax %</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t sticky bottom-0 bg-background">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={!sectorTitle.trim() || save.isPending}>Save Quotation</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}