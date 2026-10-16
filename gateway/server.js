/**
 * TraWe WhatsApp Gateway
 * ----------------------
 * One isolated, encrypted WhatsApp Web session per TraWe workspace (tenant).
 *
 * Endpoints (all require `Authorization: Bearer <TRAWE_WA_GATEWAY_TOKEN>`):
 *   POST   /sessions/:tenantId/start   { webhookUrl, webhookSecret, label }
 *   GET    /sessions/:tenantId
 *   POST   /sessions/:tenantId/send    { to, message, humanize }
 *   POST   /sessions/:tenantId/logout
 *   DELETE /sessions/:tenantId
 *   GET    /health
 *
 * Behaviour that keeps a real number healthy:
 *   - one session per tenant, never shared, session files stored per tenant
 *   - presence "available", read receipts, typing indicator before each send
 *   - randomised typing delay proportional to message length
 *   - serial outbound queue per session with randomised gaps
 *   - reconnect with exponential backoff; session restored from disk on restart
 *
 * Honest limitation: this is an unofficial WhatsApp Web connection. It reduces
 * spam-like patterns, but nothing can guarantee a number is never restricted.
 */

import express from "express";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";
import QRCode from "qrcode";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { useEncryptedAuthState, credsFileExists } from "./auth-state.js";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.TRAWE_WA_GATEWAY_TOKEN || "";
const DATA_DIR = process.env.TRAWE_WA_DATA_DIR || "./sessions";
// Session files on disk are encrypted with this key (falls back to the token).
const ENC_KEY = process.env.TRAWE_WA_ENC_KEY || process.env.TRAWE_WA_GATEWAY_TOKEN || "";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

if (!TOKEN) {
  logger.error("TRAWE_WA_GATEWAY_TOKEN is required");
  process.exit(1);
}
mkdirSync(DATA_DIR, { recursive: true });

/** @type {Map<string, any>} */
const sessions = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => min + Math.floor(Math.random() * (max - min));

function jidFor(number) {
  const digits = String(number).replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}

function getState(tenantId) {
  const s = sessions.get(tenantId);
  if (!s) return { status: "disconnected", qr: null, phone: null, lastSeenAt: null, error: null };
  return {
    status: s.status,
    qr: s.qrDataUrl ?? null,
    phone: s.phone ?? null,
    deviceLabel: s.label ?? null,
    lastSeenAt: s.lastSeenAt ?? null,
    error: s.error ?? null,
    queueDepth: s.pending ?? 0,
    sent: s.sent ?? 0,
    failed: s.failed ?? 0,
    disconnects: (s.disconnects ?? []).slice(-10),
  };
}

async function postWebhook(session, body) {
  if (!session.webhookUrl) return;
  try {
    await fetch(session.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": session.webhookSecret ?? "" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    logger.warn({ err: String(e) }, "webhook delivery failed");
  }
}

async function startSession(tenantId, { webhookUrl, webhookSecret, label }) {
  let session = sessions.get(tenantId);
  if (session?.sock && session.status === "connected") {
    session.webhookUrl = webhookUrl ?? session.webhookUrl;
    session.webhookSecret = webhookSecret ?? session.webhookSecret;
    return getState(tenantId);
  }

  const folder = join(DATA_DIR, tenantId);
  mkdirSync(folder, { recursive: true });
  const { state, saveCreds } = await useEncryptedAuthState(folder, ENC_KEY);
  const { version } = await fetchLatestBaileysVersion();

  session = session ?? { queue: Promise.resolve(), retries: 0, pending: 0, sent: 0, failed: 0, disconnects: [], startedAt: new Date().toISOString() };
  session.webhookUrl = webhookUrl ?? session.webhookUrl;
  session.webhookSecret = webhookSecret ?? session.webhookSecret;
  session.label = label ?? session.label ?? "TraWe";
  session.status = "connecting";
  session.error = null;
  sessions.set(tenantId, session);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    browser: ["TraWe", "Chrome", "121.0.0"],
  });
  session.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      session.status = "qr_pending";
      session.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 380 });
    }
    if (connection === "open") {
      session.status = "connected";
      session.qrDataUrl = null;
      session.retries = 0;
      session.phone = sock.user?.id ? `+${String(sock.user.id).split(":")[0]}` : null;
      session.lastSeenAt = new Date().toISOString();
      try { await sock.sendPresenceUpdate("available"); } catch { /* ignore */ }
      logger.info({ tenantId, phone: session.phone }, "session connected");
      await postWebhook(session, { event: "connection.update", data: { status: "connected", phone: session.phone, error: null } });
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        session.status = "logged_out";
        session.qrDataUrl = null;
        session.phone = null;
        logger.warn({ tenantId }, "session logged out on the phone");
        await postWebhook(session, { event: "connection.update", data: { status: "logged_out", phone: null, error: "Logged out on the phone" } });
        return;
      }
      session.status = "connecting";
      session.error = lastDisconnect?.error?.message ?? "Connection dropped";
      (session.disconnects ??= []).push({ at: new Date().toISOString(), code: code ?? null, reason: session.error });
      if (session.disconnects.length > 50) session.disconnects.shift();
      session.retries = Math.min((session.retries ?? 0) + 1, 8);
      const wait = Math.min(60_000, 2000 * 2 ** session.retries) + rand(0, 2000);
      logger.warn({ tenantId, wait }, "reconnecting");
      await postWebhook(session, { event: "connection.update", data: { status: "connecting", error: session.error } });
      setTimeout(() => {
        startSession(tenantId, { webhookUrl: session.webhookUrl, webhookSecret: session.webhookSecret, label: session.label })
          .catch((e) => logger.error({ err: String(e) }, "reconnect failed"));
      }, wait);
    }
  });

  // Delivery and read receipts keep the inbox ticks in sync.
  sock.ev.on("messages.update", async (updates) => {
    const list = (updates ?? []).filter((u) => u?.update?.status !== undefined);
    if (!list.length) return;
    await postWebhook(session, { event: "messages.update", data: { updates: list } });
  });

  // Forward incoming messages to TraWe using the shape the CRM webhook already understands.
  sock.ev.on("messages.upsert", async (up) => {
    if (up.type !== "notify") return;
    session.lastSeenAt = new Date().toISOString();
    for (const m of up.messages ?? []) {
      if (!m?.message) continue;
      await postWebhook(session, { event: "messages.upsert", data: { messages: m } });
      // Behave like a human client: mark chats as read shortly after arrival.
      try {
        await sleep(rand(700, 2500));
        await sock.readMessages([m.key]);
      } catch { /* ignore */ }
    }
  });

  return getState(tenantId);
}

/** Serial per-session queue: one message at a time, with human-like typing. */
function enqueueSend(session, tenantId, { to, message, humanize = true }) {
  session.pending = (session.pending ?? 0) + 1;
  const task = session.queue.then(async () => {
    const sock = session.sock;
    if (!sock || session.status !== "connected") throw new Error("WhatsApp is not connected for this workspace.");
    const jid = jidFor(to);
    if (humanize) {
      await sock.presenceSubscribe(jid).catch(() => {});
      await sleep(rand(400, 1200));
      await sock.sendPresenceUpdate("composing", jid).catch(() => {});
      const typing = Math.min(6000, 600 + String(message).length * rand(25, 55));
      await sleep(typing);
      await sock.sendPresenceUpdate("paused", jid).catch(() => {});
    }
    const sent = await sock.sendMessage(jid, { text: message });
    session.lastSeenAt = new Date().toISOString();
    // A pause after each send keeps the cadence away from bot-like bursts.
    await sleep(rand(1200, 4000));
    session.sent = (session.sent ?? 0) + 1;
    return sent?.key?.id ?? null;
  });
  task.catch(() => { session.failed = (session.failed ?? 0) + 1; });
  task.finally?.(() => { session.pending = Math.max(0, (session.pending ?? 1) - 1); });
  session.queue = task.catch(() => {});
  return task;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const header = req.headers.authorization ?? "";
  if (header !== `Bearer ${TOKEN}`) return res.status(401).json({ error: "Unauthorized" });
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    sessions: [...sessions.entries()].map(([tenantId, s]) => ({
      tenantId,
      status: s.status,
      phone: s.phone ?? null,
      lastSeenAt: s.lastSeenAt ?? null,
      queueDepth: s.pending ?? 0,
      sent: s.sent ?? 0,
      failed: s.failed ?? 0,
      disconnectCount: (s.disconnects ?? []).length,
    })),
  });
});

