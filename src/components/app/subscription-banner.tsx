import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useLocation } from "@tanstack/react-router";
import { AlertTriangle, Megaphone, ShieldAlert, X, Lock } from "lucide-react";
import { getMySubscription, getMyBroadcasts, dismissBroadcast, getImpersonationNotice } from "@/lib/plan.functions";
import { supabase } from "@/integrations/supabase/client";
import type { FeatureKey } from "@/lib/plan-config";

export function useSubscription() {
  const fn = useServerFn(getMySubscription);
  return useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
}

/** Convenience gate for UI affordances. Server functions enforce it for real. */
export function useFeature(key: FeatureKey) {
  const { data } = useSubscription();
  if (!data) return true; // optimistic while loading — server still enforces
  return data.is_platform_owner || !!data.features?.[key];
}

export function SubscriptionBanners() {
  const { data } = useSubscription();
  const qc = useQueryClient();

  const bFn = useServerFn(getMyBroadcasts);
  const { data: broadcasts } = useQuery({ queryKey: ["my-broadcasts"], queryFn: () => bFn(), staleTime: 120_000 });
  const dismissFn = useServerFn(dismissBroadcast);
  const dismiss = useMutation({
    mutationFn: (id: string) => dismissFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-broadcasts"] }),
  });

  const impFn = useServerFn(getImpersonationNotice);
  const { data: imp } = useQuery({ queryKey: ["impersonation-notice"], queryFn: () => impFn(), staleTime: 300_000 });

  const renewalSoon =
    data && !data.is_platform_owner && data.days_left !== null && data.days_left <= 15 && data.days_left >= 0;

  return (
    <div className="space-y-2">
      {imp?.active && (
        <Banner tone="amber" icon={ShieldAlert}>
          <span>
            Support session active — a TraWe platform admin is signed in as{" "}
            <strong>{imp.target_email}</strong>.
          </span>
          <button
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
            className="ml-auto rounded-full border border-amber-300 bg-white/70 px-3 py-1 text-xs font-medium"
          >
            End session
          </button>
        </Banner>
      )}

      {data?.in_grace && (
        <Banner tone="red" icon={AlertTriangle}>
          <span>
            Your subscription expired on {data.renewal_date}. Access ends in{" "}
            {Math.max(0, data.grace_days + (data.days_left ?? 0))} day(s).
          </span>
          <Link to="/subscription" className="ml-auto rounded-full bg-[#c04818] px-3 py-1 text-xs font-medium text-white">
            View subscription
          </Link>
        </Banner>
      )}

      {renewalSoon && !data?.in_grace && (
        <Banner tone="teal" icon={AlertTriangle}>
          <span>
            Your {data!.plan} plan renews in {data!.days_left} day(s) on {data!.renewal_date}.
          </span>
          <Link to="/subscription" className="ml-auto rounded-full bg-[#48a890] px-3 py-1 text-xs font-medium text-white">
            Renew
          </Link>
        </Banner>
      )}

      {(broadcasts ?? []).map((b: any) => (
        <Banner key={b.id} tone={b.kind === "warning" ? "amber" : "navy"} icon={Megaphone}>
          <span>
            <strong>{b.title}</strong> — {b.body}
          </span>
          <button
            onClick={() => dismiss.mutate(b.id)}
            className="ml-auto rounded-full p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </Banner>
      ))}
    </div>
  );
}

const TONES: Record<string, string> = {
  red: "border-red-200 bg-red-50 text-red-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  teal: "border-[#cfe7df] bg-[#effaf5] text-[#0d4f3f]",
  navy: "border-[#dbe4ef] bg-[#f2f6fb] text-[#001830]",
};

function Banner({
  tone,
  icon: Icon,
  children,
}: {
  tone: keyof typeof TONES | string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm ${TONES[tone] ?? TONES["navy"]}`}>
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

/** Full-screen lockout for suspended / past-grace workspaces. */
export function SubscriptionLock() {
  const { data } = useSubscription();
  const location = useLocation();
  if (!data?.locked || location.pathname === "/subscription") return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#001830]/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdeee7] text-[#c04818]">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#001830]">Your workspace is on hold</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          {data.subscription_status === "suspended"
            ? "This workspace has been suspended by the TraWe team."
            : "Your subscription period and grace window have ended."}{" "}
          Your data is safe — restore access by settling your subscription.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/subscription"
            className="rounded-full border border-[#e8ecf1] px-4 py-2.5 text-sm font-medium text-[#001830]"
          >
            View subscription and support
          </Link>
          <a
            href="mailto:sales@trawe.in?subject=Restore%20my%20TraWe%20workspace"
            className="rounded-full bg-[#48a890] px-4 py-2.5 text-sm font-medium text-white"
          >
            Contact TraWe support
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
            className="rounded-full border border-[#e8ecf1] px-4 py-2.5 text-sm text-[#64748b]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
