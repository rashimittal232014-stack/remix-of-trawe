import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getTenantId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  return data?.tenant_id ?? null;
}

export const getEmailConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const tenantId = await getTenantId(supabase, userId);
    const [{ data: mine }, { data: org }, { data: tenant }] = await Promise.all([
      supabase.from("user_email_accounts").select("*").eq("user_id", userId).maybeSingle(),
      tenantId
        ? supabase.from("org_smtp_config").select("*").eq("tenant_id", tenantId).maybeSingle()
        : Promise.resolve({ data: null }),
      tenantId
        ? supabase.from("tenants").select("email_sharing").eq("id", tenantId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    return {
      mine: mine ?? null,
      org: org ?? null,
      sharing: (tenant?.email_sharing as string) ?? "record",
      tenantId,
    };
  });

const MyAccountSchema = z.object({
  provider: z.string().default("custom"),
  email_address: z.string().email(),
  from_name: z.string().optional().nullable(),
  smtp_host: z.string().min(1),
  smtp_port: z.coerce.number().int().positive(),
  smtp_username: z.string().min(1),
  smtp_password: z.string().optional().nullable(),
  smtp_encryption: z.enum(["TLS", "SSL", "None"]).default("TLS"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const saveMyEmailAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MyAccountSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenantId = await getTenantId(supabase, userId);
    const payload: any = { ...data, user_id: userId, tenant_id: tenantId };
    // If password blank, keep existing
    if (!data.smtp_password) {
      delete payload.smtp_password;
    }
    const { error } = await supabase.from("user_email_accounts").upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ImapSchema = z.object({
  imap_status: z.enum(["active", "inactive"]).default("active"),
  imap_host: z.string().min(1),
  imap_port: z.coerce.number().int().positive().default(993),
  imap_username: z.string().min(1),
  imap_password: z.string().optional().nullable(),
  imap_security: z.string().default("imap/ssl/novalidate-cert"),
  imap_default_folder: z.string().default("INBOX"),
});

export const saveMyImap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImapSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("user_email_accounts").select("id").eq("user_id", userId).maybeSingle();
    if (!existing) throw new Error("Save your email account first before configuring IMAP.");
    const patch: any = { ...data };
    if (!data.imap_password) delete patch.imap_password;
    const { error } = await supabase.from("user_email_accounts").update(patch).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const OrgSchema = z.object({
  smtp_host: z.string().min(1),
  smtp_port: z.coerce.number().int().positive(),
  smtp_encryption: z.enum(["TLS", "SSL", "None"]).default("SSL"),
  smtp_username: z.string().min(1),
  smtp_password: z.string().optional().nullable(),
  from_name: z.string().min(1),
  from_email: z.string().email(),
  reply_to_email: z.string().email().optional().or(z.literal("")).nullable(),
  test_email: z.string().email().optional().or(z.literal("")).nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const saveOrgSmtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OrgSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenantId = await getTenantId(supabase, userId);
    if (!tenantId) throw new Error("No workspace");
    const payload: any = { ...data, tenant_id: tenantId };
    if (!data.smtp_password) delete payload.smtp_password;
    const { error } = await supabase.from("org_smtp_config").upsert(payload, { onConflict: "tenant_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveEmailSharing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sharing: z.enum(["private", "record", "admin"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenantId = await getTenantId(supabase, userId);
    if (!tenantId) throw new Error("No workspace");
    const { error } = await supabase.from("tenants").update({ email_sharing: data.sharing }).eq("id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Send test email — picks user SMTP if active, else org SMTP fallback
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().email(), useOrg: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenantId = await getTenantId(supabase, userId);
    const { data: mine } = await supabase.from("user_email_accounts").select("*").eq("user_id", userId).maybeSingle();
    const { data: org } = tenantId
      ? await supabase.from("org_smtp_config").select("*").eq("tenant_id", tenantId).maybeSingle()
      : { data: null } as any;

    let cfg: any = null;
    let source = "";
    if (!data.useOrg && mine && mine.status === "active" && mine.smtp_host) {
      cfg = {
        host: mine.smtp_host, port: mine.smtp_port, secure: mine.smtp_encryption === "SSL",
        auth: { user: mine.smtp_username, pass: mine.smtp_password },
        from: `"${mine.from_name || mine.email_address}" <${mine.email_address}>`,
      };
      source = "user";
    } else if (org && org.status === "active" && org.smtp_host) {
      cfg = {
        host: org.smtp_host, port: org.smtp_port, secure: org.smtp_encryption === "SSL",
        auth: { user: org.smtp_username, pass: org.smtp_password },
        from: `"${org.from_name}" <${org.from_email}>`,
        replyTo: org.reply_to_email || undefined,
      };
      source = "org";
    } else {
      throw new Error("No active SMTP configured. Configure My Email Account or Organization SMTP first.");
    }

    try {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: cfg.host, port: cfg.port, secure: cfg.secure,
        auth: cfg.auth,
        requireTLS: cfg.secure ? false : true,
      });
      const info = await transporter.sendMail({
        from: cfg.from,
        to: data.to,
        replyTo: cfg.replyTo,
        subject: "TraWe · Test Email",
        text: `This is a test email sent from your TraWe workspace via ${source === "user" ? "your personal SMTP" : "the organization SMTP fallback"}.`,
        html: `<div style="font-family:system-ui,sans-serif;padding:24px;background:#f8fafc;">
          <div style="max-width:520px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
            <h2 style="margin:0 0 8px;color:#0f172a;">✅ SMTP is working</h2>
            <p style="color:#475569;margin:0 0 12px;">This test email was delivered via <b>${source === "user" ? "your personal SMTP" : "the organization SMTP fallback"}</b>.</p>
            <p style="color:#64748b;font-size:12px;margin:0;">Sent from TraWe · ${new Date().toISOString()}</p>
          </div>
        </div>`,
      });
      return { ok: true, source, messageId: info.messageId };
    } catch (e: any) {
      throw new Error(`SMTP send failed: ${e?.message || e}`);
    }
  });