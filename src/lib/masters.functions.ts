import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

async function tenantId(ctx: any): Promise<string> { return ensureTenantId(ctx); }

export const MASTER_KINDS = [
  "day_detail", "hotel", "transfer", "sightseeing", "cruise", "ferry",
  "bus", "train", "complementary", "visa", "passport", "supplier",
  "meal_plan", "room_type", "bank", "airline", "cruise_line",
] as const;
export type MasterKind = (typeof MASTER_KINDS)[number];

export const listMasters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: string; search?: string }) => d)
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("masters_items").select("*").eq("kind", data.kind).order("created_at", { ascending: false });
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.string().min(1),
  name: z.string().min(1),
  location: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  meta: z.record(z.string(), z.any()).optional(),
});
export const upsertMaster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof itemSchema>) => itemSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = { ...data, tenant_id: tid, owner_id: context.userId, status: data.status ?? "active", meta: data.meta ?? {} };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("masters_items").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("masters_items").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deleteMaster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("masters_items").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

export const listPrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { item_id: string }) => d)
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.from("masters_prices").select("*").eq("item_id", data.item_id).order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

const priceSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid(),
  label: z.string().min(1),
  price: z.number().nonnegative(),
  currency: z.string().default("INR"),
  valid_from: z.string().optional().nullable(),
  valid_to: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export const upsertPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof priceSchema>) => priceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const row: any = { ...data, tenant_id: tid };
    if (data.id) {
      const { data: out, error } = await context.supabase.from("masters_prices").update(row).eq("id", data.id).select().single();
      if (error) throw error; return out;
    }
    const { data: out, error } = await context.supabase.from("masters_prices").insert(row).select().single();
    if (error) throw error; return out;
  });

export const deletePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("masters_prices").delete().eq("id", data.id);
    if (error) throw error; return { ok: true };
  });

// ============ WEBSITE SETTINGS ============
export const getWebsiteSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await tenantId(context);
    const { data } = await context.supabase.from("website_settings").select("*").eq("tenant_id", tid).maybeSingle();
    return data ?? { tenant_id: tid, data: {} };
  });

export const saveWebsiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { data: Record<string, any> }) => d)
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    const { data: out, error } = await context.supabase
      .from("website_settings")
      .upsert({ tenant_id: tid, data: data.data }, { onConflict: "tenant_id" })
      .select().single();
    if (error) throw error; return out;
  });