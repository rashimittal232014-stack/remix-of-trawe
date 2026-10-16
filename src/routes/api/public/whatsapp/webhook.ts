import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret, X-Tenant-Id, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function cleanWhatsAppPhone(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.split("@")[0].replace(/[^\d+]/g, "");
}

function isLidJid(value: unknown) {
  return /@lid$/i.test(String(value ?? ""));
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const challenge = url.searchParams.get("hub.challenge") ?? url.searchParams.get("challenge");
        if (challenge) return new Response(challenge, { status: 200, headers: CORS });
        return json({ ok: true, service: "TraWe WhatsApp webhook" });
      },
      POST: async ({ request }) => {
        const raw = await request.text();
        const url = new URL(request.url);
        const tenantId =
          request.headers.get("x-tenant-id") ??
          url.searchParams.get("tenant") ??
          url.searchParams.get("tenant_id");
        const providedSecret =
          request.headers.get("x-webhook-secret") ??
          url.searchParams.get("secret") ??
          "";
        if (!tenantId) return json({ error: "Missing tenant_id (add ?tenant=<uuid> or X-Tenant-Id header)" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: tenant } = await supabaseAdmin
          .from("tenants")
          .select("id, whatsapp_provider_config")
          .eq("id", tenantId)
          .maybeSingle();
        if (!tenant) return json({ error: "Unknown tenant" }, 404);

        const cfg = ((tenant as any).whatsapp_provider_config ?? {}) as Record<string, string>;
        const expected = cfg.webhook_secret ?? "";

        // Constant-time comparison
        const ok = (() => {
          if (!expected) return false;
          if (providedSecret.length !== expected.length) return false;
          let mismatch = 0;
          for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ providedSecret.charCodeAt(i);
          return mismatch === 0;
        })();

        if (!ok) {
          await supabaseAdmin.from("whatsapp_webhook_logs").insert({
            tenant_id: tenantId,
            kind: "error",
            status: "unauthorized",
            message: "Invalid or missing webhook secret",
          });
          return json({ error: "Unauthorized" }, 401);
        }

        // Honor the manual on/off switch — accept the webhook but skip processing.
        if ((cfg as any).enabled === false) {
          await supabaseAdmin.from("whatsapp_webhook_logs").insert({
            tenant_id: tenantId,
            kind: "webhook_hit",
            status: "paused",
            message: "WhatsApp is paused in Settings; incoming message ignored.",
          });
          return json({ ok: true, paused: true });
        }

        let payload: unknown = raw;
        try { payload = JSON.parse(raw); } catch { /* keep raw */ }

        const hasMessage = (() => {
          try {
            const p: any = payload;
            return Boolean(p?.message || p?.messages || p?.data?.message || p?.event);
          } catch { return false; }
        })();

        await supabaseAdmin.from("whatsapp_webhook_logs").insert({
          tenant_id: tenantId,
          kind: "webhook_hit",
          status: hasMessage ? "received" : "empty",
          message: hasMessage ? "Webhook received." : "Webhook received but no message object found.",
          payload: (typeof payload === "object" && payload !== null ? payload : { raw: String(payload).slice(0, 2000) }) as any,
        });

        const pAny: any = payload;
        const eventName = String(pAny?.event ?? "");

        // Delivery / read receipts -> update the stored message status so the inbox shows ticks.
        try {
          const updates: Array<{ id: string; status: string }> = [];
          const rawUpdates =
            (Array.isArray(pAny?.data?.updates) ? pAny.data.updates : null) ??
            (Array.isArray(pAny?.statuses) ? pAny.statuses : null) ??
            (eventName === "messages.update" && pAny?.data ? [].concat(pAny.data) : []);
          const mapStatus = (v: any) => {
            const n = typeof v === "number" ? v : Number.NaN;
            const t = String(v ?? "").toLowerCase();
            if (n === 3 || t === "delivery_ack" || t === "delivered") return "delivered";
            if (n === 4 || n === 5 || t === "read" || t === "played") return "read";
            if (t === "error" || t === "failed") return "failed";
            if (n === 2 || t === "server_ack" || t === "sent") return "sent";
            return "";
          };
          for (const u of rawUpdates as any[]) {
            const id = u?.key?.id ?? u?.id ?? u?.messageId;
            const st = mapStatus(u?.update?.status ?? u?.status);
            if (id && st) updates.push({ id: String(id), status: st });
          }
          for (const u of updates) {
            await supabaseAdmin
              .from("whatsapp_messages")
              .update({ status: u.status })
              .eq("tenant_id", tenantId)
              .eq("provider_message_id", u.id);
          }
        } catch { /* best-effort */ }

        // Connection heartbeats from the TraWe gateway keep the session card honest.
        try {
          if (eventName === "connection.update") {
            const d: any = pAny?.data ?? {};
            const patch: Record<string, any> = { last_seen_at: new Date().toISOString() };
            if (d.status) patch['status'] = String(d.status);
            if (d.phone) patch['phone'] = String(d.phone);
            if (d.error !== undefined) patch['last_error'] = d.error ? String(d.error).slice(0, 300) : null;
            await (supabaseAdmin as any).from("whatsapp_sessions").update(patch).eq("tenant_id", tenantId);
          }
        } catch { /* best-effort */ }

        // Extract and persist inbound WhatsApp messages so the inbox can render conversations.
        try {
          const p: any = payload;
          const extracted: Array<{ peer: string; body: string; id?: string; direction: "in" | "out" }> = [];
          const push = (from: any, body: any, id: any, direction: "in" | "out") => {
            const f = cleanWhatsAppPhone(from);
            const b = typeof body === "string" ? body : (body?.text ?? body?.body ?? "");
            if (f && b) extracted.push({ peer: f, body: String(b), id: id ? String(id) : undefined, direction });
          };
          // WasenderAPI shape: { event, data: { messages: { key:{remoteJid}, message:{ conversation | extendedTextMessage:{text} } } } }
          // For send events WasenderAPI wraps the sent message in data.result (no data.messages).
          const msgs =
            p?.data?.messages ??
            p?.messages ??
            p?.message ??
            (p?.data?.result ? [p.data.result] : null);
          const list = Array.isArray(msgs) ? msgs : msgs ? [msgs] : [];
          for (const m of list) {
            // WasenderAPI/Baileys: on newer accounts remoteJid is a LID (e.g. "2136...@lid")
            // which is NOT the phone number. The real phone is in key.senderPn / cleanedSenderPn.
            // Prefer those; only fall back to remoteJid when it's a normal @s.whatsapp.net JID.
            const rawRemote: string = m?.key?.remoteJid ?? m?.remoteJid ?? "";
            const remoteIsLid = isLidJid(rawRemote);
            const phoneCandidate =
              cleanWhatsAppPhone(m?.key?.cleanedSenderPn) ||
              cleanWhatsAppPhone(m?.key?.senderPn) ||
              cleanWhatsAppPhone(m?.cleanedSenderPn) ||
              cleanWhatsAppPhone(m?.senderPn) ||
              cleanWhatsAppPhone(p?.data?.messages?.key?.cleanedSenderPn) ||
              cleanWhatsAppPhone(p?.data?.messages?.key?.senderPn) ||
              cleanWhatsAppPhone(p?.data?.senderPn) ||
              cleanWhatsAppPhone(p?.senderPn);
            const from =
              phoneCandidate ||
              (!remoteIsLid && rawRemote ? rawRemote.split("@")[0] : undefined) ||
              (m?.from ?? m?.author ?? m?.sender ?? m?.chatId ?? "");
            const body =
              m?.message?.conversation ??
              m?.message?.extendedTextMessage?.text ??
              m?.text?.body ?? m?.text ?? m?.body ?? "";
            const id = m?.key?.id ?? m?.id ?? m?.messageId;
            const fromMe = m?.key?.fromMe === true || m?.fromMe === true;
            push(from, body, id, fromMe ? "out" : "in");
          }
          if (extracted.length) {
            // Duplicate-event protection: the same provider id can arrive twice on retries.
            const ids = extracted.map((e) => e.id).filter(Boolean) as string[];
            if (ids.length) {
              const { data: seen } = await supabaseAdmin
                .from("whatsapp_messages")
                .select("provider_message_id")
                .eq("tenant_id", tenantId)
                .in("provider_message_id", ids);
              const known = new Set((seen ?? []).map((r: any) => r.provider_message_id));
              for (let i = extracted.length - 1; i >= 0; i--) {
                if (extracted[i].id && known.has(extracted[i].id)) extracted.splice(i, 1);
              }
            }
          }
          if (extracted.length) {
            await supabaseAdmin.from("whatsapp_messages").insert(
              extracted.map((e) => ({
                tenant_id: tenantId,
                peer_phone: e.peer,
                direction: e.direction,
                body: e.body,
                provider_message_id: e.id ?? null,
                status: e.direction === "in" ? "received" : "sent",
              })),
            );
          }
        } catch { /* best-effort; already logged */ }

        return json({ ok: true });
      },
    },
  },
});