import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWebsiteSettings, saveWebsiteSettings } from "@/lib/masters.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Gauge, Settings2, Plane, Hotel, Percent, CreditCard, UserCircle2,
  FileText, ImageIcon, Newspaper, Palette, MapPin, MessageSquare, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { SingleImagePicker } from "@/components/masters/single-image-picker";

export const Route = createFileRoute("/_authenticated/website")({
  head: () => ({ meta: [{ title: "Website Settings — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: WebsitePage,
});

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "general", label: "General", icon: Settings2 },
  { id: "services", label: "Services On/Off", icon: Plane },
  { id: "flights", label: "Flight Settings", icon: Plane },
  { id: "hotels", label: "Hotel Settings", icon: Hotel },
  { id: "markup", label: "Markup Rules", icon: Percent },
  { id: "payment", label: "Payment Gateway", icon: CreditCard },
  { id: "portal", label: "Client Portal", icon: UserCircle2 },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "blogs", label: "Blogs", icon: Newspaper },
  { id: "themes", label: "Website Themes", icon: Palette },
  { id: "destinations", label: "Destinations", icon: MapPin },
  { id: "testimonials", label: "Testimonials", icon: MessageSquare },
  { id: "contact", label: "Contact Settings", icon: Mail },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function WebsitePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getWebsiteSettings);
  const saveFn = useServerFn(saveWebsiteSettings);
  const { data } = useQuery({ queryKey: ["website-settings"], queryFn: () => getFn() });
  const [tab, setTab] = useState<SectionId>("dashboard");
  const [state, setState] = useState<Record<string, any>>({});
  useEffect(() => { if (data) setState(data.data ?? {}); }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { data: state } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["website-settings"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const section = (id: SectionId) => state[id] ?? {};
  const setSection = (id: SectionId, patch: Record<string, any>) =>
    setState({ ...state, [id]: { ...section(id), ...patch } });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a]" style={{fontFamily: '"Sora", ui-sans-serif, system-ui, sans-serif'}}>Website Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your public site, portal, and booking widgets</p>
        </div>
        <div className="ml-auto"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button></div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <Card className="p-2 h-fit">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = tab === s.id;
              return (
                <button key={s.id} onClick={() => setTab(s.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>
                  <Icon className="h-4 w-4" /> {s.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <Card>
          <CardHeader><CardTitle>{SECTIONS.find(s => s.id === tab)?.label}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {tab === "dashboard" && (
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { k: "Total Pages", v: (section("pages").items ?? []).length },
                  { k: "Banners", v: (section("banners").items ?? []).length },
                  { k: "Destinations", v: (section("destinations").items ?? []).length },
                  { k: "Testimonials", v: (section("testimonials").items ?? []).length },
                  { k: "Site Live", v: section("general").live ? "Yes" : "No" },
                  { k: "Client Portal", v: section("portal").enabled ? "On" : "Off" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border p-4 bg-gradient-to-br from-muted/40 to-transparent">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.k}</div>
                    <div className="text-2xl font-semibold mt-1">{s.v}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "general" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Site Title</Label><Input value={section("general").title ?? ""} onChange={(e) => setSection("general", { title: e.target.value })} /></div>
                <div><Label>Tagline</Label><Input value={section("general").tagline ?? ""} onChange={(e) => setSection("general", { tagline: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Meta description</Label><Textarea rows={2} value={section("general").meta ?? ""} onChange={(e) => setSection("general", { meta: e.target.value })} /></div>
                <div><Label>Domain</Label><Input placeholder="www.mytravel.com" value={section("general").domain ?? ""} onChange={(e) => setSection("general", { domain: e.target.value })} /></div>
                <div className="flex items-center gap-3 pt-6"><Switch checked={!!section("general").live} onCheckedChange={(v) => setSection("general", { live: v })} /><Label>Site Live</Label></div>
              </div>
            )}

            {tab === "services" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {["Packages", "Flights", "Hotels", "Cruise", "Visa", "Insurance", "Forex", "Trains", "Bus", "Transfers"].map((k) => (
                  <div key={k} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <span className="text-sm">{k}</span>
                    <Switch checked={!!(section("services")[k] ?? true)} onCheckedChange={(v) => setSection("services", { [k]: v })} />
                  </div>
                ))}
              </div>
            )}

            {tab === "flights" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Default Origin (IATA)</Label><Input value={section("flights").origin ?? ""} onChange={(e) => setSection("flights", { origin: e.target.value })} /></div>
                <div><Label>Default Cabin</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={section("flights").cabin ?? "Economy"} onChange={(e) => setSection("flights", { cabin: e.target.value })}>
                    {["Economy", "Premium Economy", "Business", "First"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6"><Switch checked={!!section("flights").show_widget} onCheckedChange={(v) => setSection("flights", { show_widget: v })} /><Label>Show booking widget</Label></div>
                <div><Label>Supplier tag</Label><Input value={section("flights").supplier ?? ""} onChange={(e) => setSection("flights", { supplier: e.target.value })} /></div>
              </div>
            )}

            {tab === "hotels" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Default Destination</Label><Input value={section("hotels").destination ?? ""} onChange={(e) => setSection("hotels", { destination: e.target.value })} /></div>
                <div><Label>Star Filter Default</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={section("hotels").stars ?? "3"} onChange={(e) => setSection("hotels", { stars: e.target.value })}>
                    {["1","2","3","4","5"].map(c => <option key={c}>{c}★+</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6"><Switch checked={!!section("hotels").allow_map} onCheckedChange={(v) => setSection("hotels", { allow_map: v })} /><Label>Enable map view</Label></div>
              </div>
            )}

            {tab === "markup" && (
              <div className="grid sm:grid-cols-3 gap-3">
                {["packages","flights","hotels","cruise","visa","transfers"].map((k) => (
                  <div key={k}>
                    <Label className="capitalize">{k} markup %</Label>
                    <Input type="number" value={section("markup")[k] ?? ""} onChange={(e) => setSection("markup", { [k]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}

            {tab === "payment" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Provider</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={section("payment").provider ?? "razorpay"} onChange={(e) => setSection("payment", { provider: e.target.value })}>
                    {["razorpay","stripe","payu","cashfree"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Key ID</Label><Input value={section("payment").key_id ?? ""} onChange={(e) => setSection("payment", { key_id: e.target.value })} /></div>
                <div><Label>Key Secret</Label><Input type="password" value={section("payment").key_secret ?? ""} onChange={(e) => setSection("payment", { key_secret: e.target.value })} /></div>
                <div className="flex items-center gap-3 pt-6"><Switch checked={!!section("payment").live} onCheckedChange={(v) => setSection("payment", { live: v })} /><Label>Live mode</Label></div>
              </div>
            )}

            {tab === "portal" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 pt-6"><Switch checked={!!section("portal").enabled} onCheckedChange={(v) => setSection("portal", { enabled: v })} /><Label>Enable client portal</Label></div>
                <div><Label>Portal subdomain</Label><Input placeholder="clients" value={section("portal").subdomain ?? ""} onChange={(e) => setSection("portal", { subdomain: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Welcome message</Label><Textarea rows={3} value={section("portal").welcome ?? ""} onChange={(e) => setSection("portal", { welcome: e.target.value })} /></div>
              </div>
            )}

            {(tab === "pages" || tab === "banners" || tab === "blogs" || tab === "destinations" || tab === "testimonials") && (
              <ListEditor
                title={SECTIONS.find(s => s.id === tab)!.label}
                items={section(tab).items ?? []}
                onChange={(items) => setSection(tab, { items })}
                fields={
                  tab === "pages" ? [["slug", "Slug"], ["title", "Title"], ["body", "Body", true]]
                  : tab === "banners" ? [["title", "Title"], ["image_url", "Image URL"], ["cta", "CTA link"]]
                  : tab === "blogs" ? [["slug", "Slug"], ["title", "Title"], ["excerpt", "Excerpt", true]]
                  : tab === "destinations" ? [["name", "Name"], ["country", "Country"], ["image_url", "Image URL"]]
                  : [["name", "Name"], ["quote", "Quote", true], ["avatar_url", "Avatar URL"]]
                }
              />
            )}

            {tab === "themes" && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Primary color</Label><Input type="color" value={section("themes").primary ?? "#48a890"} onChange={(e) => setSection("themes", { primary: e.target.value })} /></div>
                <div><Label>Accent color</Label><Input type="color" value={section("themes").accent ?? "#c04818"} onChange={(e) => setSection("themes", { accent: e.target.value })} /></div>
                <div><Label>Font</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={section("themes").font ?? "Inter"} onChange={(e) => setSection("themes", { font: e.target.value })}>
                    {["Inter","Manrope","DM Sans","Sora","Instrument Serif"].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            )}

            {tab === "contact" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Contact Email</Label><Input value={section("contact").email ?? ""} onChange={(e) => setSection("contact", { email: e.target.value })} /></div>
                <div><Label>Contact Phone</Label><Input value={section("contact").phone ?? ""} onChange={(e) => setSection("contact", { phone: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Office address</Label><Textarea rows={3} value={section("contact").address ?? ""} onChange={(e) => setSection("contact", { address: e.target.value })} /></div>
                <div><Label>Google Maps URL</Label><Input value={section("contact").map_url ?? ""} onChange={(e) => setSection("contact", { map_url: e.target.value })} /></div>
                <div><Label>WhatsApp number</Label><Input value={section("contact").whatsapp ?? ""} onChange={(e) => setSection("contact", { whatsapp: e.target.value })} /></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Field = [string, string, boolean?];
function ListEditor({ title, items, onChange, fields }: { title: string; items: any[]; onChange: (v: any[]) => void; fields: Field[] }) {
  const empty = Object.fromEntries(fields.map(([k]) => [k, ""]));
  const [draft, setDraft] = useState<Record<string, string>>(empty);
  const isImageField = (k: string) => /image_url|avatar_url|photo_url|cover_url|logo_url/i.test(k);
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-2 items-end">
        {fields.map(([k, label, ta]) => (
          <div key={k} className={ta ? "sm:col-span-3" : ""}>
            <Label className="text-xs">{label}</Label>
            {ta ? <Textarea rows={2} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
              : isImageField(k)
                ? <SingleImagePicker value={draft[k]} onChange={(url) => setDraft({ ...draft, [k]: url })} folder="website" />
                : <Input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />}
          </div>
        ))}
        <Button onClick={() => { if (!Object.values(draft).some(Boolean)) return; onChange([...items, draft]); setDraft(empty); }}>Add {title.replace(/s$/, "")}</Button>
      </div>
      <div className="border rounded-lg divide-y">
        {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nothing added yet.</div>}
        {items.map((it, idx) => (
          <div key={idx} className="p-3 flex items-start gap-3 text-sm">
            {(it.image_url || it.avatar_url || it.photo_url || it.cover_url) && (
              <img src={it.image_url || it.avatar_url || it.photo_url || it.cover_url} alt="" className="h-14 w-20 rounded object-cover border" />
            )}
            <div className="flex-1 space-y-0.5">
              {fields.map(([k, label]) => it[k] && (
                <div key={k}><span className="text-muted-foreground text-xs mr-2">{label}:</span>{isImageField(k) ? <span className="truncate inline-block max-w-[240px] align-bottom">{it[k]}</span> : it[k]}</div>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={() => onChange(items.filter((_, i) => i !== idx))}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}