import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function tenantOf(sb: any, userId: string): Promise<string> {
  const { data } = await sb.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  if (!data?.tenant_id) throw new Error("No workspace found for this account.");
  return data.tenant_id as string;
}

async function loadCfg(sb: any, tenantId: string) {
  const { data } = await sb.from("tenants").select("whatsapp_provider_config").eq("id", tenantId).maybeSingle();
  return (data?.whatsapp_provider_config ?? {}) as Record<string, any>;
}

async function ensureWebhookSecret(sb: any, tenantId: string, cfg: Record<string, any>) {
  if (cfg.webhook_secret) return cfg.webhook_secret as string;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  await sb.from("tenants").update({ whatsapp_provider_config: { ...cfg, webhook_secret: secret } }).eq("id", tenantId);
  return secret;
}

async function upsertSession(sb: any, tenantId: string, patch: Record<string, any>) {
  await sb.from("whatsapp_sessions").upsert(
    { tenant_id: tenantId, ...patch, updated_at: new Date().toISOString() },
    { onConflict: "tenant_id" },
  );
}

function warmupInfo(startedAt?: string | null) {
  if (!startedAt) return { day: 21, factor: 1, progress: 100, nextIncreaseDay: null as number | null };
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000));
  const stages = [
    { until: 1, factor: 0.1 }, { until: 3, factor: 0.2 }, { until: 7, factor: 0.4 },
    { until: 14, factor: 0.7 }, { until: 21, factor: 0.9 }, { until: Infinity, factor: 1 },
  ];
  const stage = stages.find((item) => elapsed < item.until) ?? stages[stages.length - 1];
  return {
    day: Math.min(21, elapsed + 1),
    factor: stage?.factor ?? 1,
    progress: Math.min(100, Math.round((elapsed / 21) * 100)),
    nextIncreaseDay: stage?.until === Infinity ? null : stage?.until,
  };
}

/** Which engine this workspace uses, plus the live state of the TraWe session. */
export const getTraweWhatsAppStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    const cfg = await loadCfg(sb, tenantId);
    const { gatewayConfig, getSession } = await import("./trawe-whatsapp.server");
    const { configured } = gatewayConfig();

    const { data: row } = await sb
      .from("whatsapp_sessions")
      .select("status, phone, device_label, last_error, connected_at, last_seen_at, warmup_started_at, daily_cap, hourly_cap, quiet_start, quiet_end")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    let live: any = null;
    if (configured) {
      try {
        live = await getSession(tenantId);
        await upsertSession(sb, tenantId, {
          status: live.status,
          phone: live.phone ?? row?.phone ?? null,
          device_label: live.deviceLabel ?? row?.device_label ?? null,
          last_error: live.error ?? null,
          last_seen_at: live.lastSeenAt ?? new Date().toISOString(),
          ...(live.status === "connected" && !row?.connected_at
            ? { connected_at: new Date().toISOString(), warmup_started_at: new Date().toISOString() }
            : {}),
        });
      } catch (e: any) {
        live = { status: row?.status ?? "disconnected", error: e?.message ?? String(e) };
      }
    }

    const warmup = warmupInfo(row?.warmup_started_at);
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: sentHour }, { count: sentDay }] = await Promise.all([
      sb.from("whatsapp_messages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("direction", "out").gte("created_at", hourAgo),
      sb.from("whatsapp_messages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("direction", "out").gte("created_at", dayAgo),
    ]);
    const configuredHourly = Number(row?.hourly_cap ?? 40);
    const configuredDaily = Number(row?.daily_cap ?? 250);
    return {
      engine: cfg.engine === "trawe" ? "trawe" : "wasender",
      serviceConfigured: configured,
      status: (live?.status ?? row?.status ?? "disconnected") as string,
      qr: (live?.qr ?? null) as string | null,
      phone: live?.phone ?? row?.phone ?? null,
      deviceLabel: live?.deviceLabel ?? row?.device_label ?? null,
      lastError: live?.error ?? row?.last_error ?? null,
      connectedAt: row?.connected_at ?? null,
      lastSeenAt: live?.lastSeenAt ?? row?.last_seen_at ?? null,
      warmupStartedAt: row?.warmup_started_at ?? null,
      warmup,
      usage: { sentHour: sentHour ?? 0, sentDay: sentDay ?? 0 },
      effectiveLimits: {
        hourlyCap: Math.max(3, Math.floor(configuredHourly * warmup.factor)),
        dailyCap: Math.max(10, Math.floor(configuredDaily * warmup.factor)),
      },
      limits: {
        dailyCap: row?.daily_cap ?? 250,
        hourlyCap: row?.hourly_cap ?? 40,
        quietStart: row?.quiet_start ?? 22,
        quietEnd: row?.quiet_end ?? 8,
      },
    };
  });

/** Pick WasenderAPI or TraWe WhatsApp for this workspace. */
export const setWhatsAppEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ engine: z.enum(["wasender", "trawe"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    await (await import("./plan.server")).assertTenantActive(tenantId);
    if (data.engine === "wasender") await (await import("./plan.server")).assertFeature(tenantId, "whatsapp_cloud");
    const cfg = await loadCfg(sb, tenantId);
    const { error } = await sb
      .from("tenants")
      .update({ whatsapp_provider_config: { ...cfg, engine: data.engine } })
      .eq("id", tenantId);
    if (error) throw error;
    return { ok: true, engine: data.engine };
  });

/** Start (or restart) the QR session for this workspace. */
export const startTraweWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    const cfg = await loadCfg(sb, tenantId);
    const secret = await ensureWebhookSecret(sb, tenantId, cfg);
    const { startSession } = await import("./trawe-whatsapp.server");
    try {
      const state = await startSession(tenantId, {
        webhookUrl: `${data.origin.replace(/\/+$/, "")}/api/public/whatsapp/webhook?tenant=${tenantId}`,
        webhookSecret: secret,
        label: "TraWe",
      });
      await upsertSession(sb, tenantId, { status: state.status, last_error: state.error ?? null });
      return { ok: true, status: state.status, qr: state.qr ?? null };
    } catch (e: any) {
      const message = e?.message ?? String(e);
      await upsertSession(sb, tenantId, { status: "error", last_error: message });
      return { ok: false, status: "error", qr: null, message };
    }
  });

/** Sign this workspace's number out of WhatsApp. */
export const logoutTraweWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    const { logoutSession } = await import("./trawe-whatsapp.server");
    try { await logoutSession(tenantId); } catch { /* still clear locally */ }
    await upsertSession(sb, tenantId, { status: "logged_out", phone: null, connected_at: null, warmup_started_at: null });
    return { ok: true };
  });

/** Remove the session entirely (deletes stored session material on the service). */
export const removeTraweWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    const { removeSession } = await import("./trawe-whatsapp.server");
    try { await removeSession(tenantId); } catch { /* ignore */ }
    await sb.from("whatsapp_sessions").delete().eq("tenant_id", tenantId);
    return { ok: true };
  });

/** Safety rails: caps and quiet hours. */
export const updateTraweWhatsAppLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      dailyCap: z.number().int().min(10).max(1000),
      hourlyCap: z.number().int().min(3).max(200),
      quietStart: z.number().int().min(0).max(23),
      quietEnd: z.number().int().min(0).max(23),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const tenantId = await tenantOf(sb, context.userId);
    await upsertSession(sb, tenantId, {
      daily_cap: data.dailyCap, hourly_cap: data.hourlyCap,
      quiet_start: data.quietStart, quiet_end: data.quietEnd,
    });
    return { ok: true };
  });
