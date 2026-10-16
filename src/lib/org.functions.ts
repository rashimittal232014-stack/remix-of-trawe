import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "@/lib/tenant.server";

// -------- Organization (tenants) --------
const orgSchema = z.object({
  name: z.string().min(1).optional(),
  crm_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  gst_no: z.string().nullable().optional(),
  pan_no: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  primary_color: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  signature_url: z.string().nullable().optional(),
  invoice_terms: z.string().nullable().optional(),
  invoice_template: z.string().nullable().optional(),
  itinerary_template: z.string().nullable().optional(),
  id_prefixes: z.any().optional(),
  whatsapp_ai_config: z.any().optional(),
  whatsapp_provider_config: z.any().optional(),
  gemini_api_key: z.string().nullable().optional(),
  ai_provider_config: z.any().optional(),
});

export const updateOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => orgSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const plan = await import("./plan.server");
    await plan.assertTenantActive(tenantId);
    if (data.whatsapp_provider_config && data.whatsapp_provider_config.engine !== "trawe") {
      await plan.assertFeature(tenantId, "whatsapp_cloud");
    }
    if (data.logo_url !== undefined || data.primary_color !== undefined || data.crm_name !== undefined) {
      await plan.assertFeature(tenantId, "white_label");
    }
    const { error } = await context.supabase.from("tenants").update(data as never).eq("id", tenantId);
    if (error) throw error;
    return { ok: true };
  });

// -------- Test AI Provider Key (live connectivity check) --------
const testAiSchema = z.object({
  provider: z.enum(["chatgpt", "gemini", "claude"]),
  api_key: z.string().min(1),
  model: z.string().optional(),
});

export const testAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => testAiSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    await (await import("./plan.server")).assertFeature(tenantId, "ai_builder");
    const started = Date.now();
    const key = data.api_key.trim();
    try {
      if (data.provider === "gemini") {
        const model = data.model || "gemini-flash-latest";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Reply with the single word: pong" }] }],
              generationConfig: { maxOutputTokens: 10 },
            }),
          },
        );
        const j: any = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, provider: data.provider, model, status: res.status, error: j?.error?.message || `HTTP ${res.status}`, latency_ms: Date.now() - started };
        const txt = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
        return { ok: true, provider: data.provider, model, sample: txt.slice(0, 60), latency_ms: Date.now() - started };
      }
      if (data.provider === "chatgpt") {
        const model = data.model || "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Reply with the single word: pong" }],
            max_tokens: 10,
          }),
        });
        const j: any = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, provider: data.provider, model, status: res.status, error: j?.error?.message || `HTTP ${res.status}`, latency_ms: Date.now() - started };
        const txt = j?.choices?.[0]?.message?.content ?? "";
        return { ok: true, provider: data.provider, model, sample: String(txt).slice(0, 60), latency_ms: Date.now() - started };
      }
      // claude
      const model = data.model || "claude-3-5-haiku-latest";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Reply with the single word: pong" }],
        }),
      });
      const j: any = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, provider: data.provider, model, status: res.status, error: j?.error?.message || `HTTP ${res.status}`, latency_ms: Date.now() - started };
      const txt = j?.content?.map((c: any) => c?.text ?? "").join("") ?? "";
      return { ok: true, provider: data.provider, model, sample: String(txt).slice(0, 60), latency_ms: Date.now() - started };
    } catch (e: any) {
      return { ok: false, provider: data.provider, error: e?.message || "Network error", latency_ms: Date.now() - started };
    }
  });

// -------- Package Terms Blocks --------
export const listPackageTerms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const { data } = await (context.supabase as any)
      .from("package_terms_blocks")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true });
    return data ?? [];
  });

const termSchema = z.object({
  id: z.string().uuid().optional(),
  heading: z.string().min(1),
  content: z.string().default(""),
  is_default: z.boolean().default(true),
  status: z.enum(["active", "inactive"]).default("active"),
  sort_order: z.number().int().default(0),
});

export const upsertPackageTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => termSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await sb.from("package_terms_blocks").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await sb
      .from("package_terms_blocks")
      .insert({ ...data, tenant_id: tenantId })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deletePackageTerm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).from("package_terms_blocks").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Currency Rates --------
