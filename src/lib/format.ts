export function inr(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  if (!isFinite(v)) return "₹0";
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function inr2(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function shortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export const formatCurrency = inr;
