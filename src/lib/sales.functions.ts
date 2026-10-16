import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { ensureTenantId } from "./tenant.server";
async function tenantId(ctx: any): Promise<string> { return ensureTenantId(ctx); }

// ============ CUSTOMERS ============
export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (data.search) q = q.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%,phone.ilike.%${data.search}%,code.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    const list = rows ?? [];
    const ownerIds = Array.from(new Set(list.map((r: any) => r.owner_id).filter(Boolean)));
    let owners: Record<string, any> = {};
    if (ownerIds.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url")
        .in("id", ownerIds);
      owners = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    return list.map((r: any) => ({ ...r, owner: owners[r.owner_id] ?? null }));
  });

const customerSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().min(1).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
  owner_id: z.string().uuid().optional().nullable(),
});
export const upsertCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof customerSchema>) => customerSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const full_name =
      (data.full_name && data.full_name.trim()) ||
      [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
      data.title ||
      data.email ||
      "Unnamed";
    const row: any = {
      ...data,
      full_name,
      email: data.email || null,
      dob: data.dob || null,
      tenant_id: tid,
      owner_id: data.owner_id ?? context.userId,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("customers").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("customers").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ QUOTATIONS ============
export const listQuotations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string } | undefined) => d ?? {})
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    // Union: legacy quotations + itineraries (the modern "quotation" surface).
    let q = context.supabase
      .from("quotations")
      .select("*, customers(full_name), leads(id, full_name, code), quotation_items(*)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false });
    if (data.search) q = q.or(`title.ilike.%${data.search}%,code.ilike.%${data.search}%`);
    const { data: quoteRows, error } = await q;
    if (error) throw error;

    const { data: itinRows, error: iErr } = await context.supabase
      .from("itineraries")
      .select("id, code, title, status, currency, valid_till:end_date, created_at, lead_id, customer_id, markup_value, cgst_rate, sgst_rate, tax_rate, tcs_rate, customers(full_name), leads(id, full_name, code), itinerary_services(cost, qty, markup)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false });
    if (iErr) throw iErr;

    const itinAsQuotes = (itinRows ?? []).map((it: any) => {
      const svcSubtotal = (it.itinerary_services ?? []).reduce(
        (s: number, r: any) => s + Number(r.cost ?? 0) * Number(r.qty ?? 1) + Number(r.markup ?? 0),
        0,
      );
      const sell = svcSubtotal + Number(it.markup_value ?? 0);
      const gstRate = Number(it.cgst_rate ?? 0) + Number(it.sgst_rate ?? 0) || Number(it.tax_rate ?? 0);
      const total = sell + sell * (gstRate / 100) + sell * (Number(it.tcs_rate ?? 0) / 100);
      return {
        id: it.id,
        code: it.code ?? "ITN-" + String(it.id).slice(0, 6),
        title: it.title,
        status: it.status,
        currency: it.currency,
        valid_till: it.valid_till,
        created_at: it.created_at,
        lead_id: it.lead_id,
        customer_id: it.customer_id,
        customers: it.customers,
        leads: it.leads,
        quotation_items: it.itinerary_services ?? [],
        total,
        source: "itinerary" as const,
      };
    });

    const legacy = (quoteRows ?? []).map((r: any) => ({ ...r, source: "quotation" as const }));

    let combined = [...legacy, ...itinAsQuotes];
    if (data.search) {
      const s = data.search.toLowerCase();
      combined = combined.filter((r) => (r.title ?? "").toLowerCase().includes(s) || (r.code ?? "").toLowerCase().includes(s));
    }
    combined.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return combined;
  });

export const getQuotation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: q } = await context.supabase.from("quotations").select("*, customers(*), leads(*), quotation_items(*)").eq("id", data.id).maybeSingle();
    return q;
  });

const quoteSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  lead_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  status: z.string().default("draft"),
  currency: z.string().default("INR"),
  valid_till: z.string().optional().nullable(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  gst_mode: z.string().default("cgst_sgst"),
  items: z.array(z.object({
    description: z.string(),
    qty: z.number().default(1),
    rate: z.number().default(0),
    discount: z.number().default(0),
    tax_rate: z.number().default(5),
    service_type: z.string().optional(),
    supplier: z.string().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  })).default([]),
});

function computeItems(items: any[]) {
  return items.map((it, i) => {
    const taxable = Math.max(0, it.qty * it.rate - (it.discount ?? 0));
    const tax_amount = taxable * (it.tax_rate ?? 0) / 100;
    return {
      ...it,
      sort_order: i,
      taxable,
      tax_amount,
      amount: taxable + tax_amount,
      meta: it.meta ?? {},
    };
  });
}

export const saveQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof quoteSchema>) => quoteSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const items = computeItems(data.items);
    const subtotal = items.reduce((s, i) => s + i.taxable, 0);
    const tax_amount = items.reduce((s, i) => s + i.tax_amount, 0);
    const total = subtotal + tax_amount;
    const head = {
      title: data.title, lead_id: data.lead_id || null, customer_id: data.customer_id || null,
      status: data.status, currency: data.currency, valid_till: data.valid_till || null,
      terms: data.terms, notes: data.notes, gst_mode: data.gst_mode,
      subtotal, tax_amount, total,
      tenant_id: tid, owner_id: context.userId,
    };
    let quoteId = data.id;
    if (quoteId) {
      const { error } = await context.supabase.from("quotations").update(head).eq("id", quoteId);
      if (error) throw error;
      await context.supabase.from("quotation_items").delete().eq("quotation_id", quoteId);
    } else {
      const { data: out, error } = await context.supabase.from("quotations").insert(head).select().single();
      if (error) throw error;
      quoteId = out.id;
    }
    if (items.length) {
      const { error } = await context.supabase.from("quotation_items").insert(items.map(i => ({ ...i, quotation_id: quoteId })));
      if (error) throw error;
    }
    return { id: quoteId };
  });

export const deleteQuotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("quotations").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ ITINERARIES ============
export const listItineraries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantId(context);
    const { data, error } = await context.supabase
      .from("itineraries")
      .select("*, customers(full_name), leads(full_name), itinerary_services(id, title, service_type, description, supplier, price)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getItinerary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: it } = await context.supabase.from("itineraries").select("*, itinerary_days(*), itinerary_services(*), customers(*), leads(*)").eq("id", data.id).maybeSingle();
    if (it) {
      (it as any).itinerary_days?.sort((a: any, b: any) => a.day_no - b.day_no);
      (it as any).itinerary_services?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }
    return it;
  });

const itinSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  lead_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  destinations: z.array(z.string()).default([]),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  nights: z.number().optional().nullable(),
  adults: z.number().default(1),
  children: z.number().default(0),
  infants: z.number().default(0),
  currency: z.string().default("INR"),
  description: z.string().optional().nullable(),
  package_type: z.string().default("FIT"),
  hotel_category: z.string().default("3_star"),
  package_option: z.string().default("Basic"),
  meal_plan: z.string().optional().nullable(),
  travel_style: z.string().default("Relaxed"),
  interests: z.array(z.string()).default([]),
  gst_apply_on: z.string().default("total"),
  tcs_rate: z.number().default(0),
  per_adult: z.number().default(0),
  per_child: z.number().default(0),
  per_infant: z.number().default(0),
  terms_blocks: z.array(z.object({ title: z.string(), items: z.array(z.string()).default([]) })).optional(),
  inclusions: z.string().optional().nullable(),
  exclusions: z.string().optional().nullable(),
  payment_policy: z.string().optional().nullable(),
  cancellation_policy: z.string().optional().nullable(),
  important_notes: z.string().optional().nullable(),
  costing_type: z.string().default("service_wise"),
  basic_cost: z.number().default(0),
  markup_type: z.string().default("flat"),
  markup_value: z.number().default(0),
  tax_rate: z.number().default(5),
  cgst_rate: z.number().default(0),
  sgst_rate: z.number().default(0),
  git_costing: z.any().optional(),
  slots: z.array(z.any()).optional(),
});

