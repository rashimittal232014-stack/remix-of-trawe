import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = { collapsed: boolean; toggle: () => void; setCollapsed: (v: boolean) => void };
const SidebarCtx = createContext<Ctx | null>(null);
const KEY = "trawe:sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);
  const update = useCallback((v: boolean) => {
    setCollapsed(v);
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch {}
  }, []);
  const toggle = useCallback(() => update(!collapsed), [collapsed, update]);
  return (
    <SidebarCtx.Provider value={{ collapsed, toggle, setCollapsed: update }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) return { collapsed: false, toggle: () => {}, setCollapsed: () => {} } as Ctx;
  return ctx;
}