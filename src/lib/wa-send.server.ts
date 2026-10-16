/**
 * One sending layer for every outgoing WhatsApp message in TraWe.
 *
 * Engines:
 *   - "wasender"  -> WasenderAPI / Meta / custom HTTP provider (existing behaviour)
 *   - "trawe"     -> TraWe WhatsApp, our own QR-based gateway
 *
 * The TraWe engine applies the safety rails that keep a real number healthy:
 * quiet hours, hourly/daily caps, a warm-up ramp for freshly connected numbers,
 * duplicate-blast detection, and no cold bulk campaigns.
 */

import { sendViaGateway } from "./trawe-whatsapp.server";

export type SendPurpose = "reply" | "automation" | "test" | "campaign";

export type SendResult = {
  ok: boolean;
  engine: "wasender" | "trawe";
  status: "sent" | "failed" | "paused" | "blocked";
  message: string;
  providerMessageId?: string | null;
};

export function resolveEngine(cfg: Record<string, any>): "wasender" | "trawe" {
  return cfg?.engine === "trawe" ? "trawe" : "wasender";
}

export function cleanPhone(v: unknown) {
  return String(v ?? "").split("@")[0].replace(/[^\d+]/g, "");
}

/** Warm-up: a newly connected number ramps up over its first three weeks. */
function warmupFactor(startedAt?: string | null) {
  if (!startedAt) return 1;
  const days = (Date.now() - new Date(startedAt).getTime()) / 86400000;
  if (days < 1) return 0.1;
  if (days < 3) return 0.2;
  if (days < 7) return 0.4;
  if (days < 14) return 0.7;
  if (days < 21) return 0.9;
  return 1;
}

function localHour(timeZone: string, now: Date) {
  try {
    const h = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now);
    return Number(h) % 24;
  } catch {
    return Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", hourCycle: "h23" }).format(now)) % 24;
  }
}

/** Quiet window evaluated in the agency's own timezone (defaults to India). */
function inQuietHours(start: number, end: number, timeZone = "Asia/Kolkata", now = new Date()) {
  const h = Number(localHour(timeZone, now));
  if (start === end) return false;
  return start < end ? h >= start && h < end : h >= start || h < end;
}

async function countOut(sb: any, tenantId: string, sinceIso: string) {
  const { count } = await sb
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("direction", "out")
    .gte("created_at", sinceIso);
  return count ?? 0;
}

/** Human-ish pause so messages never leave at a machine-perfect cadence. */
async function humanPause(min = 900, max = 2600) {
  const ms = min + Math.floor(Math.random() * (max - min));
  await new Promise((r) => setTimeout(r, ms));
}

