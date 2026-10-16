import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listItineraries, upsertItinerary, deleteItinerary, draftItineraryAI } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MoreVertical, Plus, Search, Sparkles, FileText, Grid2X2, List as ListIcon, Trash2 } from "lucide-react";
import { BookOpen, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { DESTINATIONS } from "@/lib/destinations";

export const Route = createFileRoute("/_authenticated/itineraries/")({
  head: () => ({ meta: [{ title: "Itineraries — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: ItinerariesPage,
});

const INTERESTS = ["Sightseeing","Shopping","Temple","Adventure","Beach","Nature","Culture","Food","Photography","Leisure"];
const SERVICES = ["Hotel","Transport","Sightseeing","Cruise","Bus","Train","Flight"];
const HOTEL_CATS = [{ v: "3_star", l: "3 Star" }, { v: "4_star", l: "4 Star" }, { v: "5_star", l: "5 Star" }];
const PKG_OPTS = ["Basic","Deluxe","Luxury","Package","Standard","Premium"];
const CURRENCIES = ["INR","USD","EUR","GBP","AED","SGD","THB"];

function ItinerariesPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const listFn = useServerFn(listItineraries);
  const delFn = useServerFn(deleteItinerary);
  const [view, setView] = useState<"box" | "list">("box");
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openAI, setOpenAI] = useState(false);
  const [openPDF, setOpenPDF] = useState(false);

  const { data: rows = [] } = useQuery({ queryKey: ["itineraries"], queryFn: () => listFn() });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["itineraries"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete"),
  });

  const filtered = useMemo(() => rows.filter((r: any) => {
    // Itineraries page shows templates only (not lead/customer-linked instances)
    if (r.lead_id || r.customer_id) return false;
    if (!q) return true;
    const hay = `${r.title} ${(r.destinations ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Itineraries</h1>
          <p className="text-sm text-muted-foreground">Total {filtered.length} · Active {filtered.filter((r:any)=>r.status!=="archived").length}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or destination" className="pl-9 w-72 rounded-full" />
          </div>
          <div className="inline-flex rounded-full border p-0.5">
            <button onClick={() => setView("box")} className={`h-8 w-8 grid place-items-center rounded-full ${view==="box"?"bg-primary text-primary-foreground":""}`}><Grid2X2 className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`h-8 w-8 grid place-items-center rounded-full ${view==="list"?"bg-primary text-primary-foreground":""}`}><ListIcon className="h-4 w-4" /></button>
          </div>
          <Button variant="outline" onClick={() => setOpenPDF(true)}><FileText className="h-4 w-4 mr-1" />Add via PDF</Button>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setOpenAI(true)}><Sparkles className="h-4 w-4 mr-1" />Create AI Itinerary</Button>
          <Button onClick={() => setOpenAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Itinerary</Button>
        </div>
      </div>

      {view === "box" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r: any) => <BoxCard key={r.id} r={r} onDelete={() => del.mutate(r.id)} />)}
          {filtered.length === 0 && <Card className="col-span-full"><CardContent className="p-10 text-center text-muted-foreground">No itineraries yet.</CardContent></Card>}
        </div>
      ) : (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b">
              <tr><th className="p-3">Title</th><th className="p-3">Destinations</th><th className="p-3">Duration</th><th className="p-3">Pax</th><th className="p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => nav({ to: "/itineraries/$id", params: { id: r.id } })}>
                  <td className="p-3 font-medium">{r.title}</td>
                  <td className="p-3">{(r.destinations ?? []).join(", ") || "—"}</td>
                  <td className="p-3">{r.nights ?? 0}N / {(r.nights ?? 0) + 1}D</td>
                  <td className="p-3">{r.adults}A · {r.children}C · {r.infants ?? 0}I</td>
                  <td className="p-3"><Badge variant="outline" className="capitalize">{r.status}</Badge></td>
                  <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); del.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}

      {openAdd && <AddItineraryDrawer open={openAdd} onOpenChange={setOpenAdd} onCreated={(id) => nav({ to: "/itineraries/$id", params: { id } })} />}
      {openAI && <AIItineraryDrawer open={openAI} onOpenChange={setOpenAI} onCreated={(id) => nav({ to: "/itineraries/$id", params: { id } })} />}
      <Dialog open={openPDF} onOpenChange={setOpenPDF}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Itinerary via PDF</DialogTitle></DialogHeader>
          <div className="border-2 border-dashed rounded-xl p-10 text-center space-y-2">
            <div className="h-14 w-14 mx-auto rounded-full bg-emerald-50 grid place-items-center"><FileText className="h-6 w-6 text-emerald-600" /></div>
            <div className="font-medium">Select PDF file</div>
            <div className="text-xs text-muted-foreground">PDF only, maximum 50 MB. Text-based PDFs give the best result.</div>
            <Input type="file" accept="application/pdf" className="mt-4 max-w-xs mx-auto" />
          </div>
          <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded p-3">Tip: after upload AI extracts title, days and services. You can review before creating.</div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenPDF(false)}>Cancel</Button><Button disabled>Import PDF</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoxCard({ r, onDelete }: { r: any; onDelete: () => void }) {
  const total = Number(r.total_price ?? 0);
  const nights = r.nights ?? 0;
  const nav = useNavigate();
  const titleMatch = String(r.title ?? "").match(/^(.*?)(\s+\d+\s*[Nn]\/?\s*\d+\s*[Dd].*)?$/);
  const titleMain = titleMatch?.[1]?.trim() || r.title || "Untitled";
  const titleTail = titleMatch?.[2]?.trim() || "";
  const priceFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(total);
  return (
    <Link to="/itineraries/$id" params={{ id: r.id }} className="block h-full">
      <article className="group h-full bg-white rounded-2xl border border-neutral-200/70 overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500">
        <div className="relative">
          {r.cover_url ? (
            <img src={r.cover_url} alt="" className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-primary/20 to-accent/40 grid place-items-center text-primary/60 text-xs">No cover</div>
          )}
          <div className="absolute top-4 right-4" onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
                  <MoreVertical className="h-4 w-4 text-neutral-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => nav({ to: "/itineraries/$id", params: { id: r.id } })}>
                  <BookOpen className="h-4 w-4 mr-2" />Open Builder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/itineraries/$id", params: { id: r.id }, search: { edit: 1 } as any })}>
                  <Edit className="h-4 w-4 mr-2" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { if (confirm("Delete this itinerary?")) onDelete(); }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(r.destinations ?? []).slice(0, 4).map((d: string) => (
              <span key={d} className="px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase bg-stone-100 text-stone-600 rounded-sm">{d}</span>
            ))}
          </div>

          <h3 className="text-[22px] leading-tight text-neutral-900 mb-6 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {titleMain}
            {titleTail && <span className="italic font-medium text-stone-400"> {titleTail}</span>}
          </h3>

          <div className="grid grid-cols-3 border-t border-b border-neutral-100 py-5">
            <div className="text-center border-r border-neutral-100 px-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-1.5">Duration</p>
              <p className="text-sm font-semibold text-neutral-800">{nights} Nights</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{nights + 1} Days</p>
            </div>
            <div className="text-center border-r border-neutral-100 px-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-1.5">Guests</p>
              <p className="text-sm font-semibold text-neutral-800">{r.adults}A {r.children}C {r.infants ?? 0}I</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Pax</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-bold mb-1.5">Investment</p>
              <p className="text-sm font-semibold text-orange-800">{r.currency ?? "INR"} {priceFmt}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Net Total</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-[0.15em] capitalize">{r.status ?? "Draft"}</span>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-900 group-hover:text-orange-800 transition-colors">
              View
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function DestinationsCombo({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [q, setQ] = useState("");
  const matches = q ? DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-[36px] px-2 py-1 border rounded-md">
        {value.map((v) => (
          <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
            {v}<button onClick={() => onChange(value.filter((x) => x !== v))}>×</button>
          </span>
        ))}
        <input className="flex-1 min-w-[140px] bg-transparent outline-none text-sm" placeholder={placeholder ?? "Type destination and select"} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {matches.length > 0 && (
        <div className="border rounded-md max-h-48 overflow-auto text-sm">
          {matches.map((m) => (
            <button key={m.name} type="button" className="w-full text-left px-3 py-1.5 hover:bg-muted flex justify-between" onClick={() => { if (!value.includes(m.name)) onChange([...value, m.name]); setQ(""); }}>
              <span>{m.name}</span><span className="text-xs text-muted-foreground">{m.section}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddItineraryDrawer({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (b: boolean) => void; onCreated: (id: string) => void }) {
  const saveFn = useServerFn(upsertItinerary);
  const [form, setForm] = useState<any>({
    package_type: "FIT", currency: "INR", costing_type: "service_wise",
    title: "", nights: 4, adults: 2, children: 0, infants: 0,
    destinations: [] as string[], description: "",
  });
  const create = useMutation({
    mutationFn: () => saveFn({ data: { ...form, adults: Number(form.adults), children: Number(form.children), infants: Number(form.infants), nights: Number(form.nights) } as any }),
    onSuccess: (out: any) => { onOpenChange(false); onCreated(out.id); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>Add Itinerary</SheetTitle></SheetHeader>
        <Tabs defaultValue="info" className="mt-4">
          <TabsList><TabsTrigger value="info">Itinerary Info</TabsTrigger><TabsTrigger value="site">Website Setting</TabsTrigger></TabsList>
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Package Type</Label>
                <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="FIT">FIT Package</SelectItem><SelectItem value="GIT">GIT Package</SelectItem><SelectItem value="Custom">Custom</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Costing Type</Label>
                <Select value={form.costing_type} onValueChange={(v) => setForm({ ...form, costing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="service_wise">Service Wise Cost</SelectItem><SelectItem value="one_time">One Time Cost</SelectItem></SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Service Wise keeps service supplier/cost. One Time uses Package Options cost.</p>
              </div>
            </div>
            <div><Label>Package Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Manali, Sissu Package" /></div>
            <div><Label>Nights</Label><Input type="number" value={form.nights} onChange={(e) => setForm({ ...form, nights: e.target.value })} /><p className="text-xs text-muted-foreground mt-1">Days auto calculate: nights + 1</p></div>
            <div>
              <div className="font-semibold mb-2">Pax Information</div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Adult</Label><Input type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} /></div>
                <div><Label>Child</Label><Input type="number" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} /></div>
                <div><Label>Infant</Label><Input type="number" value={form.infants} onChange={(e) => setForm({ ...form, infants: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Destination Information</div>
              <Label>Destinations</Label>
              <DestinationsCombo value={form.destinations} onChange={(v) => setForm({ ...form, destinations: v })} />
            </div>
            <div><Label>Description</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Package description" /></div>
          </TabsContent>
          <TabsContent value="site" className="text-sm text-muted-foreground mt-4">
            Website publishing options will appear after the itinerary is saved.
          </TabsContent>
        </Tabs>
        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title}>Add & Open Builder</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AIItineraryDrawer({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (b: boolean) => void; onCreated: (id: string) => void }) {
  const aiFn = useServerFn(draftItineraryAI);
  const [form, setForm] = useState<any>({
    title: "", destinations: [] as string[], nights: 4,
    adults: 2, children: 0, infants: 0,
    meal_plan: "", travel_style: "Relaxed", interests: [] as string[],
    include_services: ["Hotel","Transport","Sightseeing"] as string[],
    hotel_category: "3_star", package_option: "Basic", currency: "INR", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const days = Math.max(0, Number(form.nights) || 0) + 1;

  const create = useMutation({
    mutationFn: () => aiFn({ data: { ...form, nights: Number(form.nights), adults: Number(form.adults), children: Number(form.children), infants: Number(form.infants) } as any }),
    onMutate: () => setLoading(true),
    onSuccess: (out: any) => { setLoading(false); onOpenChange(false); onCreated(out.id); },
    onError: (e: any) => { setLoading(false); toast.error(e.message); },
  });
  const toggle = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x: string) => x !== v) : [...f[k], v] }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" />Create AI Itinerary</SheetTitle></SheetHeader>
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto h-20 w-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <div className="font-semibold text-lg">Creating your perfect itinerary…</div>
            <div className="text-sm text-muted-foreground">Understanding, planning days, fetching images, saving services.</div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div><Label>Package Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Manali Sissu Shimla Package" /></div>
            <div><Label>Destination *</Label><DestinationsCombo value={form.destinations} onChange={(v) => setForm({ ...form, destinations: v })} /></div>
            <div className="text-sm text-primary font-semibold">Total: {form.nights} Nights / {days} Days</div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>Nights</Label><Input type="number" value={form.nights} onChange={(e) => setForm({ ...form, nights: e.target.value })} /></div>
              <div><Label>Adults</Label><Input type="number" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} /></div>
              <div><Label>Children</Label><Input type="number" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} /></div>
              <div><Label>Infants</Label><Input type="number" value={form.infants} onChange={(e) => setForm({ ...form, infants: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Meal Plan</Label>
                <Select value={form.meal_plan} onValueChange={(v) => setForm({ ...form, meal_plan: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose Meal Plan" /></SelectTrigger>
                  <SelectContent><SelectItem value="EP">EP</SelectItem><SelectItem value="CP">CP</SelectItem><SelectItem value="MAP">MAP</SelectItem><SelectItem value="AP">AP</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Travel Style</Label>
                <Select value={form.travel_style} onValueChange={(v) => setForm({ ...form, travel_style: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Relaxed">Relaxed</SelectItem><SelectItem value="Balanced">Balanced</SelectItem><SelectItem value="Packed">Packed</SelectItem><SelectItem value="Honeymoon">Honeymoon</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-semibold mb-2">Interests</div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <label key={i} className="flex items-center gap-2 border rounded-full px-3 py-1 text-sm cursor-pointer">
                    <Checkbox checked={form.interests.includes(i)} onCheckedChange={() => toggle("interests", i)} />{i}
                  </label>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="font-semibold mb-2">Include Services</div>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((i) => (
                  <label key={i} className="flex items-center gap-2 border rounded-full px-3 py-1 text-sm cursor-pointer">
                    <Checkbox checked={form.include_services.includes(i)} onCheckedChange={() => toggle("include_services", i)} />{i}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">Hotel Category</div>
                <RadioGroup value={form.hotel_category} onValueChange={(v) => setForm({ ...form, hotel_category: v })} className="flex gap-3">
                  {HOTEL_CATS.map((c) => <label key={c.v} className="flex items-center gap-1.5 text-sm"><RadioGroupItem value={c.v} />{c.l}</label>)}
                </RadioGroup>
              </div>
              <div className="border rounded-lg p-3">
                <div className="font-semibold mb-2">Package Options</div>
                <RadioGroup value={form.package_option} onValueChange={(v) => setForm({ ...form, package_option: v })} className="flex flex-wrap gap-2">
                  {PKG_OPTS.map((p) => <label key={p} className="flex items-center gap-1.5 text-sm"><RadioGroupItem value={p} />{p}</label>)}
                </RadioGroup>
              </div>
            </div>
            <div><Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Special Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Example: Honeymoon style, less walking, premium feel." /></div>
          </div>
        )}
        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => create.mutate()} disabled={loading || !form.title || form.destinations.length === 0}><Sparkles className="h-4 w-4 mr-1" />Generate Itinerary</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