app.post("/sessions/:tenantId/start", async (req, res) => {
  try {
    const state = await startSession(req.params.tenantId, req.body ?? {});
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get("/sessions/:tenantId", async (req, res) => {
  const tenantId = req.params.tenantId;
  // Restore a persisted session automatically after a service restart.
  if (!sessions.has(tenantId) && credsFileExists(join(DATA_DIR, tenantId))) {
    startSession(tenantId, {}).catch(() => {});
  }
  res.json(getState(tenantId));
});

app.post("/sessions/:tenantId/send", async (req, res) => {
  const session = sessions.get(req.params.tenantId);
  const { to, message, humanize } = req.body ?? {};
  if (!to || !message) return res.status(400).json({ ok: false, error: "to and message are required" });
  if (!session) return res.status(409).json({ ok: false, error: "WhatsApp is not connected for this workspace." });
  try {
    const id = await enqueueSend(session, req.params.tenantId, { to, message, humanize });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message ?? e) });
  }
});

app.post("/sessions/:tenantId/logout", async (req, res) => {
  const session = sessions.get(req.params.tenantId);
  try { await session?.sock?.logout(); } catch { /* ignore */ }
  if (session) { session.status = "logged_out"; session.phone = null; session.qrDataUrl = null; }
  res.json({ ok: true });
});

app.delete("/sessions/:tenantId", async (req, res) => {
  const tenantId = req.params.tenantId;
  const session = sessions.get(tenantId);
  try { await session?.sock?.logout(); } catch { /* ignore */ }
  try { session?.sock?.end?.(); } catch { /* ignore */ }
  sessions.delete(tenantId);
  try { rmSync(join(DATA_DIR, tenantId), { recursive: true, force: true }); } catch { /* ignore */ }
  res.json({ ok: true });
});

/* --------------------------- reliability loop --------------------------- */

/** Bring every session that has credentials on disk back up after a restart. */
function restoreAllSessions() {
  let dirs = [];
  try { dirs = readdirSync(DATA_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); }
  catch { return; }
  for (const tenantId of dirs) {
    if (sessions.has(tenantId)) continue;
    if (!credsFileExists(join(DATA_DIR, tenantId))) continue;
    logger.info({ tenantId }, "restoring persisted session");
    startSession(tenantId, {}).catch((e) => logger.warn({ tenantId, err: String(e) }, "restore failed"));
  }
}

/**
 * Heartbeat: keeps connected sockets warm (presence ping) and revives sessions
 * that silently dropped without a close event.
 */
const HEARTBEAT_MS = Number(process.env.TRAWE_WA_HEARTBEAT_MS || 60_000);
const STALE_MS = Number(process.env.TRAWE_WA_STALE_MS || 10 * 60_000);

setInterval(() => {
  const now = Date.now();
  for (const [tenantId, s] of sessions.entries()) {
    if (s.status === "connected") {
      s.sock?.sendPresenceUpdate?.("available").catch(() => {});
      s.lastHeartbeatAt = new Date().toISOString();
      continue;
    }
    if (s.status === "error" || s.status === "disconnected") {
      const since = s.lastSeenAt ? now - new Date(s.lastSeenAt).getTime() : Infinity;
      if (since > STALE_MS && credsFileExists(join(DATA_DIR, tenantId))) {
        logger.info({ tenantId }, "heartbeat reviving stale session");
        startSession(tenantId, { webhookUrl: s.webhookUrl, webhookSecret: s.webhookSecret, label: s.label })
          .catch(() => {});
      }
    }
  }
}, HEARTBEAT_MS).unref?.();

app.listen(PORT, () => {
  logger.info(`TraWe WhatsApp gateway listening on :${PORT}`);
  restoreAllSessions();
});