export const upsertItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof itinSchema>) => itinSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row = {
      ...data,
      lead_id: data.lead_id || null, customer_id: data.customer_id || null,
      start_date: data.start_date || null, end_date: data.end_date || null,
      tenant_id: tid, owner_id: context.userId,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("itineraries").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("itineraries").insert(row).select().single();
    if (error) throw error; return out;
  });

export const addItineraryDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itinerary_id: string; day_no?: number; day_date?: string; location?: string; title?: string; description?: string; subtitle?: string; image_url?: string }) => d)
  .handler(async ({ context, data }) => {
    // Always compute day_no server-side from the current max to avoid
    // duplicate day numbers when the client fires multiple Add Day clicks
    // before the query cache refreshes.
    const { data: existing } = await context.supabase
      .from("itinerary_days")
      .select("day_no")
      .eq("itinerary_id", data.itinerary_id)
      .order("day_no", { ascending: false })
      .limit(1);
    const nextNo = ((existing?.[0]?.day_no as number | undefined) ?? 0) + 1;
    const title = data.title && data.title.trim() ? data.title : `Day ${nextNo}`;
    const { data: out, error } = await context.supabase.from("itinerary_days").insert({
      ...data, day_no: nextNo, title, day_date: data.day_date || null,
    }).select().single();
    if (error) throw error; return out;
  });

export const updateItineraryDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; title?: string; subtitle?: string; location?: string; description?: string; image_url?: string; day_date?: string | null }) => d)
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("itinerary_days").update(rest).eq("id", id);
    if (error) throw error; return { ok: true };
  });

export const deleteItineraryDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("itinerary_days").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// Clone an existing itinerary (template) into a lead / customer context.
export const cloneItineraryToLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { source_id: string; lead_id?: string | null; customer_id?: string | null; title?: string; slot_id?: string | null; source_template_id?: string | null }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: src, error: e1 } = await context.supabase
      .from("itineraries")
      .select("*, itinerary_days(*), itinerary_services(*)")
      .eq("id", data.source_id)
      .maybeSingle();
    if (e1) throw e1;
    if (!src) throw new Error("Source itinerary not found");

    const { id: _id, created_at: _c, updated_at: _u, portal_token: _p, itinerary_days, itinerary_services, code: _code, ...rest } = src as any;
    // Find the chosen slot (if any) so we can seed pricing from it.
    const slotList: any[] = Array.isArray((src as any).slots) ? (src as any).slots : [];
    const chosenSlot = data.slot_id
      ? slotList.find((s: any) => (s.start_date ?? "") === data.slot_id) ?? null
      : null;
    const seededGitCosting = chosenSlot?.rooms
      ? {
          rows: Object.fromEntries(
            ["single", "double", "triple", "quad", "cnb", "cwb", "extra_bed"].map((k) => [
              k, { rate: Number(chosenSlot.rooms?.[k] ?? 0), qty: 0 },
            ])
          ),
        }
      : (src as any).git_costing ?? null;
    const isTemplateClone = !data.lead_id && !data.customer_id;
    const head = {
      ...rest,
      tenant_id: tid,
      owner_id: context.userId,
      lead_id: data.lead_id ?? null,
      customer_id: data.customer_id ?? null,
      title: data.title || `${src.title} (copy)`,
      status: "draft",
      slots: isTemplateClone ? (Array.isArray(rest.slots) ? rest.slots : []) : [],
      source_template_id: isTemplateClone ? null : data.source_template_id ?? data.source_id,
      slot_id: isTemplateClone ? null : data.slot_id ?? null,
      start_date: chosenSlot?.start_date ?? (src as any).start_date ?? null,
      git_costing: seededGitCosting,
    };
    const { data: created, error: e2 } = await context.supabase.from("itineraries").insert(head).select().single();
    if (e2) throw e2;

    const dayIdMap: Record<string, string> = {};
    const days = (itinerary_days ?? []) as any[];
    if (days.length) {
      const rows = days.map(({ id, itinerary_id, created_at, ...d }) => ({ ...d, itinerary_id: created.id }));
      const { data: newDays, error: e3 } = await context.supabase.from("itinerary_days").insert(rows).select();
      if (e3) throw e3;
      // Map by day_no since inserted order isn't guaranteed
      const byNo: Record<number, string> = {};
      (newDays ?? []).forEach((d: any) => { byNo[d.day_no] = d.id; });
      days.forEach((d: any) => { dayIdMap[d.id] = byNo[d.day_no]; });
    }

    const services = (itinerary_services ?? []) as any[];
    if (services.length) {
      const rows = services.map(({ id, itinerary_id, created_at, day_id, ...s }) => ({
        ...s,
        itinerary_id: created.id,
        day_id: day_id ? dayIdMap[day_id] ?? null : null,
      }));
      const { error: e4 } = await context.supabase.from("itinerary_services").insert(rows);
      if (e4) throw e4;
    }
    return { id: created.id };
  });

// Live GIT inventory for a template. Counts confirmed vs open bookings per slot.
export const getGitInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { template_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("itineraries")
      .select("id, slot_id, lead_id, leads(id, code, full_name, adults, children, infants, stage_id, pipeline_stages(type, name))")
      .eq("source_template_id", data.template_id);
    if (error) throw error;
    const bySlot: Record<string, {
      confirmed_pax: number; tentative_pax: number;
      confirmed_bookings: number; tentative_bookings: number;
      bookings: Array<{ itinerary_id: string; lead_id: string | null; code: string | null; name: string; pax: number; status: string }>;
    }> = {};
    for (const r of (rows ?? []) as any[]) {
      const slotKey = r.slot_id ?? "__unassigned__";
      const lead = r.leads ?? {};
      const type = lead?.pipeline_stages?.type ?? "open";
      const pax = Number(lead.adults ?? 0) + Number(lead.children ?? 0) + Number(lead.infants ?? 0);
      if (!bySlot[slotKey]) bySlot[slotKey] = { confirmed_pax: 0, tentative_pax: 0, confirmed_bookings: 0, tentative_bookings: 0, bookings: [] };
      const bucket = bySlot[slotKey];
      if (type === "lost") continue;
      if (type === "won") { bucket.confirmed_pax += pax; bucket.confirmed_bookings += 1; }
      else { bucket.tentative_pax += pax; bucket.tentative_bookings += 1; }
      bucket.bookings.push({
        itinerary_id: r.id,
        lead_id: lead.id ?? null,
        code: lead.code ?? null,
        name: lead.full_name ?? "—",
        pax,
        status: type,
      });
    }
    return bySlot;
  });

// Re-sync a lead-scoped GIT itinerary's pricing matrix from its source template + slot.
export const resyncGitCosting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: it, error: e1 } = await context.supabase
      .from("itineraries")
      .select("id, source_template_id, slot_id, git_costing")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw e1;
    if (!it?.source_template_id || !it.slot_id) throw new Error("No source template/slot to sync from");
    const { data: tpl, error: e2 } = await context.supabase
      .from("itineraries").select("slots").eq("id", it.source_template_id).maybeSingle();
    if (e2) throw e2;
    const slot = ((tpl?.slots ?? []) as any[]).find((s) => (s.start_date ?? "") === it.slot_id);
    if (!slot) throw new Error("Slot no longer exists on template");
    const prev = (it.git_costing && typeof it.git_costing === "object") ? (it.git_costing as any) : {};
    const prevRows = prev.rows ?? {};
    const nextRows = Object.fromEntries(
      ["single", "double", "triple", "quad", "cnb", "cwb", "extra_bed"].map((k) => [
        k, { rate: Number(slot.rooms?.[k] ?? 0), qty: Number(prevRows?.[k]?.qty ?? 0) },
      ])
    );
    const { error: e3 } = await context.supabase
      .from("itineraries").update({ git_costing: { ...prev, rows: nextRows } }).eq("id", data.id);
    if (e3) throw e3;
    return { ok: true };
  });

export const addItineraryService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    itinerary_id: string; day_id?: string; service_type: string; title: string;
    supplier?: string; qty?: number; cost?: number; markup?: number;
    description?: string; image_url?: string; address?: string; meta?: any;
    checkin_time?: string; checkout_time?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const price = (data.cost ?? 0) * (data.qty ?? 1) + (data.markup ?? 0);
    const { data: out, error } = await context.supabase.from("itinerary_services").insert({ ...data, price }).select().single();
    if (error) throw error; return out;
  });

