// Server-only helper: resolves the current user's tenant, auto-provisioning
// a tenant + profile row on first use so newly signed-up users don't hit
// "No tenant" errors from every server fn.
export async function ensureTenantId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (data?.tenant_id) return data.tenant_id as string;

  const email = ctx.claims?.email ?? null;
  const name =
    ctx.claims?.user_metadata?.full_name ??
    ctx.claims?.user_metadata?.name ??
    email ??
    "My Workspace";
  const slug = `t-${String(ctx.userId).slice(0, 8)}-${Date.now().toString(36)}`;
  const tenantId = crypto.randomUUID();

  // Bootstrap must use the trusted server client: the signed-in user's profile
  // does not point at the new tenant yet, so tenant RLS cannot return it during
  // the same insert. Ownership is derived only from the verified auth context.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Re-check with the trusted client: RLS may hide an existing profile row,
  // and concurrent server fns must not each mint a new workspace.
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (existing?.tenant_id) return existing.tenant_id as string;

  const { error: tErr } = await supabaseAdmin
    .from("tenants")
    .insert({ id: tenantId, name: `${name}'s Workspace`, slug });
  if (tErr) throw tErr;

  const { error: pErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { id: ctx.userId, tenant_id: tenantId, email, display_name: name },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (pErr) throw pErr;

  // If another request won the race, adopt its tenant and drop the spare.
  const { data: after } = await supabaseAdmin
    .from("profiles")
    .select("tenant_id")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (after?.tenant_id && after.tenant_id !== tenantId) {
    await supabaseAdmin.from("tenants").delete().eq("id", tenantId);
    return after.tenant_id as string;
  }

  return tenantId;
}