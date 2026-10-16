import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { ensureTenantId } from "./tenant.server";
async function tenantId(ctx: any): Promise<string> { return ensureTenantId(ctx); }

/* =========== BRANCHES =========== */
export const listBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("branches").select("*").order("is_default", { ascending: false }).order("name");
    if (error) throw error;
    return data ?? [];
  });

export const upsertBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid,
      name: data.name, code: data.code ?? null,
      address: data.address ?? null, city: data.city ?? null, state: data.state ?? null, country: data.country ?? null,
      phone: data.phone ?? null, email: data.email ?? null, gstin: data.gstin ?? null,
      invoice_prefix: data.invoice_prefix ?? null,
      is_default: !!data.is_default, is_active: data.is_active ?? true,
    };
    if (data.is_default) {
      await context.supabase.from("branches").update({ is_default: false }).eq("tenant_id", tid);
    }
    if (data.id) {
      const { data: out, error } = await context.supabase.from("branches").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("branches").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("branches").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

/* =========== ATTENDANCE =========== */
export const listAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month?: string; user_id?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const month = data.month ? new Date(data.month + "-01") : new Date();
    const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);
    let q = context.supabase.from("attendance").select("*").gte("date", from).lte("date", to).order("date", { ascending: false });
    if (data.user_id) q = q.eq("user_id", data.user_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const punchIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantId(context);
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await context.supabase.from("attendance").select("*").eq("user_id", context.userId).eq("date", today).maybeSingle();
    if (existing) return existing;
    const { data, error } = await context.supabase.from("attendance").insert({
      tenant_id: tid, user_id: context.userId, date: today, punch_in: new Date().toISOString(), status: "present",
    }).select().single();
    if (error) throw error; return data;
  });

export const punchOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await context.supabase.from("attendance").select("*").eq("user_id", context.userId).eq("date", today).maybeSingle();
    if (!existing) throw new Error("No punch-in for today");
    const out = new Date().toISOString();
    const hrs = existing.punch_in ? Math.max(0, (new Date(out).getTime() - new Date(existing.punch_in).getTime()) / 3600000) : null;
    const { data, error } = await context.supabase.from("attendance").update({ punch_out: out, hours: hrs ? Number(hrs.toFixed(2)) : null }).eq("id", existing.id).select().single();
    if (error) throw error; return data;
  });

export const upsertAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, user_id: data.user_id ?? context.userId,
      date: data.date, punch_in: data.punch_in ?? null, punch_out: data.punch_out ?? null,
      hours: data.hours ?? null, status: data.status ?? "present", notes: data.notes ?? null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("attendance").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("attendance").upsert(row, { onConflict: "tenant_id,user_id,date" }).select().single();
    if (error) throw error; return out;
  });

/* =========== LEAVES =========== */
export const listLeaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const upsertLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, user_id: data.user_id ?? context.userId,
      leave_type: data.leave_type ?? "casual",
      from_date: data.from_date, to_date: data.to_date,
      reason: data.reason ?? null, status: data.status ?? "pending",
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("leave_requests").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("leave_requests").insert(row).select().single();
    if (error) throw error; return out;
  });

export const reviewLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" }) => d)
  .handler(async ({ context, data }) => {
    const { data: out, error } = await context.supabase.from("leave_requests").update({
      status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id).select().single();
    if (error) throw error; return out;
  });

/* =========== TARGETS =========== */
export const listTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("sales_targets").select("*").order("period_month", { ascending: false });
    if (data.month) q = q.eq("period_month", data.month + "-01");
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const upsertTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, user_id: data.user_id,
      period_month: data.period_month,
      target_amount: data.target_amount ?? 0,
      target_leads: data.target_leads ?? 0,
      target_bookings: data.target_bookings ?? 0,
      currency: data.currency ?? "INR",
      notes: data.notes ?? null,
    };
    const { data: out, error } = await context.supabase.from("sales_targets")
      .upsert(row, { onConflict: "tenant_id,user_id,period_month" }).select().single();
    if (error) throw error; return out;
  });

export const deleteTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("sales_targets").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const leaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { month?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const month = data.month ? new Date(data.month + "-01") : new Date();
    const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
    const [{ data: targets = [] }, { data: invoices = [] }, { data: bookings = [] }, { data: leads = [] }, { data: profs = [] }] = await Promise.all([
      context.supabase.from("sales_targets").select("*").eq("period_month", new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0,10)),
      context.supabase.from("invoices").select("owner_id, total, created_at").gte("created_at", from).lt("created_at", to),
      context.supabase.from("bookings").select("owner_id, created_at").gte("created_at", from).lt("created_at", to),
      context.supabase.from("leads").select("owner_id, created_at").gte("created_at", from).lt("created_at", to),
      context.supabase.from("profiles").select("id, display_name, email"),
    ]);
    const byUser: Record<string, any> = {};
    for (const p of profs ?? []) byUser[p.id] = { user_id: p.id, name: p.display_name || p.email || "User", revenue: 0, bookings: 0, leads: 0, target_amount: 0, target_bookings: 0, target_leads: 0 };
    for (const t of targets ?? []) {
      byUser[t.user_id] ??= { user_id: t.user_id, name: "User", revenue: 0, bookings: 0, leads: 0, target_amount: 0, target_bookings: 0, target_leads: 0 };
      byUser[t.user_id].target_amount = Number(t.target_amount);
      byUser[t.user_id].target_bookings = t.target_bookings;
      byUser[t.user_id].target_leads = t.target_leads;
    }
    for (const i of invoices ?? []) if (i.owner_id && byUser[i.owner_id]) byUser[i.owner_id].revenue += Number(i.total ?? 0);
    for (const b of bookings ?? []) if (b.owner_id && byUser[b.owner_id]) byUser[b.owner_id].bookings += 1;
    for (const l of leads ?? []) if (l.owner_id && byUser[l.owner_id]) byUser[l.owner_id].leads += 1;
    return Object.values(byUser).sort((a: any, b: any) => b.revenue - a.revenue);
  });

/* =========== ROLE PERMISSIONS =========== */
const DEFAULT_MODULES = [
  "leads", "customers", "quotations", "itineraries", "bookings", "invoices",
  "payments", "vouchers", "packages", "wallet", "tasks", "activities",
  "marketing", "forms", "automations", "masters", "reports", "settings",
  "branches", "attendance", "targets",
];

export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("role_permissions").select("*");
    if (error) throw error;
    return { rows: data ?? [], modules: DEFAULT_MODULES, roles: ["admin", "manager", "agent"] };
  });

export const upsertRolePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row = {
      tenant_id: tid, role: data.role, module: data.module,
      can_view: !!data.can_view, can_create: !!data.can_create,
      can_edit: !!data.can_edit, can_delete: !!data.can_delete,
    };
    const { data: out, error } = await context.supabase.from("role_permissions")
      .upsert(row, { onConflict: "tenant_id,role,module" }).select().single();
    if (error) throw error; return out;
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("id, display_name, email, branch_id").order("display_name");
    if (error) throw error;
    return data ?? [];
  });