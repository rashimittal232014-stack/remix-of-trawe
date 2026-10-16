import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendWhatsAppTestMessage } from "@/lib/org.functions";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  it: any;
  days: any[];
  services: any[];
  total: number;
  fmt: (n: number) => string;
  termsBlocks: any[];
  agencyName: string;
  publicUrl?: string;
  onSent?: () => void;
};

function fmtDate(d: any) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDayHeader(d: any) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function fmtShort(d: any) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function addDays(base: string | Date | null | undefined, n: number): Date | null {
  if (!base) return null;
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + n);
  return d;
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
function normalizePhone(raw: string) {
  if (!raw) return "";
  let s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  // strip leading zeros that sometimes prefix mobile numbers
  s = s.replace(/^0+/, "");
  return s;
}

function buildItineraryText(p: Props): string {
  const { it, days, services, total, fmt, termsBlocks, agencyName, publicUrl } = p;
  const lines: string[] = [];
  const code = it?.code || (it?.id ? `#${String(it.id).slice(0, 8)}` : "");
  const title = it?.title || "Your Trip";
  const destinations: string[] = Array.isArray(it?.destinations) ? it.destinations.filter(Boolean) : [];
  const nights = Number(it?.nights ?? Math.max(0, (days?.length ?? 0) - 1));
  const dur = nights ? `${nights} Nights, ${nights + 1} Days` : `${days?.length ?? 0} Days`;
  const adults = Number(it?.adults ?? 0);
  const children = Number(it?.children ?? 0);
  const infants = Number(it?.infants ?? 0);
  const start = it?.start_date;

  lines.push(`*${title}*`);
  if (code) lines.push(`Trip ID: ${code}`);
  lines.push("----------");
  if (destinations.length) lines.push(destinations.join(", "));
  if (start) lines.push(`• ${fmtDate(start)} for ${dur}`);
  else lines.push(`• ${dur}`);
  const pax: string[] = [];
  if (adults) pax.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
  if (children) pax.push(`${children} Child${children > 1 ? "ren" : ""}`);
  if (infants) pax.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
  if (pax.length) lines.push(`• ${pax.join(", ")}`);
  lines.push("");
  lines.push(`Total Price: ${fmt(total)} (incl. of taxes)`);
  lines.push("");

  // Hotels — sequential check-in/out based on day_date or start_date + offset
  const sortedDays = [...(days ?? [])].sort((a, b) => (a.day_no ?? 0) - (b.day_no ?? 0));
  const dayIndex: Record<string, number> = {};
  sortedDays.forEach((d, i) => { dayIndex[d.id] = i; });
  const hotels = (services ?? [])
    .filter((s) => s.service_type === "hotel")
    .sort((a, b) => (dayIndex[a.day_id] ?? 999) - (dayIndex[b.day_id] ?? 999) || (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (hotels.length) {
    lines.push("🏨 *Hotels*");
    lines.push("-----------");
    hotels.forEach((h, idx) => {
      const dIdx = dayIndex[h.day_id] ?? idx;
      const meta = h.meta ?? {};
      const nightsHere = Math.max(1, Number(meta.nights ?? 1));
      const checkin = meta.check_in ? new Date(meta.check_in) : addDays(start, dIdx);
      const checkout = meta.check_out ? new Date(meta.check_out) : addDays(start, dIdx + nightsHere);
      const city = meta.city || meta.location || h.location || "";
      lines.push(`*Night ${idx + 1}${city ? ` at ${city}` : ""}*`);
      if (checkin && checkout) lines.push(`Check-in: ${fmtShort(checkin)} & Check-out: ${fmtShort(checkout)}`);
      lines.push(`${h.title}${meta.similar ? "/similar" : ""}`);
      const extras: string[] = [];
      if (meta.meal_plan) extras.push(String(meta.meal_plan));
      if (meta.room_type) extras.push(String(meta.room_type));
      if (meta.pax) extras.push(`${meta.pax} Pax`);
      if (extras.length) lines.push(`- ${extras.join(", ")}`);
      lines.push("");
    });
  }

  // Transport
  const transport = (services ?? [])
    .filter((s) => s.service_type === "transport")
    .sort((a, b) => (dayIndex[a.day_id] ?? 999) - (dayIndex[b.day_id] ?? 999));
  if (transport.length) {
    lines.push("🚖 *Transportation*");
    lines.push("-----------");
    transport.forEach((t) => {
      const dIdx = dayIndex[t.day_id] ?? 0;
      const dDate = sortedDays[dIdx]?.day_date || addDays(start, dIdx);
      const meta = t.meta ?? {};
      lines.push(`*${ordinal(dIdx + 1)} Day${dDate ? ` — ${fmtDate(dDate)}` : ""}*`);
      lines.push(t.title);
      const bits: string[] = [];
      if (meta.vehicle_type) bits.push(String(meta.vehicle_type));
      if (meta.units || meta.qty) bits.push(`${meta.units ?? meta.qty} Unit(s)`);
      if (bits.length) lines.push(`• ${bits.join(" — ")}`);
      lines.push("");
    });
  }

  // Inclusions / Exclusions from terms blocks
  const inc = termsBlocks?.find((b: any) => /inclusion/i.test(b.title));
  const exc = termsBlocks?.find((b: any) => /exclusion/i.test(b.title));
  if (inc?.items?.length) {
    lines.push("*Inclusions*");
    lines.push("-----------");
    inc.items.forEach((x: string) => lines.push(`+ ${x}`));
    lines.push("");
  }
  if (exc?.items?.length) {
    lines.push("*Exclusions*");
    lines.push("-----------");
    exc.items.forEach((x: string) => lines.push(`- ${x}`));
    lines.push("");
  }

  // Day-wise itinerary
  if (sortedDays.length) {
    lines.push("🗓️ *Day Wise Itinerary*");
    lines.push("----------");
    sortedDays.forEach((d, i) => {
      const date = d.day_date || addDays(start, i);
      lines.push(`*${ordinal(i + 1)} Day${date ? ` — ${fmtDayHeader(date)}` : ""}*`);
      if (d.title) lines.push(d.title);
      if (d.description) lines.push(String(d.description));
      lines.push("----------");
    });
    lines.push("");
  }

  if (publicUrl) {
    lines.push(`View online: ${publicUrl}`);
    lines.push("");
  }
  lines.push(`Regards,\n${agencyName}`);

  let text = lines.join("\n");
  if (text.length > 4096) text = text.slice(0, 4090) + "\n…";
  return text;
}

export function SendWhatsAppDialog(props: Props) {
  const { open, onOpenChange, it } = props;
  const customer = it?.customers || it?.leads;
  const initialPhone = customer?.phone || customer?.mobile || "";
  const [phone, setPhone] = useState(initialPhone);
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"text" | "pdf">("text");

  useEffect(() => {
    if (open) {
      setPhone(initialPhone);
      setBody(buildItineraryText(props));
      setTab("text");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, it?.id]);

  const sendFn = useServerFn(sendWhatsAppTestMessage);
  const send = useMutation({
    mutationFn: (input: { to: string; message: string }) => sendFn({ data: input }),
    onSuccess: (res: any) => {
      if (res?.ok) {
        toast.success("Sent on WhatsApp");
        props.onSent?.();
        onOpenChange(false);
      } else if (res?.status === "paused") {
        toast.warning(res.message || "WhatsApp is paused. Using wa.me fallback.");
        openWaMe();
        props.onSent?.();
      } else {
        toast.error(res?.message || "Send failed. Opening wa.me fallback.");
        openWaMe();
      }
    },
    onError: (e: any) => {
      toast.error(e?.message || "Send failed. Opening wa.me fallback.");
      openWaMe();
    },
  });

  const to = useMemo(() => normalizePhone(phone), [phone]);

  function openWaMe() {
    const msg = encodeURIComponent(body);
    const url = to ? `https://wa.me/${to}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
    // Best-effort: user explicitly opened wa.me with the itinerary body
    props.onSent?.();
  }

  function onSend() {
    if (!to || to.length < 6) {
      toast.error("Enter a valid phone number with country code");
      return;
    }
    if (!body.trim()) {
      toast.error("Message is empty");
      return;
    }
    send.mutate({ to, message: body });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            Send Itinerary on WhatsApp
          </DialogTitle>
        </DialogHeader>

        {customer?.name && (
          <div className="text-sm text-muted-foreground -mt-2">To: <b>{customer.name}</b></div>
        )}

        <div className="space-y-1">
          <Label>Mobile Number</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
          <div className="text-[11px] text-muted-foreground">
            Will be sent to: <b>{to || "—"}</b> · Include country code (no leading zeros).
          </div>
        </div>

        <div className="flex items-center gap-4 border-b -mx-6 px-6">
          <button
            className={`py-2 text-sm border-b-2 ${tab === "text" ? "border-emerald-600 text-emerald-700 font-semibold" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab("text")}
          >
            Textual Itinerary
          </button>
          <button
            className={`py-2 text-sm border-b-2 ${tab === "pdf" ? "border-emerald-600 text-emerald-700 font-semibold" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab("pdf")}
          >
            PDF Link
          </button>
        </div>

        {tab === "text" ? (
          <div className="space-y-1">
            <Label>WhatsApp Content</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="font-mono text-xs"
            />
            <div className="text-[11px] text-muted-foreground text-right">
              {body.length} / 4096
            </div>
          </div>
        ) : (
          <div className="rounded-lg border p-4 text-sm space-y-2">
            <div className="text-muted-foreground">
              Sends a short message with your published portal link. Recipient can view/download the styled PDF from the portal.
            </div>
            {props.publicUrl ? (
              <a href={props.publicUrl} target="_blank" rel="noreferrer" className="text-emerald-700 inline-flex items-center gap-1 text-sm">
                {props.publicUrl} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <div className="text-amber-700 text-xs">Publish the itinerary first to get a shareable link.</div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!props.publicUrl) { toast.error("Publish itinerary first."); return; }
                setBody(`Hi${customer?.name ? ` ${customer.name}` : ""},\n\nHere is your itinerary "${it?.title}":\n${props.publicUrl}\n\nRegards,\n${props.agencyName}`);
                setTab("text");
              }}
            >
              Use link message
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <Button variant="ghost" size="sm" onClick={openWaMe}>
            Open in wa.me instead
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={onSend}
              disabled={send.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {send.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}