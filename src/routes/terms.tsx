import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";

export const Route = createFileRoute("/terms")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Terms of Service — TraWe" },
      { name: "description", content: "The terms that govern your use of the TraWe travel CRM. Fair, plainly written, India-jurisdiction." },
      { property: "og:title", content: "TraWe Terms of Service" },
      { property: "og:description", content: "Terms of Service for the TraWe travel CRM." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/terms" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/terms" }],
  }),
});

const SECTIONS = [
  { h: "1. Agreement", body: ["By creating a TraWe account you agree to these terms on behalf of your agency. If you don't have authority to bind your agency, don't create the account."] },
  { h: "2. The service", body: ["TraWe provides a multi-tenant B2C travel CRM as a service. We target 99.9% monthly uptime but do not promise the service will be error-free at all times."] },
  { h: "3. Your responsibilities", body: [
    "Keep your login credentials safe. You are responsible for all activity under your account.",
    "Ensure you have the legal right to upload every piece of data you upload.",
    "Comply with applicable law — GST, DPDP, and consent rules for outbound communications.",
  ]},
  { h: "4. Acceptable use", body: [
    "No spam. Do not send unsolicited bulk messages.",
    "No illegal content. Do not upload material that infringes IP, harasses individuals, or is unlawful.",
    "No reverse engineering, resale of the service, or bypassing plan limits.",
  ]},
  { h: "5. Fees & billing", body: [
    "Paid plans are billed monthly or annually in advance, in Indian Rupees, inclusive of GST unless stated otherwise.",
    "Upgrade, downgrade or cancel from Settings → Billing. Downgrades take effect at the end of your billing period.",
  ]},
  { h: "6. Data ownership", body: ["You own your data. TraWe holds it as a processor and never sells it to third parties."] },
  { h: "7. Suspension & termination", body: [
    "We may suspend accounts on non-payment, abuse, or valid legal order — with reasonable notice where possible.",
    "You may terminate any time from Settings → Billing. We honour the DPDP right to erasure on request.",
  ]},
  { h: "8. Liability", body: ["To the maximum extent permitted by law, TraWe's aggregate liability for any claim is capped at the fees you paid us in the 12 months preceding the event."] },
  { h: "9. Governing law", body: ["These terms are governed by the laws of India. Courts at Bengaluru, Karnataka have exclusive jurisdiction."] },
  { h: "10. Contact", body: ["Questions about these terms: legal@trawe.in."] },
];

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Legal</div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground font-mono">Last updated: 15 July 2026</p>
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