/**
 * TraWe WhatsApp — client for our own QR-based WhatsApp gateway service.
 *
 * The gateway is a small always-on Node service (source in /gateway) that keeps
 * one isolated, encrypted WhatsApp Web session per tenant. This module is the
 * only place the app talks to it; the browser never sees the gateway token or
 * any session material.
 */

export type GatewaySessionState = {
  status: "disconnected" | "qr_pending" | "connecting" | "connected" | "logged_out" | "error";
  qr?: string | null;
  phone?: string | null;
  deviceLabel?: string | null;
  lastSeenAt?: string | null;
  error?: string | null;
};

export function gatewayConfig() {
  const url = (process.env["TRAWE_WA_GATEWAY_URL"] ?? "").replace(/\/+$/, "");
  const token = process.env["TRAWE_WA_GATEWAY_TOKEN"] ?? "";
  return { url, token, configured: Boolean(url && token) };
}

export class GatewayNotConfiguredError extends Error {
  constructor() {
    super("TraWe WhatsApp is not connected to its service yet. Ask TraWe support to finish the setup.");
    this.name = "GatewayNotConfiguredError";
  }
}

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { url, token, configured } = gatewayConfig();
  if (!configured) throw new GatewayNotConfiguredError();
  const res = await fetch(`${url}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = { raw: text }; }
  if (!res.ok) {
    throw new Error(parsed?.error || `Gateway error ${res.status}: ${String(text).slice(0, 180)}`);
  }
  return parsed as T;
}

export function startSession(tenantId: string, opts: { webhookUrl: string; webhookSecret: string; label?: string }) {
  return call<GatewaySessionState>(`/sessions/${tenantId}/start`, { method: "POST", body: opts });
}

export function getSession(tenantId: string) {
  return call<GatewaySessionState>(`/sessions/${tenantId}`);
}

export function logoutSession(tenantId: string) {
  return call<{ ok: true }>(`/sessions/${tenantId}/logout`, { method: "POST" });
}

export function removeSession(tenantId: string) {
  return call<{ ok: true }>(`/sessions/${tenantId}`, { method: "DELETE" });
}

export function sendViaGateway(tenantId: string, payload: { to: string; message: string; humanize?: boolean }) {
  return call<{ ok: boolean; id?: string; error?: string }>(`/sessions/${tenantId}/send`, {
    method: "POST",
    body: { humanize: true, ...payload },
  });
}
