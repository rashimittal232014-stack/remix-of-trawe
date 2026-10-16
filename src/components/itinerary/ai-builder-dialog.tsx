import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { aiItineraryChat, aiItineraryFinalize } from "@/lib/sales.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Wand2, Loader2, Bot, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

// Parse `CHIPS: [a | b | c]` from an assistant turn and return { text, chips }.
function extractChips(raw: string): { text: string; chips: string[] } {
  const m = raw.match(/CHIPS:\s*\[([^\]]+)\]/i);
  if (!m) return { text: raw.trim(), chips: [] };
  const chips = m[1].split("|").map((s) => s.trim()).filter(Boolean);
  return { text: raw.replace(m[0], "").trim(), chips };
}

// Detect the `<ready/>` sentinel + `<brief>{...}</brief>` block emitted by
// the assistant when it has gathered enough info.
function extractBrief(raw: string): { ready: boolean; brief: any | null; text: string } {
  const ready = /<ready\s*\/?>/i.test(raw);
  const bm = raw.match(/<brief>([\s\S]*?)<\/brief>/i);
  let brief: any = null;
  if (bm) { try { brief = JSON.parse(bm[1].trim()); } catch { brief = null; } }
  const text = raw.replace(/<brief>[\s\S]*?<\/brief>/i, "").replace(/<ready\s*\/?>/i, "").trim();
  return { ready, brief, text };
}

export function AIBuilderDialog({
  open, onOpenChange, lead,
}: { open: boolean; onOpenChange: (v: boolean) => void; lead: any }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const chatFn = useServerFn(aiItineraryChat);
  const finalizeFn = useServerFn(aiItineraryFinalize);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [brief, setBrief] = useState<any | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when opened.
  useEffect(() => {
    if (!open) return;
    const c = { full_name: lead?.full_name };
    const dest = lead?.to_location ?? "your destination";
    const from = lead?.from_location ?? "your city";
    const nights = lead?.nights ?? "?";
    const pax = `${lead?.adults ?? 1}A ${lead?.children ?? 0}C ${lead?.infants ?? 0}I`;
    const greet = `Hi! I'll help you build a tailor-made itinerary for **${c.full_name ?? "your client"}** — ${from} → ${dest}, ${nights} nights, ${pax}. A few quick questions and I'll draft everything for you.

What's the vibe of the trip?
CHIPS: [Relaxed | Adventure | Honeymoon | Family | Luxury | Cultural]`;
    setMessages([{ role: "assistant", content: greet }]);
    setReady(false);
    setBrief(null);
    setInput("");
  }, [open, lead]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const chat = useMutation({
    mutationFn: async (userTurn: string) => {
      const next = [...messages, { role: "user" as const, content: userTurn }];
      setMessages(next);
      setInput("");
      const res = await chatFn({ data: { lead_id: lead.id, messages: next } });
      return res.reply as string;
    },
    onSuccess: (reply) => {
      const parsed = extractBrief(reply);
      setMessages((m) => [...m, { role: "assistant", content: parsed.text || reply }]);
      if (parsed.ready && parsed.brief) { setReady(true); setBrief(parsed.brief); }
    },
    onError: (e: any) => toast.error(e?.message ?? "AI is unavailable. Try again."),
  });

  const finalize = useMutation({
    mutationFn: () => finalizeFn({ data: { lead_id: lead.id, brief: brief ?? {} } }),
    onSuccess: ({ id }) => {
      toast.success("Itinerary drafted — opening builder");
      qc.invalidateQueries({ queryKey: ["itins-all"] });
      qc.invalidateQueries({ queryKey: ["lead", lead.id] });
      onOpenChange(false);
      navigate({ to: "/itineraries/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to build itinerary"),
  });

  const send = (t?: string) => {
    const value = (t ?? input).trim();
    if (!value || chat.isPending) return;
    chat.mutate(value);
  };

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return messages[i].content;
    return "";
  }, [messages]);
  const currentChips = extractChips(lastAssistant).chips;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b bg-gradient-to-r from-primary/10 via-teal-500/5 to-transparent">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            AI Itinerary Builder
          </SheetTitle>
          <p className="text-xs text-muted-foreground pl-10">
            Chat with TraWe AI — it knows your customer, catalog & dates.
          </p>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/20">
          {messages.map((m, i) => {
            const parsed = m.role === "assistant" ? extractChips(m.content) : { text: m.content, chips: [] as string[] };
            const clean = m.role === "assistant"
              ? parsed.text.replace(/<brief>[\s\S]*?<\/brief>/i, "").replace(/<ready\s*\/?>/i, "").trim()
              : parsed.text;
            return (
              <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border rounded-bl-sm",
                )}>
                  {clean}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
          {chat.isPending && (
            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-background border rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          {ready && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Ready to draft your itinerary
              </div>
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1.5">
                {brief?.trip_style && <div><span className="text-foreground/70">Style:</span> {brief.trip_style}</div>}
                {brief?.hotel_category && <div><span className="text-foreground/70">Hotel:</span> {brief.hotel_category}</div>}
                {brief?.meal_plan && <div><span className="text-foreground/70">Meals:</span> {brief.meal_plan}</div>}
                {brief?.package_option && <div><span className="text-foreground/70">Package:</span> {brief.package_option}</div>}
                {brief?.interests?.length ? <div className="col-span-2"><span className="text-foreground/70">Interests:</span> {brief.interests.join(", ")}</div> : null}
                {brief?.include_services?.length ? <div className="col-span-2"><span className="text-foreground/70">Includes:</span> {brief.include_services.join(", ")}</div> : null}
                {brief?.budget_cap_inr ? <div className="col-span-2"><span className="text-foreground/70">Budget:</span> ₹{brief.budget_cap_inr}</div> : null}
              </div>
              <Button className="w-full" onClick={() => finalize.mutate()} disabled={finalize.isPending}>
                {finalize.isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Building itinerary…</>) : (<><Wand2 className="h-4 w-4 mr-2" /> Generate Itinerary</>)}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t bg-background p-3 space-y-2">
          {!ready && currentChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {currentChips.map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition"
                  onClick={() => send(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={ready ? "Ask a follow-up or click Generate above…" : "Type your answer or tap a chip…"}
              rows={2}
              className="resize-none"
              disabled={chat.isPending || finalize.isPending}
            />
            <Button size="icon" onClick={() => send()} disabled={!input.trim() || chat.isPending || finalize.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}