import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MarketingNav } from "@/components/app/marketing-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitDemoRequest } from "@/lib/demo.functions";
import { CheckCircle2, Mail, Phone, MessageCircle, Sparkles, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/request-demo")({
  head: () => ({
    meta: [
      { title: "Get a Live Demo of TraWe Travel CRM" },
      { name: "description", content: "Book a free live demo of TraWe travel CRM — queries, itinerary builder, AI, invoicing and WhatsApp. Call +91 93117 84451." },
      { property: "og:title", content: "Get a Live Demo of TraWe Travel CRM" },
      { property: "og:description", content: "See TraWe live with a product expert. Free 30-minute walkthrough for travel agencies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestDemoPage,
});

const PHONE = "+919311784451";
const EMAIL = "sales@trawe.in";

const empty = {
  full_name: "", company: "", email: "", phone: "", city: "",
  country: "India", team_size: "", current_software: "", message: "",
};

function RequestDemoPage() {
  const [form, setForm] = useState(empty);
  const [done, setDone] = useState(false);
  const submit = useServerFn(submitDemoRequest);

  const m = useMutation({
    mutationFn: () => submit({ data: { ...form, source: "website" } }),
    onSuccess: () => { setDone(true); setForm(empty); },
    onError: (e: any) => toast.error(e?.message ?? "Something went wrong"),
  });

  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdf6f1] via-white to-[#f2f7f6]">
      <MarketingNav />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start">
          {/* Left: pitch + contact */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c04818]/25 bg-white px-3 py-1 text-xs font-medium text-[#c04818]">
              <Sparkles className="h-3.5 w-3.5" /> Free 30-minute walkthrough
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-[#001830]">
              Get a live demo of TraWe
            </h1>
            <p className="mt-3 text-[#001830]/70 leading-relaxed">
              A product expert will walk you through queries, the itinerary builder, AI planning,
              GST invoicing, WhatsApp and reporting — using your own destinations and packages.
              Accounts are created for you after the demo.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-[#001830]/80">
              {[
                "See your real workflow mapped inside TraWe",
                "Pricing, GST and TCS configured for your agency",
                "Data migration and onboarding plan",
                "Answers on white-label and custom domain",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#48a890] shrink-0" /> {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-3xl border border-[#001830]/10 bg-white p-5 shadow-[0_25px_60px_-45px_rgba(0,24,48,0.5)]">
              <p className="text-xs uppercase tracking-wide text-[#001830]/50">Prefer to talk now?</p>
              <div className="mt-3 space-y-3 text-sm">
                <a href={`tel:${PHONE}`} className="flex items-center gap-3 text-[#001830] hover:text-[#c04818]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#001830]/5"><Phone className="h-4 w-4" /></span>
                  +91 93117 84451
                </a>
                <a href={`https://wa.me/${PHONE.replace("+", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#001830] hover:text-[#c04818]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#48a890]/10"><MessageCircle className="h-4 w-4 text-[#48a890]" /></span>
                  Chat on WhatsApp
                </a>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-3 text-[#001830] hover:text-[#c04818]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c04818]/10"><Mail className="h-4 w-4 text-[#c04818]" /></span>
                  {EMAIL}
                </a>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-[#001830]/50">
                <Clock className="h-3.5 w-3.5" /> Mon–Sat, 10am–7pm IST · we reply within one business day
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-[28px] border border-[#001830]/10 bg-white p-6 sm:p-8 shadow-[0_40px_90px_-55px_rgba(0,24,48,0.6)]">
            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#48a890]/15">
                  <CheckCircle2 className="h-7 w-7 text-[#48a890]" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[#001830]">Request received</h2>
                <p className="mt-2 text-sm text-[#001830]/70">
                  Our team will call you on the number you shared to schedule your live demo.
                  For anything urgent, call +91 93117 84451 or write to {EMAIL}.
                </p>
                <Button className="mt-6 rounded-full bg-[#001830] hover:bg-[#001830]/90" onClick={() => setDone(false)}>
                  Submit another request
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
              >
                <h2 className="text-lg font-semibold text-[#001830]">Request for demo</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name *">
                    <Input required maxLength={100} value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} placeholder="Rahul Thakur" />
                  </Field>
                  <Field label="Agency / company">
                    <Input maxLength={120} value={form.company} onChange={(e) => set("company")(e.target.value)} placeholder="Trawe Holidays" />
                  </Field>
                  <Field label="Email *">
                    <Input required type="email" maxLength={255} value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@agency.com" />
                  </Field>
                  <Field label="Mobile number *">
                    <Input required maxLength={20} value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+91 90000 00000" />
                  </Field>
                  <Field label="City">
                    <Input maxLength={80} value={form.city} onChange={(e) => set("city")(e.target.value)} placeholder="Mumbai" />
                  </Field>
                  <Field label="Country">
                    <Input maxLength={80} value={form.country} onChange={(e) => set("country")(e.target.value)} />
                  </Field>
                  <Field label="Team size">
                    <Select value={form.team_size} onValueChange={set("team_size")}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["1–3", "4–10", "11–25", "26–50", "50+"].map((o) => (
                          <SelectItem key={o} value={o}>{o} people</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Current software">
                    <Input maxLength={120} value={form.current_software} onChange={(e) => set("current_software")(e.target.value)} placeholder="Excel / TraWe / None" />
                  </Field>
                </div>
                <Field label="What would you like to see?">
                  <Textarea rows={4} maxLength={1000} value={form.message} onChange={(e) => set("message")(e.target.value)} placeholder="We handle 150 queries a month for Europe and Bali…" />
                </Field>

                <Button type="submit" disabled={m.isPending} className="w-full rounded-full h-12 bg-[#c04818] hover:bg-[#a63d14] text-white">
                  {m.isPending ? "Sending…" : "Get live demo"}
                </Button>
                <p className="flex items-center justify-center gap-2 text-xs text-[#001830]/50">
                  <ShieldCheck className="h-3.5 w-3.5" /> Your details stay private — no spam, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-[#001830]/70">{label}</Label>
      {children}
    </div>
  );
}
