// Server-only helpers for the white-label platform console.
// Never import this from components or *.functions.ts module scope.

export async function assertSuperAdmin(ctx: any) {
  // Verified against ctx.userId (from the validated bearer token) using the
  // trusted server client, so is_super_admin needs no client-callable grant.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("is_super_admin", { _user_id: ctx.userId });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: super admin only");
  return true;
}

export function admin() {
  return import("@/integrations/supabase/client.server").then((m) => m.supabaseAdmin);
}

// ---------- Cloudflare for SaaS (custom hostnames) ----------
const CF_API = "https://api.cloudflare.com/client/v4";

export function cloudflareConfigured() {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}

async function cf(path: string, init?: RequestInit) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zone) throw new Error("Cloudflare is not configured yet");
  const res = await fetch(`${CF_API}/zones/${zone}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const msg = json?.errors?.[0]?.message ?? `Cloudflare error ${res.status}`;
    throw new Error(msg);
  }
  return json.result;
}

export type CfHostname = {
  id: string;
  status: string;
  ssl_status: string | null;
  txt_name: string | null;
  txt_value: string | null;
};

function normalizeCf(result: any): CfHostname {
  const ownership = result?.ownership_verification ?? {};
  return {
    id: result?.id,
    status: result?.status ?? "pending",
    ssl_status: result?.ssl?.status ?? null,
    txt_name: ownership?.name ?? result?.ssl?.validation_records?.[0]?.txt_name ?? null,
    txt_value: ownership?.value ?? result?.ssl?.validation_records?.[0]?.txt_value ?? null,
  };
}

export async function cfCreateHostname(hostname: string): Promise<CfHostname> {
  const result = await cf(`/custom_hostnames`, {
    method: "POST",
    body: JSON.stringify({
      hostname,
      ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } },
    }),
  });
  return normalizeCf(result);
}

export async function cfGetHostname(id: string): Promise<CfHostname> {
  return normalizeCf(await cf(`/custom_hostnames/${id}`));
}

export async function cfDeleteHostname(id: string) {
  await cf(`/custom_hostnames/${id}`, { method: "DELETE" });
}

// ---------- subscription helpers ----------
export function addCycle(from: Date, cycle: string): Date {
  const d = new Date(from.getTime());
  const months = cycle === "yearly" ? 12 : cycle === "half_yearly" ? 6 : cycle === "quarterly" ? 3 : 1;
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}