import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dpdp")({
  component: Page,
  head: () => ({
    meta: [
      { title: "DPDP Compliance — TraWe" },
      { name: "description", content: "How TraWe complies with India's Digital Personal Data Protection Act, 2023 — roles, rights, sub-processors and grievance redressal." },
      { property: "og:title", content: "TraWe DPDP Compliance" },
      { property: "og:description", content: "TraWe's DPDP Act, 2023 alignment — roles, rights and sub-processors." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/dpdp" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/dpdp" }],
  }),
});

const SUBPROCESSORS = [
  { name: "Managed Postgres (India region)", purpose: "Database, auth, storage", location: "Mumbai, India" },
  { name: "Cloudflare Workers", purpose: "Application hosting, edge compute", location: "India edge PoPs" },
  { name: "Razorpay", purpose: "Payment collection & reconciliation", location: "India" },
  { name: "Meta WhatsApp Cloud API", purpose: "WhatsApp Business messaging", location: "Global (Meta)" },
  { name: "Google Gemini via AI Gateway", purpose: "AI copilot & itinerary drafting", location: "Global" },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="border-b bg-secondary/30">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
            <ShieldCheck className="h-3 w-3" /> DPDP Act, 2023
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">DPDP Compliance</h1>
          <p className="mt-3 text-sm text-muted-foreground font-mono">Maintained by TraWe. Reflects the controls we operate today. Not a legal certification.</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-6 py-14 space-y-10 text-sm text-muted-foreground leading-relaxed">
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Our role</h2><p className="mt-2">For agency and team data: TraWe is the <b>data fiduciary</b>. For traveller data your agency uploads: your agency is the fiduciary, TraWe is the <b>processor</b>.</p></div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Rights we honour</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>Right to access and copy your personal data.</li>
            <li>Right to correction, completion and updation.</li>
            <li>Right to erasure once the processing purpose is complete.</li>
            <li>Right to nominate another individual to exercise rights on your behalf.</li>
            <li>Right to grievance redressal — acknowledged in 48 hours, resolved within 30 days.</li>
          </ul>
          <p className="mt-3">Requests: <span className="font-mono">dpo@trawe.in</span>. From the app: Settings → Privacy → Request my data.</p>
        </div>
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Consent</h2><p className="mt-2">We collect only what's needed. Optional processing (marketing, product analytics) is opt-out from Settings → Privacy.</p></div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Security safeguards</h2>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            <li>TLS 1.2+ in transit, AES-256 at rest.</li>
            <li>Row-level security isolating every agency's data.</li>
            <li>Least-privilege role model; MFA for admin access.</li>
            <li>Daily encrypted backups, 30-day retention.</li>
            <li>Immutable audit log of every meaningful action.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Sub-processors</h2>
          <p className="mt-2">Minimum data shared with a small number of vetted providers. Changes are notified at least 15 days in advance.</p>
          <div className="mt-4 border rounded-xl bg-card divide-y">
            {SUBPROCESSORS.map((s) => (
              <div key={s.name} className="p-4 grid gap-1 md:grid-cols-3 md:gap-6">
                <div className="font-medium text-foreground">{s.name}</div>
                <div>{s.purpose}</div>
                <div className="font-mono text-xs">{s.location}</div>
              </div>
            ))}
          </div>
        </div>
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Grievance officer (India)</h2><p className="mt-2">TraWe Technologies Pvt. Ltd. · <span className="font-mono">grievance@trawe.in</span> · Acknowledgement 48h, resolution 30 days.</p></div>
        <div><h2 className="text-lg font-semibold tracking-tight text-foreground">Data breach notification</h2><p className="mt-2">We notify the Data Protection Board and affected principals as required, with facts, likely consequences, and mitigation applied.</p></div>
      </section>
      <MarketingFooter />
    </div>
  );
}