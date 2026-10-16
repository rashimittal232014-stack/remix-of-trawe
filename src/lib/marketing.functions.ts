import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { ensureTenantId } from "./tenant.server";
async function tid(ctx: any): Promise<string> { return ensureTenantId(ctx); }

// ============ GROUPS ============
export const listGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("contact_groups").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const groupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  filter: z.record(z.string(), z.any()).optional(),
});
export const upsertGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof groupSchema>) => groupSchema.parse(d))
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const row: any = { ...data, tenant_id: t, filter: data.filter ?? {} };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("contact_groups").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("contact_groups").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("contact_groups").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ CAMPAIGNS ============
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("campaigns")
      .select("*, contact_groups(name)")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  channel: z.enum(["email", "whatsapp", "sms"]),
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  status: z.string().optional(),
  scheduled_at: z.string().optional().nullable(),
  group_id: z.string().uuid().optional().nullable(),
});
export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof campaignSchema>) => campaignSchema.parse(d))
  .handler(async ({ context, data }) => {
    await (await import("./plan.server")).assertFeature(await tid(context), "campaigns");
    const t = await tid(context);
    const row: any = {
      ...data, tenant_id: t,
      scheduled_at: data.scheduled_at || null,
      group_id: data.group_id || null,
      status: data.status ?? "draft",
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("campaigns").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("campaigns").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    await (await import("./plan.server")).assertFeature(await tid(context), "campaigns");
    const { error } = await context.supabase.from("campaigns").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// Real launch: send via configured Email/WhatsApp provider, persist per-recipient status.
export const launchCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const sb = context.supabase as any;
    const t = await tid(context);
    await (await import("./plan.server")).assertFeature(t, "campaigns");
    const { data: c } = await sb.from("campaigns").select("*").eq("id", data.id).maybeSingle();
    if (!c) throw new Error("Campaign not found");

    const { data: tenant } = await sb.from("tenants")
      .select("name, company_name, whatsapp_provider_config").eq("id", t).maybeSingle();
    const waCfg = (tenant?.whatsapp_provider_config ?? {}) as Record<string, string>;

    // Recipient source: contact group leads, else all leads
    let leadQ = sb.from("leads").select("id, full_name, email, phone").eq("tenant_id", t).limit(500);
    const { data: leads } = await leadQ;
    if (!leads || leads.length === 0) {
      await sb.from("campaigns").update({ status: "sent", sent_count: 0 }).eq("id", c.id);
      return { sent: 0, failed: 0, message: "No recipients" };
    }

    let smtp: any = null;
    if (c.channel === "email") {
      const { data: org } = await sb.from("org_smtp_config").select("*").eq("tenant_id", t).maybeSingle();
      if (org?.status === "active" && org.smtp_host) {
        smtp = {
          host: org.smtp_host, port: org.smtp_port, secure: org.smtp_encryption === "SSL",
          auth: { user: org.smtp_username, pass: org.smtp_password },
          from: `"${org.from_name}" <${org.from_email}>`,
          replyTo: org.reply_to_email || undefined,
        };
      }
    }
    let nodemailerLib: any = null;
    if (smtp) nodemailerLib = (await import("nodemailer")).default;

    const render = (tpl: string, l: any) => String(tpl || "")
      .replace(/\{\{?(\w+)\}?\}/g, (_, k) => {
        const map: Record<string, string> = {
          name: l.full_name || "there", first_name: (l.full_name || "").split(" ")[0] || "",
          email: l.email || "", phone: l.phone || "",
          company: tenant?.company_name || tenant?.name || "",
        };
        return map[k] ?? "";
      });

    let sent = 0, failed = 0;
    const rows: any[] = [];

    for (const l of leads as any[]) {
      let status: "sent" | "failed" | "skipped" = "skipped";
      let err: string | null = null;
      const body = render(c.body || "", l);
      const subject = render(c.subject || "", l);

      try {
        if (c.channel === "email") {
          if (!l.email) { status = "skipped"; err = "no email"; }
          else if (!smtp) { status = "failed"; err = "SMTP not configured"; failed++; }
          else {
            const transporter = nodemailerLib.createTransport({
              host: smtp.host, port: smtp.port, secure: smtp.secure, auth: smtp.auth,
              requireTLS: !smtp.secure,
            });
            await transporter.sendMail({
              from: smtp.from, to: l.email, replyTo: smtp.replyTo,
              subject, html: `<div style="font-family:system-ui,sans-serif;padding:24px;color:#0f172a">${body.replace(/\n/g, "<br/>")}</div>`,
            });
            status = "sent"; sent++;
          }
        } else if (c.channel === "whatsapp") {
          if (!l.phone) { status = "skipped"; err = "no phone"; }
          else {
            const { sendWhatsApp } = await import("./wa-send.server");
            const r = await sendWhatsApp({
              sb, tenantId: t, cfg: waCfg, to: l.phone, message: body,
              purpose: "campaign", logKind: "campaign_send",
            });
            if (r.ok) { status = "sent"; sent++; }
            else if (r.status === "blocked" || r.status === "paused") { status = "skipped"; err = r.message.slice(0, 200); }
            else { status = "failed"; err = r.message.slice(0, 200); failed++; }
          }
        } else {
          status = "skipped"; err = `channel ${c.channel} not supported`;
        }
      } catch (e: any) {
        status = "failed"; err = (e?.message || String(e)).slice(0, 200); failed++;
      }

      rows.push({
        tenant_id: t, campaign_id: c.id,
        contact_name: l.full_name, contact_email: l.email, contact_phone: l.phone,
        status, sent_at: new Date().toISOString(), error: err,
      });
    }

    if (rows.length) await sb.from("campaign_recipients").insert(rows);
    await sb.from("campaigns").update({ status: "sent", sent_count: sent }).eq("id", c.id);
    return { sent, failed, total: rows.length, message: `Sent ${sent}, failed ${failed}` };
  });

// ============ MARKETING SETTINGS ============
export const getMarketingSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await tid(context);
    const { data } = await context.supabase.from("marketing_settings").select("*").eq("tenant_id", t).maybeSingle();
    return data ?? { tenant_id: t, data: {} };
  });