const DEFAULT_CURRENCIES: Array<{ country: string; code: string; name: string; symbol: string }> = [
  { country: "India", code: "INR", name: "Indian Rupee", symbol: "₹" },
  { country: "United States", code: "USD", name: "US Dollar", symbol: "$" },
  { country: "European Union", code: "EUR", name: "Euro", symbol: "€" },
  { country: "United Kingdom", code: "GBP", name: "British Pound", symbol: "£" },
  { country: "United Arab Emirates", code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { country: "Singapore", code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { country: "Thailand", code: "THB", name: "Thai Baht", symbol: "฿" },
  { country: "Malaysia", code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { country: "Australia", code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { country: "Japan", code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

async function seedCurrencies(sb: any, tenantId: string, baseCode: string) {
  const rows = DEFAULT_CURRENCIES.map((c, i) => ({
    tenant_id: tenantId,
    country: c.country,
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    is_base: c.code === baseCode,
    is_active: true,
    rate: c.code === baseCode ? 1 : 0,
    sort_order: i,
  }));
  await sb.from("currency_rates").upsert(rows, { onConflict: "tenant_id,code" });
}

export const listCurrencyRates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    let { data } = await sb
      .from("currency_rates")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true });
    if (!data || data.length === 0) {
      const { data: t } = await sb.from("tenants").select("currency").eq("id", tenantId).maybeSingle();
      await seedCurrencies(sb, tenantId, t?.currency || "INR");
      const res = await sb.from("currency_rates").select("*").eq("tenant_id", tenantId).order("sort_order", { ascending: true });
      data = res.data;
    }
    return data ?? [];
  });

export const refreshCurrencyRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: t } = await sb.from("tenants").select("currency").eq("id", tenantId).maybeSingle();
    const base = t?.currency || "INR";
    const { data: rows } = await sb.from("currency_rates").select("code").eq("tenant_id", tenantId);
    const codes = (rows ?? []).map((r: any) => r.code).filter((c: string) => c !== base);
    if (codes.length === 0) return { ok: true, updated: 0, message: "No currencies to update" };
    const url = `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${codes.join(",")}`;
    let updated = 0;
    let message = "";
    try {
      const res = await fetch(url);
      const j: any = await res.json();
      const rates: Record<string, number> = j.rates || {};
      const now = new Date().toISOString();
      for (const code of Object.keys(rates)) {
        await sb
          .from("currency_rates")
          .update({ rate: rates[code], last_updated: now })
          .eq("tenant_id", tenantId)
          .eq("code", code);
        updated++;
      }
      await sb
        .from("currency_rates")
        .update({ rate: 1, is_base: true, last_updated: now })
        .eq("tenant_id", tenantId)
        .eq("code", base);
      message = `Updated ${updated} currency rate(s) using Frankfurter`;
    } catch (e: any) {
      message = `Rate API failed: ${e.message}`;
    }
    return { ok: true, updated, message };
  });

