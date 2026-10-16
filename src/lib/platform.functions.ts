import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================ overview ============================ */

export const platformOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();

    const { data: tenants } = await db
      .from("tenants")
      .select("id,name,plan,plan_price,billing_cycle,subscription_status,renewal_date,grace_days,is_platform_owner");
    const { count: users } = await db.from("profiles").select("id", { count: "exact", head: true });
    const { data: payments } = await db.from("platform_payments").select("amount,paid_on");

    const clients = (tenants ?? []).filter((t: any) => !t.is_platform_owner);
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 864e5);
    const mrr = clients
      .filter((c: any) => c.subscription_status === "active")
      .reduce((s: number, c: any) => {
        const p = Number(c.plan_price ?? 0);
        const div = c.billing_cycle === "yearly" ? 12 : c.billing_cycle === "half_yearly" ? 6 : c.billing_cycle === "quarterly" ? 3 : 1;
        return s + p / div;
      }, 0);
    const expiring = clients.filter(
      (c: any) => c.renewal_date && new Date(c.renewal_date) >= today && new Date(c.renewal_date) <= in30,
    ).length;
    const overdue = clients.filter((c: any) => {
      if (!c.renewal_date) return false;
      const due = new Date(c.renewal_date);
      due.setDate(due.getDate() + (c.grace_days ?? 7));
      return due < today;
    }).length;
    const ym = new Date().toISOString().slice(0, 7);
    const collectedThisMonth = (payments ?? [])
      .filter((p: any) => String(p.paid_on).startsWith(ym))
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    return {
      totalClients: clients.length,
      activeClients: clients.filter((c: any) => c.subscription_status === "active").length,
      suspended: clients.filter((c: any) => c.subscription_status === "suspended").length,
      trials: clients.filter((c: any) => c.subscription_status === "trial").length,
      expiring,
      overdue,
      mrr: Math.round(mrr),
      users: users ?? 0,
      collectedThisMonth,
    };
  });

/* ============================ clients ============================ */

export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data: tenants, error } = await db
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: profiles } = await db.from("profiles").select("id,tenant_id,email,display_name");
    const { data: domains } = await db.from("tenant_domains").select("tenant_id,hostname,status");
    return (tenants ?? []).map((t: any) => ({
      ...t,
      user_count: (profiles ?? []).filter((p: any) => p.tenant_id === t.id).length,
      domains: (domains ?? []).filter((d: any) => d.tenant_id === t.id),
    }));
  });

const createSchema = z.object({
  agency_name: z.string().min(2),
  owner_email: z.string().email(),
  owner_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8),
  plan: z.string().default("starter"),
  plan_price: z.number().nonnegative().default(0),
  billing_cycle: z.enum(["monthly", "quarterly", "half_yearly", "yearly"]).default("monthly"),
  seat_limit: z.number().int().positive().default(5),
  subscription_start: z.string().optional().nullable(),
  subscription_status: z.enum(["trial", "active", "suspended"]).default("active"),
});

export const createClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof createSchema>) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin, addCycle, isoDate } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();

    const start = data.subscription_start ? new Date(data.subscription_start) : new Date();
    const renewal = addCycle(start, data.billing_cycle);

    const { data: created, error: uErr } = await db.auth.admin.createUser({
      email: data.owner_email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.owner_name ?? data.agency_name,
        agency_name: data.agency_name,
        phone: data.phone ?? null,
      },
    });
    if (uErr) throw new Error(uErr.message);
    const userId = created.user!.id;

    // The signup trigger provisions a tenant + profile + pipelines. Read it back.
    let tenantId: string | null = null;
    for (let i = 0; i < 10 && !tenantId; i++) {
      const { data: prof } = await db.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
      tenantId = (prof?.tenant_id as string) ?? null;
      if (!tenantId) await new Promise((r) => setTimeout(r, 300));
    }
    if (!tenantId) throw new Error("Client login created but workspace provisioning failed — check the client list.");

    const { error: tErr } = await db
      .from("tenants")
      .update({
        name: data.agency_name,
        crm_name: data.agency_name,
        owner_email: data.owner_email,
        phone: data.phone ?? null,
        plan: data.plan,
        plan_price: data.plan_price,
        billing_cycle: data.billing_cycle,
        seat_limit: data.seat_limit,
        subscription_status: data.subscription_status,
        subscription_start: isoDate(start),
        renewal_date: isoDate(renewal),
      })
      .eq("id", tenantId);
    if (tErr) throw tErr;

    return { tenant_id: tenantId, user_id: userId };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  patch: z.record(z.string(), z.any()),
});

