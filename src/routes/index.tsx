import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import { MarketingNav as Nav } from "@/components/app/marketing-nav";
import {
  ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown, FileText, Globe2,
  IndianRupee, MapPin, MessageCircle, Plane, Plus, Receipt, Search, ShieldCheck,
  Sparkles, TrendingUp, Users, Wallet, Zap, LayoutDashboard, Kanban, CalendarDays,
  Bell, Filter, MoreHorizontal, CircleDot, Mail, Phone, Star, Clock, Hotel,
  CreditCard, Bot, LineChart, Settings2, Inbox, ArrowDownRight, Lock, Database,
  Server, KeyRound, PlayCircle, Upload, Rocket, X, Palette, Download, Smartphone,
} from "lucide-react";
import {
  Globe, Landmark, HeartHandshake, Ticket, MapPinned, Target, Command,
  Gift, ShieldAlert, PlugZap, TableProperties, FileSignature,
} from "lucide-react";
import { useState } from "react";
import winInstaller from "@/assets/TraWeSetup.exe.asset.json";
import androidApk from "@/assets/TraWe-Android.apk.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "TraWe — Gemini-powered travel CRM for modern agencies" },
      { name: "description", content: "TraWe is the AI-native CRM for Indian travel agencies. Chat with the AI Itinerary Builder & Editor, run Live Flight/Hotel Search, one-click Confirm & Invoice with a client-signable portal, 2-way WhatsApp inbox, GST-compliant billing, Razorpay, sales forecast — plus a Windows desktop app." },
      { property: "og:title", content: "TraWe — Gemini-powered travel CRM for modern agencies" },
      { property: "og:description", content: "The all-in-one travel CRM with a full AI copilot. Chat-build & chat-edit itineraries, Live Search real flights/hotels, Confirm & Invoice + signed client portal, 2-way WhatsApp, GST invoicing, Razorpay, forecast — with BYO Gemini/ChatGPT/Claude keys and a Windows desktop app." },
      { property: "og:type", content: "website" },
      { property: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

/* ================= SHARED SOFT GRADIENT BACKGROUND ================= */
function SoftGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#dbe7f5_0%,#e6ecf5_35%,#f5ece2_75%,#f8dccb_100%)]" />
      <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#b9d0ea] blur-[120px] opacity-70" />
      <div className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-[#f7c7a8] blur-[120px] opacity-70" />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Nav />
      <Hero />
      <PartnerStrip />
      <Benefits />
      <DashboardShowcase />
      <FeatureCards />
      <GeminiSection />
      <WhatsNewGrid />
      <ProductTour />
      <AnalyticsMockup />
      <TemplatesGallery />
      <WorkflowSteps />
      <StatsBand />
      <Comparison />
      <IntegrationsGrid />
      <SecurityBand />
      
      <Testimonials />
      <FAQ />
      <MigrationCTA />
      <ContactCTA />
      <Footer />
    </div>
  );
}

/* ============================== HERO ============================== */
function Hero() {
  return (
    <section className="relative px-4 sm:px-6 pt-8 pb-20">
      <div className="relative mx-auto max-w-7xl rounded-[32px] overflow-hidden border border-white/60 shadow-[0_30px_80px_-40px_rgba(0,24,48,0.25)]">
        <SoftGradient />
        <div className="relative px-6 sm:px-10 lg:px-16 pt-16 pb-20 lg:pt-24 lg:pb-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-[#001830]/70 border border-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c04818]" />
            Gemini enabled · AI-native travel CRM
          </span>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl sm:text-5xl lg:text-[68px] font-semibold leading-[1.05] tracking-tight text-[#001830]">
            The travel CRM that runs<br className="hidden sm:block" />
            <span className="italic font-serif text-[#001830]/95">your whole agency</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-[#001830]/60 leading-relaxed">
            Chat-build and chat-edit itineraries with AI. Live search real flights and hotels. Confirm & Invoice a trip in one click and share a signed client portal. Real 2-way WhatsApp, GST billing, sales forecast — one calm workspace, on web and Windows desktop.
          </p>

          {/* Hero mockup with floating chips */}
          <div className="relative mx-auto mt-14 max-w-xl">
            {/* Floating chip: top-left */}
            <div className="hidden md:flex absolute -left-40 top-6 items-center gap-3 rounded-2xl bg-white/85 backdrop-blur px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,24,48,0.2)] border border-white/80 animate-float">
              <div className="h-9 w-9 rounded-xl bg-[#48a890]/15 grid place-items-center">
                <TrendingUp className="h-4 w-4 text-[#48a890]" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-[#001830] leading-none">48%</div>
                <div className="text-[11px] text-[#001830]/60 mt-1">Best deals this year</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -left-48 top-40 items-center gap-3 rounded-2xl bg-white/85 backdrop-blur px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,24,48,0.2)] border border-white/80 animate-float-2">
              <div className="h-9 w-9 rounded-xl bg-[#c04818]/15 grid place-items-center">
                <BarChart3 className="h-4 w-4 text-[#c04818]" />
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-[#001830] leading-none">68%</div>
                <div className="text-[11px] text-[#001830]/60 mt-1">Hit rate this quarter</div>
              </div>
            </div>

            {/* Floating chip: top-right */}
            <div className="hidden md:block absolute -right-44 top-2 w-56 rounded-2xl bg-white/85 backdrop-blur px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,24,48,0.2)] border border-white/80 animate-float text-left">
              <div className="text-[11px] text-[#001830]/60">Bookings this month</div>
              <div className="mt-1 text-2xl font-semibold text-[#001830]">₹4,68,682</div>
              <div className="mt-2 flex gap-1">
                {[6,10,7,12,9,14,11,16].map((h,i)=>(
                  <div key={i} className="w-3 rounded-sm bg-[#c04818]/70" style={{height:`${h*2}px`}} />
                ))}
              </div>
            </div>
            <div className="hidden md:block absolute -right-48 top-52 w-52 rounded-2xl bg-white/85 backdrop-blur px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,24,48,0.2)] border border-white/80 animate-float-2 text-left">
              <div className="text-[11px] text-[#001830]/60">Conversion</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-[#001830]">88%</span>
                <span className="text-[11px] text-[#48a890]">+2.4%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[#001830]/10 overflow-hidden">
                <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#48a890] to-[#c04818]" />
              </div>
            </div>

            {/* Central card */}
            <div className="relative rounded-[28px] bg-white/90 backdrop-blur border border-white/80 shadow-[0_30px_60px_-30px_rgba(0,24,48,0.3)] p-6 sm:p-8">
              <div className="flex items-center justify-between text-xs text-[#001830]/60">
                <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#c04818]" /> New itinerary</span>
                <Plus className="h-4 w-4" />
              </div>
              <div className="mx-auto my-6 h-16 w-16 rounded-full bg-gradient-to-br from-[#f7c7a8] via-[#e88a5c] to-[#c04818] shadow-[0_15px_30px_-10px_rgba(192,72,24,0.5)] grid place-items-center">
                <Plane className="h-7 w-7 text-white" />
              </div>
              <p className="text-sm text-[#001830]/70">
                Draft a 6-night Bali honeymoon for the Shah family with private villa in Ubud and a Nusa Penida day trip.
              </p>
              <div className="mt-4 rounded-xl bg-[#001830]/[0.04] px-4 py-3 text-left text-sm text-[#001830]/60">
                What are the best hotels in Seminyak under ₹18k/night?
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-[#c04818]/30 bg-gradient-to-r from-[#fdece1] via-white to-[#fdece1] px-4 py-2.5 shadow-[0_10px_30px_-15px_rgba(192,72,24,0.4)]">
                <Search className="h-4 w-4 text-[#c04818]" />
                <input className="flex-1 bg-transparent text-sm placeholder:text-[#001830]/40 focus:outline-none" placeholder="Ask or search for anything" />
                <ArrowRight className="h-4 w-4 text-[#c04818]" />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full h-12 px-7 bg-[#001830] text-white hover:bg-[#001830]/90 shadow-[0_15px_35px_-15px_rgba(0,24,48,0.5)]">
              <Link to="/request-demo">Get Live Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 bg-white/70 border-white text-[#001830] hover:bg-white">
              <Link to="/contact">Talk to sales</Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 bg-white/80 border-[#001830]/15 text-[#001830] hover:bg-white">
              <a href={winInstaller.url} download="TraWeSetup.exe">
                <Download className="mr-2 h-4 w-4" /> Download for Windows
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 bg-white/80 border-[#001830]/15 text-[#001830] hover:bg-white">
              <a href={androidApk.url} download="TraWe-Android.apk">
                <Smartphone className="mr-2 h-4 w-4" /> Install Android APK
              </a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-[#001830]/50">
            Windows 10/11 · 110 MB installer &nbsp;•&nbsp; Android 7+ · 14 MB APK &nbsp;•&nbsp; iPhone: open in Safari → Share → Add to Home Screen
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================ PARTNER STRIP ============================ */
function PartnerStrip() {
  const names = ["Google Gemini", "OpenAI ChatGPT", "Anthropic Claude", "Meta WhatsApp Cloud", "WasenderAPI", "Razorpay", "Google Sheets", "Open-Meteo"];
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <p className="text-center text-sm text-muted-foreground">Trusted by 620+ agencies · natively connects with</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
        {names.map((n) => (
          <span key={n} className="text-lg font-semibold tracking-tight text-[#001830]/60">{n}</span>
        ))}
      </div>
    </section>
  );
}

/* ============================== BENEFITS ============================== */
function Benefits() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Benefits</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830] max-w-xl">
            Everything your agency runs on — in one workspace
          </h2>
        </div>
        <Button asChild variant="outline" className="rounded-full self-start md:self-auto bg-[#001830] text-white hover:bg-[#001830]/90 border-transparent">
          <Link to="/features">Learn more <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-5">
        <BenefitCard tint="mint" icon={Users} title="Query workspace, not a spreadsheet row"
          body="Per-service pipelines (Package, Flight, Hotel, Visa, Cruise), stage stepper, timeline, activity, WhatsApp, notes, invoice and documents — all on one screen." />
        <BenefitCard tint="peach" icon={Receipt} title="Invoices, quotes & PDFs on autopilot"
          body="Pick a template (Classic or Travel Tax), auto-numbered by your ID prefix, GST split by place-of-supply, branded with your logo — customer branding front and centre." />
        <BenefitCard tint="sky" icon={MessageCircle} title="Real 2-way WhatsApp inbox"
          body="Chat threads grouped by contact, Meta Cloud + WasenderAPI supported, LID numbers auto-normalised, stage-based follow-ups and DOB greetings sent for you." />
      </div>
    </section>
  );
}

function BenefitCard({ tint, icon: Icon, title, body }: { tint: "mint"|"peach"|"sky"; icon: any; title: string; body: string }) {
  const bg = tint === "mint" ? "bg-[#e6f2ec]" : tint === "peach" ? "bg-[#fce7d6]" : "bg-[#e2ecf7]";
  const chip = tint === "mint" ? "bg-[#48a890] text-white" : tint === "peach" ? "bg-[#c04818] text-white" : "bg-[#001830] text-white";
  return (
    <div className={`rounded-3xl ${bg} p-6 sm:p-7 border border-white/60`}>
      <div className={`h-11 w-11 rounded-2xl ${chip} grid place-items-center shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#001830]">{title}</h3>
      <p className="mt-2 text-sm text-[#001830]/65 leading-relaxed">{body}</p>
      <div className="mt-6 rounded-2xl bg-white/70 backdrop-blur p-4 border border-white/70">
        <div className="flex items-center justify-between text-xs text-[#001830]/50">
          <span>Preview</span><span>Live</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 rounded bg-[#001830]/10 w-4/5" />
          <div className="h-2 rounded bg-[#001830]/10 w-2/3" />
          <div className="h-2 rounded bg-[#001830]/10 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/* ============================ FEATURE CARDS ============================ */
function FeatureCards() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-[#eef3fb] p-8 border border-white/60">
          <h3 className="text-xl font-semibold text-[#001830]">AI-Powered Sales Forecasting</h3>
          <p className="mt-2 text-sm text-[#001830]/65">Analyze your team's performance in real time with detailed analytics, key sales metrics, and actionable insights to drive smarter decisions.</p>
          <div className="mt-6 grid grid-cols-6 gap-1.5">
            {[
              { icon: Wallet, tint: "bg-white" },
              { icon: IndianRupee, tint: "bg-[#48a890] text-white" },
              { icon: Sparkles, tint: "bg-white" },
              { icon: Plane, tint: "bg-white" },
              { icon: Globe2, tint: "bg-white" },
              { icon: MapPin, tint: "bg-white" },
              { icon: ShieldCheck, tint: "bg-white" },
              { icon: FileText, tint: "bg-white" },
              { icon: Zap, tint: "bg-white" },
              { icon: BarChart3, tint: "bg-white" },
              { icon: Receipt, tint: "bg-white" },
              { icon: MessageCircle, tint: "bg-white" },
            ].map((it, i) => {
              const I = it.icon;
              return <div key={i} className={`aspect-square rounded-xl ${it.tint} grid place-items-center shadow-sm text-[#001830]`}><I className="h-4 w-4" /></div>;
            })}
          </div>
        </div>
        <div className="rounded-3xl bg-[#fdece1] p-8 border border-white/60">
          <h3 className="text-xl font-semibold text-[#001830]">Real-Time Performance Tracking</h3>
          <p className="mt-2 text-sm text-[#001830]/65">Sync effortlessly with Razorpay, Meta, and other major platforms to see every rupee flow in and out of your agency.</p>
          <div className="mt-6 flex items-end gap-3 h-40">
            {[35,60,45,80,55,95,70,50,65].map((h,i)=>(
              <div key={i} className={`flex-1 rounded-t-lg ${i===5?"bg-[#c04818]":"bg-white"} shadow-sm relative`} style={{height:`${h}%`}}>
                {i===5 && <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-[#001830] text-white px-2 py-0.5 rounded">₹80k</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ TESTIMONIALS ============================ */
/* ============================ GEMINI SECTION ============================ */
function GeminiSection() {
  const capabilities = [
    { icon: Sparkles, t: "AI itinerary drafting", d: "Type a one-line brief — TraWe drafts a day-by-day itinerary with hotels, transfers and sightseeing in seconds." },
    { icon: Bot, t: "WhatsApp AI agent", d: "Answer new query messages 24×7 in your brand's tone with a Gemini system prompt you control." },
    { icon: Search, t: "Ask my CRM (RAG)", d: "Semantic search across queries, quotations, invoices and chats — powered by pgvector and Gemini embeddings." },
    { icon: FileText, t: "Query summaries", d: "One-paragraph brief of any query's full history — every timeline entry, quote and payment condensed before the call." },
    { icon: LineChart, t: "AI sales forecast", d: "Projected month-end revenue from pipeline velocity, historical close rates and seasonality — refreshed every night." },
    { icon: MessageCircle, t: "Smart compose", d: "Channel-aware WhatsApp and email drafts that pick up prior context and match the customer's language." },
  ];
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="relative isolate overflow-hidden rounded-[32px] border border-white/60 shadow-[0_30px_80px_-40px_rgba(0,24,48,0.35)] bg-[linear-gradient(140deg,#0b1f3a_0%,#123256_45%,#1f4d7a_100%)]">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#4285F4]/40 blur-[140px]" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#c04818]/40 blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#48a890]/25 blur-[120px]" />

        <div className="relative px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-white/80 border border-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f7c7a8]" />
                Gemini Enabled
              </span>
              <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                Built on <span className="italic font-serif">Google&nbsp;Gemini</span> — the smartest engine in travel CRM.
              </h2>
              <p className="mt-5 text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
                Every AI feature in TraWe — itineraries, summaries, forecasts, WhatsApp auto-replies, ⌘K search — runs on Google's Gemini 2.5 Flash. Bring your own free API key and pay Google nothing for the first ~1,500 requests a day.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full h-12 px-7 bg-white text-[#001830] hover:bg-white/90">
                  <Link to="/contact">Try TraWe free <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/features" hash="ai" className="inline-flex items-center justify-center rounded-full h-12 px-7 bg-transparent border border-white/40 text-white hover:bg-white/10 hover:text-white text-sm font-medium">
                    See every AI feature <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <div className="rounded-2xl bg-white/[0.07] border border-white/15 p-4 backdrop-blur">
                  <div className="text-2xl font-semibold text-white">Free</div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/60 mt-1">BYO Gemini key</div>
                </div>
                <div className="rounded-2xl bg-white/[0.07] border border-white/15 p-4 backdrop-blur">
                  <div className="text-2xl font-semibold text-white">1,500<span className="text-sm text-white/60">/day</span></div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/60 mt-1">Free-tier requests</div>
                </div>
                <div className="rounded-2xl bg-white/[0.07] border border-white/15 p-4 backdrop-blur">
                  <div className="text-2xl font-semibold text-white">0-config</div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-white/60 mt-1">Shared AI fallback</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {capabilities.map((c) => {
                  const I = c.icon;
                  return (
                    <div key={c.t} className="rounded-2xl bg-white/[0.06] border border-white/15 p-5 backdrop-blur hover:bg-white/[0.1] transition">
                      <div className="h-10 w-10 rounded-xl bg-white/10 grid place-items-center">
                        <I className="h-4 w-4 text-white" />
                      </div>
                      <div className="mt-4 text-white text-sm font-semibold">{c.t}</div>
                      <div className="mt-1.5 text-white/65 text-xs leading-relaxed">{c.d}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-white/[0.06] border border-white/15 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#48a890]" /> Key resolution order
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80">
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-mono">1. Workspace key</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/50" />
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-mono">2. Project secret</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/50" />
                  <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-mono">3. TraWe shared AI</span>
                </div>
                <p className="mt-3 text-[11px] text-white/55">Zero downtime — if your key expires or hits its quota, TraWe silently falls back to the shared engine. No AI feature ever breaks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ TESTIMONIALS (real) ============================ */
function Testimonials() {
  const items = [
    { agency: "Wanderly Tours", name: "Rahul Mehta", role: "Founder, Mumbai", quote: "TraWe is by far my favorite CRM for travel. It's incredibly powerful yet stays surprisingly calm — it's changed how our team quotes." },
    { agency: "Blue Compass", name: "Sneha Iyer", role: "Ops Lead, Bengaluru", quote: "We started using TraWe to streamline WhatsApp replies. The efficiency it brings to our workflow is unmatched." },
    { agency: "Skyline Holidays", name: "Aman Kapoor", role: "Director, Delhi", quote: "I absolutely love building itineraries in TraWe — it enables me to create production-ready quotes in minutes, not hours." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Testimonials</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">What travel agencies are saying</h2>
        <p className="mt-3 text-sm text-[#001830]/60">Trusted by high-performing agencies across India</p>
      </div>
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {items.map((t) => (
          <div key={t.name} className="rounded-3xl bg-white border border-[#001830]/10 p-7 shadow-[0_20px_40px_-30px_rgba(0,24,48,0.2)]">
            <div className="text-sm font-semibold text-[#001830]">✷ {t.agency}</div>
            <p className="mt-4 text-[15px] leading-relaxed text-[#001830]/75">"{t.quote}"</p>
            <div className="mt-6 flex items-center gap-3 pt-5 border-t border-[#001830]/10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#48a890] to-[#001830] grid place-items-center text-white text-sm font-semibold">
                {t.name.split(" ").map(s=>s[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-medium text-[#001830]">{t.name}</div>
                <div className="text-xs text-[#001830]/55">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================================= FAQ ================================= */
function FAQ() {
  const faqs = [
    { q: "Does the WhatsApp inbox actually work both ways?", a: "Yes — connect Meta Cloud API or WasenderAPI in Settings. Inbound messages land as chat threads with contact matching; outbound sends log delivery status; LID identifiers are auto-normalised to real phone numbers." },
    { q: "Which automations does TraWe run in the background?", a: "Stage-based WhatsApp/email follow-ups, DOB greetings, currency-rate refresh every 12 hours, Google Sheet sync, storage cleanup and the automation queue — all driven by a 60–90s poller with execution logs." },
    { q: "Can I use my own AI keys?", a: "Yes. Data Administration → API Settings stores your Gemini, ChatGPT and Claude keys per workspace. TraWe uses them for itinerary drafting, query summaries and the WhatsApp AI agent." },
    { q: "Is my data secure and portable?", a: "Row-level security per tenant, DPDP-aligned handling, encrypted at rest and in transit. Data Administration ships full Excel export, backup and a 30-day recycle bin — no lock-in." },
    { q: "Is there a free trial?", a: "Yes — 14 days on the Pro plan, no card required. Invite your team, wire WhatsApp, and issue real GST invoices from day one." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
        <div className="rounded-3xl bg-[#e6f2ec] p-8 border border-white/60 relative overflow-hidden min-h-[320px]">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1 bg-white/60">FAQ</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">FAQs</h2>
          <p className="mt-3 text-sm text-[#001830]/60 max-w-xs">Everything you need to know before getting started with TraWe.</p>
          <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur p-4 border border-white/70 max-w-xs">
            <div className="text-xs text-[#001830]/60">Close rate</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#48a890] to-[#001830]" />
              <div>
                <div className="text-sm font-medium text-[#001830]">Priya · Ops</div>
                <div className="text-xs text-[#48a890]">Live</div>
              </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[#001830]/10 rounded-3xl bg-white border border-[#001830]/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <button key={i} onClick={() => setOpen(isOpen ? null : i)} className="w-full text-left px-6 sm:px-8 py-6 group">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base sm:text-lg font-medium text-[#001830]">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#001830]/60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="mt-3 text-sm text-[#001830]/65 leading-relaxed animate-fade-in">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================== CONTACT CTA ============================== */
function ContactCTA() {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="relative mx-auto max-w-7xl rounded-[32px] overflow-hidden border border-white/60 py-20 px-6 text-center">
        <SoftGradient />
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1 bg-white/60">Contact</span>
        <h2 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-[#001830] max-w-2xl mx-auto leading-[1.05]">
          Supercharge your agency <span className="italic font-serif">with TraWe</span> today.
        </h2>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full h-12 px-7 bg-[#001830] text-white hover:bg-[#001830]/90">
            <Link to="/contact">Contact us</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 bg-white/80 border-white text-[#001830] hover:bg-white">
            <Link to="/contact">Start free <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {/* Mini dashboard preview */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl bg-white/85 backdrop-blur border border-white/80 p-5 text-left shadow-[0_30px_60px_-30px_rgba(0,24,48,0.25)]">
          <div className="flex items-center justify-between text-xs text-[#001830]/60 pb-3 border-b border-[#001830]/10">
            <span className="flex items-center gap-2 font-semibold text-[#001830]"><Logo className="h-5 w-auto" /> Dashboard</span>
            <span>Search anything…</span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: "Sales", v: "₹7,85,421", c: "bg-[#e6f2ec]" },
              { l: "Purchase", v: "₹1,27,432", c: "bg-[#fce7d6]" },
              { l: "Return", v: "₹27,632", c: "bg-[#fdece1]" },
              { l: "Conv", v: "68%", c: "bg-[#eef3fb]" },
            ].map((k) => (
              <div key={k.l} className={`rounded-xl ${k.c} p-3`}>
                <div className="text-[11px] text-[#001830]/60">{k.l}</div>
                <div className="mt-1 text-lg font-semibold text-[#001830]">{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================ FOOTER ================================ */
/* ============================ WHAT'S NEW GRID ============================ */
function WhatsNewGrid() {
  const items: { icon: any; tint: string; kicker: string; title: string; body: string; href: string }[] = [
    { icon: Sparkles, tint: "bg-[#fdece1]", kicker: "AI Itinerary Copilot", title: "Chat-build AND chat-edit trips", body: "Type a one-line brief — AI drafts a day-by-day itinerary. Open any confirmed plan and refine it by chat: 'swap day 2 hotel', 'add candlelight dinner on day 3'. Untouched days keep their costs.", href: "/features#ai-copilot" },
    { icon: Search, tint: "bg-[#e2ecf7]", kicker: "Live Search", title: "Real flights & hotels, in-CRM", body: "Gemini-grounded live search for airfares and hotel availability. Airport picker with every IATA code, cascading Country → State → City → Area location picker.", href: "/features#live-search" },
    { icon: FileSignature, tint: "bg-[#e6f2ec]", kicker: "Confirm & Invoice", title: "One click from quote to GST invoice", body: "Confirm a chosen itinerary — TraWe auto-raises the tax invoice, generates a signable client portal token, and locks the plan. Reopen safely voids the linked invoice.", href: "/features#confirm" },
    { icon: KeyRound, tint: "bg-[#fce7d6]", kicker: "Client Portal", title: "Traveller signs from the link", body: "Public tokenised portal for the customer to view the itinerary, accept it (auto-marks Sent), pay via Razorpay and download vouchers — on your brand and domain.", href: "/features#portal" },
    { icon: Wallet, tint: "bg-[#eef3fb]", kicker: "Billing 2.0", title: "Payments, dues, proofs, bank picker", body: "5 live KPIs — collected, due, overdue, refunded, wallet. Add Payment side-sheet with bank, UTR, proof upload and due-date reminders wired to WhatsApp/email.", href: "/features#billing" },
    { icon: Palette, tint: "bg-[#e6f2ec]", kicker: "Simpler pricing UI", title: "One markup, one GST, done", body: "Big client-price card on top, plain 3-line breakdown, one markup row (₹/%) and one GST row (5% default). CGST/SGST/TCS/per-child/currency tucked under Advanced options.", href: "/features#pricing-ui" },
    { icon: KeyRound, tint: "bg-[#fdece1]", kicker: "Multi-provider AI", title: "Gemini, ChatGPT or Claude — BYO key", body: "Pick your provider per workspace, paste your key, hit Test — TraWe verifies connectivity. Automatic 3-tier fallback keeps every AI feature online even if a key expires.", href: "/features#ai" },
    { icon: Hotel, tint: "bg-[#fce7d6]", kicker: "Add hotels via Gemini", title: "Grounded hotel lookup in the builder", body: "Type a hotel name and destination — Gemini pulls category, address, image and typical rate, then drops it straight into the itinerary day.", href: "/features#hotels" },
    { icon: MessageCircle, tint: "bg-[#e2ecf7]", kicker: "WhatsApp share", title: "Text or PDF, up to 4,096 chars", body: "Send itinerary as a formatted 4k-character message or a branded PDF straight to the customer. Contacts auto-name from lead by 10-digit phone match.", href: "/features#whatsapp" },
    { icon: Command, tint: "bg-[#e6f2ec]", kicker: "Windows Desktop app", title: "TraWe as a native .exe", body: "Electron desktop build with tray icon, launch-on-startup and external link handling — same workspace, offline-friendly shell for daily operators.", href: "/features#desktop" },
    { icon: MessageCircle, tint: "bg-[#e6f2ec]", kicker: "WhatsApp Inbox", title: "Real chat threads, not just sends", body: "Two-pane inbox with contacts, filters, date-grouped bubbles, and Meta Cloud + WasenderAPI providers pre-wired.", href: "/features#whatsapp" },
    { icon: Kanban, tint: "bg-[#e2ecf7]", kicker: "Pipelines & Stages", title: "One pipeline per service", body: "Package, Flight, Hotel, Visa, Cruise, Ferry — each with its own stages, probabilities and Kanban view.", href: "/features#pipelines" },
    { icon: Bot, tint: "bg-[#fdece1]", kicker: "Automation triggers", title: "Stage-based follow-ups", body: "When a query hits a stage, TraWe sends the WhatsApp/email template you designed — with client, company and query variables interpolated.", href: "/features#automation" },
    { icon: Gift, tint: "bg-[#fce7d6]", kicker: "DOB Greeting", title: "Never miss a birthday", body: "Auto WhatsApp + email wishes to customers on their birthday, with HTML templates and a live match report.", href: "/features#dob" },
    { icon: Globe, tint: "bg-[#eef3fb]", kicker: "Weather widget", title: "Live forecast on every trip", body: "Open-Meteo powered 3-day forecast per destination, refreshed on your schedule, shown on the query workspace.", href: "/features#weather" },
    { icon: PlugZap, tint: "bg-[#e2ecf7]", kicker: "Google Sheets sync", title: "Rows into queries, cleanly", body: "Connect a sheet, we de-dupe and import new rows into the right pipeline with full sync logs.", href: "/features#sheets" },
    { icon: Inbox, tint: "bg-[#e6f2ec]", kicker: "Email SMTP/IMAP", title: "Per-user or org mailboxes", body: "Send with your Gmail/Zoho/Outlook or the org SMTP fallback. Test button verifies before you send a single quote.", href: "/features#email" },
    { icon: Database, tint: "bg-[#fdece1]", kicker: "Data Administration", title: "Import, export, backup, recycle bin", body: "One-click Excel import, full-workspace export & backup, 30-day recycle bin, storage dashboard and BYO AI API keys.", href: "/features#data-admin" },
    { icon: Palette, tint: "bg-[#fce7d6]", kicker: "PDF templates", title: "Classic vs Travel Tax, previewable", body: "Pick your invoice and itinerary template from the settings gallery — live mini-previews before you switch.", href: "/features#templates" },
    { icon: ShieldAlert, tint: "bg-[#eef3fb]", kicker: "Storage Cleaner", title: "Reclaim unused files", body: "Scans crm-documents, agency-logos and masters-media, cross-references DB URLs, and safe-trashes anything orphaned.", href: "/features#storage-cleaner" },
    { icon: Landmark, tint: "bg-[#e6f2ec]", kicker: "Currencies", title: "Multi-currency, auto-refreshed", body: "Rates refreshed every 12 hours in the background, per-currency symbols and rounding on every quote and invoice.", href: "/features#currencies" },
    { icon: Command, tint: "bg-[#fdece1]", kicker: "Global ⌘K + Super Admin", title: "Search everything, run the whole SaaS", body: "Command palette across every module, plus a hidden Super Admin console for tenants, billing, broadcasts and system health.", href: "/features#power" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1 bg-white/60">New in TraWe</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">
            22 new pillars. Same calm ledger.
          </h2>
          <p className="mt-3 text-[#001830]/60">
            The last few sprints shipped an AI Itinerary Copilot that builds AND edits by chat, Live Flight/Hotel Search, one-click Confirm & Invoice with a signable client portal, Billing 2.0 with payment proofs, simplified pricing UI, multi-provider AI (Gemini/ChatGPT/Claude), Grounded hotel lookup, formatted WhatsApp share, a Windows desktop build — plus per-service pipelines, stage automations, DOB greetings, weather, Sheets sync, per-user email, Data Administration, PDF templates, storage cleaner, auto-currencies and a Super Admin console.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full self-start md:self-auto bg-[#001830] text-white hover:bg-[#001830]/90 border-transparent">
          <Link to="/features">See every feature <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => {
          const I = it.icon;
          return (
            <Link key={it.title} to={it.href} className={`group rounded-3xl ${it.tint} p-6 border border-white/60 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-25px_rgba(0,24,48,0.35)]`}>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#001830]/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c04818]" /> {it.kicker}
              </div>
              <div className="mt-4 h-11 w-11 rounded-2xl bg-white/80 grid place-items-center shadow-sm">
                <I className="h-5 w-5 text-[#001830]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#001830]">{it.title}</h3>
              <p className="mt-1.5 text-sm text-[#001830]/65 leading-relaxed">{it.body}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#001830]/80 group-hover:text-[#c04818] transition">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-10 flex flex-wrap gap-2">
        {[
          "Query workspace tabs", "Pipelines per service", "IT & GIT itineraries",
          "Hotel · Flight · Cruise dialogs", "GIT costing sidebar", "Supplier communication tab",
          "Masters: Hotels/Sightseeing/Transfers/Visas/Meals/Rooms", "Pexels image picker",
          "Roles & Profiles matrix", "Companies & Branches", "ID prefix manager",
          "Package terms library", "Recycle bin & audit log", "White-label CNAME domains",
          "Attendance & HR", "Marketing campaigns & groups", "Form builder + public /f/$slug",
          "Referrals & wallet", "Reports with PDF + Excel export",
        ].map((chip) => (
          <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-[#001830]/10 bg-white px-3 py-1.5 text-xs text-[#001830]/70">
            <TableProperties className="h-3 w-3 text-[#001830]/50" /> {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const cols: { h: string; l: { label: string; to: string }[] }[] = [
    { h: "Product", l: [
      { label: "Features", to: "/features" },
      
      { label: "Book a demo", to: "/contact" },
      { label: "Start free trial", to: "/contact" },
    ]},
    { h: "Company", l: [
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ]},
    { h: "Resources", l: [
      { label: "Docs", to: "/docs" },
      { label: "Guides", to: "/guides" },
      { label: "Support", to: "/support" },
      { label: "Status", to: "/status" },
    ]},
    { h: "Legal", l: [
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
      { label: "Refund", to: "/refund" },
      { label: "DPDP", to: "/dpdp" },
    ]},
  ];
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid md:grid-cols-6 gap-10">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">The operating system for modern travel agencies. Made in India for the world.</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <Globe2 className="h-3 w-3" /> EN · HI · TA · TE · BN
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{c.h}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {c.l.map((x) => <li key={x.label}><Link to={x.to} className="text-muted-foreground hover:text-foreground transition">{x.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
          <span>© {new Date().getFullYear()} TraWe Technologies · All systems nominal</span>
          <span className="flex items-center gap-3">
            <span>DPDP</span><span>·</span><span>SOC 2</span><span>·</span><span>GSTIN ready</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// Unused helper reference to keep Check import silent if needed
void Check;

/* ======================== DASHBOARD SHOWCASE (BIG MOCKUP) ======================== */
function DashboardShowcase() {
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="mx-auto max-w-7xl text-center">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1 bg-white/60">The Dashboard</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">One calm ledger. Everything in view.</h2>
        <p className="mt-3 text-[#001830]/60 max-w-xl mx-auto">Leads, itineraries, invoices, payments, WhatsApp — all in a single, beautifully quiet workspace.</p>
      </div>

      <div className="relative mx-auto max-w-7xl mt-12 rounded-[32px] overflow-hidden border border-white/60 shadow-[0_40px_100px_-40px_rgba(0,24,48,0.35)]">
        <SoftGradient />
        <div className="relative p-4 sm:p-8">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 pb-3 px-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#48a890]" />
            <span className="ml-3 text-[11px] font-mono text-[#001830]/50">app.trawe.in/dashboard</span>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur border border-white/80 overflow-hidden grid grid-cols-12">
            {/* Sidebar */}
            <aside className="hidden md:flex col-span-2 flex-col gap-1 border-r border-[#001830]/8 p-4 bg-[#f7f4ef]/60">
              <div className="flex items-center gap-2 pb-3">
                <Logo className="h-6 w-auto" />
              </div>
              {[
                { icon: LayoutDashboard, label: "Dashboard", active: true },
                { icon: Kanban, label: "Leads" },
                { icon: Plane, label: "Itineraries" },
                { icon: Hotel, label: "Hotels" },
                { icon: Receipt, label: "Invoices" },
                { icon: CreditCard, label: "Payments" },
                { icon: MessageCircle, label: "Inbox" },
                { icon: Bot, label: "Copilot" },
                { icon: Settings2, label: "Settings" },
              ].map((it) => (
                <div key={it.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${it.active ? "bg-[#001830] text-white shadow-sm" : "text-[#001830]/70 hover:bg-white"}`}>
                  <it.icon className="h-3.5 w-3.5" />
                  {it.label}
                </div>
              ))}
            </aside>

            {/* Main */}
            <div className="col-span-12 md:col-span-10 p-5 sm:p-7 space-y-5">
              {/* Topbar */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">Monday · 20 Jul</div>
                  <div className="text-lg font-semibold text-[#001830]">Good morning, Priya ✳</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#001830]/10 bg-white px-3 py-1.5 text-xs text-[#001830]/60 w-56">
                    <Search className="h-3.5 w-3.5" /> Search leads, invoices…
                  </div>
                  <div className="h-8 w-8 rounded-full border border-[#001830]/10 grid place-items-center bg-white"><Bell className="h-3.5 w-3.5 text-[#001830]/60" /></div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#48a890] to-[#001830] text-white text-[11px] font-semibold grid place-items-center">PS</div>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { l: "Revenue MTD", v: "₹18.4L", d: "+12.4%", tint: "bg-[#e6f2ec]", up: true },
                  { l: "Open leads", v: "142", d: "+8", tint: "bg-[#eef3fb]", up: true },
                  { l: "Bookings", v: "37", d: "+5", tint: "bg-[#fce7d6]", up: true },
                  { l: "Overdue", v: "₹62,300", d: "-4.1%", tint: "bg-[#fdece1]", up: false },
                ].map((k) => (
                  <div key={k.l} className={`rounded-2xl ${k.tint} p-4 border border-white/70`}>
                    <div className="text-[11px] text-[#001830]/60">{k.l}</div>
                    <div className="mt-1 text-2xl font-semibold text-[#001830]">{k.v}</div>
                    <div className={`mt-1 inline-flex items-center gap-1 text-[11px] ${k.up ? "text-[#48a890]" : "text-[#c04818]"}`}>
                      {k.up ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {k.d}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart + tasks */}
              <div className="grid lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 rounded-2xl border border-[#001830]/10 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">Revenue</div>
                      <div className="text-lg font-semibold text-[#001830]">Last 30 days</div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-[#001830]/10 p-0.5 text-[11px]">
                      {["7d", "30d", "90d"].map((r, i) => (
                        <span key={r} className={`px-2.5 py-0.5 rounded-full ${i === 1 ? "bg-[#001830] text-white" : "text-[#001830]/60"}`}>{r}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 h-40 flex items-end gap-1.5">
                    {[28, 42, 36, 55, 48, 62, 51, 70, 58, 74, 61, 82, 68, 88, 72, 94, 80, 68, 76, 90, 78, 96, 84, 100, 88, 74, 91, 82, 96, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#001830]/10 to-[#48a890]/70 relative" style={{ height: `${h}%` }}>
                        {i === 23 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-[#001830] text-white px-1.5 py-0.5 rounded">₹1.2L</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#001830]/10 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-[#001830]">Today</div>
                    <CalendarDays className="h-4 w-4 text-[#001830]/50" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { t: "Follow up · Shah family", time: "10:30", tint: "bg-[#e6f2ec] text-[#48a890]" },
                      { t: "Send Bali quote v2", time: "12:00", tint: "bg-[#fdece1] text-[#c04818]" },
                      { t: "Call · Kapoor honeymoon", time: "15:45", tint: "bg-[#eef3fb] text-[#001830]" },
                      { t: "Confirm hotel · Ubud", time: "17:30", tint: "bg-[#fce7d6] text-[#c04818]" },
                    ].map((t) => (
                      <div key={t.t} className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg grid place-items-center ${t.tint}`}><Clock className="h-3.5 w-3.5" /></div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-[#001830]">{t.t}</div>
                          <div className="text-[10px] text-[#001830]/50 font-mono">{t.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pipeline */}
              <div className="rounded-2xl border border-[#001830]/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">Pipeline</div>
                    <div className="text-lg font-semibold text-[#001830]">This week</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#001830]/60">
                    <Filter className="h-3.5 w-3.5" /> Filter
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { stage: "New", count: 24, dot: "bg-[#48a890]", cards: [{ n: "Shah · Bali", v: "₹1.8L" }, { n: "Iyer · Kerala", v: "₹92k" }] },
                    { stage: "Quoted", count: 18, dot: "bg-[#c04818]", cards: [{ n: "Kapoor · Ladakh", v: "₹2.4L" }, { n: "Sinha · Dubai", v: "₹1.6L" }] },
                    { stage: "Negotiating", count: 9, dot: "bg-[#facc15]", cards: [{ n: "Mehta · Europe", v: "₹4.8L" }] },
                    { stage: "Won", count: 12, dot: "bg-[#001830]", cards: [{ n: "Rao · Andaman", v: "₹1.2L" }, { n: "Nair · Bhutan", v: "₹1.7L" }] },
                  ].map((col) => (
                    <div key={col.stage} className="rounded-xl bg-[#f7f4ef]/50 border border-[#001830]/5 p-3">
                      <div className="flex items-center justify-between text-[11px] text-[#001830]/60 mb-3">
                        <span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />{col.stage}</span>
                        <span>{col.count}</span>
                      </div>
                      <div className="space-y-2">
                        {col.cards.map((c) => (
                          <div key={c.n} className="rounded-lg bg-white border border-[#001830]/8 p-2.5">
                            <div className="text-xs font-medium text-[#001830]">{c.n}</div>
                            <div className="text-[10px] text-[#001830]/50 mt-0.5 font-mono">{c.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ======================== PRODUCT TOUR (3 mockup cards) ======================== */
function ProductTour() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Inside TraWe</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">Every screen designed to save minutes</h2>
        <p className="mt-3 text-[#001830]/60">A peek at the three surfaces your team lives in every day.</p>
      </div>

      <div className="mt-12 grid lg:grid-cols-3 gap-5">
        {/* Itinerary mockup */}
        <div className="rounded-3xl bg-[#eef3fb] border border-white/60 p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-[#001830]/50">Itinerary Builder</div>
          <h3 className="mt-2 text-xl font-semibold text-[#001830]">Drag, drop, done.</h3>
          <div className="mt-5 rounded-2xl bg-white border border-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between text-[11px] text-[#001830]/60">
              <span className="font-semibold text-[#001830]">Bali · 6N/7D</span>
              <span>₹1,84,500</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { d: "Day 1", t: "Arrive Denpasar · Ubud transfer", tint: "bg-[#e6f2ec]" },
                { d: "Day 2", t: "Tegallalang rice terraces", tint: "bg-[#fce7d6]" },
                { d: "Day 3", t: "Nusa Penida day tour", tint: "bg-[#eef3fb]" },
                { d: "Day 4", t: "Seminyak beach + spa", tint: "bg-[#fdece1]" },
              ].map((r) => (
                <div key={r.d} className={`flex items-center gap-3 rounded-lg ${r.tint} p-2.5`}>
                  <div className="text-[10px] font-mono w-10 text-[#001830]/60">{r.d}</div>
                  <div className="text-xs text-[#001830] flex-1">{r.t}</div>
                  <MoreHorizontal className="h-3.5 w-3.5 text-[#001830]/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GST invoice mockup */}
        <div className="rounded-3xl bg-[#fdece1] border border-white/60 p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-[#001830]/50">GST Invoice</div>
          <h3 className="mt-2 text-xl font-semibold text-[#001830]">Compliance, on autopilot.</h3>
          <div className="mt-5 rounded-2xl bg-white border border-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#001830]/10">
              <div>
                <div className="font-semibold text-[#001830]">Wanderly Tours</div>
                <div className="text-[#001830]/50">GSTIN 27AABCU9603R1ZM</div>
              </div>
              <span className="rounded-full bg-[#e6f2ec] text-[#48a890] text-[10px] px-2 py-0.5 font-mono">PAID</span>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <Row l="Package · Bali 6N" v="₹1,56,356" />
              <Row l="SAC 998552" v="—" muted />
              <Row l="CGST 2.5%" v="₹3,908" muted />
              <Row l="SGST 2.5%" v="₹3,908" muted />
              <div className="border-t border-[#001830]/10 mt-2 pt-2 flex justify-between">
                <span className="font-semibold text-[#001830]">Total</span>
                <span className="font-semibold text-[#001830]">₹1,64,172</span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-[#001830] text-white text-[11px] py-2 text-center font-mono">Download PDF</div>
          </div>
        </div>

        {/* Inbox mockup */}
        <div className="rounded-3xl bg-[#e6f2ec] border border-white/60 p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-[#001830]/50">WhatsApp Inbox</div>
          <h3 className="mt-2 text-xl font-semibold text-[#001830]">Close from your chair.</h3>
          <div className="mt-5 rounded-2xl bg-white border border-white/80 p-3 shadow-sm">
            {[
              { n: "Rahul Shah", m: "Can we tweak the villa in Ubud?", t: "2m", u: 2 },
              { n: "Sneha Iyer", m: "Payment link received ✓", t: "12m", u: 0 },
              { n: "Aman Kapoor", m: "Sending passport now", t: "1h", u: 1 },
              { n: "Priya Nair", m: "Confirmed for Sept 12", t: "3h", u: 0 },
            ].map((c) => (
              <div key={c.n} className="flex items-center gap-3 py-2.5 border-b last:border-0 border-[#001830]/5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#48a890] to-[#001830] text-white text-[10px] font-semibold grid place-items-center">
                  {c.n.split(" ").map(s => s[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-[#001830] truncate">{c.n}</div>
                    <div className="text-[10px] text-[#001830]/50 font-mono">{c.t}</div>
                  </div>
                  <div className="text-[11px] text-[#001830]/60 truncate">{c.m}</div>
                </div>
                {c.u > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-[#c04818] text-white text-[9px] grid place-items-center font-mono">{c.u}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ l, v, muted }: { l: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-[#001830]/50" : "text-[#001830]/80"}`}>
      <span>{l}</span><span>{v}</span>
    </div>
  );
}

/* ============================== WORKFLOW STEPS ============================== */
function WorkflowSteps() {
  const steps = [
    { n: "01", icon: Inbox, title: "Capture", body: "Queries stream in from your form builder, Google Sheet, WhatsApp inbox and website — landed in the right service pipeline automatically." },
    { n: "02", icon: Plane, title: "Design", body: "Build day-wise itineraries with Hotel, Flight, Cruise, Sightseeing and Transfer services — or clone an IT/GIT template from the library." },
    { n: "03", icon: Receipt, title: "Quote & invoice", body: "Send a branded GST quote or Travel Tax invoice via WhatsApp/email in one click. Auto-numbered by your ID prefix." },
    { n: "04", icon: CreditCard, title: "Collect & automate", body: "Razorpay links, auto-reconcile to the booking, and stage-based follow-ups keep every customer warm without lifting a finger." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Workflow</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">Four steps. Lead to landed.</h2>
      </div>
      <div className="relative mt-14 grid md:grid-cols-4 gap-5">
        <div className="hidden md:block absolute left-0 right-0 top-8 h-px bg-gradient-to-r from-transparent via-[#001830]/15 to-transparent" />
        {steps.map((s) => (
          <div key={s.n} className="relative">
            <div className="relative z-10 mx-auto h-16 w-16 rounded-2xl bg-white border border-white/80 shadow-[0_15px_30px_-15px_rgba(0,24,48,0.2)] grid place-items-center">
              <s.icon className="h-6 w-6 text-[#c04818]" />
            </div>
            <div className="mt-5 text-center">
              <div className="text-[11px] font-mono text-[#001830]/50">{s.n}</div>
              <div className="mt-1 text-lg font-semibold text-[#001830]">{s.title}</div>
              <p className="mt-2 text-sm text-[#001830]/60 leading-relaxed max-w-xs mx-auto">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================== STATS BAND ============================== */
function StatsBand() {
  const stats = [
    { v: "620+", l: "Agencies onboard" },
    { v: "₹84Cr", l: "Bookings processed" },
    { v: "4.1×", l: "Faster quotes" },
    { v: "99.98%", l: "Uptime this year" },
  ];
  return (
    <section className="px-4 sm:px-6 py-14">
      <div className="mx-auto max-w-7xl rounded-[28px] bg-[#001830] text-white p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-[#c04818]/40 blur-[120px]" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#48a890]/40 blur-[120px]" />
        {stats.map((s) => (
          <div key={s.l} className="relative">
            <div className="text-4xl md:text-5xl font-semibold tracking-tight">{s.v}</div>
            <div className="mt-2 text-xs font-mono uppercase tracking-widest text-white/60">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ INTEGRATIONS GRID ============================ */
function IntegrationsGrid() {
  const apps = [
    { n: "Google Gemini (native)", d: "Gemini 2.5 Flash is TraWe's default brain — BYO free key or use the shared engine", tint: "bg-[#e2ecf7]", icon: Sparkles },
    { n: "WhatsApp Cloud + WasenderAPI", d: "Real 2-way inbox with LID normalisation", tint: "bg-[#e6f2ec]", icon: MessageCircle },
    { n: "Razorpay", d: "Payment links & auto-reconcile to invoice", tint: "bg-[#eef3fb]", icon: CreditCard },
    { n: "Gmail / Zoho / Outlook SMTP", d: "Per-user or org mailbox, IMAP inbox", tint: "bg-[#fdece1]", icon: Mail },
    { n: "Google Sheets", d: "Import new rows into queries, de-duped", tint: "bg-[#fce7d6]", icon: FileText },
    { n: "Open-Meteo", d: "Live weather widget on every trip", tint: "bg-[#eef3fb]", icon: Globe },
    { n: "TBO / Agoda", d: "Hotel & flight rate inventory", tint: "bg-[#e6f2ec]", icon: Hotel },
    { n: "Pexels", d: "Free stock imagery for masters & itineraries", tint: "bg-[#fdece1]", icon: MapPin },
    { n: "GPT · Claude (BYO key)", d: "Optional secondary AI keys, stored in Data Administration", tint: "bg-[#fce7d6]", icon: Bot },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Integrations</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830] max-w-xl">Wired into everything your agency already uses</h2>
        </div>
        <p className="text-sm text-[#001830]/60 max-w-sm">First-class connectors for the tools Indian travel agencies actually use — with your own API keys stored safely in Data Administration.</p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {apps.map((a) => (
          <div key={a.n} className="rounded-2xl bg-white border border-[#001830]/8 p-5 hover:shadow-[0_20px_40px_-25px_rgba(0,24,48,0.25)] transition">
            <div className={`h-10 w-10 rounded-xl ${a.tint} grid place-items-center`}>
              <a.icon className="h-4 w-4 text-[#001830]" />
            </div>
            <div className="mt-4 text-sm font-semibold text-[#001830]">{a.n}</div>
            <div className="mt-1 text-xs text-[#001830]/60">{a.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// keep additional icon imports referenced
void CircleDot; void Star; void LineChart; void Bell; void MoreHorizontal;
void X;

/* ======================== ANALYTICS MOCKUP (2nd dashboard view) ======================== */
function AnalyticsMockup() {
  const donutSegments = [
    { c: "#48a890", v: 42, l: "Honeymoon" },
    { c: "#c04818", v: 28, l: "Family" },
    { c: "#001830", v: 18, l: "Corporate" },
    { c: "#f7c7a8", v: 12, l: "Solo" },
  ];
  let acc = 0;
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Analytics</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">
            Know exactly where your <span className="italic font-serif">revenue</span> comes from.
          </h2>
          <p className="mt-4 text-[#001830]/60 leading-relaxed max-w-md">
            Live dashboards for source attribution, agent leaderboards, seasonality, and margin per package. Filter by branch, agent, or destination in one click.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-[#001830]/75">
            {["Source & campaign attribution","Agent-wise conversion & AOV","Destination profitability","Exportable to CSV & Google Sheets"].map(x => (
              <li key={x} className="flex items-start gap-2"><Check className="h-4 w-4 text-[#48a890] mt-0.5 shrink-0" />{x}</li>
            ))}
          </ul>
          <Button asChild className="mt-8 rounded-full bg-[#001830] text-white hover:bg-[#001830]/90">
            <Link to="/features">Explore reports <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="relative rounded-[28px] overflow-hidden border border-white/60 shadow-[0_40px_80px_-40px_rgba(0,24,48,0.3)]">
          <SoftGradient />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-center gap-2 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#48a890]" />
              <span className="ml-3 text-[11px] font-mono text-[#001830]/50">app.trawe.in/reports</span>
            </div>
            <div className="rounded-2xl bg-white/95 backdrop-blur border border-white/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#001830]/50">Revenue breakdown</div>
                  <div className="text-lg font-semibold text-[#001830]">Q3 · FY26</div>
                </div>
                <div className="text-[11px] text-[#48a890] font-mono">▲ 24.6% YoY</div>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-6 items-center">
                {/* donut */}
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90">
                    {donutSegments.map((s, i) => {
                      const dash = (s.v / 100) * 100;
                      const off = 100 - acc;
                      acc += dash;
                      return (
                        <circle key={i} cx="21" cy="21" r="15.915" fill="transparent"
                          stroke={s.c} strokeWidth="6"
                          strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={off} />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="text-xl font-semibold text-[#001830] leading-none">₹84L</div>
                      <div className="text-[10px] text-[#001830]/50 mt-1 font-mono">total</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {donutSegments.map(s => (
                    <div key={s.l} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#001830]/70">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
                        {s.l}
                      </span>
                      <span className="font-mono text-[#001830]/80">{s.v}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-[#f7f4ef]/60 p-4">
                <div className="flex items-center justify-between text-[11px] text-[#001830]/60 mb-3">
                  <span>Top agents · this quarter</span><span>Bookings</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { n: "Priya S", v: 32, w: 92 },
                    { n: "Rahul M", v: 27, w: 78 },
                    { n: "Anjali K", v: 21, w: 60 },
                    { n: "Vikas T", v: 14, w: 42 },
                  ].map(a => (
                    <div key={a.n} className="flex items-center gap-3">
                      <div className="text-xs text-[#001830]/70 w-16">{a.n}</div>
                      <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#48a890] to-[#c04818]" style={{ width: `${a.w}%` }} />
                      </div>
                      <div className="text-xs font-mono text-[#001830]/70 w-6 text-right">{a.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ TEMPLATES GALLERY ============================ */
function TemplatesGallery() {
  const packs = [
    { d: "Bali", n: "6N/7D · Honeymoon", p: "₹1,84,500", tint: "bg-[#fce7d6]", emo: "🌴" },
    { d: "Kerala", n: "5N/6D · Backwaters", p: "₹98,000", tint: "bg-[#e6f2ec]", emo: "🛶" },
    { d: "Ladakh", n: "7N/8D · Adventure", p: "₹2,40,000", tint: "bg-[#eef3fb]", emo: "🏔" },
    { d: "Dubai", n: "4N/5D · Family", p: "₹1,62,000", tint: "bg-[#fdece1]", emo: "🕌" },
    { d: "Bhutan", n: "6N/7D · Culture", p: "₹1,45,500", tint: "bg-[#e6f2ec]", emo: "🏯" },
    { d: "Andaman", n: "5N/6D · Beach", p: "₹1,20,000", tint: "bg-[#eef3fb]", emo: "🏖" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Templates</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830] max-w-xl">
            Start from a template. Ship in minutes.
          </h2>
        </div>
        <p className="text-sm text-[#001830]/60 max-w-sm">120+ ready-to-edit itineraries across India and international destinations — cloned, priced, and branded to your agency.</p>
      </div>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map(p => (
          <div key={p.n} className={`rounded-3xl ${p.tint} border border-white/60 p-5`}>
            <div className="flex items-start justify-between">
              <div className="text-3xl">{p.emo}</div>
              <span className="rounded-full bg-white/70 text-[10px] font-mono px-2 py-0.5 text-[#001830]/60">Ready</span>
            </div>
            <div className="mt-6 text-lg font-semibold text-[#001830]">{p.d}</div>
            <div className="text-xs text-[#001830]/60">{p.n}</div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#001830]">{p.p}</div>
              <div className="inline-flex items-center gap-1 text-xs text-[#c04818] font-medium">Use template <ArrowRight className="h-3.5 w-3.5" /></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================================ COMPARISON ================================ */
function Comparison() {
  const rows = [
    { f: "Per-service Kanban pipelines", s: false, g: "Partial", t: true },
    { f: "GST-ready invoices with template picker", s: false, g: false, t: true },
    { f: "Real 2-way WhatsApp inbox (Meta + WasenderAPI)", s: false, g: "Add-on", t: true },
    { f: "Itinerary builder (IT + GIT) with PDF", s: "Manual", g: false, t: true },
    { f: "Stage-based automations + DOB greetings", s: false, g: "Add-on", t: true },
    { f: "Data Administration (export/backup/recycle bin)", s: false, g: "Partial", t: true },
    { f: "BYO AI keys (Gemini · GPT · Claude)", s: false, g: false, t: true },
    { f: "Made for Indian agencies (GST, INR, RBI KYC)", s: false, g: false, t: true },
  ];
  const cell = (v: boolean | string) => v === true
    ? <span className="inline-flex h-6 w-6 rounded-full bg-[#e6f2ec] text-[#48a890] items-center justify-center"><Check className="h-3.5 w-3.5" /></span>
    : v === false
    ? <span className="inline-flex h-6 w-6 rounded-full bg-[#fdece1] text-[#c04818] items-center justify-center"><X className="h-3.5 w-3.5" /></span>
    : <span className="text-xs text-[#001830]/60 font-mono">{v}</span>;
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Compare</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">
          Spreadsheets and generic CRMs weren't built for travel.
        </h2>
      </div>
      <div className="mt-12 rounded-3xl border border-[#001830]/10 bg-white overflow-hidden">
        <div className="grid grid-cols-4 text-sm">
          <div className="p-5 text-xs font-mono uppercase tracking-widest text-[#001830]/50">Feature</div>
          <div className="p-5 text-center text-xs font-mono uppercase tracking-widest text-[#001830]/50">Spreadsheets</div>
          <div className="p-5 text-center text-xs font-mono uppercase tracking-widest text-[#001830]/50">Generic CRM</div>
          <div className="p-5 text-center text-xs font-mono uppercase tracking-widest text-[#c04818] bg-[#fdece1]">TraWe</div>
          {rows.map((r, i) => (
            <div key={i} className="contents">
              <div className="p-5 border-t border-[#001830]/8 text-[#001830]/80">{r.f}</div>
              <div className="p-5 border-t border-[#001830]/8 text-center">{cell(r.s)}</div>
              <div className="p-5 border-t border-[#001830]/8 text-center">{cell(r.g)}</div>
              <div className="p-5 border-t border-[#001830]/8 text-center bg-[#fdece1]/40">{cell(r.t)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================ SECURITY BAND ================================ */
function SecurityBand() {
  const items = [
    { icon: ShieldCheck, t: "DPDP-aligned", d: "India's Digital Personal Data Protection Act — built in from day one." },
    { icon: Lock, t: "Row-level security", d: "Per-tenant isolation. Your data is invisible to every other agency on TraWe." },
    { icon: Database, t: "Encrypted at rest", d: "AES-256 encryption in the database, TLS 1.3 in transit, everywhere." },
    { icon: Server, t: "99.98% uptime", d: "Multi-region backups, hourly snapshots, and a public status page." },
    { icon: KeyRound, t: "SSO & audit log", d: "Google Workspace SSO on Business plan. Immutable audit trail for every write." },
    { icon: Palette, t: "Your brand, your data", d: "Own your logos, PDFs, and customer records. Export any time, no lock-in." },
  ];
  return (
    <section className="px-4 sm:px-6 py-20">
      <div className="relative mx-auto max-w-7xl rounded-[32px] overflow-hidden border border-white/60 p-8 sm:p-12">
        <SoftGradient />
        <div className="relative grid lg:grid-cols-[1fr_1.6fr] gap-10">
          <div>
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1 bg-white/60">Security</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">
              Trust, engineered in.
            </h2>
            <p className="mt-4 text-[#001830]/65 leading-relaxed max-w-sm">
              TraWe is built on hardened infrastructure with the same standards used by banks and fintechs. Your travelers' data stays private, portable, and yours.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full bg-white/80 border-white text-[#001830] hover:bg-white">
              <Link to="/dpdp">Read compliance <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map(it => (
              <div key={it.t} className="rounded-2xl bg-white/85 backdrop-blur border border-white/70 p-5">
                <div className="h-9 w-9 rounded-xl bg-[#001830] text-white grid place-items-center">
                  <it.icon className="h-4 w-4" />
                </div>
                <div className="mt-4 text-sm font-semibold text-[#001830]">{it.t}</div>
                <div className="mt-1 text-xs text-[#001830]/60 leading-relaxed">{it.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== MIGRATION CTA ============================== */
function MigrationCTA() {
  const steps = [
    { icon: Upload, t: "Import in one click", d: "Upload your Excel of leads, customers, and past bookings. We map columns automatically." },
    { icon: PlayCircle, t: "White-glove onboarding", d: "A TraWe specialist sets up your rate book, WhatsApp templates, and GST profile — free on Pro and Business." },
    { icon: Rocket, t: "Live in 48 hours", d: "Most agencies send their first branded quote from TraWe within two working days." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#001830]/60 border border-[#001830]/15 rounded-full px-3 py-1">Migration</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[#001830]">
          Switching is the easy part.
        </h2>
        <p className="mt-3 text-[#001830]/60">From spreadsheets, Zoho, HubSpot, or another travel CRM — we handle the migration for you.</p>
      </div>
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={s.t} className="rounded-3xl bg-white border border-[#001830]/10 p-7 relative overflow-hidden">
            <div className="absolute top-4 right-5 text-6xl font-serif text-[#001830]/5 leading-none">0{i + 1}</div>
            <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-[#48a890] to-[#001830] text-white grid place-items-center">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="relative mt-6 text-lg font-semibold text-[#001830]">{s.t}</div>
            <p className="relative mt-2 text-sm text-[#001830]/60 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
