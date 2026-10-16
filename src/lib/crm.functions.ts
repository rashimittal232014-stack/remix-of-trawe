import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

// -------- Bootstrap: current profile + tenant + roles --------
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*, tenants(*)").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      profile,
      tenant: profile?.tenants ?? null,
      roles: (roles ?? []).map((r) => r.role as string),
      isSuperAdmin: (roles ?? []).some((r) => r.role === "super_admin"),
    };
  });

// -------- Team (profiles list for owner assignment) --------
export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url")
      .order("display_name");
    return data ?? [];
  });

// -------- Pipelines & Stages --------
export const listPipelines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pipelines")
      .select("*, pipeline_stages(*)")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((p: any) => ({
      ...p,
      pipeline_stages: (p.pipeline_stages ?? []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order,
      ),
    }));
  });

// -------- Leads --------
export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; stageId?: string; pipelineId?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("leads")
      .select("*, pipeline_stages(name,color,type)")
      .order("created_at", { ascending: false });
    if (data.stageId) q = q.eq("stage_id", data.stageId);
    if (data.pipelineId) q = q.eq("pipeline_id", data.pipelineId);
    if (data.search) {
      q = q.or(
        `full_name.ilike.%${data.search}%,email.ilike.%${data.search}%,phone.ilike.%${data.search}%,code.ilike.%${data.search}%`,
      );
    }
    const { data: leads, error } = await q;
    if (error) throw error;
    return leads ?? [];
  });

export const getLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*, pipeline_stages(*), pipelines(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return lead;
  });

const leadSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  query_type: z.string().optional(),
  service_type: z.string().optional(),
  from_location: z.string().optional(),
  to_location: z.string().optional(),
  travel_date: z.string().optional().nullable(),
  return_date: z.string().optional().nullable(),
  nights: z.number().int().optional().nullable(),
  adults: z.number().int().optional().nullable(),
  children: z.number().int().optional().nullable(),
  infants: z.number().int().optional().nullable(),
  source: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "hot"]).optional(),
  estimated_value: z.number().optional().nullable(),
  notes: z.string().optional(),
  pipeline_id: z.string().uuid().optional().nullable(),
  stage_id: z.string().uuid().optional().nullable(),
  next_followup_at: z.string().optional().nullable(),
});

export const upsertLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof leadSchema>) => leadSchema.parse(d))
  .handler(async ({ context, data }) => {
    const __tid = await ensureTenantId(context);
    const __plan = await import("./plan.server");
    if ((data as any).id) {
      await __plan.assertTenantActive(__tid);
    } else {
      await __plan.meter(__tid, "queries");
    }

    // Default pipeline+stage if none set
    let pipeline_id = data.pipeline_id ?? null;
    let stage_id = data.stage_id ?? null;
    if (!pipeline_id) {
      const { data: pipe } = await context.supabase
        .from("pipelines")
        .select("id, pipeline_stages(id,sort_order)")
        .eq("is_default", true)
        .maybeSingle();
      if (pipe) {
        pipeline_id = pipe.id;
        stage_id =
          stage_id ??
          (pipe as any).pipeline_stages?.sort(
            (a: any, b: any) => a.sort_order - b.sort_order,
          )[0]?.id ??
          null;
      }
    }

    const row = {
      ...data,
      email: data.email || null,
      travel_date: data.travel_date || null,
      return_date: data.return_date || null,
      next_followup_at: data.next_followup_at || null,
      tenant_id: __tid,
      owner_id: context.userId,
      pipeline_id,
      stage_id,
    };

    if (data.id) {
      const { data: out, error } = await context.supabase
        .from("leads")
        .update(row)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return out;
    }
    const { data: out, error } = await context.supabase
      .from("leads")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return out;
  });

export const updateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; stage_id: string }) => d)
  .handler(async ({ context, data }) => {
    // Look up the stage to sync pipeline_id (stages belong to a pipeline)
    const { data: stage, error: sErr } = await context.supabase
      .from("pipeline_stages")
      .select("id, pipeline_id")
      .eq("id", data.stage_id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!stage) throw new Error("Stage not found");
    const { error } = await context.supabase
      .from("leads")
      .update({ stage_id: data.stage_id, pipeline_id: stage.pipeline_id })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Activities --------
export const listActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { leadId?: string; onlyToday?: boolean } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("activities").select("*").order("due_at", { ascending: true });
    if (data.leadId) q = q.eq("lead_id", data.leadId);
    if (data.onlyToday) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      q = q.gte("due_at", start.toISOString()).lte("due_at", end.toISOString());
    }
    const { data: acts, error } = await q;
    if (error) throw error;
    return acts ?? [];
  });

const activitySchema = z.object({
  id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional().nullable(),
  type: z.enum(["task", "call", "event", "note"]),
  title: z.string().min(1),
  description: z.string().optional(),
  due_at: z.string().optional().nullable(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
});

export const upsertActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof activitySchema>) => activitySchema.parse(d))
  .handler(async ({ context, data }) => {
    const __tid = await ensureTenantId(context);
    const row = {
      ...data,
      due_at: data.due_at || null,
      tenant_id: __tid,
      owner_id: context.userId,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase
        .from("activities")
        .update(row)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw error;
      return out;
    }
    const { data: out, error } = await context.supabase
      .from("activities")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return out;
  });