export const updateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof updateSchema>) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const allowed = [
      "name", "crm_name", "owner_email", "phone", "plan", "plan_price", "billing_cycle",
      "seat_limit", "subscription_status", "subscription_start", "renewal_date",
      "grace_days", "internal_notes", "logo_url", "favicon_url", "primary_color",
      "accent_color", "login_headline", "login_subtext", "powered_by_enabled",
      "features", "usage_limits",
    ];
    const patch: Record<string, any> = {};
    for (const k of allowed) if (k in data.patch) patch[k] = data.patch[k];
    const { data: out, error } = await db.from("tenants").update(patch as any).eq("id", data.id).select().single();
    if (error) throw error;
    return out;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data: t } = await db.from("tenants").select("is_platform_owner").eq("id", data.id).maybeSingle();
    if (t?.is_platform_owner) throw new Error("The platform account cannot be deleted");
    const { data: profs } = await db.from("profiles").select("id").eq("tenant_id", data.id);
    for (const p of profs ?? []) await db.auth.admin.deleteUser(p.id as string).catch(() => {});
    const { error } = await db.from("tenants").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const resetClientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const db = await admin();
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = list.users.find((u: any) => (u.email ?? "").toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("No login found for that email");
    const { error } = await db.auth.admin.updateUserById(user.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changeMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { password: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const db = await admin();
    const { error } = await db.auth.admin.updateUserById(context.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================ payments ============================ */

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenant_id?: string }) => d ?? {})
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    let q = db.from("platform_payments").select("*, tenants(name)").order("paid_on", { ascending: false }).limit(300);
    if (data?.tenant_id) q = q.eq("tenant_id", data.tenant_id);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const paymentSchema = z.object({
  tenant_id: z.string().uuid(),
  amount: z.number().positive(),
  paid_on: z.string(),
  mode: z.enum(["bank_transfer", "upi", "cheque", "cash", "other"]).default("bank_transfer"),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  extend_renewal: z.boolean().default(true),
  cycles: z.number().int().min(1).max(12).default(1),
});

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof paymentSchema>) => paymentSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin, addCycle, isoDate } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();

    const { data: tenant, error: tErr } = await db
      .from("tenants")
      .select("id,name,billing_cycle,renewal_date,subscription_status")
      .eq("id", data.tenant_id)
      .single();
    if (tErr) throw tErr;

    const paid = new Date(data.paid_on);
    const base =
      tenant.renewal_date && new Date(tenant.renewal_date) > paid ? new Date(tenant.renewal_date) : paid;
    let periodEnd = base;
    for (let i = 0; i < data.cycles; i++) periodEnd = addCycle(periodEnd, tenant.billing_cycle ?? "monthly");

    const { data: payment, error } = await db
      .from("platform_payments")
      .insert({
        tenant_id: data.tenant_id,
        amount: data.amount,
        paid_on: data.paid_on,
        mode: data.mode,
        reference: data.reference ?? null,
        note: data.note ?? null,
        period_start: isoDate(base),
        period_end: isoDate(periodEnd),
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw error;

    if (data.extend_renewal) {
      await db
        .from("tenants")
        .update({ renewal_date: isoDate(periodEnd), subscription_status: "active" })
        .eq("id", data.tenant_id);
    }

    // Platform-side receipt record
    const invoiceNo = `TRW-${new Date().getFullYear()}-${Math.floor(Date.now() / 1000)
      .toString()
      .slice(-6)}`;
    await db.from("billing_invoices").insert({
      tenant_id: data.tenant_id,
      invoice_no: invoiceNo,
      amount: data.amount,
      status: "paid",
      issue_date: data.paid_on,
      notes: `Subscription ${isoDate(base)} → ${isoDate(periodEnd)} · ${data.mode}${data.reference ? " · " + data.reference : ""}`,
      created_by: context.userId,
    });

    return payment;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { error } = await db.from("platform_payments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ============================ domains ============================ */

export const listDomains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin, cloudflareConfigured } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("tenant_domains")
      .select("*, tenants(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { rows: data ?? [], cloudflare: cloudflareConfigured() };
  });

export const addDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenant_id: string; hostname: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin, cloudflareConfigured, cfCreateHostname } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const hostname = data.hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) throw new Error("Enter a valid hostname like crm.client.com");

    let cfId: string | null = null;
    let txtName: string | null = null;
    let txtValue: string | null = null;
    let status = "pending";
    let sslStatus: string | null = null;
    let errorMessage: string | null = null;

    if (cloudflareConfigured()) {
      try {
        const cfHost = await cfCreateHostname(hostname);
        cfId = cfHost.id;
        txtName = cfHost.txt_name;
        txtValue = cfHost.txt_value;
        status = cfHost.status;
        sslStatus = cfHost.ssl_status;
      } catch (e: any) {
        errorMessage = e?.message ?? "Cloudflare request failed";
      }
    }

    const { data: row, error } = await db
      .from("tenant_domains")
      .insert({
        tenant_id: data.tenant_id,
        hostname,
        status,
        ssl_status: sslStatus,
        cloudflare_hostname_id: cfId,
        verification_txt_name: txtName,
        verification_txt_value: txtValue,
        error_message: errorMessage,
        last_checked_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const checkDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin, cloudflareConfigured, cfGetHostname, cfCreateHostname } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data: row, error } = await db.from("tenant_domains").select("*").eq("id", data.id).single();
    if (error) throw error;
    if (!cloudflareConfigured()) throw new Error("Cloudflare is not connected yet — add the API token first");

    let cfHost;
    if (row.cloudflare_hostname_id) cfHost = await cfGetHostname(row.cloudflare_hostname_id);
    else cfHost = await cfCreateHostname(row.hostname);

    const active = cfHost.status === "active" && (cfHost.ssl_status === "active" || !cfHost.ssl_status);
    const { data: out } = await db
      .from("tenant_domains")
      .update({
        cloudflare_hostname_id: cfHost.id,
        status: active ? "active" : cfHost.status,
        ssl_status: cfHost.ssl_status,
        verification_txt_name: cfHost.txt_name ?? row.verification_txt_name,
        verification_txt_value: cfHost.txt_value ?? row.verification_txt_value,
        error_message: null,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select()
      .single();
    return out;
  });