export const updateItineraryService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; title?: string; description?: string; supplier?: string; address?: string; image_url?: string; qty?: number; cost?: number; markup?: number; meta?: any }) => d)
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data as any;
    if (rest.qty != null || rest.cost != null || rest.markup != null) {
      const { data: cur } = await context.supabase.from("itinerary_services").select("qty,cost,markup").eq("id", id).maybeSingle();
      const qty = rest.qty ?? cur?.qty ?? 1;
      const cost = rest.cost ?? cur?.cost ?? 0;
      const markup = rest.markup ?? cur?.markup ?? 0;
      rest.price = qty * cost + markup;
    }
    const { error } = await context.supabase.from("itinerary_services").update(rest).eq("id", id);
    if (error) throw error; return { ok: true };
  });

// AI itinerary generator via Lovable AI Gateway (Gemini)
export const draftItineraryAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string; destinations: string[]; nights: number;
    adults: number; children: number; infants: number;
    meal_plan?: string; travel_style?: string; interests?: string[];
    include_services?: string[]; hotel_category?: string; package_option?: string;
    currency?: string; notes?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const planControl = await import("./plan.server");
    await planControl.assertFeature(tid, "ai_builder");
    await planControl.meter(tid, "ai_calls");
    const days = Math.max(1, data.nights + 1);
    let plan: any = null;
    const sys = "You draft travel itineraries. Reply ONLY as JSON: {days:[{day_no,title,subtitle,description,services:[{service_type,title,description,supplier,cost}]}], inclusions:string[], exclusions:string[], payment_policy:string[], cancellation_policy:string[], important_notes:string[]}.";
    const user = `Destination(s): ${data.destinations.join(", ")}\nDuration: ${data.nights} nights / ${days} days\nPax: ${data.adults}A ${data.children}C ${data.infants}I\nStyle: ${data.travel_style ?? "Relaxed"}\nMeal Plan: ${data.meal_plan ?? "EP"}\nInterests: ${(data.interests ?? []).join(", ") || "General"}\nInclude: ${(data.include_services ?? []).join(", ")}\nHotel: ${data.hotel_category ?? "3_star"} · ${data.package_option ?? "Basic"}\nCurrency: ${data.currency ?? "INR"}\nNotes: ${data.notes ?? ""}\nGenerate one day per day (${days} total) with 2-4 services each.`;
    try {
      const { data: tenantRow } = await context.supabase
        .from("tenants").select("gemini_api_key, ai_provider_config").eq("id", tid).maybeSingle();
      const tenantKey = (tenantRow as any)?.gemini_api_key ?? null;
      const providerCfg = (tenantRow as any)?.ai_provider_config ?? null;
      const { geminiJson } = await import("./ai-gemini.server");
      plan = await geminiJson([
        { role: "system", content: sys },
        { role: "user", content: user },
      ], { tenantKey, providerCfg });
    } catch { plan = null; }
    // Fallback skeleton if AI unavailable
    if (!plan) {
      plan = {
        days: Array.from({ length: days }, (_, i) => ({ day_no: i + 1, title: data.destinations[0] ?? "Destination", subtitle: i === 0 ? "Arrival" : i === days - 1 ? "Departure" : "Explore", description: "", services: [] })),
        inclusions: ["Accommodation as per selected package option.", "Meals as per plan.", "All transfers & sightseeing per itinerary."],
        exclusions: ["Airfare / train fare unless specified.", "Personal expenses.", "Anything not listed under inclusions."],
        payment_policy: ["50% advance to confirm booking.", "Balance before travel date."],
        cancellation_policy: ["As per supplier & hotel policies.", "No refund for no-show or unused services."],
        important_notes: ["Standard hotel check-in / check-out timings apply.", "Rates may change until booking confirmed."],
      };
    }
    // Create itinerary row
    const { data: itin, error: e1 } = await context.supabase.from("itineraries").insert({
      tenant_id: tid, owner_id: context.userId,
      title: data.title, destinations: data.destinations, nights: data.nights,
      adults: data.adults, children: data.children, infants: data.infants,
      currency: data.currency ?? "INR", meal_plan: data.meal_plan, travel_style: data.travel_style ?? "Relaxed",
      interests: data.interests ?? [], hotel_category: data.hotel_category ?? "3_star", package_option: data.package_option ?? "Basic",
      status: "draft",
      inclusions: plan.inclusions?.map((s: string) => `• ${s}`).join("\n") ?? "",
      exclusions: plan.exclusions?.map((s: string) => `• ${s}`).join("\n") ?? "",
      payment_policy: plan.payment_policy?.map((s: string) => `• ${s}`).join("\n") ?? "",
      cancellation_policy: plan.cancellation_policy?.map((s: string) => `• ${s}`).join("\n") ?? "",
      important_notes: plan.important_notes?.map((s: string) => `• ${s}`).join("\n") ?? "",
      terms_blocks: [
        { title: "Inclusions", items: plan.inclusions ?? [] },
        { title: "Exclusions", items: plan.exclusions ?? [] },
        { title: "Payment Policy", items: plan.payment_policy ?? [] },
        { title: "Cancellation Policy", items: plan.cancellation_policy ?? [] },
        { title: "Important Notes", items: plan.important_notes ?? [] },
      ],
    }).select().single();
    if (e1) throw e1;
    for (const d of plan.days ?? []) {
      const { data: dayRow } = await context.supabase.from("itinerary_days").insert({
        itinerary_id: itin.id, day_no: d.day_no, title: d.title, subtitle: d.subtitle, description: d.description, location: d.title,
      }).select().single();
      if (dayRow && Array.isArray(d.services)) {
        for (const s of d.services) {
          const cost = Number(s.cost ?? 0);
          await context.supabase.from("itinerary_services").insert({
            itinerary_id: itin.id, day_id: dayRow.id,
            service_type: s.service_type ?? "activity", title: s.title, description: s.description,
            supplier: s.supplier, qty: 1, cost, markup: 0, price: cost,
          });
        }
      }
    }
    return { id: itin.id };
  });

export const deleteItineraryService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("itinerary_services").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ AI ITINERARY BUILDER (conversational) ============
// Two-turn API:
//   aiItineraryChat  → returns the next assistant message (plain text).
//     When the assistant has enough info it emits a `<brief>{...}</brief>`
//     block plus the `<ready/>` sentinel. The client parses those out and
//     calls aiItineraryFinalize with the extracted brief.
//   aiItineraryFinalize → persists itineraries + days + services, links to
//     the lead, and returns `{ id }` for router navigation.

type AiChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function loadLeadContext(supabase: any, leadId: string) {
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  return lead;
}

async function loadTenantCatalog(supabase: any) {
  const [hotels, activities, meals, transfers] = await Promise.all([
    supabase.from("masters_items").select("name, location, meta").eq("kind", "hotel").limit(40),
    supabase.from("masters_items").select("name, location, meta").eq("kind", "sightseeing").limit(40),
    supabase.from("masters_items").select("name, meta").eq("kind", "meal_plan").limit(20),
    supabase.from("masters_items").select("name, location, meta").eq("kind", "transfer").limit(20),
  ]);
  const shape = (r: any) => (r.data ?? []).map((x: any) => ({
    name: x.name, location: x.location, cost: x?.meta?.cost ?? x?.meta?.price ?? null,
  }));
  return {
    hotels: shape(hotels),
    activities: shape(activities),
    meals: shape(meals),
    transfers: shape(transfers),
  };
}

