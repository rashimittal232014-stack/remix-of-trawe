import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { LifeBuoy, Mail, MessageCircle, Phone, BookOpen, Clock, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/support")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Support — TraWe" },
      { name: "description", content: "Get help with TraWe. Email, WhatsApp or priority phone support with SLAs across every plan." },
      { property: "og:title", content: "TraWe Support" },
      { property: "og:description", content: "Human help in Hindi, English and Hinglish — within one business day, faster on paid plans." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/support" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/support" }],
  }),
});

const SLAS = [
  { plan: "Starter", hours: "24h", channels: "Email + Docs" },
  { plan: "Pro", hours: "8h", channels: "Email + WhatsApp" },
  { plan: "Business", hours: "2h", channels: "Email + WhatsApp + Phone" },
];

const FAQS = [
  { q: "How do I import my existing leads from Excel?",
    a: "Settings → Import. Download the sample CSV, map your columns, and we'll de-duplicate on phone/email before creating leads. Up to 10,000 rows per file." },
  { q: "Can I use my own WhatsApp Business number?",
    a: "Yes — TraWe connects to the official Meta WhatsApp Cloud API. You keep your number, we handle templates, delivery receipts and inbox." },
  { q: "Is my data safe if I cancel?",
    a: "You own your data. Full JSON export is available anytime from Settings → Data. After cancellation we retain your workspace for 30 days, then permanently delete on request." },
  { q: "Do you support GST invoicing for tour operators?",
    a: "Yes — 5% under the Tour Operator scheme (without ITC) and 18% for pure services, including CGST/SGST vs IGST place-of-supply logic. GSTR-1 CSV export is one click." },
  { q: "How do I add teammates?",
    a: "Settings → Team → Invite. Choose their role (Owner, Manager, Agent, Accounts, Ops). Seats are per your plan — upgrade anytime for more." },
  { q: "Which payment gateways do you support?",
    a: "Razorpay is native. Stripe and PayU are on the roadmap. You can always attach a manual payment link from any gateway." },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="border-b relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Support</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">Real humans. Hindi, English, Hinglish.</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">No chatbots dressing up as agents. Our team runs travel agencies too — you'll be understood the first time.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid gap-4 sm:grid-cols-3">
        <a href="mailto:support@trawe.in" className="border rounded-xl p-6 bg-card hover:border-primary transition block">
          <Mail className="h-5 w-5 text-primary mb-4" />
          <div className="font-semibold">Email</div>
          <div className="mt-1 text-sm text-muted-foreground">Best for account, billing and detailed issues with screenshots.</div>
          <div className="mt-4 font-mono text-sm">support@trawe.in</div>
        </a>
        <a href="https://wa.me/919311784451" target="_blank" rel="noreferrer" className="border rounded-xl p-6 bg-card hover:border-primary transition block">
          <MessageCircle className="h-5 w-5 text-primary mb-4" />
          <div className="font-semibold">WhatsApp</div>
          <div className="mt-1 text-sm text-muted-foreground">Fastest for quick questions and shared screenshots. 9am–9pm IST.</div>
          <div className="mt-4 font-mono text-sm">+91 93117 84451</div>
        </a>
        <a href="tel:+919311784451" className="border rounded-xl p-6 bg-card hover:border-primary transition block">
          <Phone className="h-5 w-5 text-primary mb-4" />
          <div className="font-semibold">Phone</div>
          <div className="mt-1 text-sm text-muted-foreground">Priority phone line for Business plan customers. Mon–Sat, 10am–7pm IST.</div>
          <div className="mt-4 font-mono text-sm">+91 93117 84451</div>
        </a>
      </section>

      <section className="border-t bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Service level</div>
              <h2 className="text-2xl font-semibold tracking-tight">First-response SLA by plan</h2>
            </div>
            <Link to="/request-demo" className="text-sm text-primary font-medium hover:underline">Get a live demo →</Link>
          </div>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {SLAS.map((s) => (
              <div key={s.plan} className="rounded-xl border bg-card p-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{s.plan}</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">{s.hours}</div>
                <div className="mt-1 text-xs text-muted-foreground">first response · business hours</div>
                <div className="mt-4 pt-4 border-t text-sm">{s.channels}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Frequently asked</div>
        <h2 className="text-2xl font-semibold tracking-tight">Answers to what most agencies ask.</h2>
        <div className="mt-8 divide-y border rounded-xl bg-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="font-medium">{f.q}</span>
                <span className="mt-1 text-muted-foreground group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-16 grid gap-4 md:grid-cols-4">
          {[
            { icon: Clock, t: "24×7 uptime monitoring" },
            { icon: ShieldCheck, t: "India-region data residency" },
            { icon: Zap, t: "99.9% target uptime" },
            { icon: BookOpen, t: "Free onboarding on Pro+" },
          ].map((x) => (
            <div key={x.t} className="border rounded-xl p-5 bg-card flex items-center gap-3">
              <x.icon className="h-5 w-5 text-primary" />
              <div className="text-sm font-medium">{x.t}</div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}