export async function sendWhatsApp(args: {
  sb: any;
  tenantId: string;
  cfg: Record<string, any>;
  to: string;
  message: string;
  purpose?: SendPurpose;
  logKind?: string;
}): Promise<SendResult> {
  const { sb, tenantId, cfg } = args;
  const purpose: SendPurpose = args.purpose ?? "reply";
  const engine = resolveEngine(cfg);
  const to = cleanPhone(args.to);
  const message = String(args.message ?? "").trim();
  const logKind = args.logKind ?? "send";

  const log = async (status: string, msg: string) => {
    try {
      await sb.from("whatsapp_webhook_logs").insert({ tenant_id: tenantId, kind: logKind, status, message: msg });
    } catch { /* diagnostics only */ }
  };
  const fail = async (status: SendResult["status"], msg: string): Promise<SendResult> => {
    await log(status === "sent" ? "sent" : "failed", msg);
    return { ok: false, engine, status, message: msg };
  };

  try {
    await (await import("./plan.server")).assertTenantActive(tenantId);
  } catch (error: any) {
    return fail("blocked", error?.message ?? "This workspace is currently suspended.");
  }

  if (cfg?.enabled === false) return fail("paused", "WhatsApp is paused in Settings → WhatsApp.");
  if (!to) return fail("failed", "No valid phone number for this contact.");
  if (!message) return fail("failed", "Message body is empty.");

  if (engine === "wasender") {
    try {
      await (await import("./plan.server")).assertFeature(tenantId, "whatsapp_cloud");
    } catch (error: any) {
      return fail("blocked", error?.message ?? "WhatsApp Cloud is not included in this plan.");
    }
    const endpoint = cfg.send_endpoint || "";
    const apiKey = cfg.api_key || "";
    if (!endpoint || !apiKey) return fail("failed", "Missing WasenderAPI key or send endpoint. Save API settings first.");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ to, message, text: message }),
      });
      const text = await res.text();
      if (!res.ok) return fail("failed", `HTTP ${res.status}: ${text.slice(0, 200)}`);
      await sb.from("whatsapp_messages").insert({ tenant_id: tenantId, peer_phone: to, direction: "out", body: message, status: "sent" });
      await log("sent", `Sent to ${to} via WasenderAPI.`);
      return { ok: true, engine, status: "sent", message: `Sent to ${to}.` };
    } catch (e: any) {
      return fail("failed", `Request failed: ${e?.message ?? String(e)}`);
    }
  }

  // ---- TraWe WhatsApp engine ----
  if (purpose === "campaign") {
    return fail(
      "blocked",
      "Bulk campaigns are not allowed on TraWe WhatsApp — mass identical messages get numbers banned. Switch this workspace to WasenderAPI for campaigns.",
    );
  }

  const { data: session } = await sb
    .from("whatsapp_sessions")
    .select("status, phone, warmup_started_at, daily_cap, hourly_cap, quiet_start, quiet_end")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!session || session.status !== "connected") {
    return fail("failed", "TraWe WhatsApp is not connected. Open Settings → WhatsApp and scan the QR code.");
  }

  const quietStart = Number(session.quiet_start ?? 22);
  const quietEnd = Number(session.quiet_end ?? 8);
  const { data: tz } = await sb.from("tenants").select("timezone").eq("id", tenantId).maybeSingle();
  const timeZone = (tz as any)?.timezone || "Asia/Kolkata";
  if (purpose !== "test" && purpose !== "reply" && inQuietHours(quietStart, quietEnd, timeZone)) {
    return fail("blocked", "Quiet hours are on for this number — automated messages resume in the morning.");
  }

  const factor = warmupFactor(session.warmup_started_at);
  const hourlyCap = Math.max(3, Math.floor(Number(session.hourly_cap ?? 40) * factor));
  const dailyCap = Math.max(10, Math.floor(Number(session.daily_cap ?? 250) * factor));
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  const [sentHour, sentDay] = await Promise.all([countOut(sb, tenantId, hourAgo), countOut(sb, tenantId, dayAgo)]);
  if (sentHour >= hourlyCap) return fail("blocked", `Hourly safety limit reached (${hourlyCap} messages). Try again shortly.`);
  if (sentDay >= dailyCap) return fail("blocked", `Daily safety limit reached (${dailyCap} messages). This protects the number from being banned.`);

  // Duplicate-blast guard: the same body sent to many different numbers looks like spam.
  if (purpose !== "test") {
    const { data: recentSame } = await sb
      .from("whatsapp_messages")
      .select("peer_phone")
      .eq("tenant_id", tenantId)
      .eq("direction", "out")
      .eq("body", message)
      .gte("created_at", hourAgo)
      .limit(20);
    const distinct = new Set((recentSame ?? []).map((r: any) => r.peer_phone));
    distinct.delete(to);
    if (distinct.size >= 8) {
      return fail("blocked", "This exact message already went to many numbers in the last hour. Vary the wording before sending more.");
    }
  }

  await humanPause();

  try {
    const res = await sendViaGateway(tenantId, { to, message, humanize: true });
    if (!res?.ok) return fail("failed", res?.error || "TraWe WhatsApp could not send this message.");
    await sb.from("whatsapp_messages").insert({
      tenant_id: tenantId, peer_phone: to, direction: "out", body: message,
      status: "sent", provider_message_id: res.id ?? null,
    });
    await sb.from("whatsapp_sessions").update({ last_seen_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    await log("sent", `Sent to ${to} via TraWe WhatsApp.`);
    return { ok: true, engine, status: "sent", message: `Sent to ${to}.`, providerMessageId: res.id ?? null };
  } catch (e: any) {
    return fail("failed", e?.message ?? String(e));
  }
}