export const deleteDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin, cloudflareConfigured, cfDeleteHostname } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data: row } = await db.from("tenant_domains").select("cloudflare_hostname_id").eq("id", data.id).maybeSingle();
    if (row?.cloudflare_hostname_id && cloudflareConfigured()) {
      await cfDeleteHostname(row.cloudflare_hostname_id).catch(() => {});
    }
    const { error } = await db.from("tenant_domains").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ============================ broadcasts ============================ */

export const listBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data, error } = await db.from("platform_broadcasts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const saveBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; title: string; body: string; kind?: string; active?: boolean; ends_at?: string | null }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const row = {
      title: data.title,
      body: data.body,
      kind: data.kind ?? "info",
      active: data.active ?? true,
      ends_at: data.ends_at ?? null,
      created_by: context.userId,
    };
    if (data.id) {
      const { data: out, error } = await db.from("platform_broadcasts").update(row).eq("id", data.id).select().single();
      if (error) throw error;
      return out;
    }
    const { data: out, error } = await db.from("platform_broadcasts").insert(row).select().single();
    if (error) throw error;
    return out;
  });

export const deleteBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { error } = await db.from("platform_broadcasts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ============================ impersonation ============================ */

export const impersonateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenant_id: string; reason?: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data: prof } = await db
      .from("profiles")
      .select("id,email")
      .eq("tenant_id", data.tenant_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!prof?.email) throw new Error("This client has no owner login yet");

    const { data: link, error } = await db.auth.admin.generateLink({
      type: "magiclink",
      email: prof.email as string,
    });
    if (error) throw new Error(error.message);

    await db.from("impersonation_events").insert({
      actor_id: context.userId,
      actor_email: (context.claims as any)?.email ?? null,
      tenant_id: data.tenant_id,
      target_user_id: prof.id,
      target_email: prof.email,
      reason: data.reason ?? "support",
    });

    return { url: (link as any)?.properties?.action_link as string, email: prof.email };
  });

export const listImpersonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data } = await db
      .from("impersonation_events")
      .select("id,actor_email,tenant_id,target_email,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Array<{
      id: string; actor_email: string | null; tenant_id: string | null;
      target_email: string | null; reason: string | null; created_at: string;
    }>;
  });

/* ============================ who am I ============================ */

export const amISuperAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Role check runs with the trusted server client so the SECURITY DEFINER
    // function stays un-executable by signed-in users over the Data API.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.rpc("is_super_admin", { _user_id: context.userId });
    return { ok: Boolean(data), email: (context.claims as any)?.email ?? null };
  });
/* ============================ support tickets ============================ */

export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const [{ data: rows }, { data: tenants }] = await Promise.all([
      db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200),
      db.from("tenants").select("id,name"),
    ]);
    const byId = new Map((tenants ?? []).map((t: any) => [t.id, t.name]));
    return (rows ?? []).map((r: any) => ({ ...r, tenant_name: byId.get(r.tenant_id) ?? "—" }));
  });

export const replyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reply?: string; status?: string }) => d)
  .handler(async ({ context, data }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const patch: Record<string, any> = {};
    if (typeof data.reply === "string") {
      patch["reply"] = data.reply;
      patch["replied_at"] = new Date().toISOString();
    }
    if (data.status) patch["status"] = data.status;
    const { data: out, error } = await db.from("support_tickets").update(patch as any).eq("id", data.id).select().single();
    if (error) throw error;
    return out;
  });

/* ============================ usage & health ============================ */

export const clientHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const period = new Date().toISOString().slice(0, 7);
    const [{ data: tenants }, { data: usage }, { data: profiles }] = await Promise.all([
      db.from("tenants").select("id,name,plan,subscription_status,seat_limit,last_active_at,is_platform_owner"),
      db.from("usage_counters").select("tenant_id,metric,used").eq("period", period),
      db.from("profiles").select("id,tenant_id"),
    ]);
    return (tenants ?? [])
      .filter((t: any) => !t.is_platform_owner)
      .map((t: any) => {
        const u: Record<string, number> = {};
        for (const r of (usage ?? []) as any[]) if (r.tenant_id === t.id) u[r.metric] = Number(r.used ?? 0);
        return {
          id: t.id,
          name: t.name,
          plan: t.plan,
          subscription_status: t.subscription_status,
          seat_limit: t.seat_limit,
          seats_used: (profiles ?? []).filter((p: any) => p.tenant_id === t.id).length,
          last_active_at: t.last_active_at,
          usage: u,
        };
      });
  });

/* ==================== TraWe WhatsApp fleet (phase 5) ==================== */

/** Live health of every workspace WhatsApp connection, gateway included. */
export const whatsappFleet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { gatewayConfig } = await import("./trawe-whatsapp.server");
    const { url, token, configured } = gatewayConfig();

    let gateway: any = { configured, online: false, uptimeSeconds: 0, sessions: [] as any[], error: null as string | null };
    if (configured) {
      try {
        const res = await fetch(`${url}/health`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        gateway = { configured: true, online: Boolean(body?.ok), uptimeSeconds: body?.uptimeSeconds ?? 0, sessions: body?.sessions ?? [], error: null };
      } catch (e: any) {
        gateway.error = String(e?.message ?? e);
      }
    }

    const [{ data: rows }, { data: tenants }] = await Promise.all([
      db.from("whatsapp_sessions").select("*"),
      db.from("tenants").select("id,name,whatsapp_provider_config,is_platform_owner"),
    ]);

    const live = new Map<string, any>((gateway.sessions ?? []).map((s: any) => [s.tenantId, s]));
    const workspaces = (tenants ?? [])
      .filter((t: any) => !t.is_platform_owner)
      .map((t: any) => {
        const row = (rows ?? []).find((r: any) => r.tenant_id === t.id);
        const g = live.get(t.id);
        return {
          tenantId: t.id,
          name: t.name,
          engine: (t.whatsapp_provider_config?.engine ?? "wasender") as string,
          status: g?.status ?? row?.status ?? "disconnected",
          phone: g?.phone ?? row?.phone ?? null,
          lastSeenAt: g?.lastSeenAt ?? row?.last_seen_at ?? null,
          connectedAt: row?.connected_at ?? null,
          lastError: row?.last_error ?? null,
          queueDepth: g?.queueDepth ?? 0,
          sent: g?.sent ?? 0,
          failed: g?.failed ?? 0,
          disconnectCount: g?.disconnectCount ?? 0,
          hourlyCap: row?.hourly_cap ?? null,
          dailyCap: row?.daily_cap ?? null,
          warmupStartedAt: row?.warmup_started_at ?? null,
        };
      })
      .sort((a, b) => Number(b.status === "connected") - Number(a.status === "connected"));

    return { gateway: { configured: gateway.configured, online: gateway.online, uptimeSeconds: gateway.uptimeSeconds, error: gateway.error }, workspaces };
  });

/** Force a reconnect (or full sign-out) of one workspace's TraWe WhatsApp session. */
export const controlWhatsAppSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tenantId: string; action: "restart" | "logout" }) =>
    z.object({ tenantId: z.string().uuid(), action: z.enum(["restart", "logout"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const gw = await import("./trawe-whatsapp.server");
    if (data.action === "logout") {
      await gw.logoutSession(data.tenantId);
      await db.from("whatsapp_sessions").update({ status: "logged_out", phone: null, updated_at: new Date().toISOString() }).eq("tenant_id", data.tenantId);
      return { ok: true };
    }
    const { data: t } = await db.from("tenants").select("whatsapp_provider_config").eq("id", data.tenantId).maybeSingle();
    const cfg = ((t as any)?.whatsapp_provider_config ?? {}) as Record<string, any>;
    const state = await gw.startSession(data.tenantId, {
      webhookUrl: `${process.env["PUBLIC_APP_URL"] ?? "https://app.trawe.in"}/api/public/whatsapp/webhook`,
      webhookSecret: cfg["webhook_secret"] ?? "",
    });
    await db.from("whatsapp_sessions").update({ status: state.status, updated_at: new Date().toISOString() }).eq("tenant_id", data.tenantId);
    return { ok: true, status: state.status };
  });
