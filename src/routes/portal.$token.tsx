import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublicItinerary, acceptItineraryPublic } from "@/lib/sales.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, MapPin, Calendar, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/$token")({
  head: () => ({ meta: [{ title: "Your Itinerary" }, { name: "robots", content: "noindex" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { token } = Route.useParams();
  const getFn = useServerFn(getPublicItinerary);
  const acceptFn = useServerFn(acceptItineraryPublic);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["portal", token],
    queryFn: () => getFn({ data: { token } }),
    retry: false,
  });
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState("");

  const accept = useMutation({
    mutationFn: (accepter_name: string) => acceptFn({ data: { token, accepter_name } }),
    onSuccess: () => {
      toast.success("Itinerary accepted — thank you!");
      setNameOpen(false);
      refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "Something went wrong"),
  });

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading itinerary…</div>;
  if (!data) return <div className="p-10 text-center text-muted-foreground">This link is invalid or has expired.</div>;

  const { itinerary: it, tenant } = data as any;
  const brand = tenant?.primary_color || "#0f766e";
  const agency = tenant?.crm_name || tenant?.name || "Your Travel Partner";
  const days = (it.itinerary_days ?? []) as any[];
  const services = (it.itinerary_services ?? []) as any[];
  const subtotal = services.reduce((s: number, x: any) => s + Number(x.price ?? 0), 0);
  const markup = it.markup_type === "percent" ? subtotal * Number(it.markup_value ?? 0) / 100 : Number(it.markup_value ?? 0);
  const gstRate = Number(it.cgst_rate ?? 0) + Number(it.sgst_rate ?? 0) + Number(it.tax_rate ?? 0);
  const taxable = subtotal + markup;
  const gst = taxable * gstRate / 100;
  const tcs = taxable * Number(it.tcs_rate ?? 0) / 100;
  const total = taxable + gst + tcs;
  const fmt = (n: number) => `${it.currency ?? "INR"} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const confirmed = it.status === "confirmed";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tenant?.logo_url && <img src={tenant.logo_url} alt="" className="h-8 w-8 rounded object-contain" />}
            <div className="font-semibold">{agency}</div>
          </div>
          {confirmed ? (
            <div className="inline-flex items-center gap-1 text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Accepted
            </div>
          ) : (
            <Button style={{ background: brand }} className="text-white hover:opacity-90" onClick={() => setNameOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Itinerary
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="relative rounded-2xl overflow-hidden border h-64 bg-slate-200">
          {it.cover_url ? (
            <img src={it.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-slate-400"><Sparkles className="h-10 w-10" /></div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <h1 className="text-2xl font-semibold">{it.title}</h1>
            <div className="text-sm mt-1 flex items-center gap-3 opacity-90">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{(it.destinations ?? [])[0] ?? "—"}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{it.nights ?? 0} Nights · {(it.nights ?? 0) + 1} Days</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{it.adults ?? 0}A · {it.children ?? 0}C{it.infants ? ` · ${it.infants}I` : ""}</span>
            </div>
          </div>
        </div>

        {days.map((d) => {
          const svcs = services.filter((s) => s.day_id === d.id);
          return (
            <Card key={d.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-baseline gap-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Day {d.day_no}</div>
                  <div className="font-semibold">{d.title}</div>
                  {d.location && <div className="text-sm text-muted-foreground">· {d.location}</div>}
                </div>
                {d.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{d.description}</p>}
                {svcs.length > 0 && (
                  <ul className="space-y-2">
                    {svcs.map((s) => (
                      <li key={s.id} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium">{s.title} <span className="text-xs text-muted-foreground">· {s.service_type}</span></div>
                        {s.description && <div className="text-muted-foreground text-xs mt-1 whitespace-pre-wrap">{s.description}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardContent className="p-5">
            <div className="font-semibold mb-3">Package Total</div>
            <div className="flex items-center justify-between text-sm py-1"><span>Subtotal</span><span>{fmt(subtotal + markup)}</span></div>
            {gst > 0 && <div className="flex items-center justify-between text-sm py-1"><span>GST ({gstRate}%)</span><span>{fmt(gst)}</span></div>}
            {tcs > 0 && <div className="flex items-center justify-between text-sm py-1"><span>TCS ({it.tcs_rate}%)</span><span>{fmt(tcs)}</span></div>}
            <div className="mt-3 rounded-xl p-4 flex items-center justify-between font-semibold" style={{ background: `${brand}15`, color: brand }}>
              <span>Grand Total</span><span>{fmt(total)}</span>
            </div>
          </CardContent>
        </Card>

        {!confirmed && (
          <div className="rounded-2xl border-2 border-dashed p-6 text-center bg-white">
            <div className="font-semibold mb-1">Happy with the itinerary?</div>
            <div className="text-sm text-muted-foreground mb-4">Accepting will confirm your booking and notify {agency} to prepare your invoice.</div>
            <Button style={{ background: brand }} className="text-white hover:opacity-90" onClick={() => setNameOpen(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Itinerary
            </Button>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">Powered by TraWe</footer>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirm your acceptance</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <label className="text-sm">Your full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
            <p className="text-xs text-muted-foreground">By accepting, you confirm this itinerary and authorize {agency} to raise the invoice.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameOpen(false)}>Cancel</Button>
            <Button
              style={{ background: brand }}
              className="text-white hover:opacity-90"
              disabled={!name.trim() || accept.isPending}
              onClick={() => accept.mutate(name.trim())}
            >
              {accept.isPending ? "Confirming…" : "Confirm Acceptance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}