function buildSystemPrompt(lead: any, catalog: any, existingCount: number): string {
  const c = { full_name: lead?.full_name, email: lead?.email, phone: lead?.phone };
  const nights = lead?.nights ?? "?";
  const days = typeof lead?.nights === "number" ? lead.nights + 1 : "?";
  const travel = lead?.travel_date ? new Date(lead.travel_date).toDateString() : "TBD";
  const ret = lead?.return_date ? new Date(lead.return_date).toDateString() : null;
  const dest = lead?.to_location ?? "TBD";
  const from = lead?.from_location ?? "TBD";
  const pax = `${lead?.adults ?? 1}A ${lead?.children ?? 0}C ${lead?.infants ?? 0}I`;
  const stripCat = (arr: any[]) => arr.slice(0, 20).map((x) => `${x.name}${x.location ? ` (${x.location})` : ""}`).join(", ");
  return `You are TraWe's expert Indian travel-agent AI. You are helping the agent build a tailor-made itinerary for their customer through a short chat.

CUSTOMER & TRIP CONTEXT (already known — do NOT ask about these again):
- Customer: ${c.full_name ?? "guest"} · ${c.phone ?? ""} ${c.email ? "· " + c.email : ""}
- Route: ${from} → ${dest}
- Dates: Depart ${travel}${ret ? `, Return ${ret}` : ""}
- Duration: ${nights} nights / ${days} days
- Pax: ${pax}
- Service Type: ${lead?.service_type ?? lead?.query_type ?? "Full Package"}
- Notes from agent: ${lead?.notes ?? "—"}
- Existing quotations on this lead: ${existingCount} (offer a variant if >0)

TENANT CATALOG (only propose from this list where possible; note supplier names):
- Hotels: ${stripCat(catalog.hotels) || "(none — invent tastefully)"}
- Activities/Sightseeing: ${stripCat(catalog.activities) || "(none)"}
- Meal plans: ${stripCat(catalog.meals) || "EP, CP, MAP, AP"}
- Transfers: ${stripCat(catalog.transfers) || "(none)"}

CONVERSATION RULES:
1. Be warm, concise: 1–3 sentences per turn, then ONE clear question.
2. Ask ONLY what's genuinely missing to build a great itinerary. Prioritise in this order:
   a. Trip style (Relaxed / Adventure / Honeymoon / Family / Luxury / Cultural)
   b. Hotel category (3★ / 4★ / 5★ / Mixed)
   c. Meal plan (EP breakfast-only … MAP … AP)
   d. Must-include activities (offer chips from the catalog)
   e. Must-include services (Flights, Transfers, Sightseeing, Visa, Insurance)
   f. Any special requests (elderly, kids age, dietary, budget cap in ₹)
3. After EVERY question, on a new line, output a chips hint in this exact format for the UI:
   \`CHIPS: [option 1 | option 2 | option 3 | ...]\`
   Skip CHIPS only for genuinely open-ended follow-ups.
4. Never ask more than 6 questions total. Merge related ones if the user answers concisely.
5. When you have enough to draft a solid itinerary, DO NOT ask more questions. Instead reply with:
   - a one-sentence confirmation summary,
   - then exactly this block (no code fences, no extra text after it):
     <brief>{"trip_style":"...","hotel_category":"3_star|4_star|5_star|mixed","meal_plan":"EP|CP|MAP|AP","interests":["..."],"include_services":["flight","transfer","sightseeing","visa","insurance"],"budget_cap_inr":0,"special_requests":"...","package_option":"Basic|Standard|Premium"}</brief>
     <ready/>
6. All prices in ₹ (INR). Use Indian phrasing (pickup, drop, sightseeing, hill station, etc.).
7. Never fabricate hotel/activity names outside the catalog if the catalog is non-empty for that destination.`;
}

export const aiItineraryChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lead_id: string; messages: AiChatMsg[] }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { assertFeature, meter } = await import("./plan.server");
    await assertFeature(tid, "ai_builder");
    await meter(tid, "ai_calls");
    const lead = await loadLeadContext(context.supabase, data.lead_id);
    if (!lead || lead.tenant_id !== tid) throw new Error("Lead not found");
    if (!lead.to_location || !String(lead.to_location).trim()) {
      throw new Error(
        "This query has no destination set. Please add a 'To' destination on the query before using the AI Itinerary Builder."
      );
    }
    const catalog = await loadTenantCatalog(context.supabase);
    const { count: existingCount } = await context.supabase
      .from("itineraries").select("id", { count: "exact", head: true }).eq("lead_id", data.lead_id);
    const system = buildSystemPrompt(lead, catalog, existingCount ?? 0);

    const { data: tenantRow } = await context.supabase
      .from("tenants").select("gemini_api_key, ai_provider_config").eq("id", tid).maybeSingle();
    const tenantKey = (tenantRow as any)?.gemini_api_key ?? null;
    const providerCfg = (tenantRow as any)?.ai_provider_config ?? null;

    const { geminiChat } = await import("./ai-gemini.server");
    const reply = await geminiChat(
      [{ role: "system", content: system }, ...data.messages],
      { tenantKey, providerCfg },
    );
    if (!reply) throw new Error("AI is unavailable right now. Please try again in a moment.");
    return { reply };
  });

type Brief = {
  trip_style?: string;
  hotel_category?: string;
  meal_plan?: string;
  interests?: string[];
  include_services?: string[];
  budget_cap_inr?: number;
  special_requests?: string;
  package_option?: string;
};

