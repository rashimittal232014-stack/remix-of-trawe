import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const CRM_MODULES = [
  "Queries", "Users", "Organization", "Profiles", "Client", "Roles", "Itineraries",
  "Companies", "Forms", "Activities", "Automation", "Travel Masters", "Dashboard Editor",
  "Weather", "DOB Greeting", "Attendance", "Automation Trigger", "WhatsApp", "Bookings",
  "Marketing", "Website Settings",
] as const;

function parseSpreadsheetId(url: string): { id: string; gid: string } {
  const m = url.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  const gidM = url.match(/[?#&]gid=(\d+)/);
  return { id: m?.[1] ?? "", gid: gidM?.[1] ?? "0" };
}

async function getTenantId(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", userId).maybeSingle();
  return data?.tenant_id as string | undefined;
}

export const listSheets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const tid = await getTenantId(context.supabase, context.userId);
    if (!tid) return { sheets: [], logs: [], totals: { total: 0, created: 0, skipped: 0, failed: 0, updated: 0 } };
    const [{ data: sheets }, { data: logs }] = await Promise.all([
      context.supabase.from("google_sheet_connections").select("*").eq("tenant_id", tid).order("created_at", { ascending: false }),
      context.supabase.from("google_sheet_sync_logs").select("*").eq("tenant_id", tid).order("started_at", { ascending: false }).limit(50),
    ]);
    const totals = (sheets ?? []).reduce(
      (a: any, s: any) => ({
        total: a.total + 1,
        created: a.created + (s.created_count || 0),
        updated: a.updated + (s.updated_count || 0),
        skipped: a.skipped + (s.skipped_count || 0),
        failed: a.failed + (s.failed_count || 0),
      }),
      { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 },
    );
    return { sheets: sheets ?? [], logs: logs ?? [], totals };
  });

const SheetSchema = z.object({
  id: z.string().uuid().optional(),
  connection_name: z.string().min(1),
  crm_module: z.string().min(1),
  sheet_url: z.string().url(),
  spreadsheet_id: z.string().optional(),
  sheet_gid: z.string().optional(),
  sheet_name: z.string().optional().nullable(),
  header_row: z.coerce.number().int().positive().default(1),
  start_row: z.coerce.number().int().positive().default(2),
  duplicate_check_field: z.string().optional().nullable(),
  duplicate_action: z.enum(["skip", "update"]).default("skip"),
  field_mapping: z.record(z.string(), z.string()).optional().default({}),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const upsertSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SheetSchema.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await getTenantId(context.supabase, context.userId);
    if (!tid) throw new Error("No workspace");
    const parsed = parseSpreadsheetId(data.sheet_url);
    const payload: any = {
      tenant_id: tid,
      created_by: context.userId,
      connection_name: data.connection_name,
      crm_module: data.crm_module,
      sheet_url: data.sheet_url,
      spreadsheet_id: data.spreadsheet_id || parsed.id,
      sheet_gid: data.sheet_gid || parsed.gid || "0",
      sheet_name: data.sheet_name || null,
      header_row: data.header_row,
      start_row: data.start_row,
      duplicate_check_field: data.duplicate_check_field || null,
      duplicate_action: data.duplicate_action,
      field_mapping: data.field_mapping ?? {},
      status: data.status,
    };
    if (!payload.spreadsheet_id) throw new Error("Could not parse spreadsheet ID from URL.");
    if (data.id) {
      const { error } = await context.supabase.from("google_sheet_connections").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase.from("google_sheet_connections").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("google_sheet_connections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["active", "inactive"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("google_sheet_connections").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Sync a sheet through the Lovable Google Sheets connector gateway
export const syncSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const tid = await getTenantId(context.supabase, context.userId);
    if (!tid) throw new Error("No workspace");
    const { data: cfg, error: cfgErr } = await context.supabase
      .from("google_sheet_connections").select("*").eq("id", data.id).maybeSingle();
    if (cfgErr || !cfg) throw new Error("Sheet not found");

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GSHEETS_KEY = process.env.GOOGLE_SHEETS_API_KEY;
    if (!LOVABLE_API_KEY || !GSHEETS_KEY) {
      throw new Error("Google Sheets connector is not linked to this project. Ask an admin to connect it in workspace settings.");
    }

    // start a log
    const { data: log } = await context.supabase.from("google_sheet_sync_logs")
      .insert({ tenant_id: tid, connection_id: cfg.id }).select().single();

    const range = cfg.sheet_name ? `${cfg.sheet_name}!A${cfg.header_row}:Z10000` : `A${cfg.header_row}:Z10000`;
    const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${cfg.spreadsheet_id}/values/${range}`;

    let counts = { created: 0, updated: 0, skipped: 0, failed: 0, rows: 0 };
    try {
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GSHEETS_KEY,
        },
      });
      if (!r.ok) throw new Error(`Sheets API ${r.status}: ${await r.text()}`);
      const body: any = await r.json();
      const values: any[][] = body.values ?? [];
      const headers: string[] = (values[0] ?? []).map((h) => String(h ?? "").trim());
      const rows = values.slice(Math.max(0, (cfg.start_row - cfg.header_row) - 0));
      // start_row is absolute; header row is at header_row. Data begins at index (start_row - header_row).
      const dataRows = values.slice(cfg.start_row - cfg.header_row);
      counts.rows = dataRows.length;

      if (cfg.crm_module === "Queries") {
        // map headers to lead columns
        const mapping: Record<string, string> = (cfg.field_mapping as any) || {};
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const idx = (name: string) => {
          const target = mapping[name] ? norm(mapping[name]) : norm(name);
          return headers.findIndex((h) => norm(h) === target);
        };
        const iName = idx("full_name") >= 0 ? idx("full_name") : idx("name");
        const iEmail = idx("email");
        const iPhone = idx("phone");
        const iSource = idx("source");
        const iCompany = idx("company");

        for (const row of dataRows) {
          try {
            const email = iEmail >= 0 ? String(row[iEmail] ?? "").trim() : "";
            const phone = iPhone >= 0 ? String(row[iPhone] ?? "").trim() : "";
            const full_name = iName >= 0 ? String(row[iName] ?? "").trim() : "";
            if (!full_name && !email && !phone) { counts.skipped++; continue; }

            // duplicate check
            if (cfg.duplicate_check_field) {
              const field = cfg.duplicate_check_field;
              const val = field === "email" ? email : field === "phone" ? phone : field === "full_name" ? full_name : "";
              if (val) {
                const { data: existing } = await context.supabase
                  .from("leads").select("id").eq("tenant_id", tid).eq(field, val).maybeSingle();
                if (existing) {
                  if (cfg.duplicate_action === "update") {
                    await context.supabase.from("leads").update({
                      full_name: full_name || undefined,
                      email: email || undefined,
                      phone: phone || undefined,
                      company: iCompany >= 0 ? row[iCompany] : undefined,
                      source: iSource >= 0 ? row[iSource] : undefined,
                    }).eq("id", existing.id);
                    counts.updated++;
                  } else {
                    counts.skipped++;
                  }
                  continue;
                }
              }
            }

            const { error } = await context.supabase.from("leads").insert({
              tenant_id: tid,
              owner_id: context.userId,
              full_name: full_name || email || phone || "Sheet Import",
              email: email || null,
              phone: phone || null,
              company: iCompany >= 0 ? row[iCompany] ?? null : null,
              source: iSource >= 0 ? row[iSource] ?? "google_sheet" : "google_sheet",
            });
            if (error) { counts.failed++; } else { counts.created++; }
          } catch {
            counts.failed++;
          }
        }
      } else {
        // module not yet wired for auto-insert; count as processed only
        counts.skipped = counts.rows;
      }

      await context.supabase.from("google_sheet_sync_logs").update({
        finished_at: new Date().toISOString(),
        rows_processed: counts.rows,
        created_count: counts.created,
        updated_count: counts.updated,
        skipped_count: counts.skipped,
        failed_count: counts.failed,
        status: "success",
      }).eq("id", log!.id);

      await context.supabase.from("google_sheet_connections").update({
        last_sync_at: new Date().toISOString(),
        created_count: (cfg.created_count || 0) + counts.created,
        updated_count: (cfg.updated_count || 0) + counts.updated,
        skipped_count: (cfg.skipped_count || 0) + counts.skipped,
        failed_count: (cfg.failed_count || 0) + counts.failed,
      }).eq("id", cfg.id);

      return { ok: true, ...counts };
    } catch (e: any) {
      await context.supabase.from("google_sheet_sync_logs").update({
        finished_at: new Date().toISOString(),
        status: "failed",
        error: String(e?.message || e),
      }).eq("id", log!.id);
      throw new Error(e?.message || "Sync failed");
    }
  });