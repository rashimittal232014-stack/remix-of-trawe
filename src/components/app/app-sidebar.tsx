import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/crm.functions";
import {
  LayoutDashboard, Users, Kanban, FileText, Receipt, Wallet, CalendarClock,
  Megaphone, FormInput, Zap, Database, BarChart3, Settings, Globe, Plane,
  Hotel, Building2, ClipboardList, Sparkles, CheckSquare, Package,
  CalendarCheck, Target, Shield, Mail, StickyNote, ChevronsLeft, ChevronsRight,
  MessageCircle, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarState } from "./sidebar-context";
import traweLogoAsset from "@/assets/trawe-logo.png.asset.json";
const traweLogo = traweLogoAsset.url;

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const groups: { label: string; items: Item[] }[] = [
  { label: "Workspace", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/activities", label: "Activities", icon: CalendarClock },
    { to: "/tasks", label: "Tasks", icon: CheckSquare },
  ]},
  { label: "Sales", items: [
    { to: "/leads", label: "Queries", icon: Kanban },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/companies", label: "Companies (B2B)", icon: Building2 },
    { to: "/packages", label: "Tour Packages", icon: Package },
    { to: "/quotations", label: "Quotations", icon: FileText },
    { to: "/itineraries", label: "Itineraries", icon: Sparkles },
    { to: "/bookings", label: "Bookings", icon: ClipboardList },
    { to: "/invoices", label: "Invoices", icon: Receipt },
  ]},
  { label: "Communicate", items: [
    { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { to: "/mail", label: "Mail Inbox", icon: Mail },
    { to: "/notes", label: "Notes", icon: StickyNote },
  ]},
  { label: "Ops", items: [
    { to: "/payments", label: "Payments", icon: Wallet },
    { to: "/vouchers", label: "Vouchers", icon: FileText },
    { to: "/wallet", label: "Wallet & Credits", icon: Wallet },
  ]},
  { label: "HR & Org", items: [
    { to: "/branches", label: "Branches", icon: Building2 },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/targets", label: "Sales Targets", icon: Target },
    { to: "/roles", label: "Roles & Permissions", icon: Shield },
  ]},
  { label: "Marketing", items: [
    { to: "/marketing", label: "Marketing Hub", icon: Megaphone },
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
    { to: "/subscription", label: "Subscription", icon: CreditCard },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { collapsed, toggle } = useSidebarState();
  const tenant = me?.tenant as { name?: string; logo_url?: string | null } | null | undefined;
  const agencyName = tenant?.name || "Your Workspace";
  const initials = agencyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "TW";
  return (
    <aside className={cn(
      "hidden lg:flex fixed inset-y-0 left-0 flex-col border-r bg-card/80 backdrop-blur-xl z-40 transition-[width] duration-200",
      collapsed ? "w-16" : "w-64",
    )}>
      <div className="relative">
        <Link to="/dashboard" className={cn("pt-4 pb-3 flex items-center justify-center", collapsed ? "px-2" : "px-5")}>
          <img src={traweLogo} alt="TraWe" className={cn("w-auto object-contain", collapsed ? "h-7" : "h-8")} />
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-5 grid place-items-center h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className={cn("border-t border-border/40", collapsed ? "mx-2" : "mx-5")} />
      <Link
        to="/settings"
        title={collapsed ? agencyName : undefined}
        className={cn(
          "mx-3 mt-3 mb-2 flex items-center rounded-xl border border-border/50 bg-background/60 hover:bg-accent/40 transition-colors",
          collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5",
        )}
      >
        {tenant?.logo_url ? (
          <img
            src={tenant.logo_url}
            alt={agencyName}
            className="h-10 w-10 rounded-lg object-cover border bg-white"
          />
        ) : (
          <div className="grid place-items-center h-10 w-10 rounded-lg bg-primary/10 text-primary text-sm font-semibold border">
            {initials}
          </div>
        )}
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Workspace</div>
            <div className="text-sm font-semibold truncate leading-tight">{agencyName}</div>
            {!tenant?.logo_url && (
              <div className="text-[10px] text-primary/80 truncate">Upload logo →</div>
            )}
          </div>
        )}
      </Link>
      <nav className={cn("flex-1 overflow-y-auto pb-6 space-y-4", collapsed ? "px-2" : "px-3")}>
        {groups.map((g) => (
          <div key={g.label}>
            {!collapsed && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1">{g.label}</div>
            )}
            {collapsed && <div className="h-px bg-border/40 mx-1 my-2" />}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.to || pathname.startsWith(it.to + "/");
                const Icon = it.icon;
                return (
                  <li key={`${it.to}-${it.label}`}>
                    <Link
                      to={it.to}
                      title={collapsed ? it.label : undefined}
                      className={cn(
                        "flex items-center rounded-lg text-sm transition-colors",
                        collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
                        active ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent/40 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
