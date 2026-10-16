import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";

export const Route = createFileRoute("/refund")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Refund Policy — TraWe" },
      { name: "description", content: "Straightforward refund terms for TraWe subscriptions — with a 14-day money-back guarantee on your first paid month." },
      { property: "og:title", content: "TraWe Refund Policy" },
      { property: "og:description", content: "14-day money-back guarantee and clear proration terms for TraWe." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/refund" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/refund" }],
  }),
});

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Legal</div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Refund & Cancellation Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground font-mono">Last updated: 15 July 2026</p>
        <div className="mt-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">14-day money-back guarantee</h2><p className="mt-2">Email <span className="font-mono">billing@trawe.in</span> within 14 days of your first payment for a full, no-questions-asked refund. Applies to your first paid month only, not to renewals.</p></section>
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">Monthly subscriptions</h2><p className="mt-2">Monthly plans are billed in advance. Cancel any time from Settings → Billing; your workspace stays active until the end of the paid period. Partial months are not pro-rated.</p></section>
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">Annual subscriptions</h2><p className="mt-2">Cancel mid-year and we refund the unused whole months, minus any discount you received for choosing annual.</p></section>
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">Add-ons and usage</h2><p className="mt-2">One-time purchases (extra seats, WhatsApp template packs, AI credits) are non-refundable once consumed. Unused credits remain until you cancel.</p></section>
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">How refunds are issued</h2><p className="mt-2">Refunds go back to the original payment method within 5–10 business days.</p></section>
          <section><h2 className="text-lg font-semibold tracking-tight text-foreground">Chargebacks</h2><p className="mt-2">Please write to us first — we resolve almost every billing question within 24 hours. Chargebacks may cause immediate account suspension until resolved.</p></section>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}