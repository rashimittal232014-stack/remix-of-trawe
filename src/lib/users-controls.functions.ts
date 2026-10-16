import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

async function tid(ctx: any) { return ensureTenantId(ctx); }

/* ============ LIST ALL ============ */
export const listUsersControls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await tid(context);
    const [users, roles, profiles, assignments] = await Promise.all([
      context.supabase.from("profiles")
        .select("id, first_name, last_name, display_name, email, phone, job_title, status, avatar_url, crm_role_id, crm_profile_id, time_zone, language, created_at")
        .eq("tenant_id", t).order("created_at", { ascending: true }),
      context.supabase.from("crm_roles").select("*").eq("tenant_id", t).order("is_system", { ascending: false }).order("name"),
      context.supabase.from("crm_profiles").select("*").eq("tenant_id", t).order("is_system", { ascending: false }).order("name"),
      context.supabase.from("leads").select("owner_id").eq("tenant_id", t),
    ]);
    const assignedCount: Record<string, number> = {};
    (assignments.data ?? []).forEach((r: any) => {
      if (r.owner_id) assignedCount[r.owner_id] = (assignedCount[r.owner_id] ?? 0) + 1;
    });
    return {
      users: users.data ?? [],
      roles: roles.data ?? [],
      profiles: profiles.data ?? [],
      assignedCount,
    };
  });

/* ============ USERS ============ */
export const upsertUserRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const patch: any = {
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      display_name: data.display_name || `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || data.email,
      phone: data.phone ?? null,
      job_title: data.job_title ?? null,
      crm_role_id: data.crm_role_id || null,
      crm_profile_id: data.crm_profile_id || null,
      time_zone: data.time_zone || "Asia/Kolkata",
      language: data.language || "English",
      status: data.status || "active",
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.id) {
      // Verify the target really belongs to the caller's workspace
      const { data: target } = await supabaseAdmin.from("profiles")
        .select("id, tenant_id").eq("id", data.id).maybeSingle();
      if (!target || target.tenant_id !== t) throw new Error("User not found in this workspace");
      const { data: out, error } = await supabaseAdmin.from("profiles")
        .update(patch).eq("id", data.id).select().single();
      if (error) throw error;
      return out;
    }

    // Invite path: the profile row must belong to a real auth user (id -> auth.users)
    await (await import("./plan.server")).assertSeatAvailable(t);
    const email = String(data.email || "").trim().toLowerCase();
    if (!email) throw new Error("Email is required");

    let userId: string | null = null;
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: !data.send_invite,
      password: crypto.randomUUID() + "Aa1!",
      user_metadata: { display_name: patch.display_name, tenant_id: t },
    });
    if (created.error) {
      // Already registered — reuse the existing auth user
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
      if (!found) throw created.error;
      userId = found.id;
    } else {
      userId = created.data.user!.id;
    }

    // Never take over an account that already belongs to another workspace.
    const { data: existing } = await supabaseAdmin.from("profiles")
      .select("tenant_id").eq("id", userId!).maybeSingle();
    if (existing?.tenant_id && existing.tenant_id !== t) {
      throw new Error("This email is already registered with another workspace. Please use a different email.");
    }

    const { data: out, error } = await supabaseAdmin.from("profiles")
      .upsert({
        ...patch,
        id: userId,
        tenant_id: t,
        email,
        status: data.send_invite ? "invited" : (data.status || "active"),
      }, { onConflict: "id" })
      .select().single();
    if (error) throw error;
    return out;
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles")
      .update({ status: data.status }).eq("id", data.id).eq("tenant_id", t);
    if (error) throw error;
    return { ok: true };
  });

/* ============ CRM ROLES ============ */
export const upsertCrmRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const row: any = {
      tenant_id: t,
      name: data.name,
      reports_to: data.reports_to || null,
      description: data.description ?? null,
      dashboard: data.dashboard || "Sales Dashboard",
      status: data.status || "active",
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("crm_roles")
        .update(row).eq("id", data.id).eq("tenant_id", t).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("crm_roles")
      .insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteCrmRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("crm_roles").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

/* ============ CRM PROFILES ============ */
export const upsertCrmProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const row: any = {
      tenant_id: t,
      name: data.name,
      description: data.description ?? null,
      access_level: data.access_level || "Standard",
      status: data.status || "active",
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("crm_profiles")
        .update(row).eq("id", data.id).eq("tenant_id", t).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("crm_profiles")
      .insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteCrmProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("crm_profiles").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// zod unused but keeps import parity — silence lint
void z;