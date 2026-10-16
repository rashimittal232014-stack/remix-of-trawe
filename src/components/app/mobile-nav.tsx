import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, LayoutDashboard, Kanban, FileText, MessageCircle, MoreHorizontal, Plane, Search, Bell, Plus, Hotel as HotelIcon } from "lucide-react";
import { FlightModal, HotelModal } from "./app-topbar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard as Dash, Users, FileText as FileIcon, Receipt, Wallet, CalendarClock,
  Megaphone, FormInput, Zap, Database, BarChart3, Settings, Globe, Hotel, Building2,
  ClipboardList, Sparkles, CheckSquare, Package, CalendarCheck, Target, Shield, Mail,
  StickyNote, MessageCircle as WA,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import traweLogoAsset from "@/assets/trawe-logo.png.asset.json";
const traweLogo = traweLogoAsset.url;

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const groups: { label: string; items: Item[] }[] = [
  { label: "Workspace", items: [
    { to: "/dashboard", label: "Dashboard", icon: Dash },
    { to: "/activities", label: "Activities", icon: CalendarClock },
    { to: "/tasks", label: "Tasks", icon: CheckSquare },
  ]},
  { label: "Sales", items: [
    { to: "/leads", label: "Queries", icon: Kanban },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/companies", label: "Companies", icon: Building2 },
    { to: "/packages", label: "Packages", icon: Package },
    { to: "/quotations", label: "Quotations", icon: FileIcon },
    { to: "/itineraries", label: "Itineraries", icon: Sparkles },
    { to: "/bookings", label: "Bookings", icon: ClipboardList },
    { to: "/invoices", label: "Invoices", icon: Receipt },
  ]},
  { label: "Communicate", items: [
    { to: "/whatsapp", label: "WhatsApp", icon: WA },
    { to: "/mail", label: "Mail Inbox", icon: Mail },
    { to: "/notes", label: "Notes", icon: StickyNote },
  ]},
  { label: "Ops", items: [
    { to: "/payments", label: "Payments", icon: Wallet },
    { to: "/vouchers", label: "Vouchers", icon: FileIcon },
    { to: "/wallet", label: "Wallet", icon: Wallet },
  ]},
  { label: "HR & Org", items: [
    { to: "/branches", label: "Branches", icon: Building2 },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/targets", label: "Targets", icon: Target },
    { to: "/roles", label: "Roles", icon: Shield },
  ]},
  { label: "Marketing", items: [
    { to: "/marketing", label: "Marketing", icon: Megaphone },
    { to: "/forms", label: "Forms", icon: FormInput },
    { to: "/automations", label: "Automations", icon: Zap },
  ]},
  { label: "Masters", items: [
    { to: "/masters", label: "Travel Masters", icon: Database },
    { to: "/masters", label: "Hotels & Suppliers", icon: Hotel },
  ]},
  { label: "Insights", items: [
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/website", label: "Website", icon: Globe },
    { to: "/settings", label: "Settings", icon: Settings },
  ]},
];

const bottomTabs: Item[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/leads", label: "Queries", icon: Kanban },
  { to: "/quotations", label: "Quotes", icon: FileText },
  { to: "/whatsapp", label: "Chat", icon: MessageCircle },
];

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const [flight, setFlight] = useState(false);
  const [hotel, setHotel] = useState(false);
  return (
    <div className="lg:hidden sticky top-0 z-40 flex items-center gap-1 h-14 px-3 border-b border-[#e8ecf1] bg-white/95 backdrop-blur-xl">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="grid place-items-center h-9 w-9 rounded-lg hover:bg-accent" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <img src={traweLogo} alt="TraWe" className="h-7 w-auto" />
            </SheetTitle>
          </SheetHeader>
          <MobileNavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
        <img src={traweLogo} alt="TraWe" className="h-6 w-auto" />
      </Link>
      <div className="ml-auto flex items-center gap-0.5">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="grid place-items-center h-9 w-9 rounded-lg hover:bg-accent" aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => setFlight(true)} className="grid place-items-center h-9 w-9 rounded-lg hover:bg-accent" aria-label="Flight search">
          <Plane className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => setHotel(true)} className="grid place-items-center h-9 w-9 rounded-lg hover:bg-accent" aria-label="Hotel search">
          <HotelIcon className="h-[18px] w-[18px]" />
        </button>
        <Link to="/activities" className="grid place-items-center h-9 w-9 rounded-lg hover:bg-accent" aria-label="Reminders">
          <Bell className="h-[18px] w-[18px]" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 ml-1" aria-label="New">
              <Plus className="h-[18px] w-[18px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild><Link to="/leads">New Query</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/quotations">New Quotation</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/invoices">New Invoice</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/activities">New Task</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/companies">New Company</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/mail">Compose Mail</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/notes">New Note</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <FlightModal open={flight} onOpenChange={setFlight} />
      <HotelModal open={hotel} onOpenChange={setHotel} />
    </div>
  );
}

function MobileNavList({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 pb-24">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1">{g.label}</div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = pathname === it.to || pathname.startsWith(it.to + "/");
              const Icon = it.icon;
              return (
                <li key={`${it.to}-${it.label}`}>
                  <Link
                    to={it.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm min-h-[44px]",
                      active ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-accent/50",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#e8ecf1] bg-white/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-16">
          {bottomTabs.map((t) => {
            const active = pathname === t.to || pathname.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </Link>
            );
          })}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
              <SheetHeader className="px-5 py-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-primary" /> All modules
                </SheetTitle>
              </SheetHeader>
              <MobileNavList onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}