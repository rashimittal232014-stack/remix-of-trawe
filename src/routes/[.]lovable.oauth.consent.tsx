import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";

type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <Shell>
      <p className="text-sm text-[#001830]/70">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </p>
    </Shell>
  ),
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[linear-gradient(180deg,#dbe7f5_0%,#e6ecf5_35%,#f5ece2_75%,#f8dccb_100%)] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/80 backdrop-blur-xl p-8 shadow-[0_30px_80px_-40px_rgba(0,24,48,0.25)]">
        <Logo className="h-9 w-auto" />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Consent() {
  const details = Route.useLoaderData() as any;
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold tracking-tight text-[#001830]">
        Connect {clientName} to your TraWe workspace
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#001830]/65">
        {clientName} will be able to read and create records in TraWe exactly as you can — your queries, customers and
        itineraries. You can disconnect it at any time.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#c04818]/10 px-3 py-2 text-[13px] text-[#c04818]">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
          {busy ? "Please wait…" : "Approve"}
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
          Deny
        </Button>
      </div>
    </Shell>
  );
}
