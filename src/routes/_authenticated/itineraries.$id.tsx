import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getItinerary, upsertItinerary, addItineraryDay, deleteItineraryDay, updateItineraryDay,
  addItineraryService, deleteItineraryService, updateItineraryService, publishItinerary,
  getGitInventory, resyncGitCosting, cloneItineraryToLead, confirmItinerary, reopenItinerary, markItinerarySent,
} from "@/lib/sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Trash2, Share2, Eye, FileText, ImageIcon, Hotel, Car, Camera, Plane, Ship, Bus, Train, Utensils, Settings, Edit2, X, Download, MessageCircle, Mail, MapPin, Minus, Calendar, HandCoins, BookmarkPlus, CheckCircle2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AddHotelChooser, AddHotelManualDialog, AddHotelGeminiDialog } from "@/components/itinerary/add-hotel-dialog";
import { SingleImagePicker } from "@/components/masters/single-image-picker";
import { SendWhatsAppDialog } from "@/components/itinerary/send-whatsapp-dialog";
import { AIEditDialog } from "@/components/itinerary/ai-edit-dialog";
import { getTenantSettings } from "@/lib/settings.functions";
import { Logo } from "@/components/app/logo";
import { fieldsForServiceType, type FieldDef } from "@/lib/service-fields";

function ServiceMasterFields({ serviceType, meta, onChange }: { serviceType: string; meta: any; onChange: (m: any) => void }) {
  const fields = fieldsForServiceType(serviceType);
  if (fields.length === 0) return null;
  const getVal = (fd: FieldDef) => (fd.path === "meta" ? meta?.[fd.key] ?? "" : meta?.[fd.key] ?? "");
  const setVal = (fd: FieldDef, v: any) => onChange({ ...(meta ?? {}), [fd.key]: v });
  return (
    <div className="col-span-2 rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {serviceType} details (from Masters)
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((fd) => {
          const val = getVal(fd);
          const wrap = fd.span === 2 ? "col-span-2" : "";
          const input = fd.type === "textarea" ? (
            <Textarea rows={2} value={val} placeholder={fd.placeholder} onChange={(e) => setVal(fd, e.target.value)} />
          ) : fd.type === "select" ? (
            <Select value={val || ""} onValueChange={(v) => setVal(fd, v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{(fd.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input
              type={
                fd.type === "number" ? "number"
                : fd.type === "time" ? "time"
                : fd.type === "date" ? "date"
                : fd.type === "datetime" ? "datetime-local"
                : "text"}
              value={val}
              placeholder={fd.placeholder}
              onChange={(e) => setVal(fd, fd.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
            />
          );
          return (
            <div key={fd.key} className={wrap}>
              <Label className="text-xs">{fd.label}{fd.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
              {input}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/itineraries/$id")({
  head: () => ({ meta: [{ title: "Itinerary Builder — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: ItinBuilder,
});

const SERVICE_TYPES = [
  { v: "hotel", l: "Hotel", icon: Hotel },
  { v: "transport", l: "Transport", icon: Car },
  { v: "sightseeing", l: "Sightseeing", icon: Camera },
  { v: "flight", l: "Flight", icon: Plane },
  { v: "cruise", l: "Cruise", icon: Ship },
  { v: "bus", l: "Bus", icon: Bus },
  { v: "train", l: "Train", icon: Train },
  { v: "meal", l: "Meal", icon: Utensils },
];
const iconFor = (t: string) => SERVICE_TYPES.find(s => s.v === t)?.icon ?? Settings;
const labelFor = (t: string) => SERVICE_TYPES.find(s => s.v === t)?.l ?? t;

const DEFAULT_TERMS = [
  { title: "Inclusions", items: ["Accommodation as per selected package option.", "Meals as per plan.", "Transfers and sightseeing as per itinerary.", "Driver allowance, toll tax and parking for included transfers."] },
  { title: "Exclusions", items: ["Airfare, train fare, visa fee or insurance unless specifically mentioned.", "Personal expenses.", "Entry tickets, guide charges, adventure activities unless mentioned.", "Anything not mentioned under inclusions."] },
  { title: "Payment Policy", items: ["Package confirmation is subject to advance payment and availability.", "Balance payment must be completed before travel date or as per company policy.", "Rates may change until booking is confirmed."] },
  { title: "Cancellation Policy", items: ["Cancellation charges will apply as per hotel, transport and supplier policies.", "No refund for no-show, early check-out or unused services.", "Cancellation requests must be shared in writing."] },
  { title: "Important Notes", items: ["Standard hotel check-in and check-out timings will apply.", "Vehicle will be provided as per itinerary and will not be at disposal unless mentioned.", "Final vouchers will be shared after full payment and booking confirmation.", "Government taxes or entry rules may change without prior notice."] },
];

function ItinBuilder() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getItinerary);
  const saveFn = useServerFn(upsertItinerary);
  const addDayFn = useServerFn(addItineraryDay);
  const updDayFn = useServerFn(updateItineraryDay);
  const delDayFn = useServerFn(deleteItineraryDay);
  const addSvcFn = useServerFn(addItineraryService);
  const updSvcFn = useServerFn(updateItineraryService);
  const delSvcFn = useServerFn(deleteItineraryService);
  const publishFn = useServerFn(publishItinerary);
  const cloneFn = useServerFn(cloneItineraryToLead);
  const confirmFn = useServerFn(confirmItinerary);
  const reopenFn = useServerFn(reopenItinerary);
  const markSentFn = useServerFn(markItinerarySent);
  const { data: it, isLoading } = useQuery({ queryKey: ["itinerary", id], queryFn: () => getFn({ data: { id } }) });
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [editCover, setEditCover] = useState(false);
  const [editDay, setEditDay] = useState<any>(null);
  const [editService, setEditService] = useState<any>(null);
  const [editingTerm, setEditingTerm] = useState<number | null>(null);
  const [hotelChooserOpen, setHotelChooserOpen] = useState(false);
  const [hotelManualOpen, setHotelManualOpen] = useState(false);
  const [hotelGeminiOpen, setHotelGeminiOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [costingOpen, setCostingOpen] = useState(false);
  const [costPosition, setCostPosition] = useState<"top" | "bottom" | "hidden">("top");
  const [supplierCostOpen, setSupplierCostOpen] = useState(false);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [slotEditor, setSlotEditor] = useState<any | null>(null);
  const tenantFn = useServerFn(getTenantSettings);
  const tenantQ = useQuery({ queryKey: ["tenant-settings"], queryFn: () => tenantFn() });

  const patchItin = useMutation({
    mutationFn: (patch: any) => saveFn({ data: { id, title: it?.title, ...it, ...patch, destinations: patch.destinations ?? it?.destinations ?? [] } as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
    onError: (e: any) => toast.error(e.message),
  });
  const addDay = useMutation({
    mutationFn: (day_no: number) => addDayFn({ data: { itinerary_id: id, day_no, title: `Day ${day_no}` } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const delDay = useMutation({
    mutationFn: (d: string) => delDayFn({ data: { id: d } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const addSvc = useMutation({
    mutationFn: (payload: any) => addSvcFn({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const updSvc = useMutation({
    mutationFn: (payload: any) => updSvcFn({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const updDay = useMutation({
    mutationFn: (payload: any) => updDayFn({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const delSvc = useMutation({
    mutationFn: (d: string) => delSvcFn({ data: { id: d } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["itinerary", id] }),
  });
  const publish = useMutation({
    mutationFn: () => publishFn({ data: { id } }),
    onSuccess: ({ token }) => {
      const url = `${window.location.origin}/portal/${token}`;
      navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Portal link copied · marked as Sent", { description: url });
      qc.invalidateQueries({ queryKey: ["itinerary", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const markSent = useMutation({
    mutationFn: (via: string) => markSentFn({ data: { id, via } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["itinerary", id] });
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
      if (!res?.skipped) toast.success("Marked as Sent");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to mark sent"),
  });
  const saveAsTemplate = useMutation({
    mutationFn: () => cloneFn({ data: { source_id: id, lead_id: null, customer_id: null, title: `${it?.title ?? "Itinerary"} (Template)` } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      qc.invalidateQueries({ queryKey: ["itins-all"] });
      toast.success("Saved to templates — reuse it from any query via Import from Templates.");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save template"),
  });
  const confirmMut = useMutation({
    mutationFn: () => confirmFn({ data: { id } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["itinerary", id] });
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Itinerary confirmed", { description: `Invoice generated — ${(it?.currency ?? "INR")} ${Number(res?.total ?? 0).toFixed(2)}` });
      if ((it as any)?.lead_id) {
        setTimeout(() => nav({ to: "/leads/$id", params: { id: (it as any).lead_id } }), 800);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to confirm itinerary"),
  });
  const reopenMut = useMutation({
    mutationFn: () => reopenFn({ data: { id } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["itinerary", id] });
      qc.invalidateQueries({ queryKey: ["itineraries"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      const n = Number(res?.deleted_invoices ?? 0);
      toast.success("Itinerary reopened for editing", {
        description: n > 0 ? `Removed ${n} previous invoice${n > 1 ? "s" : ""} — a fresh one will be generated on re-confirm.` : "Edit freely and confirm again when done.",
      });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to reopen itinerary"),
  });
  const isConfirmed = (it as any)?.status === "confirmed";
  const isSent = (it as any)?.status === "sent";

  const days = ((it as any)?.itinerary_days ?? []) as any[];
  const services = ((it as any)?.itinerary_services ?? []) as any[];

  useEffect(() => { if (!activeDay && days.length > 0) setActiveDay(days[0].id); }, [days, activeDay]);

  const currentDay = days.find((d) => d.id === activeDay) ?? days[0];
  const dayServices = services.filter((s) => s.day_id === currentDay?.id);

  const subtotal = services.reduce((s: number, x: any) => s + Number(x.price ?? 0), 0);
  const markupType = it?.markup_type ?? "flat";
  const markupVal = Number(it?.markup_value ?? 0);
  const markup = markupType === "percent" ? subtotal * markupVal / 100 : markupVal;
  const gstApplyOn = it?.gst_apply_on ?? "total";
  const gstBase = gstApplyOn === "markup" ? markup : subtotal + markup;
  const igstRate = Number(it?.tax_rate ?? 0);
  const cgstRate = Number((it as any)?.cgst_rate ?? 0);
  const sgstRate = Number((it as any)?.sgst_rate ?? 0);
  const totalGstRate = igstRate + cgstRate + sgstRate;
  const taxable = subtotal + markup;
  const taxRate = totalGstRate;
  const igstAmt = gstBase * igstRate / 100;
  const cgstAmt = gstBase * cgstRate / 100;
  const sgstAmt = gstBase * sgstRate / 100;
  const tax = igstAmt + cgstAmt + sgstAmt;
  const tcsRate = Number(it?.tcs_rate ?? 0);
  const tcsAmt = taxable * tcsRate / 100;
  const total = taxable + tax + tcsAmt;
  const currency = it?.currency ?? "INR";
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;
  const termsBlocks = useMemo(() => {
    const raw = (it?.terms_blocks as any[]) ?? [];
    return raw.length ? raw : DEFAULT_TERMS;
  }, [it]);

  if (isLoading || !it) return <div className="p-8 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if ((it as any)?.lead_id) {
              nav({ to: "/leads/$id", params: { id: (it as any).lead_id } });
            } else {
              nav({ to: "/itineraries" });
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>{it.title}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
            <span>{it.nights ?? 0} Nights · {(it.nights ?? 0) + 1} Days</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-orange-600 font-medium"><ImageIcon className="h-3 w-3" />{(it.destinations ?? [])[0] ?? "—"}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">{it.adults} Adult · {it.children} Child · {it.infants ?? 0} Infant</div>
          <Button variant="outline" onClick={() => publish.mutate()} disabled={publish.isPending}><Share2 className="h-4 w-4 mr-1" />Publish</Button>
          {!isConfirmed && (
            <Button
              variant="outline"
              onClick={() => markSent.mutate("manual")}
              disabled={markSent.isPending || isSent}
              className={isSent ? "border-blue-600 text-blue-700" : ""}
              title={isSent ? "Already marked as Sent" : "Mark this quotation as Sent to client"}
            >
              <Mail className="h-4 w-4 mr-1" />
              {isSent ? "Sent" : markSent.isPending ? "Marking…" : "Mark as Sent"}
            </Button>
          )}
          <Button variant="outline" onClick={() => saveAsTemplate.mutate()} disabled={saveAsTemplate.isPending}><BookmarkPlus className="h-4 w-4 mr-1" />{saveAsTemplate.isPending ? "Saving…" : "Save as Template"}</Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 mr-1" />Preview</Button>
          <Button variant="outline" onClick={() => setSupplierCostOpen(true)}><HandCoins className="h-4 w-4 mr-1" />Supplier Cost</Button>
          <Button variant="outline" onClick={() => setCostingOpen(true)}><FileText className="h-4 w-4 mr-1" />Costing Summary</Button>
          {isConfirmed ? (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Reopen this itinerary for editing? Status will change to Draft and any invoice previously generated from this itinerary will be deleted so a fresh one is created when you confirm again.")) {
                  reopenMut.mutate();
                }
              }}
              disabled={reopenMut.isPending}
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              title="Reopen to edit — you can confirm again after changes"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />{reopenMut.isPending ? "Reopening…" : "Confirmed · Reopen to edit"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (confirm("Confirm this itinerary and generate the invoice? Any other confirmed itinerary on this query will be marked rejected.")) {
                  confirmMut.mutate();
                }
              }}
              disabled={confirmMut.isPending || !(it as any)?.lead_id}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              title={!(it as any)?.lead_id ? "Attach this itinerary to a query first" : "Confirm & generate invoice"}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />{confirmMut.isPending ? "Confirming…" : "Confirm & Invoice"}
            </Button>
          )}
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setAiEditOpen(true)}>
            <Wand2 className="h-4 w-4 mr-1" />AI Itinerary Edit
          </Button>
        </div>
      </div>

      <AIEditDialog open={aiEditOpen} onOpenChange={setAiEditOpen} itineraryId={id} title={it.title} />

      {/* Cover */}
      <div className="relative rounded-2xl overflow-hidden border h-64 bg-muted">
        {it.cover_url ? <img src={it.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/40 grid place-items-center text-primary/60">No cover image</div>}
        <Button size="sm" variant="secondary" className="absolute top-3 right-3" onClick={() => setEditCover(true)}><ImageIcon className="h-4 w-4 mr-1" />Edit Cover Image</Button>
      </div>

      {/* Grid layout: Days sidebar | Day content | Costing sidebar */}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_320px]">
        {/* Days navigator */}
        <Card className="h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Days</CardTitle><div className="text-xs text-muted-foreground">{days.length} days</div></CardHeader>
          <CardContent className="space-y-2 p-2">
            {days.map((d) => {
              const active = d.id === (currentDay?.id ?? "");
              const dayIcons = services.filter((s) => s.day_id === d.id).map((s) => s.service_type);
              return (
                <button key={d.id} onClick={() => setActiveDay(d.id)}
                  className={`w-full text-left rounded-xl border p-3 space-y-1 ${active ? "border-l-4 border-l-orange-500 bg-orange-50" : "hover:bg-muted/50"}`}>
                  <div className="text-xs text-muted-foreground">Day {d.day_no}</div>
                  <div className="font-semibold text-sm">{d.title || `Day ${d.day_no}`}</div>
                  {d.subtitle && <div className="text-xs text-muted-foreground">{d.subtitle}</div>}
                  <div className="flex gap-1 pt-1">
                    {[...new Set(dayIcons)].slice(0, 4).map((t: any) => {
                      const Icon = iconFor(t);
                      return <Icon key={t} className="h-3 w-3 text-primary" />;
                    })}
                  </div>
                </button>
              );
            })}
            <Button variant="outline" size="sm" className="w-full" onClick={() => addDay.mutate(days.length + 1)}><Plus className="h-4 w-4 mr-1" />Add Day</Button>
          </CardContent>
        </Card>

        {/* Day content */}
        <div className="space-y-4">
          {currentDay ? (
            <>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Day {currentDay.day_no} — {currentDay.title}</CardTitle>
                  <div className="flex gap-2">
                    <Select onValueChange={(v) => {
                      if (v === "hotel") { setHotelChooserOpen(true); return; }
                      setEditService({ service_type: v, itinerary_id: id, day_id: currentDay.id, title: "", qty: 1, cost: 0, markup: 0 });
                    }}>
                      <SelectTrigger className="w-40 h-9 text-primary border-primary"><SelectValue placeholder="+ Add Service" /></SelectTrigger>
                      <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setEditDay({ ...currentDay })}><Edit2 className="h-4 w-4 mr-1" />Edit Day</Button>
                    <Button variant="ghost" size="icon" onClick={() => delDay.mutate(currentDay.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(currentDay.description || currentDay.subtitle) && (
                    <div className="flex gap-3 items-start">
                      {currentDay.image_url && <img src={currentDay.image_url} alt="" className="h-24 w-32 rounded-lg object-cover" />}
                      <div>
                        <div className="font-medium">{currentDay.subtitle}</div>
                        <div className="text-sm text-muted-foreground">{currentDay.description}</div>
                      </div>
                    </div>
                  )}

                  {dayServices.map((s) => {
                    const Icon = iconFor(s.service_type);
                    return (
                      <div key={s.id} className="flex gap-3 border rounded-xl p-3 hover:bg-muted/20">
                        <div className="h-24 w-32 rounded-lg bg-muted grid place-items-center overflow-hidden flex-shrink-0">
                          {s.image_url ? <img src={s.image_url} alt="" className="h-full w-full object-cover" /> : <Icon className="h-8 w-8 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs uppercase text-muted-foreground">{labelFor(s.service_type)}</div>
                          <div className="font-semibold">{s.title}</div>
                          {s.supplier && <div className="text-xs text-muted-foreground">{s.supplier}</div>}
                          {s.address && <div className="text-xs text-muted-foreground">Address: {s.address}</div>}
                          {s.description && <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</div>}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-semibold text-primary">{fmt(Number(s.price ?? 0))}</div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditService(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => delSvc.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {dayServices.length === 0 && <div className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-xl">No services yet. Add a hotel, transport or sightseeing.</div>}
                </CardContent>
              </Card>

              {/* Package Terms & Policies */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Package Terms &amp; Policies</CardTitle>
                      <div className="text-xs text-muted-foreground">Default blocks are copied from Organization settings. Edit for this itinerary.</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { const next = [...termsBlocks, { title: "New Block", items: [] }]; patchItin.mutate({ terms_blocks: next }); }}><Plus className="h-4 w-4 mr-1" />Add Terms Block</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {termsBlocks.map((b: any, idx: number) => (
                    <div key={idx} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-orange-600">{b.title}</div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => setEditingTerm(idx)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => { const next = termsBlocks.filter((_: any, i: number) => i !== idx); patchItin.mutate({ terms_blocks: next }); }}>Delete</Button>
                        </div>
                      </div>
                      <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                        {(b.items ?? []).map((it: string, i: number) => <li key={i}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="p-10 text-center text-muted-foreground">No days yet. Add a day to start building.</CardContent></Card>
          )}
        </div>

        {/* Costing sidebar */}
        {(() => {
          const lead: any = (it as any).leads;
          const isGitTemplate = (it as any).package_type === "GIT";
          const isGitLead = /git/i.test(lead?.service_type ?? "") || /git/i.test(lead?.query_type ?? "");
          if (isGitTemplate) {
            return (
              <SlotsSidebar
                it={it as any}
                fmt={fmt}
                onAdd={() => setSlotEditor({})}
                onEdit={(s: any) => setSlotEditor(s)}
                onDelete={(idx: number) => {
                  const next = ((it as any).slots ?? []).filter((_: any, i: number) => i !== idx);
                  patchItin.mutate({ slots: next });
                }}
                onPreview={() => setPreviewOpen(true)}
              />
            );
          }
          if (isGitLead) {
            return (
              <GitCostingSidebar
                it={it as any}
                lead={lead}
                currency={currency}
                fmt={fmt}
                onPatch={(patch: any) => patchItin.mutate(patch)}
                onPreview={() => setPreviewOpen(true)}
              />
            );
          }
          return (
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Big total */}
            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 p-4 text-center">
              <div className="text-[11px] uppercase tracking-wider text-orange-700 font-semibold">Client Price</div>
              <div className="text-3xl font-bold tracking-tight text-orange-600 mt-1">{fmt(total)}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {Number(it.adults ?? 0) > 0 && <>Per adult <span className="font-semibold text-foreground">{fmt(total / Number(it.adults))}</span></>}
              </div>
            </div>

            {/* Simple breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Services subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Markup</span><span className="font-medium">+ {fmt(markup)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span className="font-medium">+ {fmt(tax)}</span></div>
              {tcsAmt > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TCS</span><span className="font-medium">+ {fmt(tcsAmt)}</span></div>}
            </div>

            {/* Markup — single row */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your markup</Label>
              <div className="flex gap-2">
                <Input
                  key={`mk-${it.id}-${it.markup_value ?? 0}`}
                  type="number"
                  className="h-9 flex-1"
                  defaultValue={it.markup_value ?? 0}
                  onBlur={(e) => patchItin.mutate({ markup_value: Number(e.target.value) })}
                />
                <Select value={it.markup_type ?? "flat"} onValueChange={(v) => patchItin.mutate({ markup_type: v })}>
                  <SelectTrigger className="w-20 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="flat">₹</SelectItem><SelectItem value="percent">%</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            {/* GST — single row (5% default) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GST rate</Label>
              <div className="flex gap-2 items-center">
                <Input
                  key={`gst-${it.id}-${igstRate}`}
                  type="number"
                  className="h-9 flex-1"
                  defaultValue={igstRate}
                  onBlur={(e) => patchItin.mutate({ tax_rate: Number(e.target.value) })}
                />
                <span className="text-xs text-muted-foreground w-8">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Standard GST for tour packages is 5%.</p>
            </div>

            {/* Advanced */}
            <details className="group border rounded-lg">
              <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground">
                <span>Advanced options</span>
                <span className="group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-3 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-[11px]">CGST %</Label><Input key={`cgst-${it.id}-${cgstRate}`} type="number" className="h-8" defaultValue={cgstRate} onBlur={(e) => patchItin.mutate({ cgst_rate: Number(e.target.value) })} /></div>
                  <div><Label className="text-[11px]">SGST %</Label><Input key={`sgst-${it.id}-${sgstRate}`} type="number" className="h-8" defaultValue={sgstRate} onBlur={(e) => patchItin.mutate({ sgst_rate: Number(e.target.value) })} /></div>
                  <div><Label className="text-[11px]">TCS %</Label><Input key={`tcs-${it.id}-${tcsRate}`} type="number" className="h-8" defaultValue={tcsRate} onBlur={(e) => patchItin.mutate({ tcs_rate: Number(e.target.value) })} /></div>
                  <div><Label className="text-[11px]">Currency</Label>
                    <Select value={currency} onValueChange={(v) => patchItin.mutate({ currency: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{["INR","USD","EUR","GBP","AED"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-[11px]">GST applies on</Label>
                  <Select value={it.gst_apply_on ?? "total"} onValueChange={(v) => patchItin.mutate({ gst_apply_on: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="total">Subtotal + Markup</SelectItem><SelectItem value="markup">Markup only</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[11px]">Costing type</Label>
                  <Select value={it.costing_type ?? "service_wise"} onValueChange={(v) => patchItin.mutate({ costing_type: v })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="service_wise">Service Wise</SelectItem><SelectItem value="one_time">One Time</SelectItem></SelectContent>
                  </Select>
                </div>
                {(Number(it.children ?? 0) > 0 || Number(it.infants ?? 0) > 0) && (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    {Number(it.children ?? 0) > 0 && <PerPax label="Per Child" value={fmt(total / Number(it.children))} />}
                    {Number(it.infants ?? 0) > 0 && <PerPax label="Per Infant" value={fmt(total / Number(it.infants))} />}
                  </div>
                )}
              </div>
            </details>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button variant="outline" className="w-full" onClick={() => setCostingOpen(true)}><FileText className="h-4 w-4 mr-1" />Costing Summary</Button>
              <Button variant="outline" className="w-full" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4 mr-1" />Preview Itinerary</Button>
            </div>
          </CardContent>
        </Card>
          );
        })()}
      </div>

      {/* Dialogs */}
      <Dialog open={editCover} onOpenChange={setEditCover}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cover Image</DialogTitle></DialogHeader>
          <Label>Cover image</Label>
          <SingleImagePicker
            value={it.cover_url ?? ""}
            onChange={(url) => patchItin.mutate({ cover_url: url })}
            folder="itineraries"
          />
          <div className="flex justify-end"><Button onClick={() => setEditCover(false)}>Done</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDay} onOpenChange={(o) => !o && setEditDay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Day</DialogTitle></DialogHeader>
          {editDay && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editDay.title ?? ""} onChange={(e) => setEditDay({ ...editDay, title: e.target.value })} /></div>
              <div><Label>Subtitle</Label><Input value={editDay.subtitle ?? ""} onChange={(e) => setEditDay({ ...editDay, subtitle: e.target.value })} placeholder="e.g. Arrival in Dubai" /></div>
              <div><Label>Location</Label><Input value={editDay.location ?? ""} onChange={(e) => setEditDay({ ...editDay, location: e.target.value })} /></div>
              <div><Label>Image</Label>
                <SingleImagePicker value={editDay.image_url ?? ""} onChange={(url) => setEditDay({ ...editDay, image_url: url })} folder="itineraries" />
              </div>
              <div><Label>Description</Label><Textarea rows={4} value={editDay.description ?? ""} onChange={(e) => setEditDay({ ...editDay, description: e.target.value })} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditDay(null)}>Cancel</Button><Button onClick={() => { updDay.mutate({ id: editDay.id, title: editDay.title, subtitle: editDay.subtitle, location: editDay.location, description: editDay.description, image_url: editDay.image_url }); setEditDay(null); }}>Save</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editService} onOpenChange={(o) => !o && setEditService(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editService?.id ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          {editService && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={editService.service_type} onValueChange={(v) => setEditService({ ...editService, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Supplier</Label><Input value={editService.supplier ?? ""} onChange={(e) => setEditService({ ...editService, supplier: e.target.value })} /></div>
              <div className="col-span-2"><Label>Title</Label><Input value={editService.title ?? ""} onChange={(e) => setEditService({ ...editService, title: e.target.value })} placeholder="e.g. ibis Styles Dubai Jumeira - Basic" /></div>
              <div className="col-span-2"><Label>Address</Label><Input value={editService.address ?? ""} onChange={(e) => setEditService({ ...editService, address: e.target.value })} /></div>
              <div className="col-span-2"><Label>Image</Label>
                <SingleImagePicker value={editService.image_url ?? ""} onChange={(url) => setEditService({ ...editService, image_url: url })} folder="itineraries" />
              </div>
              <div className="col-span-2"><Label>Description</Label><Textarea rows={3} value={editService.description ?? ""} onChange={(e) => setEditService({ ...editService, description: e.target.value })} /></div>
              <ServiceMasterFields
                serviceType={editService.service_type}
                meta={editService.meta ?? {}}
                onChange={(meta) => setEditService({ ...editService, meta })}
              />
              <div><Label>Qty</Label><Input type="number" value={editService.qty ?? 1} onChange={(e) => setEditService({ ...editService, qty: Number(e.target.value) })} /></div>
              <div><Label>Cost per unit</Label><Input type="number" value={editService.cost ?? 0} onChange={(e) => setEditService({ ...editService, cost: Number(e.target.value) })} /></div>
              <div className="col-span-2"><Label>Markup (flat)</Label><Input type="number" value={editService.markup ?? 0} onChange={(e) => setEditService({ ...editService, markup: Number(e.target.value) })} /></div>
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditService(null)}>Cancel</Button>
                <Button onClick={() => {
                  const meta = editService.meta ?? {};
                  if (editService.id) updSvc.mutate({ id: editService.id, title: editService.title, description: editService.description, supplier: editService.supplier, address: editService.address, image_url: editService.image_url, qty: editService.qty, cost: editService.cost, markup: editService.markup, meta });
                  else addSvc.mutate({ itinerary_id: id, day_id: editService.day_id, service_type: editService.service_type, title: editService.title, description: editService.description, supplier: editService.supplier, address: editService.address, image_url: editService.image_url, qty: editService.qty, cost: editService.cost, markup: editService.markup, meta });
                  setEditService(null);
                }}>{editService.id ? "Save" : "Add"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editingTerm !== null} onOpenChange={(o) => !o && setEditingTerm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Terms Block</DialogTitle></DialogHeader>
          {editingTerm !== null && termsBlocks[editingTerm] && (
            <TermsEditor block={termsBlocks[editingTerm]} onSave={(b) => { const next = termsBlocks.map((x: any, i: number) => i === editingTerm ? b : x); patchItin.mutate({ terms_blocks: next }); setEditingTerm(null); }} onCancel={() => setEditingTerm(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AddHotelChooser
        open={hotelChooserOpen}
        onOpenChange={setHotelChooserOpen}
        onManual={() => { setHotelChooserOpen(false); setHotelManualOpen(true); }}
        onGemini={() => { setHotelChooserOpen(false); setHotelGeminiOpen(true); }}
      />
      <AddHotelManualDialog
        open={hotelManualOpen}
        onOpenChange={setHotelManualOpen}
        defaultLocation={currentDay?.location ?? (it.destinations ?? [])[0]}
        defaultNights={1}
        onSave={(p) => {
          const totalRooms = p.rooms.reduce((s, r) => s + r.count, 0) || 1;
          addSvc.mutate({
            itinerary_id: id,
            day_id: currentDay?.id,
            service_type: "hotel",
            title: p.title,
            supplier: p.supplier,
            address: p.address,
            image_url: p.image_url,
            description: p.description,
            qty: totalRooms,
            cost: p.supplier_cost / totalRooms,
            markup: Math.max(0, p.selling_total - p.supplier_cost),
            checkin_time: p.checkin_time,
            checkout_time: p.checkout_time,
            meta: {
              package_option: p.package_option,
              star: p.star,
              room_type: p.room_type,
              meal_plan: p.meal_plan,
              nights: p.nights,
              checkin_time: p.checkin_time,
              checkout_time: p.checkout_time,
              rooms: p.rooms,
              images: p.images,
              selling_total: p.selling_total,
              supplier_cost: p.supplier_cost,
            },
          });
          setHotelManualOpen(false);
          toast.success("Hotel added");
        }}
      />

      <AddHotelGeminiDialog
        open={hotelGeminiOpen}
        onOpenChange={setHotelGeminiOpen}
        defaultCity={currentDay?.location ?? (it.destinations ?? [])[0]}
        defaultCheckin={it.start_date ?? undefined}
        defaultCheckout={it.end_date ?? undefined}
        defaultAdults={Number(it.adults ?? 2)}
        defaultChildren={Number(it.children ?? 0)}
        onSave={(p) => {
          const totalRooms = p.rooms.reduce((s, r) => s + r.count, 0) || 1;
          addSvc.mutate({
            itinerary_id: id,
            day_id: currentDay?.id,
            service_type: "hotel",
            title: p.title,
            supplier: p.supplier,
            address: p.address,
            image_url: p.image_url,
            description: p.description,
            qty: totalRooms,
            cost: p.supplier_cost / totalRooms,
            markup: Math.max(0, p.selling_total - p.supplier_cost),
            meta: {
              package_option: p.package_option,
              star: p.star,
              room_type: p.room_type,
              meal_plan: p.meal_plan,
              nights: p.nights,
              rooms: p.rooms,
              images: p.images,
              selling_total: p.selling_total,
              supplier_cost: p.supplier_cost,
              source: "gemini_research",
            },
          });
          toast.success("Hotel added from Gemini AI");
        }}
      />

      <CostingSummaryDialog
        open={costingOpen}
        onOpenChange={setCostingOpen}
        it={it}
        days={days}
        services={services}
        subtotal={subtotal}
        markup={markup}
        tax={tax}
        total={total}
        tcsAmt={tcsAmt}
        gstRate={totalGstRate}
        tcsRate={tcsRate}
        gstApplyOn={gstApplyOn}
        fmt={fmt}
        labelFor={labelFor}
      />

      <PreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        it={it}
        days={days}
        services={services}
        total={total}
        fmt={fmt}
        termsBlocks={termsBlocks}
        tenant={(tenantQ.data as any)?.tenant}
        costPosition={costPosition}
        setCostPosition={setCostPosition}
        publish={() => publish.mutate()}
        onSent={(via: string) => markSent.mutate(via)}
      />

      <SupplierCostSheet
        open={supplierCostOpen}
        onOpenChange={setSupplierCostOpen}
        services={services}
        days={days}
        currency={currency}
        onSave={async (rows: any[]) => {
          for (const r of rows) {
            await updSvc.mutateAsync({
              id: r.id,
              supplier: r.supplier,
              meta: { ...(r.meta ?? {}), supplier_total_cost: r.supplier_total_cost, supplier_currency: r.supplier_currency },
            });
          }
          setSupplierCostOpen(false);
          toast.success("Supplier cost saved");
        }}
      />

      <SlotEditorSheet
        open={!!slotEditor}
        initial={slotEditor}
        onOpenChange={(o: boolean) => !o && setSlotEditor(null)}
        onSave={(s: any) => {
          const list = ((it as any).slots ?? []) as any[];
          const next = s.__index != null
            ? list.map((x: any, i: number) => (i === s.__index ? { ...s, __index: undefined } : x))
            : [...list, s];
          patchItin.mutate({ slots: next });
          setSlotEditor(null);
        }}
      />
    </div>
  );
}

function PerPax({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-2 text-center"><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div className="text-xs font-semibold">{value}</div></div>;
}

function TaxRow({ label, defaultValue, onBlur, amount }: { label: string; defaultValue: number; onBlur: (v: number) => void; amount: string }) {
  return (
    <div className="grid grid-cols-[60px_1fr_16px_1fr] items-center gap-2 text-xs">
      <span>{label}</span>
      <Input type="number" className="h-7" defaultValue={defaultValue} onBlur={(e) => onBlur(Number(e.target.value))} />
      <span>%</span>
      <span className="text-right">{amount}</span>
    </div>
  );
}

function TermsEditor({ block, onSave, onCancel }: { block: any; onSave: (b: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(block.title);
  const [items, setItems] = useState<string[]>(block.items ?? []);
  return (
    <div className="space-y-3">
      <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-2">
        <Label>Items</Label>
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => setItems(items.map((x, j) => j === i ? e.target.value : x))} />
            <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setItems([...items, ""])}><Plus className="h-4 w-4 mr-1" />Add item</Button>
      </div>
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={() => onSave({ title, items: items.filter(Boolean) })}>Save</Button></div>
    </div>
  );
}

function PreviewSheet({ open, onOpenChange, it, days, services, total, fmt, termsBlocks, tenant, costPosition, setCostPosition, publish, onSent }: any) {
  const agencyName = tenant?.name || tenant?.agency_name || "Your Workspace";
  const logoUrl = tenant?.logo_url as string | undefined;
  const brandColor = tenant?.primary_color || "#48a890";
  const initials = agencyName.split(/\s+/).filter(Boolean).slice(0,2).map((w: string) => w[0]?.toUpperCase()).join("") || "TW";
  const nights = it.nights ?? 0;
  const dest = (it.destinations ?? [])[0] ?? "";
  const customer = it.customers || it.leads;
  const phone = customer?.phone || customer?.mobile;
  const email = customer?.email;
  const publicUrl = it.portal_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${it.portal_token}` : "";

  const [waOpen, setWaOpen] = useState(false);
  const openWhatsApp = () => setWaOpen(true);
  const sendEmail = () => {
    if (!publicUrl) { publish(); toast.info("Publish first to get the share link."); return; }
    const subject = encodeURIComponent(`Itinerary: ${it.title}`);
    const body = encodeURIComponent(`Hi,\n\nPlease find your itinerary here:\n${publicUrl}\n\nRegards,\n${agencyName}`);
    window.location.href = `mailto:${email ?? ""}?subject=${subject}&body=${body}`;
    onSent?.("email");
  };
  const downloadWord = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${it.title}</title></head><body>${document.getElementById("itin-preview-doc")?.innerHTML ?? ""}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${it.title || "itinerary"}.doc`;
    a.click();
  };
  const downloadPdf = () => {
    const node = document.getElementById("itin-preview-doc");
    if (!node) { window.print(); return; }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((n) => n.outerHTML).join("\n");
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) { window.print(); return; }
    const title = `${it.title || "Itinerary"}`;
    w.document.open();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}
<style>
  @page { size: A4; margin: 10mm; }
  html, body { background: #fff !important; margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .no-print, [data-radix-popper-content-wrapper] { display: none !important; }
  #itin-preview-doc { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
  img { break-inside: avoid; }
  .break-avoid, section, .rounded-2xl { break-inside: avoid; page-break-inside: avoid; }
</style>
</head><body>${node.outerHTML}</body></html>`);
    w.document.close();
    const doPrint = () => {
      try { w.focus(); w.print(); } finally { setTimeout(() => w.close(), 300); }
    };
    // wait for images/styles to load
    if (w.document.readyState === "complete") setTimeout(doPrint, 400);
    else w.addEventListener("load", () => setTimeout(doPrint, 400));
  };

  const CostSummary = (
    <div className="mt-8">
      <div className="font-semibold mb-3">Cost Summary</div>
      <div className="rounded-2xl border p-6 max-w-md mx-auto text-center space-y-3">
        <div className="font-semibold">Basic Package</div>
        <ul className="text-xs text-muted-foreground space-y-1">
          {services.filter((s: any) => s.service_type === "hotel").map((s: any) => (
            <li key={s.id}>• {s.title}</li>
          ))}
          {services.filter((s: any) => s.service_type === "hotel").length === 0 && <li className="opacity-60">Package details</li>}
        </ul>
        <div className="rounded-xl border p-3 inline-block min-w-[180px]">
          <div className="text-xl font-bold">{fmt(it.adults > 0 ? total / Math.max(1, it.adults) : total)}</div>
          <div className="text-[11px] text-muted-foreground">Per Adult</div>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center justify-between text-sm font-semibold" style={{ background: `${brandColor}20`, color: brandColor }}>
          <span>Grand Total</span><span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col print:max-w-full print:shadow-none">
        <SendWhatsAppDialog
          open={waOpen}
          onOpenChange={setWaOpen}
          it={it}
          days={days}
          services={services}
          total={total}
          fmt={fmt}
          termsBlocks={termsBlocks}
          agencyName={agencyName}
          publicUrl={publicUrl}
          onSent={() => onSent?.("whatsapp")}
        />
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b px-5 py-3 bg-background sticky top-0 z-10 print:hidden flex-wrap">
          <div className="font-semibold">Preview Itinerary</div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-muted-foreground">Cost Position</span>
            <Select value={costPosition} onValueChange={(v) => setCostPosition(v as any)}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={downloadWord}><Download className="h-4 w-4 mr-1" />Download Word</Button>
            <Button size="sm" onClick={downloadPdf} style={{ background: brandColor }} className="text-white hover:opacity-90"><Download className="h-4 w-4 mr-1" />Download PDF</Button>
            <Button size="sm" variant="outline" onClick={openWhatsApp}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
            <Button size="sm" variant="outline" onClick={sendEmail}><Mail className="h-4 w-4 mr-1" />Send Email</Button>
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Document */}
        <div className="flex-1 overflow-y-auto bg-muted/30 print:bg-white print:overflow-visible">
          <div id="itin-preview-doc" className="mx-auto my-6 max-w-3xl bg-white text-slate-900 shadow-sm print:shadow-none print:my-0 px-8 py-8">
            {/* Brand header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={agencyName} className="h-10 w-auto" />
                ) : (
                  <div className="grid place-items-center h-10 w-10 rounded-lg text-white text-sm font-bold" style={{ background: brandColor }}>{initials}</div>
                )}
                <div className="text-lg font-semibold">{agencyName}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Prepared by</div>
                <div className="font-semibold text-slate-900">{agencyName}</div>
                <div>{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
            </div>

            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden h-56 mb-6 bg-slate-200">
              {it.cover_url && <img src={it.cover_url} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="text-3xl font-bold drop-shadow">{it.title}</div>
                {dest && <div className="inline-flex items-center gap-1 text-sm mt-1"><MapPin className="h-4 w-4" />{dest}</div>}
              </div>
            </div>

            {costPosition === "top" && CostSummary}

            {/* Days timeline */}
            <div className="mt-8 space-y-8">
              {days.map((d: any) => {
                const ds = services.filter((s: any) => s.day_id === d.id);
                return (
                  <div key={d.id}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="px-3 py-1 rounded-md text-sm font-semibold" style={{ background: `${brandColor}20`, color: brandColor }}>Day {d.day_no}</div>
                      <div className="flex-1 flex gap-4">
                        {d.image_url && <img src={d.image_url} alt="" className="h-24 w-40 rounded-lg object-cover" />}
                        <div className="flex-1">
                          <div className="text-lg font-semibold">{d.title}</div>
                          {d.subtitle && <div className="text-sm text-slate-500">{d.subtitle}</div>}
                          {d.description && <div className="text-sm text-slate-600 mt-1">{d.description}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 border-l-2 border-slate-100 pl-6 space-y-4 relative">
                      {ds.map((s: any, idx: number) => {
                        const Icon = iconFor(s.service_type);
                        return (
                          <div key={s.id} className="flex items-start gap-4 relative">
                            <div className="absolute -left-[34px] top-2 h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold text-white" style={{ background: brandColor }}>{idx + 1}</div>
                            {s.image_url ? (
                              <img src={s.image_url} alt="" className="h-20 w-24 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-20 w-24 rounded-lg bg-slate-100 grid place-items-center flex-shrink-0"><Icon className="h-6 w-6 text-slate-400" /></div>
                            )}
                            <div className="h-8 w-8 rounded-lg grid place-items-center flex-shrink-0" style={{ background: `${brandColor}18`, color: brandColor }}><Icon className="h-4 w-4" /></div>
                            <div className="flex-1">
                              <div className="text-[11px] uppercase tracking-wide text-slate-500">{labelFor(s.service_type)}</div>
                              <div className="font-semibold">{s.title}</div>
                              {s.description && <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{s.description}</div>}
                            </div>
                          </div>
                        );
                      })}
                      {ds.length === 0 && <div className="text-xs text-slate-400">No services planned</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {costPosition === "bottom" && CostSummary}

            {/* Terms */}
            <div className="mt-10 rounded-2xl border p-5">
              <div className="font-semibold mb-3">Package Terms</div>
              <div className="space-y-4">
                {termsBlocks.map((b: any, i: number) => (
                  <div key={i}>
                    <div className="font-semibold text-sm mb-1" style={{ color: brandColor }}>{b.title}</div>
                    <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                      {(b.items ?? []).map((x: string, j: number) => <li key={j}>{x}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t flex items-center justify-center gap-6 text-xs text-slate-500 flex-wrap">
              <span>{agencyName}</span>
              {email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>}
              {phone && <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{phone}</span>}
            </div>
            <div className="mt-3 flex items-center justify-center text-[10px] text-slate-400">
              <span>Powered by <a href="https://trawe.in" className="font-semibold text-slate-500 hover:underline">TraWe</a> — the operating system for modern travel agencies</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CostingSummaryDialog({
  open, onOpenChange, it, days, services, subtotal, markup, tax, total, tcsAmt, gstRate, tcsRate, gstApplyOn, fmt, labelFor,
}: any) {
  const currency = it.currency ?? "INR";
  const pax = `${it.adults ?? 0} Adult${(it.children ?? 0) ? ` · ${it.children} Child` : ""}${(it.infants ?? 0) ? ` · ${it.infants} Infant` : ""}`;
  const dayNoFor = (dayId: string) => {
    const d = days.find((x: any) => x.id === dayId);
    return d ? `Day ${d.day_no}` : "—";
  };
  const supplierCost = services.reduce((sum: number, s: any) => sum + Number(s.cost ?? 0) * Number(s.qty ?? 1), 0);

  // Distribute itinerary-level markup, GST and TCS to each service row by its share of the subtotal.
  // "subtotal" prop is the sum of service.price (cost*qty + service.markup). We allocate the
  // itinerary-level markup proportionally on top.
  const alloc = (s: any) => {
    const cost = Number(s.cost ?? 0) * Number(s.qty ?? 1);
    const svcMk = Number(s.markup ?? 0);
    const lineBase = cost + svcMk;
    const share = subtotal > 0 ? lineBase / subtotal : 0;
    const itMk = Number(markup ?? 0) * share;
    const mk = svcMk + itMk;
    // gstBase depends on gstApplyOn: "markup" → only markup portion, else taxable (cost+mk)
    const gstBaseLine = gstApplyOn === "markup" ? mk : cost + mk;
    const gstLine = gstBaseLine * (Number(gstRate ?? 0) / 100);
    const tcsLine = (cost + mk) * (Number(tcsRate ?? 0) / 100);
    const sell = cost + mk;
    const totalLine = sell + gstLine + tcsLine;
    return { cost, mk, sell, gstLine, tcsLine, totalLine };
  };

  const hotels = services.filter((s: any) => s.service_type === "hotel");
  const sights = services.filter((s: any) => s.service_type === "sightseeing");
  const transport = services.filter((s: any) => ["transport", "bus", "train", "cruise"].includes(s.service_type));
  const others = services.filter((s: any) => !["hotel", "sightseeing", "transport", "bus", "train", "cruise"].includes(s.service_type));

  const sumBy = (arr: any[], k: "cost" | "mk" | "sell" | "gstLine" | "tcsLine" | "totalLine") =>
    arr.reduce((a, s) => a + alloc(s)[k], 0);

  const Section = ({ title, rows, columns }: { title: string; rows: any[]; columns: string[] }) => (
    <div className="rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <span className="h-2 w-2 rounded-full bg-primary" />{title}
        </div>
        <div className="text-xs text-muted-foreground">{rows.length} row{rows.length === 1 ? "" : "s"}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-2 w-10">Sr.</th>
              <th className="text-left p-2">Day</th>
              {columns.map((c) => <th key={c} className="text-left p-2 whitespace-nowrap">{c}</th>)}
              <th className="text-right p-2 whitespace-nowrap">Supplier Cost</th>
              <th className="text-right p-2 whitespace-nowrap">Selling Price</th>
              <th className="text-right p-2 whitespace-nowrap">Markup</th>
              <th className="text-right p-2 whitespace-nowrap">GST/Tax</th>
              <th className="text-right p-2 whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 7} className="p-4 text-center text-muted-foreground">No entries</td></tr>
            )}
            {rows.map((s: any, i: number) => {
              const { cost, mk, sell, gstLine, tcsLine, totalLine } = alloc(s);
              return (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{dayNoFor(s.day_id)}</td>
                  {columns.map((c) => {
                    let val: any = "—";
                    if (c === "Hotel / Service" || c === "Service Name") val = <span className="font-medium">{s.title}</span>;
                    else if (c === "Service") val = labelFor(s.service_type);
                    else if (c === "Supplier") val = s.supplier || "-";
                    else if (c === "City") val = s.meta?.city || s.address || "-";
                    else if (c === "Star") val = s.meta?.star || "-";
                    else if (c === "Room Type") val = s.meta?.room_type || "-";
                    else if (c === "Meal") val = s.meta?.meal_plan || "-";
                    else if (c === "Nights") val = s.meta?.nights ?? "-";
                    else if (c === "Rooms") val = s.meta?.rooms?.length ? `${s.meta.rooms.reduce((a: number, r: any) => a + (r.count ?? 0), 0)} rooms` : pax;
                    else if (c === "Type") val = <span className="capitalize">{s.meta?.private ? "Private" : (s.service_type || "-")}</span>;
                    else if (c === "Pricing Logic") val = s.meta?.pricing_logic || (s.service_type === "sightseeing" ? "Sightseeing / Ticket" : "Total");
                    else if (c === "Vehicle / Km / Pax") val = s.meta?.vehicle || "1 Vehicle / As per group size";
                    else if (c === "Adult") val = fmt(Number(s.meta?.adult_rate ?? 0));
                    else if (c === "Child") val = fmt(Number(s.meta?.child_rate ?? 0));
                    else if (c === "Infant") val = fmt(Number(s.meta?.infant_rate ?? 0));
                    else if (c === "Pax / Qty") val = `${it.adults ?? 0}A`;
                    return <td key={c} className="p-2 whitespace-nowrap">{val}</td>;
                  })}
                  <td className="p-2 text-right whitespace-nowrap">{fmt(cost)}</td>
                  <td className="p-2 text-right whitespace-nowrap">{fmt(sell)}</td>
                  <td className="p-2 text-right whitespace-nowrap">{fmt(mk)}</td>
                  <td className="p-2 text-right whitespace-nowrap">{fmt(gstLine + tcsLine)}</td>
                  <td className="p-2 text-right font-semibold text-primary whitespace-nowrap">{fmt(totalLine)}</td>
                </tr>
              );
            })}
            {rows.length > 0 && (
              <tr className="border-t bg-muted/20 font-semibold">
                <td colSpan={2 + columns.length} className="p-2 text-right uppercase text-[11px] tracking-wider text-muted-foreground">{title} Total</td>
                <td className="p-2 text-right">{fmt(sumBy(rows, "cost"))}</td>
                <td className="p-2 text-right">{fmt(sumBy(rows, "sell"))}</td>
                <td className="p-2 text-right">{fmt(sumBy(rows, "mk"))}</td>
                <td className="p-2 text-right">{fmt(sumBy(rows, "gstLine") + sumBy(rows, "tcsLine"))}</td>
                <td className="p-2 text-right text-primary">{fmt(sumBy(rows, "totalLine"))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Kpi = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className={`rounded-xl border p-4 text-center ${highlight ? "bg-primary/5 border-primary/40" : "bg-white"}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold mt-1 ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Costing Summary</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4 bg-muted/20">
          <div className="rounded-xl border bg-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="font-semibold">{it.title}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{currency}</span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">{(it.costing_type ?? "service_wise").replace("_", " ")}</span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{pax}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2"><Eye className="h-3.5 w-3.5" />View only costing report. This popup does not update itinerary, quotation, invoice, voucher or supplier payment.</div>

          <div className="rounded-xl border-l-4 border-l-primary bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">Package Option</div>
              <div className="text-lg font-bold">{it.package_option ?? "Basic"} Package</div>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-[#0f172a] text-primary">{fmt(total)}</div>
          </div>

          <Section title="Hotel Costing" rows={hotels} columns={["Hotel / Service", "Supplier", "City", "Star", "Room Type", "Meal", "Nights", "Rooms"]} />
          <Section title="Sightseeing Costing" rows={sights} columns={["Service", "Service Name", "Supplier", "Pricing Logic", "Adult", "Child", "Infant", "Pax / Qty"]} />
          <Section title="Transport Costing" rows={transport} columns={["Service Name", "Type", "Pricing Logic", "Vehicle / Km / Pax", "Supplier"]} />
          <Section title="Other Service Costing" rows={others} columns={["Service", "Service Name", "Supplier", "Pricing Logic", "Adult", "Child", "Infant", "Pax / Qty"]} />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Kpi label="Supplier Cost" value={fmt(supplierCost)} />
            <Kpi label="Subtotal" value={fmt(subtotal)} />
            <Kpi label="Markup" value={fmt(markup)} />
            <Kpi label="GST / Tax" value={fmt(tax)} />
            <Kpi label="TCS" value={fmt(tcsAmt ?? 0)} />
            <Kpi label="Grand Total" value={fmt(total)} highlight />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== GIT Costing Sidebar ====================
const GIT_OCCUPANCIES: { key: string; label: string }[] = [
  { key: "single", label: "Single" },
  { key: "double", label: "Double" },
  { key: "triple", label: "Triple" },
  { key: "quad", label: "Quad" },
  { key: "cnb", label: "CNB" },
  { key: "cwb", label: "CWB" },
  { key: "extra_bed", label: "Extra Bed" },
  { key: "sic", label: "SIC" },
  { key: "solo_bike", label: "Solo Bike" },
  { key: "sharing_bike", label: "Sharing Bike" },
  { key: "own_bike", label: "Own Bike" },
];

function GitCostingSidebar({ it, lead, currency, fmt, onPatch, onPreview }: any) {
  const qc = useQueryClient();
  const resyncFn = useServerFn(resyncGitCosting);
  const resync = useMutation({
    mutationFn: () => resyncFn({ data: { id: it.id } }),
    onSuccess: () => { toast.success("Re-synced from template"); qc.invalidateQueries({ queryKey: ["itinerary", it.id] }); },
    onError: (e: any) => toast.error(e.message ?? "Sync failed"),
  });
  const initial = (it.git_costing && typeof it.git_costing === "object") ? it.git_costing : {};
  const [rows, setRows] = useState<Record<string, { rate: number; qty: number }>>(() => {
    const seed: Record<string, { rate: number; qty: number }> = {};
    for (const o of GIT_OCCUPANCIES) {
      const r = initial.rows?.[o.key] ?? {};
      seed[o.key] = { rate: Number(r.rate ?? 0), qty: Number(r.qty ?? 0) };
    }
    return seed;
  });
  const [markupType, setMarkupType] = useState<string>(initial.markup_type ?? it.markup_type ?? "flat");
  const [markupValue, setMarkupValue] = useState<number>(Number(initial.markup_value ?? it.markup_value ?? 0));
  const [gstApplyOn, setGstApplyOn] = useState<string>(initial.gst_apply_on ?? it.gst_apply_on ?? "total");
  const [igst, setIgst] = useState<number>(Number(initial.igst ?? it.tax_rate ?? 5));
  const [cgst, setCgst] = useState<number>(Number(initial.cgst ?? 0));
  const [sgst, setSgst] = useState<number>(Number(initial.sgst ?? 0));
  const [tcs, setTcs] = useState<number>(Number(initial.tcs ?? it.tcs_rate ?? 0));

  const paxLimit = (lead?.adults ?? 0) + (lead?.children ?? 0) + (lead?.infants ?? 0);
  const startDate = lead?.travel_date ?? lead?.start_date ?? it.start_date ?? null;
  const endDate = lead?.return_date ?? lead?.end_date ?? it.end_date ?? null;
  const nights = it.nights ?? lead?.nights ?? 0;
  const days = nights ? nights + 1 : 0;

  const subtotal = GIT_OCCUPANCIES.reduce((s, o) => s + rows[o.key].rate * rows[o.key].qty, 0);
  const markup = markupType === "percent" ? subtotal * markupValue / 100 : markupValue;
  const gstBase = gstApplyOn === "markup" ? markup : subtotal + markup;
  const gst = gstBase * (igst + cgst + sgst) / 100;
  const tcsAmt = (subtotal + markup) * tcs / 100;
  const grandTotal = subtotal + markup + gst + tcsAmt;

  function setRow(key: string, patch: Partial<{ rate: number; qty: number }>) {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }
  function save() {
    onPatch({
      git_costing: {
        rows, markup_type: markupType, markup_value: markupValue,
        gst_apply_on: gstApplyOn, igst, cgst, sgst, tcs,
        subtotal, grand_total: grandTotal,
      },
      markup_type: markupType, markup_value: markupValue,
      gst_apply_on: gstApplyOn, tax_rate: igst, tcs_rate: tcs,
    });
    toast.success("GIT costing saved");
  }

  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-3 lg:sticky lg:top-4 h-fit">
      {it.source_template_id && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-emerald-800">GIT Departure</div>
              <div className="text-[11px] text-muted-foreground truncate">
                Slot {it.slot_id ? new Date(it.slot_id).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => resync.mutate()} disabled={resync.isPending}>
              Re-sync
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">GIT Costing</CardTitle>
          <div className="text-xs text-muted-foreground">
            Query Pax Limit: {paxLimit} ({lead?.adults ?? 0} Adult, {lead?.children ?? 0} Child, {lead?.infants ?? 0} Infant)
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm p-3 pt-0">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="font-semibold text-sm">{fmtDate(startDate)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {days ? `${days} Days Tour` : "—"}{endDate ? ` • Ends On ${fmtDate(endDate)}` : ""}
            </div>
          </div>
          {GIT_OCCUPANCIES.map((o) => {
            const row = rows[o.key];
            return (
              <div key={o.key} className="rounded-lg border p-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{o.label}</div>
                  <Input
                    type="number"
                    value={row.rate}
                    onChange={(e) => setRow(o.key, { rate: Number(e.target.value) })}
                    className="h-7 mt-1 text-sm font-semibold text-primary"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => setRow(o.key, { qty: Math.max(0, row.qty - 1) })}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-8 text-center text-sm font-semibold">{row.qty}</div>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => setRow(o.key, { qty: row.qty + 1 })}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-3 text-sm">
          <div className="font-semibold">Markup</div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Markup Type</Label>
            <Select value={markupType} onValueChange={setMarkupType}>
              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">Markup Value</Label>
            <Input type="number" className="w-28 h-8 text-right" value={markupValue}
              onChange={(e) => setMarkupValue(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">GST Apply On</Label>
            <Select value={gstApplyOn} onValueChange={setGstApplyOn}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="total">GST on Total</SelectItem>
                <SelectItem value="markup">GST on Markup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="font-semibold pt-2">Tax</div>
          {[
            { l: "IGST", v: igst, s: setIgst },
            { l: "CGST", v: cgst, s: setCgst },
            { l: "SGST", v: sgst, s: setSgst },
            { l: "TCS", v: tcs, s: setTcs },
          ].map((t) => (
            <div key={t.l} className="flex items-center justify-between gap-2">
              <Label className="text-xs w-12">{t.l}</Label>
              <Input type="number" className="w-24 h-8 text-right" value={t.v}
                onChange={(e) => t.s(Number(e.target.value))} />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          ))}

          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="font-bold text-emerald-700">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="font-bold text-emerald-700">{fmt(grandTotal)}</span>
            </div>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={save}>
            <FileText className="h-4 w-4 mr-1.5" />Save Cost
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm">Actions</div>
          <Button variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1.5" />Preview Itinerary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== GIT Slots Sidebar ====================
function SlotsSidebar({ it, fmt, onAdd, onEdit, onDelete, onPreview }: any) {
  const slots: any[] = (it.slots ?? []) as any[];
  const invFn = useServerFn(getGitInventory);
  const { data: inv = {} } = useQuery({
    queryKey: ["git-inv", it.id],
    queryFn: () => invFn({ data: { template_id: it.id } }),
  });
  const [openRoster, setOpenRoster] = useState<string | null>(null);
  const bucketFor = (s: any) => (inv as any)[s.start_date ?? ""] ?? { confirmed_pax: 0, tentative_pax: 0, confirmed_bookings: 0, tentative_bookings: 0, bookings: [] };
  const totalSeats = slots.reduce((s, x) => s + Number(x.group_pax ?? 0), 0);
  const remaining = slots.reduce((s, x) => s + Math.max(0, Number(x.group_pax ?? 0) - Number(x.booked ?? 0) - bucketFor(x).confirmed_pax), 0);
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  return (
    <div className="space-y-3 lg:sticky lg:top-4 h-fit">
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Slots</CardTitle>
            <div className="text-xs text-muted-foreground">Total Seats: {totalSeats} • Remaining Seats: {remaining}</div>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onAdd()}>
            <Plus className="h-4 w-4 mr-1" />Add Date Slot
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          {slots.length === 0 && (
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <div className="font-semibold text-sm">No slot available</div>
              <div className="text-xs text-muted-foreground mt-1">Add date slots for this GIT group departure.</div>
            </div>
          )}
          {slots.map((s: any, idx: number) => {
            const seats = Number(s.group_pax ?? 0);
            const bucket = bucketFor(s);
            const booked = Number(s.booked ?? 0) + bucket.confirmed_pax;
            const rem = Math.max(0, seats - booked);
            const doubleRate = Number(s.rooms?.double ?? 0);
            const nights = it.nights ?? 0;
            const end = s.start_date && nights ? new Date(new Date(s.start_date).getTime() + nights * 86400000) : null;
            const rosterKey = s.start_date ?? `idx-${idx}`;
            const isOpen = openRoster === rosterKey;
            return (
              <div key={idx} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{fmtDate(s.start_date)}</div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit({ ...s, __index: idx })}>Edit</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { if (confirm("Delete this slot?")) onDelete(idx); }}>Delete</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Total Seats</div>
                    <div className="font-semibold">{seats}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Booked {booked}</div>
                  </div>
                  <div className="rounded-md border p-2 bg-emerald-50/40">
                    <div className="text-emerald-700 text-[10px] uppercase">Remaining Seats</div>
                    <div className="font-semibold text-emerald-700">{rem}</div>
                    {bucket.tentative_pax > 0 && <div className="text-[10px] text-amber-700 mt-0.5">+{bucket.tentative_pax} tentative</div>}
                  </div>
                </div>
                {doubleRate > 0 && (
                  <div className="text-xs text-emerald-700 font-semibold">
                    Starting from Double Sharing {fmt(doubleRate)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {nights + 1} Days Tour{end ? ` • Ends On ${fmtDate(end)}` : ""}
                </div>
                <button type="button" onClick={() => setOpenRoster(isOpen ? null : rosterKey)} className="text-[11px] text-primary font-medium hover:underline">
                  {isOpen ? "Hide bookings" : `View bookings (${bucket.confirmed_bookings + bucket.tentative_bookings})`}
                </button>
                {isOpen && (
                  <div className="rounded-md border bg-muted/30 divide-y">
                    {bucket.bookings.length === 0 ? (
                      <div className="p-2 text-[11px] text-muted-foreground">No queries booked on this slot yet.</div>
                    ) : bucket.bookings.map((b: any) => (
                      <a key={b.itinerary_id} href={b.lead_id ? `/leads/${b.lead_id}` : "#"} className="flex items-center justify-between gap-2 p-2 text-xs hover:bg-background">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{b.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{b.code ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px]">{b.pax} pax</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${b.status === "won" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {b.status === "won" ? "Confirmed" : "Tentative"}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="font-semibold text-sm">Actions</div>
          <Button variant="outline" className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1.5" />Preview Itinerary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SlotEditorSheet({ open, initial, onOpenChange, onSave }: { open: boolean; initial: any; onOpenChange: (o: boolean) => void; onSave: (s: any) => void }) {
  const [form, setForm] = useState<any>(() => ({
    start_date: "", group_pax: 0, booked: 0, currency: "INR",
    rooms: { single: 0, double: 0, triple: 0, quad: 0, cnb: 0, cwb: 0, extra_bed: 0 },
    transport: { sic: 0 },
    bike: { solo: 0, sharing: 0, own: 0 },
  }));
  useEffect(() => {
    if (open) {
      setForm({
        start_date: initial?.start_date ?? "",
        group_pax: initial?.group_pax ?? 0,
        booked: initial?.booked ?? 0,
        currency: initial?.currency ?? "INR",
        rooms: { single: 0, double: 0, triple: 0, quad: 0, cnb: 0, cwb: 0, extra_bed: 0, ...(initial?.rooms ?? {}) },
        transport: { sic: 0, ...(initial?.transport ?? {}) },
        bike: { solo: 0, sharing: 0, own: 0, ...(initial?.bike ?? {}) },
        __index: initial?.__index,
      });
    }
  }, [open, initial]);
  const num = (v: any) => (v === "" ? 0 : Number(v));
  const roomRow = (key: string, label: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={form.rooms?.[key] ?? 0} onChange={(e) => setForm({ ...form, rooms: { ...form.rooms, [key]: num(e.target.value) } })} />
    </div>
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <div className="font-semibold text-lg mb-4">{form.__index != null ? "Edit Date Slot" : "Add Date Slot"}</div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Date *</Label>
              <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Group Pax</Label>
              <Input type="number" value={form.group_pax} onChange={(e) => setForm({ ...form, group_pax: num(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["INR","USD","EUR","GBP","AED","SGD","THB"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <div className="font-semibold text-sm mb-2">Room Sharing Price</div>
            <div className="grid grid-cols-3 gap-3">
              {roomRow("single","Single")}{roomRow("double","Double")}{roomRow("triple","Triple")}
              {roomRow("quad","Quad")}{roomRow("cnb","CNB")}{roomRow("cwb","CWB")}
              {roomRow("extra_bed","Extra Bed")}
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-2">Transport Price</div>
            <div>
              <Label className="text-xs">SIC</Label>
              <Input type="number" value={form.transport?.sic ?? 0} onChange={(e) => setForm({ ...form, transport: { ...form.transport, sic: num(e.target.value) } })} />
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-2">Bike Price</div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Solo</Label><Input type="number" value={form.bike?.solo ?? 0} onChange={(e) => setForm({ ...form, bike: { ...form.bike, solo: num(e.target.value) } })} /></div>
              <div><Label className="text-xs">Sharing</Label><Input type="number" value={form.bike?.sharing ?? 0} onChange={(e) => setForm({ ...form, bike: { ...form.bike, sharing: num(e.target.value) } })} /></div>
              <div><Label className="text-xs">Own Bike</Label><Input type="number" value={form.bike?.own ?? 0} onChange={(e) => setForm({ ...form, bike: { ...form.bike, own: num(e.target.value) } })} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              if (!form.start_date) { toast.error("Start date is required"); return; }
              onSave(form);
            }}>{form.__index != null ? "Save Slot" : "Add Slot"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SupplierCostSheet({ open, onOpenChange, services, days, currency, onSave }: any) {
  const [tab, setTab] = useState<"cost" | "payment">("cost");
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (open) setRows(services.map((s: any) => ({
      id: s.id, service_type: s.service_type, title: s.title, day_id: s.day_id, meta: s.meta ?? {},
      supplier: s.supplier ?? "",
      supplier_total_cost: Number(s.meta?.supplier_total_cost ?? Number(s.cost ?? 0) * Number(s.qty ?? 1)),
      supplier_currency: s.meta?.supplier_currency ?? currency,
    })));
  }, [open, services, currency]);
  const dayNoFor = (dayId: string) => {
    const d = days.find((x: any) => x.id === dayId);
    return d ? `Day ${d.day_no}` : "—";
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg">Supplier Cost</div>
        </div>
        <div className="px-5 py-4">
          <div className="inline-flex rounded-full border p-0.5 mb-4">
            <button onClick={() => setTab("cost")} className={`px-4 h-8 rounded-full text-sm font-medium ${tab === "cost" ? "bg-emerald-600 text-white" : ""}`}>Supplier Cost</button>
            <button onClick={() => setTab("payment")} className={`px-4 h-8 rounded-full text-sm font-medium ${tab === "payment" ? "bg-emerald-600 text-white" : ""}`}>Supplier Payment</button>
          </div>
          {tab === "cost" ? (
            rows.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-lg font-semibold">No services added</div>
                <div className="text-sm text-muted-foreground mt-1">Add itinerary services first, then you can save supplier cost here.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((r, i) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold">{dayNoFor(r.day_id)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{r.service_type}</div>
                        <div className="font-semibold text-sm">{r.title}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <Label className="text-xs">Supplier</Label>
                        <Input value={r.supplier} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, supplier: e.target.value } : x))} placeholder="Choose Supplier" />
                      </div>
                      <div>
                        <Label className="text-xs">Supplier Total Cost</Label>
                        <Input type="number" value={r.supplier_total_cost} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, supplier_total_cost: Number(e.target.value) } : x))} />
                      </div>
                      <div>
                        <Label className="text-xs">Currency</Label>
                        <Select value={r.supplier_currency} onValueChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, supplier_currency: v } : x))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{["INR","USD","EUR","GBP","AED","SGD","THB"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">Supplier payments are tracked from Payments module once bookings are confirmed.</div>
          )}
        </div>
        <div className="border-t px-5 py-3 flex justify-end gap-2 sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {tab === "cost" && <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onSave(rows)}>Save Supplier Cost</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