// Auto-refresh: no-op if rates were updated in the last 12h.
// Used by the background poller so users always see fresh conversion rates.
export const refreshCurrencyRatesIfStale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: rows } = await sb
      .from("currency_rates")
      .select("code, last_updated, is_base")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    const nonBase = (rows ?? []).filter((r: any) => !r.is_base);
    if (nonBase.length === 0) return { ok: true, skipped: true, reason: "no active currencies" };
    const oldestMs = nonBase.reduce((min: number, r: any) => {
      const t = r.last_updated ? new Date(r.last_updated).getTime() : 0;
      return Math.min(min, t);
    }, Date.now());
    const staleAfter = 12 * 60 * 60 * 1000; // 12h
    if (Date.now() - oldestMs < staleAfter) return { ok: true, skipped: true, reason: "fresh" };

    const { data: t } = await sb.from("tenants").select("currency").eq("id", tenantId).maybeSingle();
    const base = t?.currency || "INR";
    const codes = nonBase.map((r: any) => r.code).filter((c: string) => c !== base);
    if (codes.length === 0) return { ok: true, skipped: true, reason: "only base" };
    try {
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${codes.join(",")}`);
      const j: any = await res.json();
      const rates: Record<string, number> = j.rates || {};
      const now = new Date().toISOString();
      let updated = 0;
      for (const code of Object.keys(rates)) {
        await sb.from("currency_rates").update({ rate: rates[code], last_updated: now })
          .eq("tenant_id", tenantId).eq("code", code);
        updated++;
      }
      return { ok: true, updated };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  });

export const toggleCurrencyActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("currency_rates")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setBaseCurrency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    await sb.from("currency_rates").update({ is_base: false }).eq("tenant_id", tenantId);
    await sb.from("currency_rates").update({ is_base: true, rate: 1 }).eq("tenant_id", tenantId).eq("code", data.code);
    await sb.from("tenants").update({ currency: data.code }).eq("id", tenantId);
    return { ok: true };
  });

// -------- WhatsApp WA Sender API diagnostics --------

export const getWhatsAppDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: tRow } = await sb
      .from("tenants")
      .select("whatsapp_provider_config")
      .eq("id", tenantId)
      .maybeSingle();
    const provCfg = (tRow?.whatsapp_provider_config ?? {}) as Record<string, any>;
    const enabled = provCfg.enabled !== false;
    const { data: logs } = await sb
      .from("whatsapp_webhook_logs")
      .select("kind, status, message, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20);
    const list = (logs ?? []) as Array<{ kind: string; status: string | null; message: string | null; created_at: string }>;
    const isOldSendLog = (l: { kind: string; status: string | null; message: string | null }) =>
      l.kind === "test" && (l.status === "sent" || (l.message ?? "").toLowerCase().includes("send endpoint"));
    const isConnectionTest = (l: { kind: string; status: string | null; message: string | null }) =>
      l.kind === "test" && !isOldSendLog(l);
    const isHealthySignal = (l: { kind: string; status: string | null; message: string | null }) =>
      (isConnectionTest(l) && l.status === "connected") ||
      ((l.kind === "test_send" || isOldSendLog(l)) && ["sent", "connected", "delivered"].includes(l.status ?? "")) ||
      (l.kind === "webhook_hit" && l.status === "received");
    const isConnectionFailure = (l: { kind: string; status: string | null; message: string | null }) =>
      isConnectionTest(l) && ["failed", "disconnected", "unauthorized"].includes(l.status ?? "");
    const latestHealthy = list.find(isHealthySignal) ?? null;
    const latestConnectionFailure = list.find(isConnectionFailure) ?? null;
    const connected = Boolean(
      latestHealthy && (!latestConnectionFailure || latestHealthy.created_at >= latestConnectionFailure.created_at),
    );
    return {
      connected: enabled && connected,
      enabled,
      statusLabel: !enabled
        ? "Paused"
        : connected ? "Connected" : (latestConnectionFailure ? "Disconnected" : "Not tested yet"),
      latestHealthy,
      latestConnectionFailure,
      lastWebhookHit: list.find((l) => l.kind === "webhook_hit") ?? null,
      lastTest: list.find(isConnectionTest) ?? null,
      lastSend: list.find((l) => l.kind === "test_send" || isOldSendLog(l)) ?? null,
      lastError: list.find((l) => l.kind === "error") ?? null,
      recent: list,
    };
  });

export const testWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    await (await import("./plan.server")).assertFeature(tenantId, "whatsapp_cloud");
    const sb = context.supabase as any;
    const { data: t } = await sb
      .from("tenants")
      .select("whatsapp_provider_config")
      .eq("id", tenantId)
      .maybeSingle();
    const cfg = (t?.whatsapp_provider_config ?? {}) as Record<string, string>;
    if ((cfg as any).enabled === false) {
      const msg = "WhatsApp is currently paused. Turn it back on to test the connection.";
      await sb.from("whatsapp_webhook_logs").insert({ tenant_id: tenantId, kind: "test", status: "failed", message: msg });
      return { ok: false, status: "paused", message: msg };
    }
    const statusUrl = cfg.status_endpoint || "";
    const apiKey = cfg.api_key || "";
    if (!statusUrl || !apiKey) {
      const msg = "Missing WA Sender API key or status endpoint.";
      await sb.from("whatsapp_webhook_logs").insert({ tenant_id: tenantId, kind: "test", status: "failed", message: msg });
      return { ok: false, status: "failed", message: msg };
    }
    try {
      const res = await fetch(statusUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      const text = await res.text();
      const status = res.ok ? "connected" : "failed";
      const message = res.ok
        ? "Live connection test successful."
        : `HTTP ${res.status}: ${text.slice(0, 200)}`;
      await sb.from("whatsapp_webhook_logs").insert({
        tenant_id: tenantId, kind: "test", status, message,
      });
      return { ok: res.ok, status, message };
    } catch (e: any) {
      const message = `Request failed: ${e?.message ?? String(e)}`;
      await sb.from("whatsapp_webhook_logs").insert({ tenant_id: tenantId, kind: "test", status: "failed", message });
      return { ok: false, status: "failed", message };
    }
  });

export const rotateWhatsAppWebhookSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    await (await import("./plan.server")).assertFeature(tenantId, "whatsapp_cloud");
    const sb = context.supabase as any;
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { data: t } = await sb.from("tenants").select("whatsapp_provider_config").eq("id", tenantId).maybeSingle();
    const cfg = { ...(t?.whatsapp_provider_config ?? {}), webhook_secret: secret };
    const { error } = await sb.from("tenants").update({ whatsapp_provider_config: cfg }).eq("id", tenantId);
    if (error) throw error;
    return { ok: true, secret };
  });

// Send a real WhatsApp test message to a chosen number using the configured
// WA Sender endpoint. Logs the attempt for diagnostics.
export const sendWhatsAppTestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      to: z.string().min(6, "Enter a valid phone number"),
      message: z.string().min(1).max(4096).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: t } = await sb
      .from("tenants")
      .select("name, whatsapp_provider_config")
      .eq("id", tenantId).maybeSingle();
    const cfg = (t?.whatsapp_provider_config ?? {}) as Record<string, string>;
    if ((cfg as any).enabled === false) {
      const msg = "WhatsApp is currently paused. Turn it back on in Settings → WhatsApp to send messages.";
      await sb.from("whatsapp_webhook_logs").insert({ tenant_id: tenantId, kind: "test_send", status: "failed", message: msg });
      return { ok: false, status: "paused", message: msg };
    }
    const to = data.to.replace(/[^\d+]/g, "");
    const message = data.message?.trim() ||
      `Hello from ${t?.name || "TraWe"}! This is a test message from your CRM WhatsApp integration.`;

    const { sendWhatsApp } = await import("./wa-send.server");
    const res = await sendWhatsApp({
      sb, tenantId, cfg, to, message, purpose: "test", logKind: "test_send",
    });
    return { ok: res.ok, status: res.status, message: res.message, to };
  });

// -------- WhatsApp inbox: conversations & messages --------

export const listWaConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: rows } = await sb
      .from("whatsapp_messages")
      .select("peer_phone, direction, body, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(500);
    const list = (rows ?? []) as Array<{ peer_phone: string; direction: string; body: string | null; created_at: string }>;
    const byPeer = new Map<string, { peer_phone: string; last_body: string | null; last_at: string; last_direction: string }>();
    for (const r of list) {
      if (!byPeer.has(r.peer_phone)) {
        byPeer.set(r.peer_phone, { peer_phone: r.peer_phone, last_body: r.body, last_at: r.created_at, last_direction: r.direction });
      }
    }
    const peers = Array.from(byPeer.keys());
    // Match customers by digit-suffix so names resolve even when the stored
    // customer phone is missing a country code (e.g. "7011154779" vs "917011154779").
    const { data: customers } = await sb
      .from("customers").select("full_name, phone, company")
      .eq("tenant_id", tenantId).not("phone", "is", null);
    const norm = (p: string) => p.replace(/\D/g, "");
    const suffix = (p: string) => { const d = norm(p); return d.slice(-10); };
    const custBySuffix = new Map<string, { full_name: string; company: string | null }>();
    for (const c of (customers ?? [])) {
      const s = suffix(String(c.phone));
      if (s && !custBySuffix.has(s)) custBySuffix.set(s, { full_name: c.full_name, company: c.company });
    }
    return Array.from(byPeer.values()).map((c) => {
      const cust = custBySuffix.get(suffix(c.peer_phone));
      return { ...c, name: cust?.full_name ?? null, company: cust?.company ?? null };
    });
  });

export const listWaMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ peer: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const sb = context.supabase as any;
    const { data: rows } = await sb
      .from("whatsapp_messages")
      .select("id, direction, body, status, created_at")
      .eq("tenant_id", tenantId)
      .eq("peer_phone", data.peer)
      .order("created_at", { ascending: true })
      .limit(500);
    return rows ?? [];
  });