import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CRM_BUCKETS, TRASH_PREFIX, listBucketRecursive, collectReferencedPaths,
  isImage, isTemp, isTrash, ageHours, type CrmBucket, type StorageObject,
} from "./storage-cleaner.server";

async function tenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("tenant_id").eq("id", ctx.userId).maybeSingle();
  return data?.tenant_id as string | undefined;
}

async function requireAdmin(ctx: { supabase: any; userId: string }) {
  const tid = await tenantId(ctx);
  if (!tid) throw new Error("No tenant");
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId).eq("tenant_id", tid);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("owner") && !roles.includes("admin")) throw new Error("Forbidden");
  return { tenantId: tid };
}

export const scanStorage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ageHours: z.number().min(1).max(24 * 90).default(24) }).parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const all: StorageObject[] = [];
    for (const b of CRM_BUCKETS) {
      const items = await listBucketRecursive(supabaseAdmin, b);
      all.push(...items);
    }

    const refs = await collectReferencedPaths(context.supabase);

    const byBucket: Record<string, { total: number; images: number; unused: number; unusedBytes: number; totalBytes: number }> = {};
    let totalUnusedBytes = 0;
    let totalTempBytes = 0;
    const unusedItems: StorageObject[] = [];
    const tempItems: StorageObject[] = [];
    const trashItems: StorageObject[] = [];

    for (const o of all) {
      const key = `${o.bucket}/${o.path}`;
      const stat = (byBucket[o.bucket] ||= { total: 0, images: 0, unused: 0, unusedBytes: 0, totalBytes: 0 });
      stat.total++;
      stat.totalBytes += o.size;
      if (isImage(o.path)) stat.images++;
      if (isTrash(o.path)) {
        trashItems.push(o);
        continue;
      }
      if (isTemp(o.path) && ageHours(o) >= data.ageHours) {
        tempItems.push(o);
        totalTempBytes += o.size;
        continue;
      }
      if (!refs.has(key)) {
        stat.unused++;
        stat.unusedBytes += o.size;
        unusedItems.push(o);
        totalUnusedBytes += o.size;
      }
    }

    return {
      totalFiles: all.length,
      totalBytes: all.reduce((s, o) => s + o.size, 0),
      referencesFound: refs.size,
      byBucket: CRM_BUCKETS.map((b) => ({ bucket: b, ...(byBucket[b] ?? { total: 0, images: 0, unused: 0, unusedBytes: 0, totalBytes: 0 }) })),
      unusedItems: unusedItems.slice(0, 500),
      unusedCount: unusedItems.length,
      unusedBytes: totalUnusedBytes,
      tempItems: tempItems.slice(0, 500),
      tempCount: tempItems.length,
      tempBytes: totalTempBytes,
      trashItems: trashItems.slice(0, 500),
      trashCount: trashItems.length,
      trashBytes: trashItems.reduce((s, o) => s + o.size, 0),
      potentialBytes: totalUnusedBytes + totalTempBytes,
      scannedAt: new Date().toISOString(),
    };
  });

const itemsSchema = z.object({
  items: z.array(z.object({
    bucket: z.enum(CRM_BUCKETS as unknown as [CrmBucket, ...CrmBucket[]]),
    path: z.string().min(1),
  })).min(1),
});

export const moveToTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => itemsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    let moved = 0;
    const errors: string[] = [];
    for (const it of data.items) {
      if (isTrash(it.path)) continue;
      const dest = `${TRASH_PREFIX}${ts}/${it.path}`;
      const { error } = await supabaseAdmin.storage.from(it.bucket).move(it.path, dest);
      if (error) errors.push(`${it.bucket}/${it.path}: ${error.message}`);
      else moved++;
    }
    return { moved, errors };
  });

export const restoreFromTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => itemsSchema.parse(d))
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let restored = 0;
    const errors: string[] = [];
    for (const it of data.items) {
      if (!it.path.startsWith(TRASH_PREFIX)) continue;
      // strip _trash/{ts}/
      const parts = it.path.split("/");
      const dest = parts.slice(2).join("/");
      if (!dest) continue;
      const { error } = await supabaseAdmin.storage.from(it.bucket).move(it.path, dest);
      if (error) errors.push(`${it.bucket}/${it.path}: ${error.message}`);
      else restored++;
    }
    return { restored, errors };
  });

export const emptyTrash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let removed = 0;
    const errors: string[] = [];
    for (const b of CRM_BUCKETS) {
      const items = await listBucketRecursive(supabaseAdmin, b, TRASH_PREFIX.slice(0, -1));
      const paths = items.map((i) => i.path);
      if (!paths.length) continue;
      // Delete in chunks of 100
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { error } = await supabaseAdmin.storage.from(b).remove(chunk);
        if (error) errors.push(`${b}: ${error.message}`);
        else removed += chunk.length;
      }
    }
    return { removed, errors };
  });