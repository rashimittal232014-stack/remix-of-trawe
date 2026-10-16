import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader, MarketingFooter } from "./features";
import { Mail, MessageCircle, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Contact — TraWe Travel CRM" },
      { name: "description", content: "Talk to the TraWe team. Email, WhatsApp, or book a demo — we reply within one business day." },
      { property: "og:title", content: "Contact TraWe" },
      { property: "og:description", content: "Email, WhatsApp or book a demo — we reply within one business day." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trawe.in/contact" },
    ],
    links: [{ rel: "canonical", href: "https://trawe.in/contact" }],
  }),
});

function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="font-mono text-xs uppercase tracking-widest text-primary mb-3">Contact</div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">We reply within a business day.</h1>
        <p className="mt-4 text-muted-foreground">Reach us on any of these — whichever's easiest.</p>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <a href="mailto:sales@trawe.in" className="border rounded-md p-5 bg-card hover:border-primary transition-colors block">
            <Mail className="h-4 w-4 text-primary mb-3" /><div className="font-medium">Email</div><div className="text-sm text-muted-foreground mt-1 font-mono">sales@trawe.in</div>
          </a>
          <a href="https://wa.me/919311784451" target="_blank" rel="noreferrer" className="border rounded-md p-5 bg-card hover:border-primary transition-colors block">
            <MessageCircle className="h-4 w-4 text-primary mb-3" /><div className="font-medium">WhatsApp</div><div className="text-sm text-muted-foreground mt-1 font-mono">+91 93117 84451</div>
          </a>
          <a href="tel:+919311784451" className="border rounded-md p-5 bg-card hover:border-primary transition-colors block">
            <Phone className="h-4 w-4 text-primary mb-3" /><div className="font-medium">Phone</div><div className="text-sm text-muted-foreground mt-1 font-mono">+91 93117 84451</div>
          </a>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}