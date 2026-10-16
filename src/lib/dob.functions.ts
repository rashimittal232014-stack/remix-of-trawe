import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendWhatsApp } from "./wa-send.server";

const DEFAULT_WA = `Happy Birthday {name}! 🎂 🎉

Wishing you a wonderful year ahead filled with happiness, success and beautiful journeys.

Warm wishes,
{company_name}`;

const DEFAULT_EMAIL_SUBJECT = `Happy Birthday {name}! 🎉`;

const DEFAULT_EMAIL_HTML = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:32px;background:#f8fafc;">
  <div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;">
    <h1 style="margin:0 0 12px;color:#0f172a;font-size:26px;">Happy Birthday {name}! 🎂</h1>
    <p style="color:#334155;line-height:1.6;margin:0 0 12px;">Wishing you a beautiful birthday and a wonderful year ahead filled with happiness, success, good health and memorable journeys.</p>
    <p style="color:#334155;line-height:1.6;margin:0 0 12px;">May your special day be as amazing as your travel dreams.</p>
    <p style="color:#475569;margin:24px 0 0;">Warm wishes,<br/><b>{company_name}</b></p>
  </div>
</div>`;

async function getTenantId(sb: any, userId: string, ctx?: any): Promise<string | null> {
  const { data } = await sb.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  if (data?.tenant_id) return data.tenant_id as string;
  if (!ctx) return null;
  // First-time users may not have a profile/tenant yet — provision one.
  const { ensureTenantId } = await import("./tenant.server");
  return await ensureTenantId(ctx);
}

function todayUTCDate(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function renderTemplate(tpl: string, ctx: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? ""));
}

export const getDobData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId, context);
    if (!tenantId) throw new Error("No tenant");

    const [{ data: settings }, { data: tenant }] = await Promise.all([
      sb.from("dob_greeting_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
      sb.from("tenants").select("company_name, name").eq("id", tenantId).maybeSingle(),
    ]);

    const cfg = settings ?? {
      tenant_id: tenantId, enabled: true, whatsapp_enabled: true, email_enabled: true,
      whatsapp_template: DEFAULT_WA, email_subject: DEFAULT_EMAIL_SUBJECT, email_html: DEFAULT_EMAIL_HTML,
    };
    if (!cfg.whatsapp_template) cfg.whatsapp_template = DEFAULT_WA;
    if (!cfg.email_subject) cfg.email_subject = DEFAULT_EMAIL_SUBJECT;
    if (!cfg.email_html) cfg.email_html = DEFAULT_EMAIL_HTML;

    const today = todayUTCDate();
    const mmdd = today.slice(5);

    // Customers with DOB set (total) and those with DOB matching today (MM-DD)
    const { data: customers } = await sb
      .from("customers")
      .select("id, full_name, email, phone, company, dob")
      .eq("tenant_id", tenantId)
      .not("dob", "is", null);

    const withDob = (customers ?? []) as Array<{ id: string; full_name: string; email: string | null; phone: string | null; company: string | null; dob: string }>;
    const todays = withDob.filter((c) => (c.dob ?? "").slice(5) === mmdd);

    // Today logs
    const { data: logs } = await sb
      .from("dob_greeting_logs")
      .select("customer_id, channel, status")
      .eq("tenant_id", tenantId)
      .eq("greeted_on", today);
    const logList = (logs ?? []) as Array<{ customer_id: string; channel: string; status: string }>;
    const waSent = logList.filter((l) => l.channel === "whatsapp" && l.status === "sent").length;
    const emailSent = logList.filter((l) => l.channel === "email" && l.status === "sent").length;

    const sentMap = new Map<string, { whatsapp: boolean; email: boolean }>();
    for (const l of logList) {
      const cur = sentMap.get(l.customer_id) ?? { whatsapp: false, email: false };
      if (l.status === "sent") {
        if (l.channel === "whatsapp") cur.whatsapp = true;
        if (l.channel === "email") cur.email = true;
      }
      sentMap.set(l.customer_id, cur);
    }

    return {
      settings: cfg,
      companyName: tenant?.company_name || tenant?.name || "Our Team",
      totalWithDob: withDob.length,
      today,
      stats: {
        birthdaysToday: todays.length,
        whatsappSentToday: waSent,
        emailSentToday: emailSent,
        notSentToday: {
          whatsapp: todays.filter((c) => c.phone && !sentMap.get(c.id)?.whatsapp).length,
          email: todays.filter((c) => c.email && !sentMap.get(c.id)?.email).length,
        },
      },
      todaysList: todays.map((c) => ({
        ...c,
        sent: sentMap.get(c.id) ?? { whatsapp: false, email: false },
      })),
    };
  });

const SaveSchema = z.object({
  enabled: z.boolean(),
  whatsapp_enabled: z.boolean(),
  email_enabled: z.boolean(),
  whatsapp_template: z.string(),
  email_subject: z.string(),
  email_html: z.string(),
});

export const saveDobSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId, context);
    if (!tenantId) throw new Error("No tenant");
    const payload = { tenant_id: tenantId, ...data, channel: "email" };
    const { error } = await sb.from("dob_greeting_settings").upsert(payload, { onConflict: "tenant_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function loadSmtp(sb: any, userId: string, tenantId: string): Promise<any | null> {
  const { data: mine } = await sb.from("user_email_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (mine && mine.status === "active" && mine.smtp_host) {
    return {
      host: mine.smtp_host, port: mine.smtp_port, secure: mine.smtp_encryption === "SSL",
      auth: { user: mine.smtp_username, pass: mine.smtp_password },
      from: `"${mine.from_name || mine.email_address}" <${mine.email_address}>`,
    };
  }
  const { data: org } = await sb.from("org_smtp_config").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (org && org.status === "active" && org.smtp_host) {
    return {
      host: org.smtp_host, port: org.smtp_port, secure: org.smtp_encryption === "SSL",
      auth: { user: org.smtp_username, pass: org.smtp_password },
      from: `"${org.from_name}" <${org.from_email}>`,
      replyTo: org.reply_to_email || undefined,
    };
  }
  return null;
}

export const sendPendingDobGreetings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId, context);
    if (!tenantId) throw new Error("No tenant");

    const { data: settings } = await sb.from("dob_greeting_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
    if (!settings?.enabled) return { ok: false, message: "DOB Greeting is disabled" };

    const { data: tenant } = await sb.from("tenants").select("company_name, name, whatsapp_provider_config").eq("id", tenantId).maybeSingle();
    const companyName = tenant?.company_name || tenant?.name || "Our Team";
    const waCfg = (tenant?.whatsapp_provider_config ?? {}) as Record<string, string>;

    const today = todayUTCDate();
    const mmdd = today.slice(5);

    const { data: customers } = await sb
      .from("customers")
      .select("id, full_name, first_name, email, phone, company, dob")
      .eq("tenant_id", tenantId)
      .not("dob", "is", null);
    const list = ((customers ?? []) as any[]).filter((c) => (c.dob ?? "").slice(5) === mmdd);
    if (list.length === 0) return { ok: true, sent: { whatsapp: 0, email: 0 }, message: "No birthdays today" };

    const { data: existing } = await sb
      .from("dob_greeting_logs")
      .select("customer_id, channel, status")
      .eq("tenant_id", tenantId)
      .eq("greeted_on", today);
    const done = new Set<string>();
    for (const l of (existing ?? []) as any[]) {
      if (l.status === "sent") done.add(`${l.customer_id}:${l.channel}`);
    }

    const wa_tpl = settings.whatsapp_template || DEFAULT_WA;
    const em_subject_tpl = settings.email_subject || DEFAULT_EMAIL_SUBJECT;
    const em_html_tpl = settings.email_html || DEFAULT_EMAIL_HTML;

    let waSent = 0, emailSent = 0, waFailed = 0, emailFailed = 0;
    let smtp: any = null;
    if (settings.email_enabled) smtp = await loadSmtp(sb, context.userId, tenantId);

    for (const c of list) {
      const ctx = {
        name: c.full_name || c.first_name || "friend",
        first_name: c.first_name || (c.full_name?.split(" ")[0] ?? ""),
        company_name: companyName,
        mobile: c.phone || "",
        email: c.email || "",
      };

      if (settings.whatsapp_enabled && c.phone && !done.has(`${c.id}:whatsapp`)) {
        const msg = renderTemplate(wa_tpl, ctx);
        const r0 = await sendWhatsApp({ sb, tenantId, cfg: waCfg, to: c.phone, message: msg, purpose: "automation", logKind: "dob_greeting" });
        const r = { ok: r0.ok, err: r0.ok ? undefined : r0.message };
        await sb.from("dob_greeting_logs").insert({
          tenant_id: tenantId, customer_id: c.id, channel: "whatsapp",
          status: r.ok ? "sent" : "failed", message: r.ok ? null : r.err, greeted_on: today,
        });
        r.ok ? waSent++ : waFailed++;
      }

      if (settings.email_enabled && c.email && !done.has(`${c.id}:email`) && smtp) {
        try {
          const nodemailer = (await import("nodemailer")).default;
          const transporter = nodemailer.createTransport({
            host: smtp.host, port: smtp.port, secure: smtp.secure, auth: smtp.auth,
            requireTLS: smtp.secure ? false : true,
          });
          await transporter.sendMail({
            from: smtp.from,
            to: c.email,
            replyTo: smtp.replyTo,
            subject: renderTemplate(em_subject_tpl, ctx),
            html: renderTemplate(em_html_tpl, ctx),
          });
          await sb.from("dob_greeting_logs").insert({
            tenant_id: tenantId, customer_id: c.id, channel: "email", status: "sent", greeted_on: today,
          });
          emailSent++;
        } catch (e: any) {
          await sb.from("dob_greeting_logs").insert({
            tenant_id: tenantId, customer_id: c.id, channel: "email", status: "failed",
            message: e?.message || String(e), greeted_on: today,
          });
          emailFailed++;
        }
      }
    }

    return {
      ok: true,
      sent: { whatsapp: waSent, email: emailSent },
      failed: { whatsapp: waFailed, email: emailFailed },
      message: `Sent ${waSent + emailSent} greeting(s)`,
    };
  });