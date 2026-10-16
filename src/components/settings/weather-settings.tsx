import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWeatherSettings, updateWeatherSettings, fetchWeather, weatherEmoji, type WeatherSettings } from "@/lib/weather.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CloudSun, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SLOTS = ["03:00", "10:00", "16:00", "20:00"];

function fmtSlot(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function WeatherSettingsPanel() {
  const qc = useQueryClient();
  const get = useServerFn(getWeatherSettings);
  const save = useServerFn(updateWeatherSettings);
  const { data } = useQuery({ queryKey: ["weather-settings"], queryFn: () => get() });

  const [form, setForm] = useState<WeatherSettings>({
    enabled: true,
    show_on_dashboard: true,
    destinations: ["", "", ""],
    time_slots: SLOTS,
  });

  useEffect(() => {
    if (data) {
      const dests = [...(data.destinations || [])];
      while (dests.length < 3) dests.push("");
      setForm({ ...data, destinations: dests.slice(0, 3) });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: (v: WeatherSettings) => save({ data: { ...v, destinations: v.destinations.filter(Boolean) } }),
    onSuccess: () => {
      toast.success("Weather settings saved");
      qc.invalidateQueries({ queryKey: ["weather-settings"] });
      qc.invalidateQueries({ queryKey: ["weather-live"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Weather Widget</h2>
          <p className="text-sm text-muted-foreground mt-1">Show three selected destination weather cards on the dashboard.</p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Live via Open-Meteo
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <StatusPill icon={CheckCircle2} title="Weather Provider" text="Free Open-Meteo endpoint — no API key required." />
        <StatusPill icon={CheckCircle2} title="Weather Icons" text="Weather icons are ready." />
      </div>

      <Card className="tile-hairline">
        <CardContent className="p-5 space-y-4">
          <ToggleRow
            title="Enable Weather Widget"
            desc="Turn on destination weather for the CRM dashboard."
            checked={form.enabled}
            onChange={(v) => setForm({ ...form, enabled: v })}
          />
          <div className="h-px bg-border/60" />
          <ToggleRow
            title="Show on Dashboard"
            desc="Keep this on to place weather beside the bottom dashboard widgets."
            checked={form.show_on_dashboard}
            onChange={(v) => setForm({ ...form, show_on_dashboard: v })}
          />
        </CardContent>
      </Card>

      <Card className="tile-hairline">
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="font-semibold">Destinations</div>
            <div className="text-xs text-muted-foreground">Select up to three destinations. City names are enough.</div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid gap-1.5">
                <Label>Destination {i + 1}</Label>
                <Input
                  value={form.destinations[i] ?? ""}
                  placeholder="e.g. Goa"
                  onChange={(e) => {
                    const next = [...form.destinations];
                    next[i] = e.target.value;
                    setForm({ ...form, destinations: next });
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="tile-hairline">
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="font-semibold">Update Time Slots</div>
            <div className="text-xs text-muted-foreground">Weather updates only after these slots when dashboard is refreshed.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => {
              const active = form.time_slots.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const next = active ? form.time_slots.filter((x) => x !== s) : [...form.time_slots, s].sort();
                    setForm({ ...form, time_slots: next });
                  }}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition " +
                    (active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 bg-background/40 text-muted-foreground hover:text-foreground")
                  }
                >
                  <Clock className="h-3.5 w-3.5" /> {fmtSlot(s)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="tile-hairline">
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="font-semibold">Dashboard Preview</div>
            <div className="text-xs text-muted-foreground">Dashboard will show city, animated icon and temperature only.</div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {form.destinations.map((city, i) => (
              <WeatherPreviewCard key={i} city={city} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => data && setForm({ ...data, destinations: [...data.destinations, "", "", ""].slice(0, 3) })}>Cancel</Button>
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending}>
          {mut.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function StatusPill({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
      <Icon className="h-5 w-5 text-primary mt-0.5" />
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function WeatherPreviewCard({ city }: { city: string }) {
  const fn = useServerFn(fetchWeather);
  const { data, isLoading } = useQuery({
    queryKey: ["weather-live", city],
    queryFn: () => fn({ data: { city } }),
    enabled: !!city,
    staleTime: 10 * 60 * 1000,
  });
  if (!city) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 h-40 flex items-center justify-center text-xs text-muted-foreground">
        Add a destination
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-5 h-40 flex flex-col items-center justify-center gap-1">
      <div className="text-sm font-semibold">{city}</div>
      <div className="text-4xl leading-none">{weatherEmoji(data?.code ?? null, data?.is_day ?? 1)}</div>
      <div className="text-3xl font-serif tracking-tight">
        {isLoading ? "—" : data?.temp != null ? `${Math.round(data.temp)}°` : "—"}
      </div>
    </div>
  );
}