export const aiItineraryFinalize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lead_id: string; brief: Brief; title?: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { assertFeature, meter } = await import("./plan.server");
    await assertFeature(tid, "ai_builder");
    await meter(tid, "ai_calls");
    const lead = await loadLeadContext(context.supabase, data.lead_id);
    if (!lead || lead.tenant_id !== tid) throw new Error("Lead not found");
    const brief = data.brief ?? {};
    const destRaw =
      (typeof lead.to_location === "string" && lead.to_location.trim()) ||
      (Array.isArray(lead.destinations) && lead.destinations.length ? String(lead.destinations[0]) : "");
    if (!destRaw) {
      throw new Error(
        "This query has no destination set. Please add a 'To' destination on the query before using the AI Itinerary Builder."
      );
    }
    const dest = [destRaw];
    const nights = Number(lead.nights ?? 3);
    const days = Math.max(1, nights + 1);
    const adults = Number(lead.adults ?? 1);
    const children = Number(lead.children ?? 0);
    const infants = Number(lead.infants ?? 0);
    const currency = lead.currency ?? "INR";
    const title = data.title || `${lead.full_name ?? "Guest"} · ${dest.join(", ")} · ${nights}N/${days}D`;

    const catalog = await loadTenantCatalog(context.supabase);
    const { data: tenantRow } = await context.supabase
      .from("tenants").select("gemini_api_key, ai_provider_config").eq("id", tid).maybeSingle();
    const tenantKey = (tenantRow as any)?.gemini_api_key ?? null;
    const providerCfg = (tenantRow as any)?.ai_provider_config ?? null;

    const sys = `You are TraWe's itinerary generator for a trip to ${destRaw}. Reply ONLY with a single valid JSON object matching:
{days:[{day_no,title,subtitle,description,services:[{service_type,title,description,supplier,cost}]}], inclusions:string[], exclusions:string[], payment_policy:string[], cancellation_policy:string[], important_notes:string[]}

Rules:
- The trip destination is STRICTLY "${destRaw}". Every hotel, sightseeing, transfer, meal and activity MUST be located in or immediately around ${destRaw}. Do NOT substitute or invent a different destination (e.g. Goa, Agra) under any circumstance.
- service_type MUST be one of: hotel, transport, sightseeing, meal, flight, activity.
- Prefer supplier names from the provided catalog. cost is per-service in INR (approximate, agent will refine).
- 2–4 services per day. Day 1 = Arrival, last day = Departure.
- Descriptions concise (1–2 lines). Titles specific (e.g. "Stay at Snow Peaks Resort — 4★").`;

    const user = `Destination(s): ${dest.join(", ")}
From: ${lead.from_location ?? "—"}
Duration: ${nights} nights / ${days} days
Pax: ${adults}A ${children}C ${infants}I
Travel: ${lead.travel_date ?? "TBD"}${lead.return_date ? " → " + lead.return_date : ""}
Style: ${brief.trip_style ?? "Relaxed"}
Hotel category: ${brief.hotel_category ?? "3_star"}
Meal plan: ${brief.meal_plan ?? "CP"}
Package option: ${brief.package_option ?? "Standard"}
Interests: ${(brief.interests ?? []).join(", ") || "General sightseeing"}
Include services: ${(brief.include_services ?? []).join(", ") || "sightseeing, transfers"}
Budget cap (₹): ${brief.budget_cap_inr || "flexible"}
Special requests: ${brief.special_requests ?? "—"}
Agent notes: ${lead.notes ?? "—"}

Available Hotels: ${catalog.hotels.slice(0, 20).map((h: any) => h.name).join(", ") || "(agent's choice)"}
Available Activities: ${catalog.activities.slice(0, 20).map((a: any) => a.name).join(", ") || "(agent's choice)"}

Generate exactly ${days} day entries.`;

    const { geminiJson } = await import("./ai-gemini.server");
    let plan: any = await geminiJson(
      [{ role: "system", content: sys }, { role: "user", content: user }],
      { tenantKey, providerCfg },
    );
    const toArr = (v: any): string[] => Array.isArray(v)
      ? v.map((x) => String(x)).filter(Boolean)
      : typeof v === "string" && v.trim()
        ? v.split(/\r?\n|•|\|/).map((s) => s.trim()).filter(Boolean)
        : [];
    const bulletize = (v: any) => toArr(v).map((s) => `• ${s}`).join("\n");
    if (!plan || !Array.isArray(plan.days)) {
      plan = {
        days: Array.from({ length: days }, (_, i) => ({
          day_no: i + 1,
          title: dest[0] ?? "Destination",
          subtitle: i === 0 ? "Arrival" : i === days - 1 ? "Departure" : "Explore",
          description: "",
          services: [],
        })),
        inclusions: ["Accommodation as per selected package.", "Meals as per plan.", "All transfers & sightseeing per itinerary."],
        exclusions: ["Airfare / train fare unless specified.", "Personal expenses.", "Anything not listed under inclusions."],
        payment_policy: ["50% advance to confirm booking.", "Balance before travel date."],
        cancellation_policy: ["As per supplier & hotel policies.", "No refund for no-show or unused services."],
        important_notes: ["Standard hotel check-in / check-out timings apply.", "Rates may change until booking confirmed."],
      };
    }

    const { data: itin, error: e1 } = await context.supabase.from("itineraries").insert({
      tenant_id: tid, owner_id: context.userId,
      lead_id: data.lead_id,
      customer_id: lead?.customer_id ?? null,
      title,
      destinations: dest,
      nights, adults, children, infants,
      currency,
      meal_plan: brief.meal_plan ?? "CP",
      travel_style: brief.trip_style ?? "Relaxed",
      interests: brief.interests ?? [],
      hotel_category: brief.hotel_category ?? "3_star",
      package_option: brief.package_option ?? "Standard",
      status: "draft",
      inclusions: bulletize(plan.inclusions),
      exclusions: bulletize(plan.exclusions),
      payment_policy: bulletize(plan.payment_policy),
      cancellation_policy: bulletize(plan.cancellation_policy),
      important_notes: bulletize(plan.important_notes),
      terms_blocks: [
        { title: "Inclusions", items: toArr(plan.inclusions) },
        { title: "Exclusions", items: toArr(plan.exclusions) },
        { title: "Payment Policy", items: toArr(plan.payment_policy) },
        { title: "Cancellation Policy", items: toArr(plan.cancellation_policy) },
        { title: "Important Notes", items: toArr(plan.important_notes) },
      ],
      slots: [],
    }).select().single();
    if (e1) throw e1;

    for (const d of plan.days ?? []) {
      const { data: dayRow } = await context.supabase.from("itinerary_days").insert({
        itinerary_id: itin.id,
        day_no: d.day_no,
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        location: d.title,
      }).select().single();
      if (dayRow && Array.isArray(d.services)) {
        for (const s of d.services) {
          const cost = Number(s.cost ?? 0);
          await context.supabase.from("itinerary_services").insert({
            itinerary_id: itin.id,
            day_id: dayRow.id,
            service_type: s.service_type ?? "activity",
            title: s.title,
            description: s.description,
            supplier: s.supplier,
            qty: 1, cost, markup: 0, price: cost,
          });
        }
      }
    }

    await context.supabase.from("timeline_events").insert({
      tenant_id: tid, lead_id: data.lead_id, kind: "itinerary.ai_generated",
      title: "AI itinerary generated", meta: { itinerary_id: itin.id, brief } as any,
    } as any);

    return { id: itin.id };
  });

export const publishItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data: cur } = await context.supabase.from("itineraries").select("status").eq("id", data.id).maybeSingle();
    const nextStatus = cur?.status === "confirmed" ? "confirmed" : "sent";
    const { error } = await context.supabase.from("itineraries").update({ portal_token: token, status: nextStatus }).eq("id", data.id);
    if (error) throw error;
    return { token };
  });

// ============ AI ITINERARY EDIT (conversational refinement) ============
// Takes the current itinerary snapshot + a chat history and asks the AI
// for either a plain conversational reply or a full plan-shaped edit block:
//   <edits>{days,inclusions,exclusions,payment_policy,cancellation_policy,important_notes}</edits>
// When an <edits> block is returned we replace the itinerary's days/services
// in-place and update the terms fields. Costing/markup/GST are preserved.
export const aiItineraryEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itinerary_id: string; messages: AiChatMsg[] }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { assertFeature, meter } = await import("./plan.server");
    await assertFeature(tid, "ai_builder");
    await meter(tid, "ai_calls");
    const { data: it, error: eIt } = await context.supabase
      .from("itineraries")
      .select("*, itinerary_days(*), itinerary_services(*)")
      .eq("id", data.itinerary_id)
      .eq("tenant_id", tid)
      .maybeSingle();
    if (eIt) throw eIt;
    if (!it) throw new Error("Itinerary not found");

    const days = ((it as any).itinerary_days ?? []).slice().sort((a: any, b: any) => a.day_no - b.day_no);
    const services = (it as any).itinerary_services ?? [];
    const snapshot = {
      title: it.title,
      destinations: it.destinations,
      nights: it.nights,
      adults: it.adults, children: it.children, infants: it.infants,
      hotel_category: it.hotel_category,
      meal_plan: it.meal_plan,
      travel_style: it.travel_style,
      days: days.map((d: any) => ({
        day_no: d.day_no,
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        services: services
          .filter((s: any) => s.day_id === d.id)
          .map((s: any) => ({
            service_type: s.service_type,
            title: s.title,
            description: s.description,
            supplier: s.supplier,
            cost: Number(s.cost ?? 0),
          })),
      })),
    };

    const catalog = await loadTenantCatalog(context.supabase);
    const { data: tenantRow } = await context.supabase
      .from("tenants").select("gemini_api_key, ai_provider_config").eq("id", tid).maybeSingle();
    const tenantKey = (tenantRow as any)?.gemini_api_key ?? null;
    const providerCfg = (tenantRow as any)?.ai_provider_config ?? null;

    const system = `You are TraWe's expert Indian travel-agent AI. The agent is editing an existing itinerary and wants to refine it via chat.

CURRENT ITINERARY SNAPSHOT (JSON):
${JSON.stringify(snapshot)}

TENANT CATALOG (prefer these names when suggesting hotels/activities):
- Hotels: ${catalog.hotels.slice(0, 20).map((h: any) => h.name).join(", ") || "(none)"}
- Activities: ${catalog.activities.slice(0, 20).map((a: any) => a.name).join(", ") || "(none)"}

RULES:
1. Reply in 1–3 warm, concise sentences describing what you'll change (or ask ONE clarifying question if the request is ambiguous).
2. When the agent's request is clear enough to apply, ALSO output the full updated plan as this block, on its own line, no code fences:
   <edits>{"days":[{"day_no":1,"title":"...","subtitle":"...","description":"...","services":[{"service_type":"hotel|transport|sightseeing|meal|flight|activity","title":"...","description":"...","supplier":"...","cost":0}]}],"inclusions":[".."],"exclusions":[".."],"payment_policy":[".."],"cancellation_policy":[".."],"important_notes":[".."]}</edits>
3. Return ALL days in the edits block (not a partial diff) — even unchanged ones — so we can safely rewrite. Keep day_no sequential starting at 1.
4. Keep the destination and duration unchanged unless the agent explicitly asks. Costs in INR.
5. If the agent is just asking a question or the request is unclear, DO NOT emit <edits>. Just reply conversationally.`;

    const { geminiChat } = await import("./ai-gemini.server");
    const reply = await geminiChat(
      [{ role: "system", content: system }, ...data.messages],
      { tenantKey, providerCfg },
    );
    if (!reply) throw new Error("AI is unavailable right now. Please try again in a moment.");

    // Parse optional <edits>{...}</edits>
    const m = reply.match(/<edits>([\s\S]*?)<\/edits>/i);
    let applied = false;
    let appliedSummary: { days: number; services: number } | null = null;
    if (m) {
      let plan: any = null;
      try { plan = JSON.parse(m[1].trim()); } catch { plan = null; }
      if (plan && Array.isArray(plan.days) && plan.days.length > 0) {
        // Wipe existing days/services (services cascade on day delete? safer to wipe explicitly)
        await context.supabase.from("itinerary_services").delete().eq("itinerary_id", data.itinerary_id);
        await context.supabase.from("itinerary_days").delete().eq("itinerary_id", data.itinerary_id);
        let dayCount = 0;
        let svcCount = 0;
        for (const d of plan.days) {
          const { data: dayRow } = await context.supabase.from("itinerary_days").insert({
            itinerary_id: data.itinerary_id,
            day_no: d.day_no ?? ++dayCount,
            title: d.title ?? null,
            subtitle: d.subtitle ?? null,
            description: d.description ?? null,
            location: d.title ?? null,
          }).select().single();
          if (d.day_no) dayCount = Math.max(dayCount, d.day_no);
          if (dayRow && Array.isArray(d.services)) {
            for (const s of d.services) {
              const cost = Number(s.cost ?? 0);
              await context.supabase.from("itinerary_services").insert({
                itinerary_id: data.itinerary_id,
                day_id: dayRow.id,
                service_type: s.service_type ?? "activity",
                title: s.title ?? "Service",
                description: s.description ?? null,
                supplier: s.supplier ?? null,
                qty: 1, cost, markup: 0, price: cost,
              });
              svcCount++;
            }
          }
        }
        const toArr = (v: any): string[] => Array.isArray(v)
          ? v.map((x: any) => String(x)).filter(Boolean)
          : typeof v === "string" && v.trim()
            ? v.split(/\r?\n|•|\|/).map((s: string) => s.trim()).filter(Boolean)
            : [];
        const bulletize = (v: any) => toArr(v).map((s) => `• ${s}`).join("\n");
        const patch: any = {};
        if (plan.inclusions != null) patch.inclusions = bulletize(plan.inclusions);
        if (plan.exclusions != null) patch.exclusions = bulletize(plan.exclusions);
        if (plan.payment_policy != null) patch.payment_policy = bulletize(plan.payment_policy);
        if (plan.cancellation_policy != null) patch.cancellation_policy = bulletize(plan.cancellation_policy);
        if (plan.important_notes != null) patch.important_notes = bulletize(plan.important_notes);
        if (Object.keys(patch).length) {
          await context.supabase.from("itineraries").update(patch).eq("id", data.itinerary_id).eq("tenant_id", tid);
        }
        applied = true;
        appliedSummary = { days: plan.days.length, services: svcCount };

        try {
          await context.supabase.from("timeline_events").insert({
            tenant_id: tid,
            lead_id: (it as any).lead_id ?? null,
            kind: "itinerary.ai_edited",
            title: "Itinerary edited via AI",
            meta: { itinerary_id: data.itinerary_id, ...appliedSummary } as any,
          } as any);
        } catch {}
      }
    }

    const text = reply.replace(/<edits>[\s\S]*?<\/edits>/i, "").trim();
    return { reply: text || "Done — I've updated the itinerary.", applied, summary: appliedSummary };
  });

// Flip an itinerary to "sent" so the Quotations tab reflects that it went
// out to the client. Safe to call multiple times — no-op when already
// confirmed/rejected. `via` is a short tag (whatsapp / email / manual / portal_view).
export const markItinerarySent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; via?: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: cur } = await context.supabase
      .from("itineraries")
      .select("id, status, title, code, lead_id, owner_id")
      .eq("id", data.id)
      .eq("tenant_id", tid)
      .maybeSingle();
    if (!cur) throw new Error("Itinerary not found");
    if (cur.status === "confirmed" || cur.status === "rejected") {
      return { ok: true, status: cur.status, skipped: true };
    }
    const { error } = await context.supabase
      .from("itineraries")
      .update({ status: "sent" })
      .eq("id", cur.id)
      .eq("tenant_id", tid);
    if (error) throw error;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any).rpc("post_timeline_event", {
        _tenant: tid,
        _lead: cur.lead_id,
        _kind: "quotation.sent",
        _title: `Quotation sent via ${data.via ?? "manual"}`,
        _body: cur.title ?? cur.code ?? null,
        _ref_type: "itinerary",
        _ref_id: cur.id,
        _amount: null,
        _actor: cur.owner_id,
      });
    } catch {}
    return { ok: true, status: "sent" };
  });

export const deleteItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    // Cascade: remove invoices linked to this itinerary first
    const { data: linkedInv } = await context.supabase
      .from("invoices")
      .select("id")
      .eq("itinerary_id", data.id)
      .eq("tenant_id", tid);
    const invIds = (linkedInv ?? []).map((r: any) => r.id);
    if (invIds.length > 0) {
      await context.supabase.from("invoice_items").delete().in("invoice_id", invIds);
      await context.supabase.from("invoices").delete().in("id", invIds).eq("tenant_id", tid);
    }
    const { data: deleted, error } = await context.supabase
      .from("itineraries")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tid)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!deleted) throw new Error("This itinerary could not be deleted. It may belong to another workspace or was already removed.");
    return { ok: true, id: deleted.id };
  });

// ---- Build invoice head+items from an itinerary ----
async function buildInvoiceFromItinerary(supabase: any, tenantId: string, ownerId: string | null, itinId: string, via: string) {
  const { data: it, error } = await supabase
    .from("itineraries")
    .select("*, itinerary_services(*)")
    .eq("id", itinId)
    .maybeSingle();
  if (error) throw error;
  if (!it) throw new Error("Itinerary not found");

  const services = (it.itinerary_services ?? []) as any[];
  const subtotal = services.reduce((s, r) => s + Number(r.cost ?? 0) * Number(r.qty ?? 1) + Number(r.markup ?? 0), 0);
  const sell = subtotal + Number(it.markup_value ?? 0);

  const cgstRate = Number(it.cgst_rate ?? 0);
  const sgstRate = Number(it.sgst_rate ?? 0);
  const gstRate = cgstRate + sgstRate || Number(it.tax_rate ?? 0);
  const tcsRate = Number(it.tcs_rate ?? 0);

  const gstMode: "cgst_sgst" | "igst" | "none" =
    gstRate === 0 ? "none" : cgstRate > 0 && sgstRate > 0 ? "cgst_sgst" : "igst";

  const taxable = sell;
  const taxAmount = taxable * (gstRate / 100);
  const tcsAmount = taxable * (tcsRate / 100);
  const cgst = gstMode === "cgst_sgst" ? taxAmount / 2 : 0;
  const sgst = gstMode === "cgst_sgst" ? taxAmount / 2 : 0;
  const igst = gstMode === "igst" ? taxAmount : 0;
  const total = taxable + taxAmount + tcsAmount;

  // Reuse existing invoice for this itinerary if present
  const { data: existing } = await supabase.from("invoices").select("id").eq("itinerary_id", itinId).maybeSingle();

  const head: any = {
    tenant_id: tenantId,
    owner_id: ownerId,
    itinerary_id: itinId,
    customer_id: it.customer_id ?? null,
    lead_id: it.lead_id ?? null,
    invoice_date: new Date().toISOString().slice(0, 10),
    gst_mode: gstMode,
    currency: it.currency ?? "INR",
    notes: `Auto-generated from itinerary "${it.title}" (confirmed ${via}). TCS ${tcsRate}% = ${tcsAmount.toFixed(2)}.`,
    subtotal: taxable,
    cgst, sgst, igst,
    total,
  };

  let invId: string;
  if (existing?.id) {
    invId = existing.id;
    const { error: uErr } = await supabase.from("invoices").update(head).eq("id", invId);
    if (uErr) throw uErr;
    await supabase.from("invoice_items").delete().eq("invoice_id", invId);
  } else {
    const { data: ins, error: iErr } = await supabase.from("invoices").insert(head).select("id").single();
    if (iErr) throw iErr;
    invId = ins.id;
  }

  const item = {
    invoice_id: invId,
    sort_order: 0,
    description: it.title || "Tour Package",
    hsn_sac: "998552",
    qty: 1,
    rate: taxable,
    discount: 0,
    tax_rate: gstRate,
    taxable,
    tax_amount: taxAmount,
    amount: taxable + taxAmount,
  };
  const { error: itErr } = await supabase.from("invoice_items").insert(item);
  if (itErr) throw itErr;

  return { invoice_id: invId, total };
}

// Confirm an itinerary from inside the CRM (agent action).
// Enforces the "one confirmed per lead" rule and auto-generates the invoice.
export const confirmItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: it, error } = await context.supabase
      .from("itineraries")
      .select("id, lead_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!it) throw new Error("Itinerary not found");

    if (it.lead_id) {
      // Any other confirmed itinerary for this lead? Move it to "rejected".
      await context.supabase
        .from("itineraries")
        .update({ status: "rejected" })
        .eq("lead_id", it.lead_id)
        .eq("status", "confirmed")
        .neq("id", data.id);
    }

    const { error: uErr } = await context.supabase
      .from("itineraries")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_by: context.userId,
        confirmed_via: "agent",
      })
      .eq("id", data.id);
    if (uErr) throw uErr;

    const result = await buildInvoiceFromItinerary(context.supabase, tid, context.userId, data.id, "by agent");
    return result;
  });

// Reopen a confirmed itinerary so the agent can edit it again.
// Moves status back to "draft", clears confirmation stamps, and deletes any
// invoice previously auto-generated from this itinerary so re-confirming
// doesn't produce a duplicate.
export const reopenItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    // Remove any linked invoices (invoice_items cascade via FK).
    const { data: linkedInvoices } = await context.supabase
      .from("invoices")
      .select("id")
      .eq("itinerary_id", data.id);
    const invIds = (linkedInvoices ?? []).map((x: any) => x.id);
    if (invIds.length) {
      await context.supabase.from("invoice_items").delete().in("invoice_id", invIds);
      await context.supabase.from("invoices").delete().in("id", invIds);
    }

    const { error } = await context.supabase
      .from("itineraries")
      .update({
        status: "draft",
        confirmed_at: null,
        confirmed_by: null,
        confirmed_via: null,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true, deleted_invoices: invIds.length };
  });

// ---------- Public portal (unauthenticated) ----------
export const getPublicItinerary = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: it, error } = await supabaseAdmin
      .from("itineraries")
      .select("*, itinerary_days(*), itinerary_services(*)")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (error) throw error;
    if (!it) throw new Error("Not found");
    (it as any).itinerary_days?.sort((a: any, b: any) => a.day_no - b.day_no);
    (it as any).itinerary_services?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("name, crm_name, logo_url, primary_color, accent_color")
      .eq("id", (it as any).tenant_id)
      .maybeSingle();
    // Auto-mark as "sent" the first time the client actually opens the portal
    // link. Only flips from draft/shared — never overrides sent/confirmed/rejected.
    const cur = (it as any).status;
    if (cur === "draft" || cur === "shared") {
      try {
        await supabaseAdmin
          .from("itineraries")
          .update({ status: "sent" })
          .eq("id", (it as any).id);
        (it as any).status = "sent";
        await (supabaseAdmin as any).rpc("post_timeline_event", {
          _tenant: (it as any).tenant_id,
          _lead: (it as any).lead_id ?? null,
          _kind: "quotation.sent",
          _title: "Quotation opened by client (portal view)",
          _body: (it as any).title ?? (it as any).code ?? null,
          _ref_type: "itinerary",
          _ref_id: (it as any).id,
          _amount: null,
          _actor: (it as any).owner_id ?? null,
        });
      } catch {}
    }
    return { itinerary: it, tenant };
  });

export const acceptItineraryPublic = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; accepter_name?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: it, error } = await supabaseAdmin
      .from("itineraries")
      .select("id, tenant_id, lead_id, owner_id, status")
      .eq("portal_token", data.token)
      .maybeSingle();
    if (error) throw error;
    if (!it) throw new Error("Not found");
    if (it.status === "confirmed") return { ok: true, already: true };

    if (it.lead_id) {
      await supabaseAdmin
        .from("itineraries")
        .update({ status: "rejected" })
        .eq("lead_id", it.lead_id)
        .eq("status", "confirmed")
        .neq("id", it.id);
    }

    const via = `by client${data.accepter_name ? " (" + data.accepter_name + ")" : ""}`;
    const { error: uErr } = await supabaseAdmin
      .from("itineraries")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_via: via,
      })
      .eq("id", it.id);
    if (uErr) throw uErr;

    await buildInvoiceFromItinerary(supabaseAdmin, it.tenant_id, it.owner_id, it.id, via);
    return { ok: true };
  });

// ============ BOOKINGS ============
export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("bookings").select("*, customers(full_name,email,phone), leads(full_name,email,phone)").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

const bookingSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  status: z.string().default("confirmed"),
  lead_id: z.string().uuid().optional().nullable(),
  quotation_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  destination: z.string().optional(),
  travel_from: z.string().optional().nullable(),
  travel_to: z.string().optional().nullable(),
  adults: z.number().default(1),
  children: z.number().default(0),
  gross_value: z.number().default(0),
  net_cost: z.number().default(0),
  currency: z.string().default("INR"),
  notes: z.string().optional(),
  booking_type: z.enum(["flight", "hotel"]).default("flight"),
  source: z.string().default("manual"),
  meta: z.record(z.string(), z.any()).default({}),
});

export const upsertBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof bookingSchema>) => bookingSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row = {
      ...data,
      lead_id: data.lead_id || null, quotation_id: data.quotation_id || null,
      customer_id: data.customer_id || null,
      travel_from: data.travel_from || null, travel_to: data.travel_to || null,
      tenant_id: tid, owner_id: context.userId,
    };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("bookings").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("bookings").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ INVOICES ============
export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select("*, customers(full_name,gstin), bookings(code), payments(*)")
      .order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  });

export const getInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const [{ data: inv }, { data: profile }] = await Promise.all([
      (context.supabase as any).from("invoices").select("*, customers(*), bookings(*), invoice_items(*), payments(*)").eq("id", data.id).maybeSingle(),
      context.supabase.from("profiles").select("tenants(*)").eq("id", context.userId).maybeSingle(),
    ]);
    return inv ? { ...inv, tenant: (profile as any)?.tenants ?? null } : inv;
  });

const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional().nullable(),
  booking_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  invoice_date: z.string(),
  due_date: z.string().optional().nullable(),
  place_of_supply: z.string().optional(),
  gst_mode: z.enum(["cgst_sgst","igst","none"]).default("cgst_sgst"),
  currency: z.string().default("INR"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    hsn_sac: z.string().optional(),
    qty: z.number().default(1),
    rate: z.number().default(0),
    discount: z.number().default(0),
    tax_rate: z.number().default(5),
  })).default([]),
});

