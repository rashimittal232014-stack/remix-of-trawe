import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTenantSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, tenants(*)")
      .eq("id", userId)
      .maybeSingle();
    const tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) return { tenant: null, users: [], roles: [], counts: {} };
    const [usersRes, rolesRes, leads, invoices, quotations, bookings, activities] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, created_at").eq("tenant_id", tenantId),
      supabase.from("user_roles").select("user_id, role").eq("tenant_id", tenantId),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
      supabase.from("quotations").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("activities").select("id", { count: "exact", head: true }),
    ]);
    return {
      tenant: profile?.tenants ?? null,
      profile,
      users: usersRes.data ?? [],
      roles: rolesRes.data ?? [],
      counts: {
        leads: leads.count ?? 0,
        invoices: invoices.count ?? 0,
        quotations: quotations.count ?? 0,
        bookings: bookings.count ?? 0,
        activities: activities.count ?? 0,
      },
    };
  });

const tenantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gst_no: z.string().nullable().optional(),
  pan_no: z.string().nullable().optional(),
  currency: z.string().min(1),
  primary_color: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
});

export const updateTenantProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => tenantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!profile?.tenant_id) throw new Error("No tenant");
    const { error } = await supabase.from("tenants").update(data).eq("id", profile.tenant_id);
    if (error) throw error;
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        display_name: z.string().min(1),
        phone: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        phone: data.phone ?? null,
        avatar_url: data.avatar_url ?? null,
      })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Login History ----------
export const getLoginHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("login_events")
      .select("id, event, ip, user_agent, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const recordLoginEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ event: z.string().min(1), user_agent: z.string().nullable().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!prof?.tenant_id) return { ok: true };
    await supabase.from("login_events").insert({
      tenant_id: prof.tenant_id,
      user_id: userId,
      event: data.event,
      user_agent: data.user_agent ?? null,
    });
    return { ok: true };
  });

// ---------- Pipelines & Stages ----------
export const listPipelines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!prof?.tenant_id) return { pipelines: [], stages: [] };
    const [pipes, stages] = await Promise.all([
      supabase
        .from("pipelines")
        .select("*")
        .eq("tenant_id", prof.tenant_id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("pipeline_stages")
        .select("*")
        .eq("tenant_id", prof.tenant_id)
        .order("sort_order", { ascending: true }),
    ]);
    return { pipelines: pipes.data ?? [], stages: stages.data ?? [] };
  });

export const upsertPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        is_default: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!prof?.tenant_id) throw new Error("No tenant");
    if (data.id) {
      const { error } = await supabase
        .from("pipelines")
        .update({ name: data.name, is_default: data.is_default ?? false })
        .eq("id", data.id)
        .eq("tenant_id", prof.tenant_id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabase
      .from("pipelines")
      .insert({ tenant_id: prof.tenant_id, name: data.name, is_default: data.is_default ?? false })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deletePipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pipelines").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const upsertStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid().optional(),
        pipeline_id: z.string().uuid(),
        name: z.string().min(1),
        type: z.string().default("open"),
        probability: z.number().int().min(0).max(100).default(50),
        color: z.string().default("#48a890"),
        sort_order: z.number().int().default(0),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!prof?.tenant_id) throw new Error("No tenant");
    if (data.id) {
      const { error } = await supabase
        .from("pipeline_stages")
        .update({
          name: data.name,
          type: data.type as never,
          probability: data.probability,
          color: data.color,
          sort_order: data.sort_order,
        })
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabase
      .from("pipeline_stages")
      .insert({
        tenant_id: prof.tenant_id,
        pipeline_id: data.pipeline_id,
        name: data.name,
        type: data.type as never,
        probability: data.probability,
        color: data.color,
        sort_order: data.sort_order,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deleteStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pipeline_stages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderStages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    for (const s of data.order) {
      await context.supabase.from("pipeline_stages").update({ sort_order: s.sort_order }).eq("id", s.id);
    }
    return { ok: true };
  });

// ---------- Team role assignment ----------
export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "manager", "agent", "viewer"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
    if (!prof?.tenant_id) throw new Error("No tenant");
    const { error } = await supabase
      .from("user_roles")
      .upsert(
        { tenant_id: prof.tenant_id, user_id: data.user_id, role: data.role as never },
        { onConflict: "user_id,role,tenant_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ user_id: z.string().uuid(), role: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role as never);
    if (error) throw error;
    return { ok: true };
  });

export const exportBackup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const tables = [
      "leads", "customers", "quotations", "quotation_items", "itineraries",
      "itinerary_days", "itinerary_services", "bookings", "invoices",
      "invoice_items", "payments", "activities", "masters_items", "masters_prices",
      "pipelines", "pipeline_stages", "campaigns", "forms", "automations",
    ] as const;
    const out: Record<string, any> = {};
    for (const t of tables) {
      const { data } = await supabase.from(t as never).select("*");
      out[t] = data ?? [];
    }
    return { exportedAt: new Date().toISOString(), data: out };
  });

export const getStorageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const tables = [
      "profiles", "leads", "tenants", "customers", "user_roles", "itineraries",
      "companies", "forms", "activities", "automations", "masters_items",
      "attendance", "notifications", "whatsapp_webhook_logs", "bookings",
      "campaigns", "invoices", "quotations", "payments",
    ] as const;
    const results: Record<string, number> = {};
    await Promise.all(
      tables.map(async (t) => {
        const { count } = await supabase.from(t as never).select("id", { count: "exact", head: true });
        results[t] = count ?? 0;
      })
    );
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return {
      leadsCount: results.leads ?? 0,
      invCount: results.invoices ?? 0,
      itCount: results.itineraries ?? 0,
      total,
      modules: results,
    };
  });