export const completeActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("activities")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Dashboard KPIs --------
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [leadsRes, stagesRes, actsRes, profilesRes, paymentsRes] = await Promise.all([
      supabase.from("leads").select("id,estimated_value,stage_id,query_type,service_type,created_at,travel_date,to_location,source,owner_id"),
      supabase.from("pipeline_stages").select("id,name,type,color,sort_order").order("sort_order"),
      supabase
        .from("activities")
        .select("*")
        .eq("status", "pending")
        .order("due_at", { ascending: true })
        .limit(20),
      supabase.from("profiles").select("id,display_name,email,avatar_url"),
      supabase.from("payments").select("amount,paid_at"),
    ]);
    const failedQuery = [leadsRes, stagesRes, actsRes, profilesRes, paymentsRes].find((result) => result.error);
    if (failedQuery?.error) throw failedQuery.error;
    const leads = leadsRes.data ?? [];
    const stages = stagesRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const stageMap = new Map(stages.map((s) => [s.id, s]));

    const total = leads.length;
    const wonLeads = leads.filter((l) => {
      const s = stageMap.get(l.stage_id as string);
      return s?.type === "won";
    });
    const confirmedValue = wonLeads.reduce((sum, l) => sum + Number(l.estimated_value ?? 0), 0);
    const now = new Date();
    const collections = (paymentsRes.data ?? []).reduce((sum, payment) => {
      if (!payment.paid_at) return sum;
      const paidAt = new Date(payment.paid_at);
      if (paidAt.getFullYear() !== now.getFullYear() || paidAt.getMonth() !== now.getMonth()) return sum;
      return sum + Number(payment.amount ?? 0);
    }, 0);
    const upcoming = wonLeads.filter(
      (l) => l.travel_date && new Date(l.travel_date) >= new Date(),
    ).length;

    // Stage-wise counts
    const byStage: Record<string, number> = {};
    leads.forEach((l) => {
      const s = stageMap.get(l.stage_id as string);
      if (s) byStage[s.name] = (byStage[s.name] ?? 0) + 1;
    });
    const pipelineBars = stages.map((s) => ({
      name: s.name,
      color: s.color,
      count: byStage[s.name] ?? 0,
    }));

    // Service mix
    const serviceMix: Record<string, number> = {};
    leads.forEach((l) => {
      const key = l.service_type || l.query_type || "Other";
      serviceMix[key] = (serviceMix[key] ?? 0) + 1;
    });

    // Monthly trend (last 6 months)
    const months: { label: string; total: number; won: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en", { month: "short" });
      const y = d.getFullYear();
      const m = d.getMonth();
      const inMonth = leads.filter((l) => {
        const c = new Date(l.created_at as string);
        return c.getFullYear() === y && c.getMonth() === m;
      });
      months.push({
        label,
        total: inMonth.length,
        won: inMonth.filter((l) => stageMap.get(l.stage_id as string)?.type === "won").length,
      });
    }

    // Top destinations (by to_location)
    const destMap: Record<string, { count: number; value: number }> = {};
    leads.forEach((l) => {
      const key = (l.to_location || "").trim();
      if (!key) return;
      const bucket = (destMap[key] ??= { count: 0, value: 0 });
      bucket.count += 1;
      bucket.value += Number(l.estimated_value ?? 0);
    });
    const topDestinations = Object.entries(destMap)
      .map(([name, v]) => ({ name, count: v.count, value: v.value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Source performance
    const sourceMap: Record<string, { count: number; won: number; value: number }> = {};
    leads.forEach((l) => {
      const key = (l.source || "Unknown").trim() || "Unknown";
      const bucket = (sourceMap[key] ??= { count: 0, won: 0, value: 0 });
      bucket.count += 1;
      const isWon = stageMap.get(l.stage_id as string)?.type === "won";
      if (isWon) {
        bucket.won += 1;
        bucket.value += Number(l.estimated_value ?? 0);
      }
    });
    const sourcePerformance = Object.entries(sourceMap)
      .map(([name, v]) => ({
        name,
        count: v.count,
        won: v.won,
        value: v.value,
        conversion: v.count ? Math.round((v.won / v.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Team performance (by owner)
    const teamMap: Record<string, { count: number; won: number; value: number }> = {};
    leads.forEach((l) => {
      const key = (l.owner_id as string) || "unassigned";
      const bucket = (teamMap[key] ??= { count: 0, won: 0, value: 0 });
      bucket.count += 1;
      const isWon = stageMap.get(l.stage_id as string)?.type === "won";
      if (isWon) {
        bucket.won += 1;
        bucket.value += Number(l.estimated_value ?? 0);
      }
    });
    const teamPerformance = Object.entries(teamMap)
      .map(([id, v]) => {
        const p = profileMap.get(id);
        return {
          id,
          name: p?.display_name || p?.email || (id === "unassigned" ? "Unassigned" : "Teammate"),
          avatar: p?.avatar_url ?? null,
          count: v.count,
          won: v.won,
          value: v.value,
          conversion: v.count ? Math.round((v.won / v.count) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value || b.count - a.count)
      .slice(0, 8);

    return {
      kpis: {
        totalQueries: total,
        confirmedQueries: wonLeads.length,
        confirmedValue,
        confirmedDepartures: upcoming,
        collections,
        supplierPayables: 0,
      },
      pipelineBars,
      serviceMix: Object.entries(serviceMix).map(([name, value]) => ({ name, value })),
      todayFollowups: actsRes.data ?? [],
      monthlyTrend: months,
      topDestinations,
      sourcePerformance,
      teamPerformance,
    };
  });