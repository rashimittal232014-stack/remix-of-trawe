import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Country, State, City } from "country-state-city";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type PickerProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function BasePicker({
  value,
  onChange,
  placeholder,
  disabled,
  items,
  emptyText,
  className,
}: PickerProps & { items: { value: string; label: string; hint?: string }[]; emptyText: string }) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);
  // Virtualize-lite: cap the visible list based on the search query so huge datasets (cities) stay smooth.
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = q ? items.filter((i) => i.label.toLowerCase().includes(q) || (i.hint ?? "").toLowerCase().includes(q)) : items;
    return src.slice(0, 300);
  }, [items, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full h-10 justify-between font-normal px-3", className)}
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filtered.map((i) => (
                <CommandItem
                  key={i.value}
                  value={i.value}
                  onSelect={() => {
                    onChange(i.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === i.value ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{i.label}</div>
                    {i.hint && <div className="text-[11px] text-muted-foreground truncate">{i.hint}</div>}
                  </div>
                </CommandItem>
              ))}
              {items.length > filtered.length && (
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground">Showing {filtered.length} of {items.length}. Keep typing to narrow…</div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Search any city in the world by name — resolves its country + state automatically. */
export function AnyCityPicker({
  onPick,
  value,
  placeholder = "Search any city (e.g. Meerut)",
  className,
}: {
  onPick: (v: { city: string; countryCode: string; stateCode: string }) => void;
  value?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { key: string; city: string; countryCode: string; stateCode: string; hint: string }[] = [];
    for (const c of City.getAllCities()) {
      const name = c.name.toLowerCase();
      if (!name.includes(q)) continue;
      const country = Country.getCountryByCode(c.countryCode);
      const state = State.getStateByCodeAndCountry(c.stateCode, c.countryCode);
      out.push({
        key: `${c.name}-${c.stateCode}-${c.countryCode}-${c.latitude ?? ""}`,
        city: c.name,
        countryCode: c.countryCode,
        stateCode: c.stateCode,
        hint: [state?.name, country?.name].filter(Boolean).join(", "),
      });
      if (out.length > 400) break;
    }
    out.sort((a, b) => Number(b.city.toLowerCase().startsWith(q)) - Number(a.city.toLowerCase().startsWith(q)));
    return out.slice(0, 60);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("w-full h-10 justify-between font-normal px-3", className)}>
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type a city name…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{query.trim().length < 2 ? "Type at least 2 letters…" : "No city found."}</CommandEmpty>
            <CommandGroup>
              {results.map((r) => (
                <CommandItem
                  key={r.key}
                  value={r.key}
                  onSelect={() => {
                    onPick({ city: r.city, countryCode: r.countryCode, stateCode: r.stateCode });
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === r.city ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{r.city}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{r.hint}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CountryPicker({ value, onChange, placeholder = "Select country", ...rest }: PickerProps) {
  const items = useMemo(
    () => Country.getAllCountries().map((c) => ({ value: c.isoCode, label: `${c.flag ?? ""} ${c.name}`.trim(), hint: c.isoCode })),
    [],
  );
  return <BasePicker value={value} onChange={onChange} placeholder={placeholder} items={items} emptyText="No country found." {...rest} />;
}

export function StatePicker({ value, onChange, countryCode, placeholder = "Select state", ...rest }: PickerProps & { countryCode: string }) {
  const items = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({ value: s.isoCode, label: s.name }));
  }, [countryCode]);
  return (
    <BasePicker
      value={value}
      onChange={onChange}
      placeholder={countryCode ? placeholder : "Select country first"}
      items={items}
      emptyText="No state found."
      disabled={!countryCode || items.length === 0}
      {...rest}
    />
  );
}

export function CityPicker({
  value,
  onChange,
  countryCode,
  stateCode,
  placeholder = "Select city",
  ...rest
}: PickerProps & { countryCode: string; stateCode?: string }) {
  const items = useMemo(() => {
    if (!countryCode) return [];
    const list = stateCode
      ? City.getCitiesOfState(countryCode, stateCode)
      : City.getCitiesOfCountry(countryCode) ?? [];
    return list.map((c) => ({ value: c.name, label: c.name, hint: c.stateCode }));
  }, [countryCode, stateCode]);
  return (
    <BasePicker
      value={value}
      onChange={onChange}
      placeholder={countryCode ? placeholder : "Select country first"}
      items={items}
      emptyText="No city found."
      disabled={!countryCode || items.length === 0}
      {...rest}
    />
  );
}