// Server-only helpers for the Storage Cleaner. Kept out of *.functions.ts
// so createServerFn splitting cannot drop them at runtime.

export const CRM_BUCKETS = ["crm-documents", "agency-logos", "masters-media"] as const;
export type CrmBucket = (typeof CRM_BUCKETS)[number];

export const TEMP_PREFIXES = ["temp/", "imports/", "exports/", "cache/", "tmp/"];
export const TRASH_PREFIX = "_trash/";

export const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".heic"];

export type StorageObject = {
  bucket: CrmBucket;
  path: string; // full path inside bucket
  size: number;
  updated_at: string | null;
  created_at: string | null;
};

export function isImage(path: string): boolean {
  const lower = path.toLowerCase();
  return IMAGE_EXT.some((e) => lower.endsWith(e));
}

export function isTemp(path: string): boolean {
  const lower = path.toLowerCase();
  return TEMP_PREFIXES.some((p) => lower.startsWith(p) || lower.includes(`/${p}`));
}

export function isTrash(path: string): boolean {
  return path.startsWith(TRASH_PREFIX);
}

export function ageHours(o: StorageObject): number {
  const t = o.updated_at || o.created_at;
  if (!t) return 0;
  return (Date.now() - new Date(t).getTime()) / 3600000;
}

// Recursively list every object in a bucket via the admin storage client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listBucketRecursive(admin: any, bucket: CrmBucket, prefix = ""): Promise<StorageObject[]> {
  const out: StorageObject[] = [];
  const stack: string[] = [prefix];
  while (stack.length) {
    const p = stack.pop()!;
    const { data, error } = await admin.storage.from(bucket).list(p, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error || !data) continue;
    for (const item of data) {
      const full = p ? `${p}/${item.name}` : item.name;
      // Folders have no id/metadata
      if (!item.id) {
        stack.push(full);
      } else {
        out.push({
          bucket,
          path: full,
          size: (item.metadata?.size as number) ?? 0,
          updated_at: item.updated_at ?? null,
          created_at: item.created_at ?? null,
        });
      }
    }
  }
  return out;
}

// Pull every storage path referenced across the CRM database schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function collectReferencedPaths(supabase: any): Promise<Set<string>> {
  const refs = new Set<string>();
  const add = (v?: string | null) => {
    if (!v || typeof v !== "string") return;
    // Extract bucket/path from signed/public URLs
    for (const b of CRM_BUCKETS) {
      const marker = `/object/sign/${b}/`;
      const marker2 = `/object/public/${b}/`;
      const idx = v.indexOf(marker);
      const idx2 = v.indexOf(marker2);
      if (idx >= 0) {
        const rest = v.slice(idx + marker.length).split("?")[0];
        refs.add(`${b}/${decodeURIComponent(rest)}`);
        return;
      }
      if (idx2 >= 0) {
        const rest = v.slice(idx2 + marker2.length).split("?")[0];
        refs.add(`${b}/${decodeURIComponent(rest)}`);
        return;
      }
    }
  };

  const columns: Array<[string, string, CrmBucket?]> = [
    ["tenants", "logo_url", "agency-logos"],
    ["profiles", "avatar_url"],
    ["itinerary_days", "image_url"],
    ["itinerary_services", "image_url"],
    ["masters_items", "image_url", "masters-media"],
  ];

  for (const [table, col] of columns) {
    const { data } = await supabase.from(table).select(`${col}`).not(col, "is", null).limit(10000);
    if (!data) continue;
    for (const row of data) add(row[col]);
  }
  return refs;
}

export function bytesHuman(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}