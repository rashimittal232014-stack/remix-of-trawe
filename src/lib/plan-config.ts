// Client-safe plan definitions shared by the tenant app and the platform console.

export type FeatureKey =
  | "ai_builder"
  | "live_search"
  | "whatsapp_cloud"
  | "campaigns"
  | "white_label"
  | "api_access"
  | "reports_advanced";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  ai_builder: "AI Itinerary Builder",
  live_search: "Live hotel & flight search",
  whatsapp_cloud: "WhatsApp Cloud API",
  campaigns: "Email / WhatsApp campaigns",
  white_label: "White-label domain & branding",
  api_access: "API access",
  reports_advanced: "Advanced reports & forecasting",
};

export type LimitKey = "ai_calls" | "queries" | "storage_mb";

export const LIMIT_LABELS: Record<LimitKey, string> = {
  ai_calls: "AI generations / month",
  queries: "New queries / month",
  storage_mb: "Storage (MB)",
};

export type PlanDef = {
  key: string;
  label: string;
  seats: number;
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>;
};

const f = (on: FeatureKey[]): Record<FeatureKey, boolean> =>
  Object.fromEntries(
    (Object.keys(FEATURE_LABELS) as FeatureKey[]).map((k) => [k, on.includes(k)]),
  ) as Record<FeatureKey, boolean>;

export const PLANS: Record<string, PlanDef> = {
  starter: {
    key: "starter",
    label: "Starter",
    seats: 3,
    features: f(["ai_builder"]),
    limits: { ai_calls: 100, queries: 300, storage_mb: 1024 },
  },
  growth: {
    key: "growth",
    label: "Growth",
    seats: 10,
    features: f(["ai_builder", "live_search", "campaigns", "reports_advanced"]),
    limits: { ai_calls: 750, queries: 2000, storage_mb: 5120 },
  },
  pro: {
    key: "pro",
    label: "Pro",
    seats: 25,
    features: f([
      "ai_builder",
      "live_search",
      "campaigns",
      "reports_advanced",
      "whatsapp_cloud",
      "white_label",
    ]),
    limits: { ai_calls: 3000, queries: 10000, storage_mb: 20480 },
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    seats: 200,
    features: f([
      "ai_builder",
      "live_search",
      "campaigns",
      "reports_advanced",
      "whatsapp_cloud",
      "white_label",
      "api_access",
    ]),
    limits: { ai_calls: 0, queries: 0, storage_mb: 0 }, // 0 = unlimited
  },
};

export const PLAN_KEYS = Object.keys(PLANS);

/** Effective feature map: plan defaults with per-tenant overrides on top. */
export function resolveFeatures(
  plan: string | null | undefined,
  overrides: Record<string, unknown> | null | undefined,
): Record<FeatureKey, boolean> {
  const base = { ...(PLANS[plan ?? "starter"] ?? PLANS["starter"]!).features };
  for (const [k, v] of Object.entries(overrides ?? {})) {
    if (k in base && typeof v === "boolean") base[k as FeatureKey] = v;
  }
  return base;
}

/** Effective limits: plan defaults with per-tenant overrides on top. 0 = unlimited. */
export function resolveLimits(
  plan: string | null | undefined,
  overrides: Record<string, unknown> | null | undefined,
): Record<LimitKey, number> {
  const base = { ...(PLANS[plan ?? "starter"] ?? PLANS["starter"]!).limits };
  for (const [k, v] of Object.entries(overrides ?? {})) {
    const n = Number(v);
    if (k in base && Number.isFinite(n) && n >= 0) base[k as LimitKey] = n;
  }
  return base;
}

export function planLabel(plan: string | null | undefined) {
  return PLANS[plan ?? ""]?.label ?? (plan ? plan[0]!.toUpperCase() + plan.slice(1) : "Starter");
}

export function resolvePlan(
  plan: string | null | undefined,
  features: Record<string, any> | null | undefined,
  limits: Record<string, any> | null | undefined,
) {
  return {
    features: resolveFeatures(plan, features),
    limits: resolveLimits(plan, limits),
  };
}
