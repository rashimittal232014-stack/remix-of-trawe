import { type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { SidebarProvider, useSidebarState } from "./sidebar-context";
import { MobileTopBar, MobileBottomNav } from "./mobile-nav";
import { SubscriptionBanners, SubscriptionLock } from "./subscription-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarState();
  return (
    <div
      className="app-shell relative min-h-screen text-[#0f172a] overflow-x-clip bg-[#fafbfc]"
      style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}
    >
      <AppSidebar />
      <MobileTopBar />
      <div className={collapsed ? "lg:pl-16 transition-[padding] duration-200" : "lg:pl-64 transition-[padding] duration-200"}>
        <div className="hidden lg:block"><AppTopbar /></div>
        <main className="p-4 sm:p-6 lg:p-8 pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-8">
          <SubscriptionBanners />
          <div className="mt-3">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
      <SubscriptionLock />
    </div>
  );
}
