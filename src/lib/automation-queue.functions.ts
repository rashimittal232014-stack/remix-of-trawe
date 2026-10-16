import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Shared helpers (mirrored from dob/automation-trigger to keep this file self-contained)
function renderTemplate(tpl: string, ctx: Record<string, string>): string {
  return String(tpl || "").replace(/\{\{?(\w+)\}?\}/g, (_, k) => ctx[k] ?? "");
}

async function getTenantId(sb: any, userId: string): Promise<string | null> {
  const { data } = await sb.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  return data?.tenant_id ?? null;
}

// Routes through the shared engine layer so WasenderAPI and TraWe WhatsApp
// (including its pacing and safety caps) behave identically for automations.
async function sendWA(sb: any, tenantId: string, cfg: any, to: string, message: string) {
  const { sendWhatsApp } = await import("./wa-send.server");
  const r = await sendWhatsApp({ sb, tenantId, cfg, to, message, purpose: "automation", logKind: "automation_send" });
  return r.ok ? { ok: true as const, err: undefined } : { ok: false as const, err: r.message };
}

async function loadSmtp(sb: any, userId: string, tenantId: string) {
  const { data: mine } = await sb.from("user_email_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (mine?.status === "active" && mine.smtp_host) {
    return {
      host: mine.smtp_host, port: mine.smtp_port, secure: mine.smtp_encryption === "SSL",
      auth: { user: mine.smtp_username, pass: mine.smtp_password },
      from: `"${mine.from_name || mine.email_address}" <${mine.email_address}>`,
    };
  }
  const { data: org } = await sb.from("org_smtp_config").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (org?.status === "active" && org.smtp_host) {
    return {
      host: org.smtp_host, port: org.smtp_port, secure: org.smtp_encryption === "SSL",
      auth: { user: org.smtp_username, pass: org.smtp_password },
      from: `"${org.from_name}" <${org.from_email}>`,
      replyTo: org.reply_to_email || undefined,
    };
  }
  return null;
}

/**
 * Drains queued rows in automation_logs (status='queued'), executes the actions
 * attached to the log payload, and marks each row as 'sent' or 'failed'.
 * Bounded per run so a background poller can call it safely.
 */
export const runAutomationQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId);
    if (!tenantId) return { ok: false, processed: 0 };

    const { data: queued } = await sb
      .from("automation_logs")
      .select("id, tenant_id, automation_id, detail")
      .eq("tenant_id", tenantId)
      .eq("status", "queued")
      .limit(10);

    if (!queued || queued.length === 0) return { ok: true, processed: 0 };

    const { data: tenant } = await sb.from("tenants")
      .select("name, company_name, whatsapp_provider_config").eq("id", tenantId).maybeSingle();
    const waCfg = (tenant?.whatsapp_provider_config ?? {}) as Record<string, string>;
    const companyName = tenant?.company_name || tenant?.name || "Our Team";
    const smtp = await loadSmtp(sb, context.userId, tenantId);

    let ok = 0, fail = 0;

    for (const row of queued as any[]) {
      const detail = typeof row.detail === "string" ? safeParse(row.detail) : (row.detail ?? {});
      const actions: any[] = Array.isArray(detail?.actions) ? detail.actions : [];
      const leadId = detail?.lead_id as string | undefined;
      const invoiceId = detail?.invoice_id as string | undefined;
      const amount = detail?.amount;

      // Resolve lead + customer context if present
      let ctxVars: Record<string, string> = {
        client_name: "Traveller", first_name: "", destination: "", travel_date: "",
        company_name: companyName, opportunity_name: "", amount: amount != null ? String(amount) : "",
      };
      let lead: any = null, customer: any = null;
      if (leadId) {
        const { data: L } = await sb.from("leads")
          .select("id, full_name, phone, email, to_location, travel_date, code, customer_id, estimated_value")
          .eq("id", leadId).maybeSingle();
        lead = L;
        if (L?.customer_id) {
          const { data: C } = await sb.from("customers")
            .select("full_name, email, phone").eq("id", L.customer_id).maybeSingle();
          customer = C;
        }
        if (L) {
          ctxVars = {
            ...ctxVars,
            client_name: L.full_name || customer?.full_name || "Traveller",
            first_name: (L.full_name || "").split(" ")[0] || "",
            destination: L.to_location || "",
            travel_date: L.travel_date ? String(L.travel_date) : "",
            opportunity_name: L.code || "",
            amount: amount != null ? String(amount) : (L.estimated_value != null ? String(L.estimated_value) : ""),
          };
        }
      }

      const results: string[] = [];
      let anyFail = false;

      for (const act of actions) {
        const kind = String(act?.kind || "").toLowerCase();
        const tpl = act?.template || act?.message || "";
        const body = renderTemplate(tpl, ctxVars);
        try {
          if (kind === "send whatsapp" || kind === "whatsapp") {
            const to = lead?.phone || customer?.phone;
            if (!to) { results.push("wa:skip(no phone)"); continue; }
            const r = await sendWA(sb, tenantId, waCfg, to, body);
            r.ok ? results.push("wa:sent") : (anyFail = true, results.push(`wa:fail(${r.err})`));
          } else if (kind === "send email" || kind === "email") {
            const to = lead?.email || customer?.email;
            if (!to) { results.push("email:skip(no address)"); continue; }
            if (!smtp) { anyFail = true; results.push("email:fail(no smtp)"); continue; }
            const nodemailer = (await import("nodemailer")).default;
            const transporter = nodemailer.createTransport({
              host: smtp.host, port: smtp.port, secure: smtp.secure, auth: smtp.auth,
              requireTLS: !smtp.secure,
            });
            await transporter.sendMail({
              from: smtp.from, to, replyTo: (smtp as any).replyTo,
              subject: renderTemplate(act?.subject || `Update from ${companyName}`, ctxVars),
              html: `<div style="font-family:system-ui,sans-serif;padding:24px;color:#0f172a">${body.replace(/\n/g, "<br/>")}</div>`,
            });
            results.push("email:sent");
          } else if (kind === "create task" || kind === "create call" || kind === "create reminder") {
            const due = new Date();
            due.setDate(due.getDate() + Number(act?.due_days ?? 1));
            await sb.from("tasks").insert({
              tenant_id: tenantId, title: renderTemplate(act?.title || act?.template || kind, ctxVars),
              status: "open", priority: "normal", assignee_id: context.userId,
              related_type: leadId ? "lead" : (invoiceId ? "invoice" : null),
              related_id: leadId ?? invoiceId ?? null, due_at: due.toISOString(),
            });
            results.push("task:created");
          } else {
            results.push(`skip:${kind}`);
          }
        } catch (e: any) {
          anyFail = true;
          results.push(`err:${(e?.message || String(e)).slice(0, 80)}`);
        }
      }

      await sb.from("automation_logs").update({
        status: anyFail ? "failed" : "sent",
        detail: JSON.stringify({ ...detail, executed: results, ran_at: new Date().toISOString() }),
        ran_at: new Date().toISOString(),
      }).eq("id", row.id);

      anyFail ? fail++ : ok++;
    }

    return { ok: true, processed: queued.length, sent: ok, failed: fail };
  });

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }