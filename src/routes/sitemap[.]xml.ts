import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PRODUCTS } from "@/lib/products-data";

const BASE = "https://trawe.in";
const paths = [
  { p: "/", pri: "1.0", cf: "weekly" as const },
  { p: "/features", pri: "0.8", cf: "monthly" as const },
  
  { p: "/contact", pri: "0.6", cf: "monthly" as const },
  { p: "/auth", pri: "0.4", cf: "yearly" as const },
  { p: "/products", pri: "0.9", cf: "monthly" as const },
  { p: "/travel-website-development", pri: "0.8", cf: "monthly" as const },
  { p: "/services", pri: "0.9", cf: "monthly" as const },
  { p: "/about", pri: "0.8", cf: "monthly" as const },
  { p: "/compare", pri: "0.8", cf: "monthly" as const },
  ...PRODUCTS.map((x) => ({ p: `/products/${x.slug}`, pri: "0.8", cf: "monthly" as const })),
];

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: async () => {
    const urls = paths.map((e) => `  <url>\n    <loc>${BASE}${e.p}</loc>\n    <changefreq>${e.cf}</changefreq>\n    <priority>${e.pri}</priority>\n  </url>`).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
  } } },
});