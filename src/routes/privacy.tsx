import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";

export const Route = createFileRoute("/privacy")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Privacy Policy — TraWe" },
      { name: "description", content: "How TraWe collects, uses, stores and protects your data. Plain English, DPDP-aligned." },
      { property: "og:title", content: "TraWe Privacy Policy" },
      { property: "og:description", content: "How TraWe handles agency and traveller data — plain English, DPDP-aligned." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/privacy" }],
  }),
});

const SECTIONS: { h: string; body: string[] }[] = [
  { h: "1. Who we are", body: [
    "TraWe is a product of TraWe Technologies Pvt. Ltd. (\"TraWe\", \"we\", \"our\"), incorporated in India.",
    "This page is maintained by TraWe to explain what personal data we collect, why, and how you can exercise your rights under India's Digital Personal Data Protection Act, 2023.",
  ]},
  { h: "2. What data we collect", body: [
    "Account data: name, email, phone, agency name, GSTIN, PAN and role — provided when you sign up or invite a teammate.",
    "Content you create: leads, itineraries, quotations, invoices, uploads and messages sent through the product.",
    "Traveller data your agency uploads: passport details, visa scans, contact info. You are the data fiduciary; TraWe is the processor.",
    "Product telemetry: pages viewed, features used, error traces — used to fix bugs and improve the product. Never sold.",
  ]},
  { h: "3. How we use it", body: [
    "To deliver the service you signed up for and keep it running securely.",
    "To send transactional emails (OTPs, invoices, receipts, reminders). You cannot opt out while your account is active.",
    "To send product updates and best-practice guides. You can opt out any time.",
    "To meet legal obligations — tax records, valid law enforcement requests.",
  ]},
  { h: "4. Where your data lives", body: [
    "All customer data is stored in India-region datacentres. TLS 1.2+ in transit, AES-256 at rest.",
    "Row-level security isolates every agency's data at the database level.",
  ]},
  { h: "5. Sub-processors", body: [
    "We use a small number of vetted sub-processors. The current list is at /dpdp — changes are notified at least 15 days in advance.",
  ]},
  { h: "6. Your rights (DPDP Act)", body: [
    "Request access, correction, updation or erasure at any time. Written requests to dpo@trawe.in are actioned within 30 days.",
    "Nominate someone to exercise these rights on your behalf.",
    "Withdraw consent for optional processing any time from Settings → Privacy.",
  ]},
  { h: "7. Retention", body: [
    "Active accounts: retained while your subscription is active.",
    "After cancellation: retained 30 days for recovery, then permanently deleted unless a legal hold applies.",
  ]},
  { h: "8. Contact", body: [
    "Data Protection Officer: dpo@trawe.in.",
    "Grievance Officer (India): grievance@trawe.in. Acknowledged within 48 hours.",
  ]},
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Legal</div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground font-mono">Last updated: 15 July 2026 · Effective across trawe.in and app.trawe.in</p>
        <p className="mt-6 text-muted-foreground">Maintained by TraWe to explain what data we handle and what rights you have. Not a certification — it reflects the controls we operate today.</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold tracking-tight">{s.h}</h2>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground leading-relaxed">
                {s.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}