import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AIRPORTS_UNIQUE, findAirport } from "@/lib/airports";
import { cn } from "@/lib/utils";

export function AirportPicker({
  value,
  onChange,
  placeholder = "Select airport",
}: {
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => findAirport(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-10 justify-between font-normal px-3"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Plane className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {selected ? (
              <span className="truncate">
                <span className="font-semibold">{selected.iata}</span>
                <span className="text-muted-foreground ml-1.5">{selected.city}</span>
              </span>
            ) : value ? (
              <span className="font-semibold">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command
          filter={(val, search) => {
            // val = "IATA|City|Country|Name" lowercased below
            const s = search.trim().toLowerCase();
            if (!s) return 1;
            return val.toLowerCase().includes(s) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search city, airport, or IATA…" />
          <CommandList>
            <CommandEmpty>No airport found.</CommandEmpty>
            <CommandGroup>
              {AIRPORTS_UNIQUE.map((a) => {
                const val = `${a.iata}|${a.city}|${a.country}|${a.name}`;
                return (
                  <CommandItem
                    key={a.iata}
                    value={val}
                    onSelect={() => {
                      onChange(a.iata);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === a.iata ? "opacity-100" : "opacity-0")} />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-xs font-semibold bg-muted px-1.5 py-0.5 rounded">{a.iata}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate">{a.city}, {a.country}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{a.name}</div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}