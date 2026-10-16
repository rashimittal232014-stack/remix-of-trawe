import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

/* ===================== subscription / plan state ===================== */

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await ensureTenantId(context);
    const { getTenantPlanState, getUsage, countSeats, touchTenantActivity, syncStorageUsage } = await import("./plan.server");
    const [state, _storage, seats] = await Promise.all([
      getTenantPlanState(t),
      syncStorageUsage(t),
      countSeats(t),
    ]);
    const usage = await getUsage(t);
    void touchTenantActivity(t);
    return { ...state, usage, seats_used: seats };
  });

export const authorizeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bytes: number }) => z.object({ bytes: z.number().int().min(1).max(25 * 1024 * 1024) }).parse(d))
  .handler(async ({ context, data }) => {
    const t = await ensureTenantId(context);
    return (await import("./plan.server")).authorizeStorageUpload(t, data.bytes);
  });

/** Subscription payment history + platform invoices for this workspace. */
export const getMyBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await ensureTenantId(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [pay, inv] = await Promise.all([
      supabaseAdmin
        .from("platform_payments")
        .select("id,amount,currency,mode,reference,paid_on,period_from,period_to,notes")
        .eq("tenant_id", t)
        .order("paid_on", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("billing_invoices")
        .select("*")
        .eq("tenant_id", t)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return { payments: pay.data ?? [], invoices: inv.data ?? [] };
  });

/** Read-only domain status for clients. Provisioning remains with TraWe administrators. */
export const getMyDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await ensureTenantId(context);
    const state = await (await import("./plan.server")).getTenantPlanState(t);
    if (!state.is_platform_owner && !state.features.white_label) return { enabled: false, domains: [] };
    const { data, error } = await context.supabase
      .from("tenant_domains")
      .select("id,hostname,status,verification_txt_name,verification_txt_value,ssl_status,last_checked_at,error_message")
      .eq("tenant_id", t)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { enabled: true, domains: data ?? [] };
  });

/* ===================== broadcasts ===================== */

export const getMyBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: items }, { data: reads }] = await Promise.all([
      context.supabase
        .from("platform_broadcasts")
        .select("id,title,body,kind,created_at,ends_at")
        .order("created_at", { ascending: false })
        .limit(20),
      context.supabase.from("broadcast_reads").select("broadcast_id").eq("user_id", context.userId),
    ]);
    const seen = new Set((reads ?? []).map((r: any) => r.broadcast_id));
    return (items ?? []).filter((b: any) => !seen.has(b.id));
  });

export const dismissBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const t = await ensureTenantId(context);
    await context.supabase
      .from("broadcast_reads")
      .insert({ broadcast_id: data.id, user_id: context.userId, tenant_id: t });
    return { ok: true };
  });

/* ===================== support tickets ===================== */

const ticketSchema = z.object({
  subject: z.string().min(3).max(160),
  message: z.string().min(5).max(4000),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof ticketSchema>) => ticketSchema.parse(d))
  .handler(async ({ context, data }) => {
    const t = await ensureTenantId(context);
    const { data: out, error } = await context.supabase
      .from("support_tickets")
      .insert({
        tenant_id: t,
        user_id: context.userId,
        requester_email: (context.claims as any)?.email ?? null,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
      })
      .select()
      .single();
    if (error) throw error;
    return out;
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await ensureTenantId(context);
    const { data } = await context.supabase
      .from("support_tickets")
      .select("id,subject,message,priority,status,reply,replied_at,created_at")
      .eq("tenant_id", t)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/* ===================== impersonation notice ===================== */

export const getImpersonationNotice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 12 * 3600e3).toISOString();
    const { data } = await supabaseAdmin
      .from("impersonation_events")
      .select("actor_email,target_email,reason,created_at")
      .eq("target_user_id", context.userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { active: false as const };
    return {
      active: true as const,
      actor_email: (data as any).actor_email as string | null,
      target_email: (data as any).target_email as string | null,
      started_at: (data as any).created_at as string,
    };
  });