export const saveInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof invoiceSchema>) => invoiceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const items = computeItems(data.items);
    const subtotal = items.reduce((s, i) => s + i.taxable, 0);
    const tax_total = items.reduce((s, i) => s + i.tax_amount, 0);
    const cgst = data.gst_mode === "cgst_sgst" ? tax_total / 2 : 0;
    const sgst = data.gst_mode === "cgst_sgst" ? tax_total / 2 : 0;
    const igst = data.gst_mode === "igst" ? tax_total : 0;
    const total = subtotal + tax_total;
    const head = {
      customer_id: data.customer_id || null, booking_id: data.booking_id || null,
      lead_id: data.lead_id || null,
      invoice_date: data.invoice_date, due_date: data.due_date || null,
      place_of_supply: data.place_of_supply, gst_mode: data.gst_mode,
      currency: data.currency, notes: data.notes, terms: data.terms,
      subtotal, cgst, sgst, igst, total,
      tenant_id: tid, owner_id: context.userId,
    };
    let invId = data.id;
    if (invId) {
      const { error } = await context.supabase.from("invoices").update(head).eq("id", invId);
      if (error) throw error;
      await context.supabase.from("invoice_items").delete().eq("invoice_id", invId);
    } else {
      const { data: out, error } = await context.supabase.from("invoices").insert(head).select().single();
      if (error) throw error;
      invId = out.id;
    }
    if (items.length) {
      const { error } = await context.supabase.from("invoice_items").insert(items.map(i => ({
        invoice_id: invId,
        sort_order: i.sort_order,
        description: i.description,
        hsn_sac: i.hsn_sac ?? null,
        qty: i.qty,
        rate: i.rate,
        discount: i.discount,
        tax_rate: i.tax_rate,
        taxable: i.taxable,
        tax_amount: i.tax_amount,
        amount: i.amount,
      })));
      if (error) throw error;
    }
    return { id: invId };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const listBankAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("bank_accounts")
      .select("id, label, bank_name, account_number, ifsc, is_default")
      .order("is_default", { ascending: false });
    return (data ?? []) as Array<{ id: string; label: string | null; bank_name: string | null; account_number: string | null; ifsc: string | null; is_default: boolean | null }>;
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    invoice_id: string; amount: number; paid_at: string;
    mode?: string; reference?: string; notes?: string;
    bank_account_id?: string | null; payer_name?: string;
    txn_fee?: number; currency?: string; exchange_rate?: number;
    status?: string; cheque_no?: string; cheque_date?: string | null;
    bank_name?: string | null; due_date?: string | null;
    reminder?: boolean; reminder_days?: number;
    proof_url?: string | null; comment?: string | null;
  }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: inv } = await context.supabase.from("invoices").select("customer_id").eq("id", data.invoice_id).maybeSingle();
    const payload: any = { ...data, tenant_id: tid, customer_id: inv?.customer_id ?? null };
    if (!payload.bank_account_id) delete payload.bank_account_id;
    if (!payload.cheque_date) delete payload.cheque_date;
    if (!payload.due_date) delete payload.due_date;
    const { data: out, error } = await context.supabase.from("payments").insert(payload).select().single();
    if (error) throw error; return out;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id).eq("tenant_id", tid);
    if (error) throw error;
    return { ok: true };
  });

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { error } = await context.supabase.from("payments").update({ status: data.status }).eq("id", data.id).eq("tenant_id", tid);
    if (error) throw error;
    return { ok: true };
  });

// ============ CONVERT QUOTATION → INVOICE ============
export const convertQuotationToInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quotation_id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: q, error: qErr } = await context.supabase
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("id", data.quotation_id)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!q) throw new Error("Quotation not found");

    // Reject if an invoice already exists for this quotation
    const { data: existing } = await context.supabase
      .from("invoices")
      .select("id, code")
      .eq("lead_id", (q as any).lead_id ?? "00000000-0000-0000-0000-000000000000")
      .limit(50);
    // (soft check — allow multiple; return newest match)

    const items = ((q as any).quotation_items ?? []).map((it: any, i: number) => {
      const taxable = Math.max(0, Number(it.qty ?? 1) * Number(it.rate ?? 0) - Number(it.discount ?? 0));
      const tax_amount = taxable * Number(it.tax_rate ?? 0) / 100;
      return {
        description: it.description ?? it.title ?? "Service",
        hsn_sac: it.hsn_sac ?? null,
        qty: Number(it.qty ?? 1),
        rate: Number(it.rate ?? 0),
        discount: Number(it.discount ?? 0),
        tax_rate: Number(it.tax_rate ?? 0),
        taxable,
        tax_amount,
        amount: taxable + tax_amount,
        sort_order: i,
      };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.taxable, 0);
    const tax_total = items.reduce((s: number, i: any) => s + i.tax_amount, 0);
    const gst_mode = (q as any).gst_mode ?? "cgst_sgst";
    const cgst = gst_mode === "cgst_sgst" ? tax_total / 2 : 0;
    const sgst = gst_mode === "cgst_sgst" ? tax_total / 2 : 0;
    const igst = gst_mode === "igst" ? tax_total : 0;
    const total = subtotal + tax_total;

    const today = new Date().toISOString().slice(0, 10);
    const { data: inv, error } = await context.supabase
      .from("invoices")
      .insert({
        tenant_id: tid,
        owner_id: context.userId,
        customer_id: (q as any).customer_id ?? null,
        lead_id: (q as any).lead_id ?? null,
        invoice_date: today,
        gst_mode,
        currency: (q as any).currency ?? "INR",
        notes: (q as any).notes ?? null,
        terms: (q as any).terms ?? null,
        subtotal, cgst, sgst, igst, total,
      })
      .select().single();
    if (error) throw error;

    if (items.length) {
      const { error: iErr } = await context.supabase
        .from("invoice_items")
        .insert(items.map((i: any) => ({ ...i, invoice_id: inv.id })));
      if (iErr) throw iErr;
    }

    // Mark quotation as converted
    await context.supabase
      .from("quotations")
      .update({ status: "invoiced" })
      .eq("id", data.quotation_id);

    return { invoice_id: inv.id };
  });

// ============ UNIFIED TIMELINE ============
export const listTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { leadId: string; limit?: number }) => d)
  .handler(async ({ context, data }) => {
    const { data: events, error } = await context.supabase
      .from("timeline_events")
      .select("id, kind, title, body, ref_type, ref_id, amount, created_at, actor_id")
      .eq("lead_id", data.leadId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (error) throw error;
    return events ?? [];
  });

// ============ AUTOMATION QUEUE PROCESSOR ============
// Converts queued automation_logs (fired by triggers) into concrete Activities
// so the user sees "Send WhatsApp to X" / "Follow up call" tasks appear.
export const runPendingAutomations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantId(context);
    const { data: queued } = await context.supabase
      .from("automation_logs")
      .select("id, automation_id, detail, automations(name)")
      .eq("tenant_id", tid)
      .eq("status", "queued")
      .limit(50);
    if (!queued?.length) return { processed: 0 };

    let created = 0;
    for (const row of queued as any[]) {
      let payload: any = {};
      try { payload = JSON.parse(row.detail ?? "{}"); } catch {}
      const actions: any[] = Array.isArray(payload.actions) ? payload.actions : [];
      const leadId = payload.lead_id ?? null;
      const autoName = row.automations?.name ?? "Automation";

      for (const act of actions) {
        const kind = String(act.type ?? act.kind ?? "task").toLowerCase();
        const title = act.title || (
          kind === "whatsapp" ? `Send WhatsApp: ${act.message ?? autoName}` :
          kind === "email"    ? `Send email: ${act.subject ?? autoName}` :
          kind === "call"     ? `Call — ${autoName}` :
          `${autoName}`
        );
        const due = act.due_after_days
          ? new Date(Date.now() + Number(act.due_after_days) * 86400000).toISOString()
          : null;
        await context.supabase.from("activities").insert({
          tenant_id: tid,
          lead_id: leadId,
          owner_id: context.userId,
          type: kind === "call" ? "call" : kind === "event" ? "event" : "task",
          title,
          description: act.body ?? act.message ?? null,
          due_at: due,
        });
        created++;
      }

      await context.supabase
        .from("automation_logs")
        .update({ status: "success", detail: `Created ${actions.length} activity(ies)` })
        .eq("id", row.id);
    }
    return { processed: queued.length, activities: created };
  });
