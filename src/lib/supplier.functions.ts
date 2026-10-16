import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

export const listSupplierComms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lead_id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await ensureTenantId(context);
    const { data: rows, error } = await context.supabase
      .from("supplier_communications")
      .select("*")
      .eq("tenant_id", tid)
      .eq("lead_id", data.lead_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

const sendSchema = z.object({
  lead_id: z.string().uuid(),
  quotation_id: z.string().uuid().nullable().optional(),
  itinerary_id: z.string().uuid().nullable().optional(),
  supplier_name: z.string().min(1),
  supplier_email: z.string().nullable().optional(),
  supplier_phone: z.string().nullable().optional(),
  channel: z.enum(["email", "whatsapp"]).default("email"),
  service_ids: z.array(z.string()).default([]),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
});

export const sendSupplierDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await ensureTenantId(context);

    const { data: ins, error } = await context.supabase
      .from("supplier_communications")
      .insert({
        tenant_id: tid,
        lead_id: data.lead_id,
        quotation_id: data.quotation_id ?? null,
        itinerary_id: data.itinerary_id ?? null,
        supplier_name: data.supplier_name,
        supplier_email: data.supplier_email ?? null,
        supplier_phone: data.supplier_phone ?? null,
        channel: data.channel,
        service_ids: data.service_ids,
        subject: data.subject ?? null,
        body: data.body,
        sent_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw error;

    // Mirror to mail_messages for email channel so it shows up in the inbox.
    if (data.channel === "email" && data.supplier_email) {
      await context.supabase.from("mail_messages").insert({
        tenant_id: tid,
        owner_id: context.userId,
        direction: "outbound",
        from_addr: context.claims?.email ?? null,
        to_addrs: [data.supplier_email],
        cc_addrs: [],
        subject: data.subject ?? "Supplier detail",
        body: data.body,
        status: "queued",
        sent_at: new Date().toISOString(),
        lead_id: data.lead_id,
      });
    }

    return ins;
  });

export const deleteSupplierComm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const tid = await ensureTenantId(context);
    const { error } = await context.supabase
      .from("supplier_communications")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tid);
    if (error) throw error;
    return { ok: true };
  });