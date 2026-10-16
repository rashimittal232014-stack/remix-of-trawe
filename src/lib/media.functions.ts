import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const searchPexels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query: string; page?: number; perPage?: number }) => d)
  .handler(async ({ data }) => {
    const key = process.env.PEXELS_API_KEY;
    if (!key) return { photos: [], error: "PEXELS_API_KEY not configured" };
    const q = encodeURIComponent(data.query || "travel");
    const perPage = data.perPage ?? 15;
    const page = data.page ?? 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${q}&per_page=${perPage}&page=${page}&orientation=landscape`,
      { headers: { Authorization: key } },
    );
    if (!res.ok) return { photos: [], error: `Pexels error ${res.status}` };
    const json: any = await res.json();
    const photos = (json.photos ?? []).map((p: any) => ({
      id: p.id,
      url: p.src?.large ?? p.src?.medium ?? p.src?.original,
      thumb: p.src?.tiny ?? p.src?.small,
      photographer: p.photographer,
      photographer_url: p.photographer_url,
    }));
    return { photos };
  });