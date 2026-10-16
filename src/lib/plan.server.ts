// Server-only subscription / plan enforcement helpers.
import { resolveFeatures, resolveLimits, type FeatureKey, type LimitKey } from "./plan-config";

export type TenantPlanState = {
  tenant_id: string;
  name: string | null;
  plan: string;
  plan_price: number;
  billing_cycle: string;
  subscription_status: string; // trial | active | suspended | past_due
  subscription_start: string | null;
  renewal_date: string | null;
  grace_days: number;
  seat_limit: number;
  is_platform_owner: boolean;
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>;
  /** derived */
  active: boolean;
  locked: boolean;
  in_grace: boolean;
  days_left: number | null;
};

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 864e5);
}

export async function getTenantPlanState(tenantId: string): Promise<TenantPlanState> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select(
      "id,name,plan,plan_price,billing_cycle,subscription_status,subscription_start,renewal_date,grace_days,seat_limit,is_platform_owner,features,usage_limits",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Workspace not found");

  const t: any = data;
  const owner = !!t.is_platform_owner;
  const today = new Date();
  const renewal = t.renewal_date ? new Date(t.renewal_date) : null;
  const grace = Number(t.grace_days ?? 7);
  const daysLeft = renewal ? daysBetween(renewal, today) : null;
  const expired = renewal ? daysLeft! < 0 : false;
  const pastGrace = renewal ? daysLeft! < -grace : false;

  const suspended = t.subscription_status === "suspended";
  const locked = !owner && (suspended || pastGrace);
  const inGrace = !owner && !locked && expired;
  const active = owner || (!locked && (t.subscription_status === "active" || t.subscription_status === "trial"));

  return {
    tenant_id: t.id,
    name: t.name ?? null,
    plan: t.plan ?? "starter",
    plan_price: Number(t.plan_price ?? 0),
    billing_cycle: t.billing_cycle ?? "monthly",
    subscription_status: t.subscription_status ?? "trial",
    subscription_start: t.subscription_start ?? null,
    renewal_date: t.renewal_date ?? null,
    grace_days: grace,
    seat_limit: Number(t.seat_limit ?? 5),
    is_platform_owner: owner,
    features: resolveFeatures(t.plan, t.features),
    limits: resolveLimits(t.plan, t.usage_limits),
    active,
    locked,
    in_grace: inGrace,
    days_left: daysLeft,
  };
}

export class PlanError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Blocks every write path when the subscription is suspended or past grace. */
export async function assertTenantActive(tenantId: string) {
  const state = await getTenantPlanState(tenantId);
  if (state.locked) {
    throw new PlanError(
      "subscription_locked",
      "Your TraWe subscription is inactive. Please contact support to restore access.",
    );
  }
  return state;
}

/** Blocks a gated feature when the plan does not include it. */
export async function assertFeature(tenantId: string, feature: FeatureKey) {
  const state = await assertTenantActive(tenantId);
  if (!state.is_platform_owner && !state.features[feature]) {
    throw new PlanError("feature_locked", "This feature is not included in your current plan.");
  }
  return state;
}

export async function getUsage(tenantId: string, period = new Date().toISOString().slice(0, 7)) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("usage_counters")
    .select("metric,used")
    .eq("tenant_id", tenantId)
    .eq("period", period);
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as any[]) out[r.metric] = Number(r.used ?? 0);
  return out;
}

/** Increments a metered counter and throws once the plan limit is exhausted. */
export async function meter(tenantId: string, metric: LimitKey, delta = 1) {
  const state = await assertTenantActive(tenantId);
  if (state.is_platform_owner) return state;
  const limit = state.limits[metric] ?? 0;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Atomic check-and-increment: concurrent requests can never overshoot or be lost.
  const { data, error } = await supabaseAdmin.rpc("consume_usage", {
    _tenant: tenantId, _metric: metric, _delta: delta, _limit: limit,
  });
  if (error) throw error;
  if (data === null) {
    throw new PlanError(
      "limit_reached",
      `You have reached your monthly plan limit for this action (${limit}). Upgrade to continue.`,
    );
  }
  return state;
}

/** Storage is a live gauge, not a monthly event counter. Recalculate it from the tenant's folders. */
export async function syncStorageUsage(tenantId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { CRM_BUCKETS, listBucketRecursive } = await import("./storage-cleaner.server");
  let bytes = 0;
  for (const bucket of CRM_BUCKETS) {
    const objects = await listBucketRecursive(supabaseAdmin, bucket, tenantId);
    bytes += objects.reduce((sum, object) => sum + Number(object.size ?? 0), 0);
  }
  const usedMb = Math.ceil(bytes / (1024 * 1024));
  await supabaseAdmin.rpc("set_usage", { _tenant: tenantId, _metric: "storage_mb", _used: usedMb });
  return { bytes, usedMb };
}

/** Checks suspension and storage capacity before a browser upload starts. */
export async function authorizeStorageUpload(tenantId: string, incomingBytes: number) {
  const state = await assertTenantActive(tenantId);
  const { bytes, usedMb } = await syncStorageUsage(tenantId);
  const incomingMb = Math.ceil(Math.max(0, incomingBytes) / (1024 * 1024));
  const limit = state.limits.storage_mb ?? 0;
  if (!state.is_platform_owner && limit > 0 && usedMb + incomingMb > limit) {
    throw new PlanError("limit_reached", `This upload would exceed your ${limit} MB storage limit.`);
  }
  return { ok: true as const, bytes, usedMb, limit };
}

/** Seats currently consumed by a workspace. */
export async function countSeats(tenantId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return count ?? 0;
}

export async function assertSeatAvailable(tenantId: string) {
  const state = await assertTenantActive(tenantId);
  if (state.is_platform_owner) return state;
  const used = await countSeats(tenantId);
  if (used >= state.seat_limit) {
    throw new PlanError(
      "seat_limit",
      `Your plan includes ${state.seat_limit} users. Contact support to add more seats.`,
    );
  }
  return state;
}

/** Lightweight health telemetry for the platform console. */
export async function touchTenantActivity(tenantId: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("tenants").update({ last_active_at: new Date().toISOString() }).eq("id", tenantId);
  } catch {
    /* telemetry is best-effort */
  }
}
