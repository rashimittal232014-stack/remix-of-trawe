import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { sendWhatsApp } from "./wa-send.server";

async function getTenantId(sb: any, userId: string): Promise<string | null> {
  const { data } = await sb.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  return data?.tenant_id ?? null;
}

function renderTemplate(tpl: string, ctx: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_: string, k: string) => (ctx[k] ?? ""));
}

export const listTriggerData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId);
    if (!tenantId) throw new Error("No tenant");

    const [{ data: triggers }, { data: stages }, { data: pipelines }, { data: logs }] = await Promise.all([
      sb.from("automation_triggers").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      sb.from("pipeline_stages").select("id, name, pipeline_id").eq("tenant_id", tenantId).order("sort_order"),
      sb.from("pipelines").select("id, name").eq("tenant_id", tenantId),
      sb.from("automation_trigger_logs")
        .select("id, status, sent_at, phone, message, error, trigger_id, lead_id")
        .eq("tenant_id", tenantId)
        .gte("sent_at", new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString())
        .order("sent_at", { ascending: false })
        .limit(200),
    ]);

    // cleanup old logs (>2 days)
    await sb.from("automation_trigger_logs")
      .delete()
      .eq("tenant_id", tenantId)
      .lt("sent_at", new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString());

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaysLogs = ((logs ?? []) as any[]).filter((l) => new Date(l.sent_at) >= today);
    const sentToday = todaysLogs.filter((l) => l.status === "sent").length;
    const failedToday = todaysLogs.filter((l) => l.status === "failed").length;
    const activeCount = ((triggers ?? []) as any[]).filter((t) => t.status === "active").length;

    // pending eligible: leads whose stage matches an active trigger and not yet sent max
    let pending = 0;
    for (const t of (triggers ?? []) as any[]) {
      if (t.status !== "active") continue;
      const { data: leads } = await sb.from("leads").select("id").eq("tenant_id", tenantId).eq("stage_id", t.stage_id);
      for (const l of (leads ?? []) as any[]) {
        const sentCount = ((logs ?? []) as any[]).filter((x) => x.lead_id === l.id && x.trigger_id === t.id && x.status === "sent").length;
        if (sentCount < (t.max_send ?? 1)) pending++;
      }
    }

    return {
      triggers: triggers ?? [],
      stages: stages ?? [],
      pipelines: pipelines ?? [],
      logs: logs ?? [],
      stats: {
        active: activeCount,
        total: (triggers ?? []).length,
        sentToday,
        failedToday,
        pending,
      },
    };
  });

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  stage_id: z.string().uuid(),
  message: z.string().min(1),
  send_type: z.enum(["once", "daily", "repeat"]),
  send_per_day: z.number().int().min(1).max(100),
  max_send: z.number().int().min(1).max(1000),
  send_interval_hours: z.number().int().min(1).max(720),
  start_time: z.string(),
  end_time: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const upsertTrigger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId);
    if (!tenantId) throw new Error("No tenant");
    const row = { ...data, tenant_id: tenantId, updated_at: new Date().toISOString() };
    if (data.id) {
      const { error } = await sb.from("automation_triggers").update(row).eq("id", data.id).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb.from("automation_triggers").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTrigger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId);
    if (!tenantId) throw new Error("No tenant");
    const { error } = await sb.from("automation_triggers").delete().eq("id", data.id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runTriggersOnce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await getTenantId(sb, context.userId);
    if (!tenantId) throw new Error("No tenant");

    const { data: tenant } = await sb.from("tenants").select("company_name, name, whatsapp_provider_config").eq("id", tenantId).maybeSingle();
    const companyName = tenant?.company_name || tenant?.name || "Our Team";
    const waCfg = (tenant?.whatsapp_provider_config ?? {}) as Record<string, string>;

    const { data: triggers } = await sb.from("automation_triggers").select("*").eq("tenant_id", tenantId).eq("status", "active");
    if (!triggers || triggers.length === 0) return { ok: true, sent: 0, failed: 0, message: "No active triggers" };

    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    let sent = 0, failed = 0;
    const MAX_PER_RUN = 5;

    for (const t of triggers as any[]) {
      if (sent + failed >= MAX_PER_RUN) break;
      // active hours check
      if (hhmm < (t.start_time ?? "00:00").slice(0, 5) || hhmm > (t.end_time ?? "23:59").slice(0, 5)) continue;

      const { data: stage } = await sb.from("pipeline_stages").select("name").eq("id", t.stage_id).maybeSingle();
      const stageName = stage?.name || "";

      const { data: leads } = await sb.from("leads")
        .select("id, code, full_name, phone, to_location, travel_date, owner_id, estimated_value")
        .eq("tenant_id", tenantId)
        .eq("stage_id", t.stage_id)
        .not("phone", "is", null);

      for (const l of (leads ?? []) as any[]) {
        if (sent + failed >= MAX_PER_RUN) break;

        // fetch existing logs for this lead+trigger
        const { data: existing } = await sb.from("automation_trigger_logs")
          .select("id, status, sent_at")
          .eq("tenant_id", tenantId).eq("trigger_id", t.id).eq("lead_id", l.id)
          .order("sent_at", { ascending: false });
        const sentLogs = ((existing ?? []) as any[]).filter((x) => x.status === "sent");
        if (sentLogs.length >= (t.max_send ?? 1)) continue;

        const sentToday = sentLogs.filter((x) => new Date(x.sent_at) >= new Date(todayISO)).length;
        if (sentToday >= (t.send_per_day ?? 1)) continue;

        if (t.send_type === "once" && sentLogs.length >= 1) continue;
        if (t.send_type === "repeat" && sentLogs.length > 0) {
          const lastSent = new Date(sentLogs[0].sent_at).getTime();
          const intervalMs = (t.send_interval_hours ?? 24) * 3600 * 1000;
          if (Date.now() - lastSent < intervalMs) continue;
        }
        if (t.send_type === "daily" && sentToday >= 1) continue;

        const owner = l.owner_id ? await sb.from("profiles").select("full_name, phone").eq("id", l.owner_id).maybeSingle() : { data: null };
        const ctx = {
          client_name: l.full_name || "Traveller",
          first_name: (l.full_name || "").split(" ")[0] || "",
          query_id: l.code || l.id.slice(0, 8),
          destination: l.to_location || "",
          travel_date: l.travel_date ? String(l.travel_date) : "",
          stage_name: stageName,
          company_name: companyName,
          owner_name: owner?.data?.full_name || "",
          owner_mobile: owner?.data?.phone || "",
          total_amount: l.estimated_value != null ? String(l.estimated_value) : "0",
        };
        const msg = renderTemplate(t.message || "", ctx);
        const r0 = await sendWhatsApp({ sb, tenantId, cfg: waCfg, to: l.phone, message: msg, purpose: "automation", logKind: "trigger_send" });
        const r = { ok: r0.ok, err: r0.ok ? undefined : r0.message };
        await sb.from("automation_trigger_logs").insert({
          tenant_id: tenantId, trigger_id: t.id, lead_id: l.id,
          phone: l.phone, message: msg,
          status: r.ok ? "sent" : "failed", error: r.ok ? null : r.err,
        });
        r.ok ? sent++ : failed++;
      }
    }

    return { ok: true, sent, failed, message: `Sent ${sent}, failed ${failed}` };
  });