export const saveMarketingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { data: Record<string, any> }) => d)
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const { data: out, error } = await context.supabase.from("marketing_settings")
      .upsert({ tenant_id: t, data: data.data }, { onConflict: "tenant_id" }).select().single();
    if (error) throw error; return out;
  });

// ============ FORMS ============
export const listForms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("forms").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const formSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  schema: z.array(z.any()),
  theme: z.record(z.string(), z.any()).optional(),
  active: z.boolean().optional(),
});
export const upsertForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof formSchema>) => formSchema.parse(d))
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const row: any = { ...data, tenant_id: t, theme: data.theme ?? {}, active: data.active ?? true };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("forms").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("forms").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("forms").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { form_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: rows } = await context.supabase.from("form_submissions").select("*").eq("form_id", data.form_id).order("created_at", { ascending: false });
    return rows ?? [];
  });

// ============ AUTOMATIONS ============
export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("automations").select("*").order("created_at", { ascending: false });
    return data ?? [];
  });

const autoSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  module: z.string().min(1),
  event: z.string().min(1),
  active: z.boolean().optional(),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()).optional(),
});
export const upsertAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof autoSchema>) => autoSchema.parse(d))
  .handler(async ({ context, data }) => {
    const t = await tid(context);
    const row: any = { ...data, tenant_id: t, conditions: data.conditions ?? [], actions: data.actions ?? [], active: data.active ?? true, description: data.description ?? null };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("automations").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("automations").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("automations").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const listAutomationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { automation_id?: string }) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("automation_logs").select("*, automations(name)").order("ran_at", { ascending: false }).limit(200);
    if (data.automation_id) q = q.eq("automation_id", data.automation_id);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const seedDefaultAutomations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const t = await tid(context);
    const defaults = [
      {
        name: "Default - Proposal Confirmation",
        description: "Sends proposal confirmation WhatsApp + Email when a quotation is sent.",
        module: "Quotations", event: "Sent", active: true, conditions: [],
        actions: [
          { kind: "Send WhatsApp", template: "Hi {{client_name}}, your proposal for {{destination}} is ready." },
          { kind: "Send Email", template: "Your travel proposal is attached." },
        ],
      },
      {
        name: "Default - Balance Payment Reminder",
        description: "Sends balance payment reminder after a partial payment is received.",
        module: "Payments", event: "Received", active: true,
        conditions: [{ field: "Status", op: "equals", value: "Partial", join: "AND" }],
        actions: [
          { kind: "Send WhatsApp", template: "Reminder: balance of {{amount}} pending for {{opportunity_name}}." },
          { kind: "Send Email", template: "Balance payment reminder." },
          { kind: "Create Call", title: "Call client for balance", due_days: 1 },
        ],
      },
      {
        name: "Default - Full Payment Received Reminder",
        description: "Sends full payment received confirmation when no balance is pending.",
        module: "Payments", event: "Received", active: true,
        conditions: [{ field: "Status", op: "equals", value: "Paid", join: "AND" }],
        actions: [
          { kind: "Send WhatsApp", template: "Thank you {{client_name}}, payment received." },
          { kind: "Send Email", template: "Receipt for your payment." },
          { kind: "Create Task", title: "Prepare travel documents", due_days: 2 },
        ],
      },
      {
        name: "Default - Trip Start Reminder",
        description: "Reminds client before trip start.",
        module: "Bookings", event: "Trip Start", active: true, conditions: [],
        actions: [
          { kind: "Create Reminder", template: "Trip starts tomorrow for {{client_name}}", due_days: -1 },
          { kind: "Send WhatsApp", template: "Your trip to {{destination}} begins tomorrow!" },
          { kind: "Send Email", template: "Trip start reminder." },
        ],
      },
      {
        name: "Default - Trip Complete Feedback Form",
        description: "Sends feedback message after trip completion.",
        module: "Bookings", event: "Trip Complete", active: true, conditions: [],
        actions: [
          { kind: "Create Reminder", template: "Collect feedback from {{client_name}}", due_days: 1 },
          { kind: "Send WhatsApp", template: "How was your trip to {{destination}}? Share feedback." },
          { kind: "Send Email", template: "We'd love your feedback." },
        ],
      },
      {
        name: "Default - Query Confirmed / Won",
        description: "Triggers when a query stage is set to Won.",
        module: "Queries", event: "Stage Changed", active: false,
        conditions: [{ field: "Stage", op: "equals", value: "Won", join: "AND" }],
        actions: [
          { kind: "Send WhatsApp", template: "Congrats {{client_name}}! Booking confirmed." },
          { kind: "Create Task", title: "Send booking confirmation to supplier", due_days: 0 },
        ],
      },
    ];
    const rows = defaults.map(d => ({ ...d, tenant_id: t }));
    // avoid duplicates by name
    const { data: existing } = await context.supabase.from("automations").select("name").eq("tenant_id", t);
    const have = new Set((existing ?? []).map((r: any) => r.name));
    const toInsert = rows.filter(r => !have.has(r.name));
    if (toInsert.length === 0) return { inserted: 0 };
    const { error } = await context.supabase.from("automations").insert(toInsert as any);
    if (error) throw error;
    return { inserted: toInsert.length };
  });