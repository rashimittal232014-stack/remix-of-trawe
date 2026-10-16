import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { runTriggersOnce } from "@/lib/automation-trigger.functions";
import { sendPendingDobGreetings } from "@/lib/dob.functions";
import { runAutomationQueue } from "@/lib/automation-queue.functions";
import { refreshCurrencyRatesIfStale } from "@/lib/org.functions";

/**
 * Silent background poller mounted once inside the authenticated shell.
 * Ticks every 90s and drains queued jobs. Failures are swallowed so the UI
 * never sees them; server-side logs still record delivery success/failure.
 */
export function BackgroundJobs() {
  const runTriggers = useServerFn(runTriggersOnce);
  const runDob = useServerFn(sendPendingDobGreetings);
  const runQueue = useServerFn(runAutomationQueue);
  const refreshFx = useServerFn(refreshCurrencyRatesIfStale);
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const timers: any[] = [];
    const safe = async (fn: () => Promise<any>) => {
      if (cancelled) return;
      try { await fn(); } catch { /* silent */ }
    };
    // Stagger jobs so we don't hit the DB with 4 parallel calls right after login.
    async function tick(offset: number) {
      if (busy.current || cancelled) return;
      busy.current = true;
      try {
        await safe(() => runTriggers({} as any));
        await new Promise((r) => timers.push(setTimeout(r, 4000)));
        await safe(() => runQueue({} as any));
        await new Promise((r) => timers.push(setTimeout(r, 4000)));
        await safe(() => runDob({} as any));
        await new Promise((r) => timers.push(setTimeout(r, 4000)));
        await safe(() => refreshFx({} as any));
      } finally { busy.current = false; }
    }
    // First run 15s after mount (well after dashboard paint), then every 2 min.
    timers.push(setTimeout(() => tick(0), 15_000));
    const interval = setInterval(() => tick(0), 120_000);
    timers.push(interval);
    return () => {
      cancelled = true;
      timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    };
  }, [runTriggers, runDob, runQueue, refreshFx]);

  return null;
}