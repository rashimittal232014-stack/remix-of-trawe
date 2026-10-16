import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "@/lib/tenant.server";

// -------- Companies (B2B) --------
export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const [{ data: companies }, { data: customers }, { data: leads }] = await Promise.all([
      context.supabase.from("companies").select("*, owner:profiles!companies_owner_id_fkey(id, display_name, email)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      context.supabase.from("customers").select("company").eq("tenant_id", tenantId),
      context.supabase.from("leads").select("company, stage").eq("tenant_id", tenantId),
    ]);
    const clientSet = new Set((customers ?? []).map((c: any) => (c.company || "").toLowerCase().trim()).filter(Boolean));
    const openStages = new Set(["new", "qualified", "proposal", "negotiation", "quoted", "contacted"]);
    const openSet = new Set(
      (leads ?? [])
        .filter((l: any) => !["won", "lost", "cancelled"].includes((l.stage || "").toLowerCase()))
        .map((l: any) => (l.company || "").toLowerCase().trim())
        .filter(Boolean),
    );
    const items = (companies ?? []).map((c: any) => ({
      ...c,
      _hasClient: clientSet.has((c.name || "").toLowerCase().trim()),
      _hasOpenPipeline: openSet.has((c.name || "").toLowerCase().trim()),
    }));
    return {
      items,
      totals: {
        total: items.length,
        withClients: items.filter((c) => c._hasClient).length,
        withOpenPipelines: items.filter((c) => c._hasOpenPipeline).length,
      },
    };
  });

export const listCompanyOwners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const { data } = await context.supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("tenant_id", tenantId)
      .order("display_name", { ascending: true });
    return (data ?? []).map((p: any) => ({ id: p.id, name: p.display_name || p.email || "User" }));
  });

const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  gstin: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const upsertCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => companySchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("companies").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await context.supabase
      .from("companies")
      .insert({ ...data, tenant_id: tenantId, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("companies").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Mail --------
export const listMail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const { data } = await context.supabase
      .from("mail_messages")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const composeMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        to: z.string().min(1),
        cc: z.string().nullable().optional(),
        subject: z.string().min(1),
        body: z.string().default(""),
        lead_id: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    const toArr = data.to.split(",").map((s) => s.trim()).filter(Boolean);
    const ccArr = data.cc ? data.cc.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const from = context.claims?.email ?? null;
    const { error } = await context.supabase.from("mail_messages").insert({
      tenant_id: tenantId,
      owner_id: context.userId,
      direction: "outbound",
      from_addr: from,
      to_addrs: toArr,
      cc_addrs: ccArr,
      subject: data.subject,
      body: data.body,
      status: "queued",
      sent_at: new Date().toISOString(),
      lead_id: data.lead_id ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const deleteMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mail_messages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Notes (pinboard) --------
export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tenantId = await ensureTenantId(context);
    const { data } = await context.supabase
      .from("notes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    return data ?? [];
  });

const noteSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().nullable().optional(),
  body: z.string().default(""),
  color: z.string().default("#fef3c7"),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
});

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => noteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await ensureTenantId(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("notes").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true, id };
    }
    const { data: row, error } = await context.supabase
      .from("notes")
      .insert({ ...data, tenant_id: tenantId, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: row.id };
  });

export const toggleNotePin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), pinned: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notes")
      .update({ pinned: data.pinned })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });