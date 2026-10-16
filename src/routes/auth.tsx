import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Sparkles, ShieldCheck, TrendingUp, MessageCircle, Wallet, MapPin, UserPlus, CalendarCheck } from "lucide-react";
import { Logo } from "@/components/app/logo";

function safeNext(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = safeNext(s.next);
    return next ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — TraWe" },
      { name: "description", content: "Sign in to TraWe, the operating system for modern travel agencies." },
      { property: "og:title", content: "Sign in — TraWe" },
      { property: "og:description", content: "Sign in to TraWe, the operating system for modern travel agencies." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        if (next) window.location.href = next;
        else navigate({ to: "/dashboard" });
      }
    });
  }, [navigate, next]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    if (next) { window.location.href = next; return; }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-[#001830]">
      {/* Ambient soft gradient — shared with landing */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#dbe7f5_0%,#e6ecf5_35%,#f5ece2_75%,#f8dccb_100%)]" />
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-[#b9d0ea] blur-[130px] opacity-70" />
        <div className="absolute top-1/3 -right-24 h-[520px] w-[520px] rounded-full bg-[#f7c7a8] blur-[130px] opacity-70" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-[#c9d9ec] blur-[140px] opacity-60" />
      </div>

      {/* Top bar */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center" aria-label="TraWe home">
          <Logo className="h-9 w-auto" />
        </Link>
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur border border-white/80 px-3.5 py-1.5 text-xs font-medium text-[#001830]/70 hover:text-[#001830] transition"
        >
          ← Back to site
        </Link>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:py-16 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        {/* Left — narrative pane */}
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[#001830]/70 border border-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c04818]" />
            Welcome back to your ledger
          </span>
          <h1 className="mt-6 text-5xl xl:text-[58px] font-semibold leading-[1.05] tracking-tight text-[#001830]">
            Where every trip finds its <span className="italic font-serif text-[#001830]/95">calm</span>.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#001830]/60">
            Sign in to pick up your queries, itineraries, GST invoices and WhatsApp threads exactly where you left them — beautifully in sync.
          </p>

          {/* Floating chip cluster */}
          <div className="relative mt-12 max-w-md">
            <div className="rounded-3xl border border-white/70 bg-white/70 backdrop-blur-xl p-5 shadow-[0_30px_80px_-40px_rgba(0,24,48,0.25)]">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/60">This week</div>
                <div className="text-[10px] rounded-full bg-[#48a890]/15 text-[#2f7867] px-2 py-0.5 font-semibold">+18%</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MiniStat icon={TrendingUp} tint="#48a890" k="Won" v="₹8.4L" />
                <MiniStat icon={MessageCircle} tint="#c04818" k="Replies" v="127" />
                <MiniStat icon={Wallet} tint="#001830" k="Collected" v="₹5.1L" />
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 border border-white/70 p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#dbe7f5] grid place-items-center"><MapPin className="h-4 w-4 text-[#001830]" /></div>
                <div className="flex-1">
                  <div className="text-sm font-semibold leading-tight">Bali · 7N Honeymoon</div>
                  <div className="text-[11px] text-[#001830]/55">Rashi + Aman · departs Oct 14</div>
                </div>
                <div className="text-[11px] rounded-full bg-[#48a890]/15 text-[#2f7867] px-2 py-0.5 font-semibold">Confirmed</div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-4 hidden xl:flex items-center gap-2 rounded-2xl bg-white/85 backdrop-blur border border-white/80 px-3 py-2 shadow-[0_20px_40px_-20px_rgba(0,24,48,0.2)]">
              <ShieldCheck className="h-4 w-4 text-[#48a890]" />
              <div className="text-[11px] text-[#001830]/70">Bank-grade, RLS-protected</div>
            </div>
          </div>

          <p className="mt-16 text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">
            © {new Date().getFullYear()} TraWe · Made for Indian travel agencies
          </p>
        </div>

        {/* Right — form card */}
        <div className="w-full max-w-[460px] mx-auto lg:ml-auto">
          <div className="relative rounded-[28px] border border-white/70 bg-white/80 backdrop-blur-xl p-7 sm:p-9 shadow-[0_30px_80px_-40px_rgba(0,24,48,0.25)]">
            <div className="lg:hidden mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[#001830]/70 border border-white/80">
              <Sparkles className="h-3 w-3 text-[#c04818]" /> TraWe workspace
            </div>
            <div className="lg:hidden mb-5"><Logo className="h-10 w-auto" /></div>

            <form onSubmit={signIn} className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-[#001830]/60 -mt-2">Enter your credentials to open your workspace.</p>
              <Field label="Work email">
                <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rashi@wanderlust.co" required />
              </Field>
              <Field label="Password">
                <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </Field>
              <BrandButton loading={loading} label="Sign in" loadingLabel="Signing in…" />
            </form>

            {/* No public sign-up — accounts are provisioned */}
            <div className="mt-7 space-y-3 border-t border-[#001830]/10 pt-6">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">Don't have an account?</p>
              <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#dbe7f5] text-[#001830]"><UserPlus className="h-4 w-4" /></span>
                <p className="text-[13px] leading-relaxed text-[#001830]/70">
                  <span className="font-semibold text-[#001830]">Working at an agency already on TraWe?</span> Please request your
                  Agency Admin to create your account — logins are added from inside your agency workspace.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#f7dccb] text-[#c04818]"><CalendarCheck className="h-4 w-4" /></span>
                <div className="text-[13px] leading-relaxed text-[#001830]/70">
                  <span className="font-semibold text-[#001830]">Agency not with us yet?</span> Request a demo — we'll walk you through
                  TraWe and set up your workspace for you.
                  <div className="mt-2">
                    <Link to="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-[#001830] px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#001830]/90">
                      Request a demo <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#001830]/50">
                By signing in you agree to our <Link to="/terms" className="underline">Terms</Link> and{" "}
                <Link to="/privacy" className="underline">Privacy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Sub components --------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/60">{label}</Label>
      <div className="mt-1.5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-[#001830]/10 [&_input]:bg-white/70 [&_input]:backdrop-blur [&_input:focus-visible]:ring-[#48a890]/40 [&_input:focus-visible]:border-[#48a890]/40">
        {children}
      </div>
    </div>
  );
}

function BrandButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-11 rounded-xl bg-[#001830] hover:bg-[#001830]/90 text-white shadow-[0_20px_40px_-20px_rgba(0,24,48,0.5)] group"
    >
      {loading ? loadingLabel : (
        <span className="inline-flex items-center gap-1.5">{label}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
      )}
    </Button>
  );
}

function MiniStat({ icon: Icon, tint, k, v }: { icon: any; tint: string; k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-white/80 border border-white/70 p-3">
      <div className="h-7 w-7 rounded-lg grid place-items-center" style={{ background: `${tint}20`, color: tint }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-2 text-[11px] text-[#001830]/55">{k}</div>
      <div className="text-sm font-semibold text-[#001830]">{v}</div>
    </div>
  );
}