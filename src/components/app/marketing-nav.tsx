import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { PRODUCTS, EXTRA_NAV_PRODUCTS } from "@/lib/products-data";

const LINKS = [
  { to: "/features", label: "Features" },
  { to: "/services", label: "Services" },
  { to: "/compare", label: "Compare" },
  
  { to: "/about", label: "About" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setProducts(false); setMobileProducts(false); }, [path]);

  const openMenu = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setProducts(true); };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setProducts(false), 120); };

  const productsActive = path.startsWith("/products") || path === "/travel-website-development";
  const pillBase = "relative rounded-full px-4 py-1.5 text-sm font-medium transition";
  const pillOn = "bg-[#001830] text-white shadow-[0_8px_20px_-8px_rgba(0,24,48,0.5)]";
  const pillOff = "text-[#001830]/70 hover:text-[#001830] hover:bg-[#001830]/5";

  return (
    <div className="sticky top-0 z-50 w-full">
      <header
        className={`w-full transition-all duration-300 border-b ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-[#001830]/10 shadow-[0_12px_30px_-22px_rgba(0,24,48,0.35)]"
            : "bg-white/70 backdrop-blur-md border-transparent"
        }`}
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Logo className="h-7 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Products mega dropdown */}
            <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
              <button
                type="button"
                onClick={() => setProducts((v) => !v)}
                className={`${pillBase} inline-flex items-center gap-1 ${productsActive || products ? pillOn : pillOff}`}
                aria-expanded={products}
              >
                Products
                <ChevronDown className={`h-3.5 w-3.5 transition ${products ? "rotate-180" : ""}`} />
              </button>

              {products && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[720px]">
                  <div className="rounded-3xl border border-[#001830]/10 bg-white shadow-[0_40px_90px_-50px_rgba(0,24,48,0.55)] p-4">
                    <div className="grid grid-cols-2 gap-1">
                      {PRODUCTS.map((p) => (
                        <Link
                          key={p.slug}
                          to="/products/$slug"
                          params={{ slug: p.slug }}
                          className="flex items-start gap-3 rounded-2xl p-3 hover:bg-[#001830]/5 transition"
                        >
                          <span className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
                            <p.icon className="h-4 w-4 text-primary" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[#001830]">{p.name}</span>
                            <span className="block text-xs text-[#001830]/60 leading-snug">{p.navBlurb}</span>
                          </span>
                        </Link>
                      ))}
                      {EXTRA_NAV_PRODUCTS.map((p) => (
                        <Link key={p.to} to={p.to} className="flex items-start gap-3 rounded-2xl p-3 hover:bg-[#001830]/5 transition">
                          <span className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-accent/15 grid place-items-center">
                            <p.icon className="h-4 w-4 text-primary" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[#001830]">{p.label}</span>
                            <span className="block text-xs text-[#001830]/60 leading-snug">{p.blurb}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#001830]/[0.04] px-4 py-3">
                      <span className="text-xs text-[#001830]/70">One platform — every module shares the same database.</span>
                      <Link to="/products" className="text-xs font-medium text-[#001830] inline-flex items-center gap-1">
                        All products <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {LINKS.map((l) => {
              const active = path === l.to || path.startsWith(l.to + "/");
              return (
                <Link key={l.to} to={l.to} className={`${pillBase} ${active ? pillOn : pillOff}`}>
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <a
              href="tel:+919311784451"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-[#001830]/75 hover:text-[#001830] hover:bg-[#001830]/5 transition"
            >
              +91 93117 84451
            </a>
            <Button
              asChild
              size="sm"
              className="rounded-full h-10 pl-4 pr-2 gap-2 bg-[#001830] text-white hover:bg-[#001830]/90 shadow-[0_10px_25px_-10px_rgba(0,24,48,0.6)]"
            >
              <Link to="/request-demo">
                <span className="text-sm font-medium">Get Live Demo</span>
                <span className="grid place-items-center h-7 w-7 rounded-full bg-[#c04818]">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </span>
              </Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden rounded-full border border-[#001830]/10 bg-white/70 p-2 text-[#001830] hover:bg-white transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile sheet */}
        {open && (
          <div className="md:hidden border-t border-[#001830]/10 bg-white/95 backdrop-blur-xl max-h-[75vh] overflow-y-auto">
            <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setMobileProducts((v) => !v)}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  productsActive ? "bg-[#001830] text-white" : "text-[#001830]/75 hover:bg-[#001830]/5"
                }`}
              >
                Products
                <ChevronDown className={`h-4 w-4 transition ${mobileProducts ? "rotate-180" : ""}`} />
              </button>
              {mobileProducts && (
                <div className="pl-2 flex flex-col gap-0.5 pb-1">
                  {PRODUCTS.map((p) => (
                    <Link
                      key={p.slug}
                      to="/products/$slug"
                      params={{ slug: p.slug }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#001830]/80 hover:bg-[#001830]/5"
                    >
                      <span className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <p.icon className="h-4 w-4 text-primary" />
                      </span>
                      {p.name}
                    </Link>
                  ))}
                  {EXTRA_NAV_PRODUCTS.map((p) => (
                    <Link key={p.to} to={p.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#001830]/80 hover:bg-[#001830]/5">
                      <span className="h-8 w-8 rounded-lg bg-accent/15 grid place-items-center shrink-0">
                        <p.icon className="h-4 w-4 text-primary" />
                      </span>
                      {p.label}
                    </Link>
                  ))}
                  <Link to="/products" className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary">
                    All products →
                  </Link>
                </div>
              )}

              {LINKS.map((l) => {
                const active = path === l.to || path.startsWith(l.to + "/");
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active ? "bg-[#001830] text-white" : "text-[#001830]/75 hover:bg-[#001830]/5 hover:text-[#001830]"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <div className="mt-2 pt-3 border-t border-[#001830]/10 flex items-center justify-between gap-2">
                <a href="tel:+919311784451" className="rounded-full px-4 py-2 text-sm font-medium text-[#001830]/75">
                  +91 93117 84451
                </a>
                <Button asChild size="sm" className="rounded-full h-10 pl-4 pr-2 gap-2 bg-[#001830] text-white hover:bg-[#001830]/90">
                  <Link to="/request-demo">
                    <span className="text-sm font-medium">Get Live Demo</span>
                    <span className="grid place-items-center h-7 w-7 rounded-full bg-[#c04818]">
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </span>
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
