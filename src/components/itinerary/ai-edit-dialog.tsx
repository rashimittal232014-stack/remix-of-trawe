import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { aiItineraryEdit } from "@/lib/sales.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Wand2, Loader2, Bot, User as UserIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Upgrade all hotels to 5★",
  "Add a candlelight dinner on day 2",
  "Replace day 3 with a local sightseeing tour",
  "Make it more relaxed — remove one activity per day",
  "Add airport transfers on arrival and departure",
];

export function AIEditDialog({
  open, onOpenChange, itineraryId, title,
}: { open: boolean; onOpenChange: (v: boolean) => void; itineraryId: string; title?: string }) {
  const qc = useQueryClient();
  const editFn = useServerFn(aiItineraryEdit);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMessages([{
      role: "assistant",
      content: `Hi! Tell me what to change in **${title ?? "this itinerary"}** — swap a hotel, add an activity, tweak the pace, change meals, or rewrite a full day. I'll apply the edit and you'll see it update in the builder.`,
    }]);
    setInput("");
  }, [open, title]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const chat = useMutation({
    mutationFn: async (userTurn: string) => {
      const next = [...messages, { role: "user" as const, content: userTurn }];
      setMessages(next);
      setInput("");
      return editFn({ data: { itinerary_id: itineraryId, messages: next } });
    },
    onSuccess: (res) => {
      const suffix = res.applied
        ? `\n\n✅ Applied — ${res.summary?.days ?? 0} days, ${res.summary?.services ?? 0} services updated.`
        : "";
      setMessages((m) => [...m, { role: "assistant", content: (res.reply || "") + suffix }]);
      if (res.applied) {
        qc.invalidateQueries({ queryKey: ["itinerary", itineraryId] });
        qc.invalidateQueries({ queryKey: ["itineraries"] });
        qc.invalidateQueries({ queryKey: ["itins-all"] });
        toast.success("Itinerary updated by AI");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "AI is unavailable. Try again."),
  });

  const send = (t?: string) => {
    const value = (t ?? input).trim();
    if (!value || chat.isPending) return;
    chat.mutate(value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b bg-gradient-to-r from-orange-500/10 via-primary/5 to-transparent">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-orange-600" />
            </div>
            AI Itinerary Edit
          </SheetTitle>
          <p className="text-xs text-muted-foreground pl-10">
            Ask TraWe AI to refine this itinerary — it sees the current plan.
          </p>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-muted/20">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-orange-600" />
                </div>
              )}
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-background border rounded-bl-sm",
              )}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
          {chat.isPending && (
            <div className="flex gap-2 items-center">
              <div className="h-7 w-7 rounded-full bg-orange-500/15 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <div className="bg-background border rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting the itinerary…
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-background p-3 space-y-2">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition"
                  onClick={() => send(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="e.g. Replace the day 2 hotel with a beachfront resort…"
              rows={2}
              className="resize-none"
              disabled={chat.isPending}
            />
            <Button size="icon" onClick={() => send()} disabled={!input.trim() || chat.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}