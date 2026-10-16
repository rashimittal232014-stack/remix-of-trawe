import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0F2A4A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "TraWe" },
      { title: "TraWe — The operating system for modern travel agencies" },
      { name: "description", content: "TraWe is the all-in-one CRM for Indian travel agencies. Capture leads, build itineraries, send GST-ready quotations & invoices, collect payments on Razorpay, and close on WhatsApp — with an AI copilot built in." },
      { name: "author", content: "TraWe" },
      { property: "og:title", content: "TraWe — The operating system for modern travel agencies" },
      { property: "og:description", content: "TraWe is the all-in-one CRM for Indian travel agencies. Capture leads, build itineraries, send GST-ready quotations & invoices, collect payments on Razorpay, and close on WhatsApp — with an AI copilot built in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TraWe — The operating system for modern travel agencies" },
      { name: "twitter:description", content: "TraWe is the all-in-one CRM for Indian travel agencies. Capture leads, build itineraries, send GST-ready quotations & invoices, collect payments on Razorpay, and close on WhatsApp — with an AI copilot built in." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/72afad21-d680-4798-a199-25e234725b42" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/72afad21-d680-4798-a199-25e234725b42" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Sora:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useHostRedirect();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

// Route the app across trawe.in (marketing) and app.trawe.in (dashboard + auth).
// - On app.trawe.in: marketing pages redirect to https://trawe.in/...
// - On trawe.in / www.trawe.in: dashboard, auth, onboarding, super-admin redirect
//   to https://app.trawe.in/...
// Localhost, preview, and *.lovable.app hosts are left untouched.
const APP_PATHS = ["/auth", "/onboarding", "/dashboard", "/super-admin140329"];
const APP_PREFIXES = [
  "/leads", "/quotations", "/itineraries", "/invoices", "/bookings",
  "/payments", "/customers", "/companies", "/branches", "/roles",
  "/tasks", "/activities", "/notes", "/mail", "/whatsapp", "/marketing",
  "/masters", "/packages", "/vouchers", "/wallet", "/reports", "/targets",
  "/attendance", "/automations", "/forms", "/website", "/settings",
];

function isAppPath(path: string) {
  if (APP_PATHS.includes(path)) return true;
  return APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function useHostRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    // Agent integration endpoints must stay on whatever host they were opened on.
    if (path === "/mcp" || path.startsWith("/mcp/") || path.startsWith("/.mcp") ||
        path.startsWith("/.well-known/") || path.startsWith("/.lovable/")) return;


    const isMarketingHost = host === "trawe.in" || host === "www.trawe.in";
    const isAppHost = host === "app.trawe.in";
    const isSuperAdminHost = host === "super-admin.trawe.in";

    // super-admin.trawe.in always serves the super-admin route
    if (isSuperAdminHost) {
      if (path !== "/super-admin") {
        window.location.replace(`/super-admin${search}${hash}`);
      }
      return;
    }

    // Client white-label domains (crm.clientdomain.com) serve the app only —
    // never redirect them to the TraWe marketing site.
    const isKnownHost =
      isMarketingHost || isAppHost || host === "localhost" || host.endsWith("lovable.app");
    if (!isKnownHost) {
      if (path === "/") window.location.replace(`/auth${search}${hash}`);
      return;
    }

    // Prevent direct access to /super-admin on other hosts
    if ((isAppHost || isMarketingHost) && path === "/super-admin") {
      window.location.replace(`https://super-admin.trawe.in/super-admin${search}${hash}`);
      return;
    }

    if (isAppHost && !isAppPath(path)) {
      window.location.replace(`https://trawe.in${path}${search}${hash}`);
      return;
    }
    if (isMarketingHost && isAppPath(path)) {
      window.location.replace(`https://app.trawe.in${path}${search}${hash}`);
    }
  }, []);
}
