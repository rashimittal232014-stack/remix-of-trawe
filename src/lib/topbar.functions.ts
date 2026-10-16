import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const globalSearch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const q = data.q.trim();
    const like = `%${q}%`;
    const [leads, customers, quotations, invoices, itineraries] = await Promise.all([
      supabase.from("leads").select("id, code, full_name, email, phone").or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like},code.ilike.${like}`).limit(6),
      supabase.from("customers").select("id, full_name, email, phone").or(`full_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(6),
      supabase.from("quotations").select("id, code, title").or(`code.ilike.${like},title.ilike.${like}`).limit(6),
      supabase.from("invoices").select("id, code, total").or(`code.ilike.${like}`).limit(6),
      supabase.from("itineraries").select("id, code, title").or(`code.ilike.${like},title.ilike.${like}`).limit(6),
    ]);
    return {
      leads: leads.data ?? [],
      customers: customers.data ?? [],
      quotations: quotations.data ?? [],
      invoices: invoices.data ?? [],
      itineraries: itineraries.data ?? [],
    };
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    return { items: data ?? [], unread: (data ?? []).filter((n: any) => !n.read_at).length };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const q = context.supabase.from("notifications").update({ read_at: new Date().toISOString() });
    if (data.ids?.length) await q.in("id", data.ids);
    else await q.is("read_at", null);
    return { ok: true };
  });

export const getReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const eod = new Date(now); eod.setHours(23, 59, 59, 999);
    const [today, overdue] = await Promise.all([
      context.supabase.from("activities").select("id, title, due_at, type, lead_id, status")
        .gte("due_at", now.toISOString()).lte("due_at", eod.toISOString())
        .neq("status", "completed").order("due_at").limit(20),
      context.supabase.from("activities").select("id, title, due_at, type, lead_id, status")
        .lt("due_at", now.toISOString()).neq("status", "completed")
        .order("due_at", { ascending: false }).limit(20),
    ]);
    return { today: today.data ?? [], overdue: overdue.data ?? [] };
  });

export const getAttendanceToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await context.supabase.from("attendance").select("*")
      .eq("user_id", context.userId).eq("date", today).maybeSingle();
    return { record: data ?? null };
  });