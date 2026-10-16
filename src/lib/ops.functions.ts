import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { ensureTenantId } from "./tenant.server";
async function tenantId(ctx: any): Promise<string> { return ensureTenantId(ctx); }

/* ============ VOUCHERS ============ */
export const listVouchers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { type?: string; status?: string; search?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("vouchers")
      .select("*, bookings(code), customers(full_name)")
      .order("created_at", { ascending: false });
    if (data.type) q = q.eq("type", data.type);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) q = q.or(`title.ilike.%${data.search}%,code.ilike.%${data.search}%,reference_no.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const upsertVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, owner_id: context.userId,
      booking_id: data.booking_id ?? null,
      customer_id: data.customer_id ?? null,
      code: data.code ?? `VCH-${Date.now().toString(36).toUpperCase()}`,
      type: data.type, title: data.title,
      status: data.status ?? "draft",
      supplier_name: data.supplier_name ?? null,
      reference_no: data.reference_no ?? null,
      travel_date: data.travel_date ?? null,
      travel_end_date: data.travel_end_date ?? null,
      pax_count: data.pax_count ?? 0,
      location: data.location ?? null,
      details: data.details ?? {},
      notes: data.notes ?? null,
      amount: data.amount ?? 0,
      currency: data.currency ?? "INR",
      issued_at: data.status === "issued" ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("vouchers").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("vouchers").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("vouchers").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

/* ============ TOUR PACKAGES ============ */
export const listPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("tour_packages")
      .select("*").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

export const upsertPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const slug = data.slug || String(data.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const row: any = {
      tenant_id: tid, owner_id: context.userId,
      slug, title: data.title,
      destination: data.destination ?? null,
      duration_days: data.duration_days ?? 1,
      duration_nights: data.duration_nights ?? 0,
      category: data.category ?? null,
      type: data.type ?? "customizable",
      summary: data.summary ?? null,
      highlights: data.highlights ?? [],
      inclusions: data.inclusions ?? [],
      exclusions: data.exclusions ?? [],
      itinerary: data.itinerary ?? [],
      gallery: data.gallery ?? [],
      cover_image: data.cover_image ?? null,
      pricing_tiers: data.pricing_tiers ?? [],
      base_price: data.base_price ?? 0,
      currency: data.currency ?? "INR",
      departures: data.departures ?? [],
      is_published: data.is_published ?? false,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("tour_packages").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("tour_packages").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deletePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tour_packages").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

/* ============ TASKS ============ */
export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; priority?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false });
    if (data.status) q = q.eq("status", data.status);
    if (data.priority) q = q.eq("priority", data.priority);
    const { data: rows, error } = await q;
    if (error) throw error; return rows ?? [];
  });

export const upsertTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, created_by: context.userId, owner_id: context.userId,
      assigned_to: data.assigned_to ?? context.userId,
      title: data.title, description: data.description ?? null,
      priority: data.priority ?? "medium",
      status: data.status ?? "open",
      due_at: data.due_at ?? null,
      completed_at: data.status === "completed" ? new Date().toISOString() : null,
      related_type: data.related_type ?? null,
      related_id: data.related_id ?? null,
      checklist: data.checklist ?? [],
      watchers: data.watchers ?? [],
      labels: data.labels ?? [],
      recurrence: data.recurrence ?? null,
      reminder_at: data.reminder_at ?? null,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("tasks").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("tasks").insert(row).select().single();
    if (error) throw error; return out;
  });

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; done: boolean }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tasks").update({
      status: data.done ? "completed" : "open",
      completed_at: data.done ? new Date().toISOString() : null,
    }).eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

/* ============ WALLET & CREDIT NOTES ============ */
export const listWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let eq = context.supabase.from("wallet_entries")
      .select("*, customers(full_name)").order("entry_date", { ascending: false }).limit(200);
    if (data.customer_id) eq = eq.eq("customer_id", data.customer_id);
    let nq = context.supabase.from("credit_notes")
      .select("*, customers(full_name), invoices(code)").order("issue_date", { ascending: false });
    if (data.customer_id) nq = nq.eq("customer_id", data.customer_id);
    const [entriesRes, notesRes, customersRes] = await Promise.all([
      eq, nq,
      context.supabase.from("customers").select("id, full_name").order("full_name"),
    ]);
    const entries = entriesRes.data ?? [];
    const balances = new Map<string, { name: string; balance: number }>();
    for (const e of entries as any[]) {
      const cid = e.customer_id;
      const cur = balances.get(cid) ?? { name: e.customers?.full_name ?? "—", balance: 0 };
      cur.balance += e.entry_type === "credit" ? Number(e.amount) : -Number(e.amount);
      balances.set(cid, cur);
    }
    return {
      entries,
      creditNotes: notesRes.data ?? [],
      customers: customersRes.data ?? [],
      balances: Array.from(balances.entries()).map(([id, v]) => ({ customer_id: id, ...v })),
    };
  });

export const addWalletEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: out, error } = await context.supabase.from("wallet_entries").insert({
      tenant_id: tid, owner_id: context.userId,
      customer_id: data.customer_id,
      entry_type: data.entry_type,
      source: data.source ?? "manual",
      amount: data.amount, currency: data.currency ?? "INR",
      notes: data.notes ?? null,
      entry_date: data.entry_date ?? new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) throw error; return out;
  });

export const upsertCreditNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = {
      tenant_id: tid, owner_id: context.userId,
      customer_id: data.customer_id,
      invoice_id: data.invoice_id ?? null,
      code: data.code ?? `CN-${Date.now().toString(36).toUpperCase()}`,
      reason: data.reason ?? null,
      amount: data.amount ?? 0,
      tax_amount: data.tax_amount ?? 0,
      total: data.total ?? (Number(data.amount ?? 0) + Number(data.tax_amount ?? 0)),
      currency: data.currency ?? "INR",
      status: data.status ?? "issued",
      issue_date: data.issue_date ?? new Date().toISOString().slice(0, 10),
      applied_to_wallet: data.applied_to_wallet ?? false,
      notes: data.notes ?? null,
    };
    let saved: any;
    if (data.id) {
      const { data: out, error } = await context.supabase.from("credit_notes").update(row).eq("id", data.id).select().single();
      if (error) throw error; saved = out;
    } else {
      const { data: out, error } = await context.supabase.from("credit_notes").insert(row).select().single();
      if (error) throw error; saved = out;
    }
    if (row.applied_to_wallet && saved && !data.id) {
      await context.supabase.from("wallet_entries").insert({
        tenant_id: tid, owner_id: context.userId,
        customer_id: saved.customer_id,
        entry_type: "credit", source: "credit_note",
        amount: saved.total, currency: saved.currency,
        reference_type: "credit_note", reference_id: saved.id,
        notes: `Credit note ${saved.code}`,
      });
    }
    return saved;
  });

export const deleteCreditNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("credit_notes").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });
