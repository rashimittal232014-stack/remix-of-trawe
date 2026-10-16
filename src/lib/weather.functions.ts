import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WeatherSettings = {
  enabled: boolean;
  show_on_dashboard: boolean;
  destinations: string[];
  time_slots: string[];
};

const DEFAULTS: WeatherSettings = {
  enabled: true,
  show_on_dashboard: true,
  destinations: ["Dehradun", "Manali", "Kashmir"],
  time_slots: ["03:00", "10:00", "16:00", "20:00"],
};

async function tenantId(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.from("profiles").select("tenant_id").eq("id", ctx.userId).maybeSingle();
  return data?.tenant_id as string | undefined;
}

export const getWeatherSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeatherSettings> => {
    const tid = await tenantId(context);
    if (!tid) return DEFAULTS;
    const { data } = await context.supabase.from("weather_settings").select("*").eq("tenant_id", tid).maybeSingle();
    if (!data) return DEFAULTS;
    return {
      enabled: !!data.enabled,
      show_on_dashboard: !!data.show_on_dashboard,
      destinations: (data.destinations as string[]) ?? DEFAULTS.destinations,
      time_slots: (data.time_slots as string[]) ?? DEFAULTS.time_slots,
    };
  });

export const updateWeatherSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    enabled: z.boolean(),
    show_on_dashboard: z.boolean(),
    destinations: z.array(z.string()).max(3),
    time_slots: z.array(z.string()).max(8),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const tid = await tenantId(context);
    if (!tid) throw new Error("No tenant");
    const { error } = await context.supabase.from("weather_settings").upsert({
      tenant_id: tid,
      enabled: data.enabled,
      show_on_dashboard: data.show_on_dashboard,
      destinations: data.destinations.filter(Boolean),
      time_slots: data.time_slots,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    if (error) throw error;
    return { ok: true };
  });

// Fetch current weather via open-meteo (no API key required)
export const fetchWeather = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ city: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.city)}&count=1`,
    ).then((r) => r.json());
    const loc = geo?.results?.[0];
    if (!loc) return { city: data.city, temp: null, code: null, is_day: 1 };
    const wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,is_day`,
    ).then((r) => r.json());
    return {
      city: loc.name,
      temp: wx?.current?.temperature_2m ?? null,
      code: wx?.current?.weather_code ?? null,
      is_day: wx?.current?.is_day ?? 1,
    };
  });

export function weatherEmoji(code: number | null, isDay = 1): string {
  if (code == null) return isDay ? "☀️" : "🌙";
  if (code === 0) return isDay ? "☀️" : "🌙";
  if ([1, 2].includes(code)) return isDay ? "🌤️" : "☁️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return isDay ? "☀️" : "🌙";
}