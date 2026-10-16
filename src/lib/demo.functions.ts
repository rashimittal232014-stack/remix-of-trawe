import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const demoSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  team_size: z.string().trim().max(40).optional().or(z.literal("")),
  current_software: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.string().trim().max(60).optional().or(z.literal("")),
});

export const submitDemoRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => demoSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demo_requests").insert({
      full_name: data.full_name,
      company: data.company || null,
      email: data.email.toLowerCase(),
      phone: data.phone,
      city: data.city || null,
      country: data.country || "India",
      team_size: data.team_size || null,
      current_software: data.current_software || null,
      message: data.message || null,
      source: data.source || "website",
    });
    if (error) throw new Error("Could not submit your request. Please try again.");
    return { ok: true };
  });

export const listDemoRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { data, error } = await db
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const updateDemoRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "demo_scheduled", "converted", "lost"]).optional(),
      notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { id, ...patch } = data;
    const { error } = await db.from("demo_requests").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteDemoRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertSuperAdmin, admin } = await import("./platform.server");
    await assertSuperAdmin(context);
    const db = await admin();
    const { error } = await db.from("demo_requests").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
