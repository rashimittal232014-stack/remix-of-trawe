import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureTenantId } from "./tenant.server";

// -------------------------------------------------------------------------
// Gemini-grounded live search for flights & hotels.
// Uses google_search tool grounding + fenced JSON block for structure.
// Returns citations from groundingMetadata for audit / disclaimer.
// -------------------------------------------------------------------------

type Citation = { title: string; url: string };

type FlightResult = {
  airline: string;
  flight_no: string;
  from: string;
  to: string;
  depart_time: string;
  arrive_time: string;
  duration: string;
  stops: string;
  cabin: string;
  price_inr: number;
  source_url?: string;
  notes?: string;
};

type HotelResult = {
  name: string;
  area: string;
  city: string;
  star_rating: number;
  price_per_night_inr: number;
  meal_plan: string;
  amenities: string[];
  source_url?: string;
  notes?: string;
};

async function getTenantGeminiKey(supabase: any, tid: string): Promise<string | null> {
  const { data: t } = await supabase
    .from("tenants")
    .select("gemini_api_key, ai_provider_config")
    .eq("id", tid)
    .maybeSingle();
  const cfg = (t as any)?.ai_provider_config ?? null;
  const activeGemKey = cfg?.active === "gemini" ? cfg?.providers?.gemini?.api_key : null;
  return (activeGemKey || (t as any)?.gemini_api_key || process.env.GEMINI_API_KEY || null) as string | null;
}

function tryParse(s: string): any | null {
  try { return JSON.parse(s); } catch {}
  // strip trailing commas + stray control chars, retry
  try { return JSON.parse(s.replace(/,\s*([}\]])/g, "$1")); } catch {}
  return null;
}

function extractJsonBlock(text: string): any | null {
  if (!text) return null;
  const candidates: string[] = [];
  // every fenced block (grounded answers often wrap JSON in ```json ... ```)
  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(text))) candidates.push(m[1]);
  candidates.push(text);
  for (const c of candidates) {
    const start = c.indexOf("{");
    const end = c.lastIndexOf("}");
    if (start === -1 || end === -1) continue;
    const parsed = tryParse(c.slice(start, end + 1));
    if (parsed) return parsed;
  }
  return null;
}

// Grounded answers frequently come back as prose/tables. Re-ask the model
// (ungrounded, JSON mime type) to reshape that text into the target schema.
async function repairToJson(
  apiKey: string | null,
  rawText: string,
  schemaHint: string,
): Promise<any | null> {
  const prompt = `Convert the research notes below into JSON only. No prose.
Schema: ${schemaHint}
If a value is unknown use a sensible default (0 for numbers, "" for strings).

RESEARCH NOTES:
${rawText.slice(0, 12000)}`;
  if (apiKey) {
    const r = await callGeminiDirect(apiKey, prompt, { grounded: false, json: true });
    if (r.ok) {
      const p = extractJsonBlock(r.text);
      if (p) return p;
    }
  }
  const gw = await callLovableGateway(prompt);
  if (gw.ok) return extractJsonBlock(gw.text);
  return null;
}


async function callGeminiDirect(
  apiKey: string,
  prompt: string,
  opts: { grounded: boolean; model?: string; json?: boolean },
): Promise<{ ok: true; text: string; citations: Citation[] } | { ok: false; status: number; error: string }> {
  const model = opts.model ?? "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4 },
  };
  if (opts.json && !opts.grounded) body.generationConfig.responseMimeType = "application/json";
  if (opts.grounded) body.tools = [{ google_search: {} }];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = raw;
      try { msg = JSON.parse(raw)?.error?.message ?? raw; } catch {}
      return { ok: false, status: res.status, error: msg };
    }
    const j: any = JSON.parse(raw);
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: any) => p?.text ?? "").join("");
    const chunks = j?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const citations: Citation[] = chunks
      .map((c: any) => (c?.web ? { title: c.web.title ?? c.web.uri, url: c.web.uri } : null))
      .filter(Boolean)
      .slice(0, 12);
    return { ok: true, text, citations };
  } catch (e: any) {
    return { ok: false, status: 0, error: String(e?.message ?? e) };
  }
}

async function callLovableGateway(prompt: string): Promise<{ ok: true; text: string; citations: Citation[] } | { ok: false; status: number; error: string }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return { ok: false, status: 0, error: "LOVABLE_API_KEY missing" };
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = raw;
      try { msg = JSON.parse(raw)?.error?.message ?? raw; } catch {}
      return { ok: false, status: res.status, error: msg };
    }
    const j: any = JSON.parse(raw);
    const text = j?.choices?.[0]?.message?.content ?? "";
    return { ok: true, text, citations: [] };
  } catch (e: any) {
    return { ok: false, status: 0, error: String(e?.message ?? e) };
  }
}

async function researchWithFallback(
  tenantKey: string | null,
  prompt: string,
): Promise<{ text: string; citations: Citation[]; source: string; error?: string }> {
  // 1. Try tenant Gemini key with grounding
  if (tenantKey) {
    const g = await callGeminiDirect(tenantKey, prompt, { grounded: true });
    if (g.ok && g.text) return { ...g, source: "gemini_grounded" };
    // 2. Retry without grounding if the tool was rejected
    const g2 = await callGeminiDirect(tenantKey, prompt, { grounded: false });
    if (g2.ok && g2.text) return { ...g2, source: "gemini_direct" };
    // 3. Fall through to gateway, but keep the tenant error for context
    const gwErr = await callLovableGateway(prompt);
    if (gwErr.ok && gwErr.text) return { ...gwErr, source: "lovable_gateway" };
    const gErr = !g.ok ? g.error : !g2.ok ? g2.error : "empty";
    return { text: "", citations: [], source: "none", error: `Gemini: ${gErr}` };
  }
  // 4. No tenant key -> use Lovable Gateway
  const gw = await callLovableGateway(prompt);
  if (gw.ok && gw.text) return { ...gw, source: "lovable_gateway" };
  return { text: "", citations: [], source: "none", error: gw.ok ? "Empty response" : gw.error };
}

// ------------------------- FLIGHTS -------------------------
const flightInput = z.object({
  from: z.string().min(2),
  to: z.string().min(2),
  depart_date: z.string().min(4), // YYYY-MM-DD
  return_date: z.string().optional().nullable(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  trip_type: z.enum(["one_way", "round_trip"]).default("one_way"),
  direct_only: z.boolean().default(false),
});

export const searchFlightsLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof flightInput>) => flightInput.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await ensureTenantId(context);
    const plan = await import("./plan.server");
    await plan.assertFeature(tid, "live_search");
    await plan.meter(tid, "ai_calls");
    const key = await getTenantGeminiKey(context.supabase, tid);
    if (!key) return { flights: [] as FlightResult[], citations: [] as Citation[], error: "No Gemini API key configured. Add one in Settings → AI Providers." };

    const paxLine = `${data.adults} adult${data.adults > 1 ? "s" : ""}${data.children ? `, ${data.children} child` : ""}${data.infants ? `, ${data.infants} infant` : ""}`;
    const dateLine = data.trip_type === "round_trip" && data.return_date
      ? `Depart ${data.depart_date}, Return ${data.return_date}`
      : `Depart ${data.depart_date} (one way)`;
    const prompt = `You are a live flight fare research assistant for an Indian travel agent.
Search the live web (Google Flights, MakeMyTrip, Cleartrip, Ixigo, airline sites) for current fares.

Route: ${data.from} → ${data.to}
${dateLine}
Passengers: ${paxLine}
Cabin: ${data.cabin}
${data.direct_only ? "Direct flights only." : "Include non-stop and 1-stop options."}

Return the 6–8 best options across airlines. Prices in INR (all-inclusive economy total per adult).

Respond with a single fenced \`\`\`json code block matching EXACTLY this schema (no prose outside the block):
{
  "flights": [
    {
      "airline": "IndiGo",
      "flight_no": "6E 2345",
      "from": "DEL",
      "to": "BOM",
      "depart_time": "2026-07-24T08:15",
      "arrive_time": "2026-07-24T10:35",
      "duration": "2h 20m",
      "stops": "Non-stop",
      "cabin": "Economy",
      "price_inr": 5480,
      "source_url": "https://...",
      "notes": "Includes 15kg check-in"
    }
  ]
}`;

    const out = await researchWithFallback(key, prompt);
    if (!out.text) return { flights: [], citations: [], error: out.error || "Live search failed." };
    let parsed = extractJsonBlock(out.text);
    if (!Array.isArray(parsed?.flights)) {
      parsed = await repairToJson(key, out.text, `{"flights":[{"airline":"","flight_no":"","from":"","to":"","depart_time":"","arrive_time":"","duration":"","stops":"","cabin":"","price_inr":0,"source_url":"","notes":""}]}`);
    }
    const flights: FlightResult[] = Array.isArray(parsed?.flights) ? parsed.flights : [];
    return {
      flights,
      citations: out.citations,
      source: out.source,
      ...(flights.length === 0 ? { error: "Gemini returned no usable flight data. Try again or refine the route/date." } : {}),
    };
  });


// ------------------------- HOTELS -------------------------
const hotelInput = z.object({
  city: z.string().min(2),
  area: z.string().optional().nullable(),
  checkin: z.string().min(4),
  checkout: z.string().min(4),
  rooms: z.number().int().min(1).default(1),
  adults: z.number().int().min(1).default(2),
  children: z.number().int().min(0).default(0),
  min_star: z.number().int().min(1).max(5).default(3),
  budget_max_inr: z.number().int().min(0).default(0),
});

const PRICE_LEVEL_INR: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 2500,
  PRICE_LEVEL_MODERATE: 5000,
  PRICE_LEVEL_EXPENSIVE: 10000,
  PRICE_LEVEL_VERY_EXPENSIVE: 20000,
};

export const searchHotelsLive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof hotelInput>) => hotelInput.parse(d))
  .handler(async ({ context, data }) => {
    const tid = await ensureTenantId(context);
    const plan = await import("./plan.server");
    await plan.assertFeature(tid, "live_search");
    await plan.meter(tid, "ai_calls");

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return { hotels: [] as HotelResult[], citations: [] as Citation[], error: "Google Places API key is not configured." };
    }

    const textQuery = `${data.min_star >= 4 ? `${data.min_star} star ` : ""}hotels in ${data.area ? `${data.area}, ` : ""}${data.city}`;

    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.shortFormattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.editorialSummary",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery,
          includedType: "lodging",
          maxResultCount: 20,
          languageCode: "en",
          regionCode: "IN",
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = raw;
        try { msg = JSON.parse(raw)?.error?.message ?? raw; } catch {}
        return { hotels: [] as HotelResult[], citations: [] as Citation[], error: `Google Places: ${msg}` };
      }
      const j: any = JSON.parse(raw);
      const places: any[] = Array.isArray(j?.places) ? j.places : [];

      let hotels: HotelResult[] = places.map((p) => {
        const rating = Number(p?.rating ?? 0);
        const est = PRICE_LEVEL_INR[p?.priceLevel as string] ?? 0;
        const addr: string = p?.shortFormattedAddress ?? p?.formattedAddress ?? "";
        return {
          name: p?.displayName?.text ?? "Hotel",
          area: data.area || addr.split(",")[0] || "",
          city: data.city,
          star_rating: rating ? Math.max(1, Math.min(5, Math.round(rating))) : 0,
          price_per_night_inr: est,
          meal_plan: "",
          amenities: [
            rating ? `${rating.toFixed(1)}★ Google (${p?.userRatingCount ?? 0} reviews)` : "",
            p?.editorialSummary?.text ?? "",
          ].filter(Boolean),
          source_url: p?.websiteUri ?? p?.googleMapsUri ?? "",
          notes: est ? "Estimated rate from Google price level — confirm with the hotel." : "Rate not published — confirm with the hotel.",
        } as HotelResult;
      });

      if (data.min_star > 0) hotels = hotels.filter((h) => h.star_rating === 0 || h.star_rating >= data.min_star);
      if (data.budget_max_inr > 0) hotels = hotels.filter((h) => h.price_per_night_inr === 0 || h.price_per_night_inr <= data.budget_max_inr);
      hotels = hotels.slice(0, 12);

      const citations: Citation[] = places
        .filter((p) => p?.googleMapsUri)
        .slice(0, 8)
        .map((p) => ({ title: p?.displayName?.text ?? "Google Maps", url: p.googleMapsUri }));

      return {
        hotels,
        citations,
        source: "google_places",
        ...(hotels.length === 0 ? { error: "No hotels found on Google Places for this city/area. Try widening the search." } : {}),
      };
    } catch (e: any) {
      return { hotels: [] as HotelResult[], citations: [] as Citation[], error: String(e?.message ?? e) };
    }
  });