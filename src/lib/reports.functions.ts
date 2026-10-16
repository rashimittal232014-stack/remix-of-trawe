import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

type Range = { from?: string; to?: string };

function applyRange(q: any, col: string, r: Range) {
  if (r.from) q = q.gte(col, r.from);
  if (r.to) q = q.lte(col, r.to);
  return q;
}

export const getReportsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Range | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const tenantId = await ensureTenantId(context);
    await (await import("./plan.server")).assertFeature(tenantId, "reports_advanced");
    const sb = context.supabase;
    const [leads, quotes, invs, pays, books] = await Promise.all([
      applyRange(sb.from("leads").select("id,status,budget,created_at,source,destination,owner_id"), "created_at", data),
      applyRange(sb.from("quotations").select("id,status,total,created_at"), "created_at", data),
      applyRange(sb.from("invoices").select("id,status,total,amount_paid,invoice_date,due_date,customer_id"), "invoice_date", data),
      applyRange(sb.from("payments").select("id,amount,paid_at,mode,customer_id,invoice_id"), "paid_at", data),
      applyRange(sb.from("bookings").select("id,status,gross_value,net_cost,travel_from,destination,owner_id"), "travel_from", data),
    ]);
    return {
      leads: leads.data ?? [],
      quotations: quotes.data ?? [],
      invoices: invs.data ?? [],
      payments: pays.data ?? [],
      bookings: books.data ?? [],
    };
  });

export const listActivitiesRange = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from?: string; to?: string; type?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from("activities")
      .select("*, leads(full_name)")
      .order("due_at", { ascending: true });
    if (data.from) q = q.gte("due_at", data.from);
    if (data.to) q = q.lte("due_at", data.to);
    if (data.type) q = q.eq("type", data.type as any);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const upsertActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; lead_id?: string | null; type: string; title: string;
    description?: string; due_at?: string | null; status?: string; color?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tenant_id").eq("id", context.userId).maybeSingle();
    if (!profile?.tenant_id) throw new Error("No tenant");
    const row: any = {
      tenant_id: profile.tenant_id,
      owner_id: context.userId,
      lead_id: data.lead_id ?? null,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      due_at: data.due_at ?? null,
      status: (data.status ?? "pending") as any,
      color: data.color ?? null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("activities").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("activities").insert(row).select().single();
    if (error) throw error; return out;
  });

export const toggleActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; done: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("activities").update({
      status: (data.done ? "completed" : "pending") as any,
      completed_at: data.done ? new Date().toISOString() : null,
    }).eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const listPaymentsHub = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope?: "client" | "supplier"; status?: string; from?: string; to?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const scope = data.scope ?? "client";
    if (scope === "client") {
      let inv = context.supabase
        .from("invoices")
        .select("id,code,total,amount_paid,status,invoice_date,due_date,owner_id,lead_id,customer_id,customers(full_name,company,phone,email),leads(code,full_name)")
        .order("invoice_date", { ascending: false });
      if (data.from) inv = inv.gte("invoice_date", data.from);
      if (data.to) inv = inv.lte("invoice_date", data.to);
      if (data.status) inv = inv.eq("status", data.status);
      const { data: rows, error } = await inv;
      if (error) throw error;
      // enrich with owner display_name
      const ownerIds = Array.from(new Set((rows ?? []).map((r: any) => r.owner_id).filter(Boolean)));
      let owners: Record<string, string> = {};
      if (ownerIds.length) {
        const { data: profs } = await context.supabase.from("profiles").select("id,display_name,email").in("id", ownerIds);
        owners = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.display_name || p.email || "—"]));
      }
      const enriched = (rows ?? []).map((r: any) => ({ ...r, owner_name: r.owner_id ? owners[r.owner_id] ?? "—" : "—" }));
      return { scope, rows: enriched, owners: Object.entries(owners).map(([id, name]) => ({ id, name })) };
    }
    let pays = context.supabase.from("payments").select("id,amount,paid_at,mode,reference,notes,invoices(code,customers(full_name))").order("paid_at", { ascending: false });
    if (data.from) pays = pays.gte("paid_at", data.from);
    if (data.to) pays = pays.lte("paid_at", data.to);
    const { data: rows, error } = await pays;
    if (error) throw error;
    return { scope, rows: rows ?? [], owners: [] };
  });

export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoice_id: string; amount: number; mode?: string; reference?: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tenant_id").eq("id", context.userId).maybeSingle();
    if (!profile?.tenant_id) throw new Error("No tenant");
    const { data: inv } = await context.supabase.from("invoices").select("customer_id,total,amount_paid").eq("id", data.invoice_id).maybeSingle();
    if (!inv) throw new Error("Invoice not found");
    const { error: pe } = await context.supabase.from("payments").insert({
      tenant_id: profile.tenant_id,
      invoice_id: data.invoice_id,
      customer_id: inv.customer_id,
      amount: data.amount,
      paid_at: new Date().toISOString(),
      mode: data.mode ?? "bank",
      reference: data.reference ?? null,
    });
    if (pe) throw pe;
    const newPaid = Number(inv.amount_paid ?? 0) + Number(data.amount);
    const status = newPaid >= Number(inv.total ?? 0) ? "paid" : "partial";
    await context.supabase.from("invoices").update({ amount_paid: newPaid, status }).eq("id", data.invoice_id);
    return { ok: true };
  });

export const deletePaymentRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });