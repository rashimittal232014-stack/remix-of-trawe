import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Item = { description: string; hsn_sac?: string | null; qty: number; rate: number; discount: number; tax_rate: number };
type Invoice = {
  code?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  place_of_supply?: string | null;
  gst_mode?: "cgst_sgst" | "igst" | "none" | string | null;
  currency?: string | null;
  status?: string | null;
  notes?: string | null;
  terms?: string | null;
  total?: number | string | null;
  amount_paid?: number | string | null;
  customers?: { full_name?: string | null; email?: string | null; phone?: string | null; gstin?: string | null; address?: string | null } | null;
  invoice_items?: Item[];
  tenant?: {
    name?: string | null; email?: string | null; phone?: string | null; address?: string | null;
    gst_no?: string | null; pan_no?: string | null; logo_url?: string | null; primary_color?: string | null;
    invoice_template?: string | null;
  } | null;
  bank_accounts?: { label?: string | null; bank_name?: string | null; account_number?: string | null; ifsc?: string | null } | null;
};

function fmt(n: number, cur = "INR") {
  const v = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n));
  return `${cur} ${n < 0 ? "-" : ""}${v}`;
}

// Convert INR amount to Indian-format words (rough but readable)
function numToWords(num: number): string {
  if (!isFinite(num)) return "";
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const words = inWords(rupees);
  const p = paise ? ` and ${inWords(paise)} Paise` : "";
  return `INR ${words} Rupees${p} Only`;
}
function inWords(n: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number): string => x < 20 ? a[x] : `${b[Math.floor(x / 10)]}${x % 10 ? " " + a[x % 10] : ""}`;
  const three = (x: number): string => x >= 100 ? `${a[Math.floor(x / 100)]} Hundred${x % 100 ? " " + two(x % 100) : ""}` : two(x);
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thou = Math.floor(n / 1000); n %= 1000;
  const rest = n;
  return [crore && `${two(crore)} Crore`, lakh && `${two(lakh)} Lakh`, thou && `${two(thou)} Thousand`, rest && three(rest)].filter(Boolean).join(" ").trim();
}

function hexToRgb(hex?: string | null): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 24, 48];
}

export async function downloadInvoicePdf(inv: Invoice) {
  const template = (inv.tenant?.invoice_template || "travel").toLowerCase();
  if (template === "classic") return renderClassic(inv);
  return renderTravel(inv);
}

async function renderTravel(inv: Invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const t = inv.tenant || {};
  const [pr, pg, pb] = hexToRgb(t.primary_color);
  const cur = inv.currency || "INR";

  // Top brand ribbon (TraWe blue → green split)
  doc.setFillColor(pr, pg, pb).rect(0, 0, W / 2, 8, "F");
  doc.setFillColor(52, 168, 144).rect(W / 2, 0, W / 2, 8, "F");

  // Try embed logo
  let logoOffset = 0;
  if (t.logo_url) {
    try {
      const dataUrl = await urlToDataUrl(t.logo_url);
      if (dataUrl) { doc.addImage(dataUrl, "PNG", M, 30, 50, 50); logoOffset = 60; }
    } catch { /* ignore */ }
  }

  // Header: brand name + address left, "TAX INVOICE" right
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold").setFontSize(16).text(t.name || "TraWe", M + logoOffset, 50);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  const addr = [t.address, [t.phone, t.email].filter(Boolean).join(" · "), t.gst_no ? `GSTIN: ${t.gst_no}` : ""].filter(Boolean);
  addr.forEach((l, i) => doc.text(String(l), M + logoOffset, 66 + i * 12));

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(pr, pg, pb).text("TAX INVOICE", W - M, 50, { align: "right" });
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(pr, pg, pb).text(inv.code || "—", W - M, 70, { align: "right" });

  // Bill To / Invoice Info panels
  let y = 120;
  const colW = (W - M * 2 - 12) / 2;
  panel(doc, M, y, colW, 96, "BILL TO");
  const c = inv.customers || {};
  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(11).text(c.full_name || "—", M + 12, y + 40);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  const bill = [c.phone, c.email, c.gstin ? `GSTIN: ${c.gstin}` : "", c.address].filter(Boolean);
  bill.forEach((l, i) => doc.text(String(l), M + 12, y + 56 + i * 11));

  panel(doc, M + colW + 12, y, colW, 96, "INVOICE INFO");
  const info: [string, string][] = [
    ["Invoice Date", inv.invoice_date || "—"],
    ["Due Date", inv.due_date || "—"],
    ["Status", (inv.status || "unpaid").toUpperCase()],
    ["Currency", cur],
  ];
  info.forEach(([k, v], i) => {
    const yy = y + 40 + i * 14;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100).text(k, M + colW + 24, yy);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42).text(v, M + colW * 2 + 4, yy, { align: "right" });
  });

  y += 116;

  // Line items table
  const items = inv.invoice_items ?? [];
  const rows = items.map((it, i) => {
    const taxable = Math.max(0, Number(it.qty) * Number(it.rate) - Number(it.discount || 0));
    return [
      String(i + 1),
      it.description || "—",
      it.hsn_sac || "",
      String(it.qty),
      fmt(Number(it.rate), cur),
      fmt(Number(it.discount || 0), cur),
      `${it.tax_rate || 0}%`,
      fmt(taxable + (taxable * Number(it.tax_rate || 0)) / 100, cur),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Particulars", "HSN/SAC", "Qty", "Rate", "Disc", "Tax", "Amount"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 7, lineColor: [230, 232, 240], textColor: [30, 41, 59] },
    headStyles: { fillColor: [pr, pg, pb], textColor: 255, fontStyle: "bold", halign: "left" },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      2: { cellWidth: 60 },
      3: { cellWidth: 40, halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { cellWidth: 40, halign: "right" },
      7: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
  });

  // Totals
  const totals = items.reduce((a, it) => {
    const taxable = Math.max(0, Number(it.qty) * Number(it.rate) - Number(it.discount || 0));
    return { sub: a.sub + taxable, tax: a.tax + (taxable * Number(it.tax_rate || 0)) / 100 };
  }, { sub: 0, tax: 0 });
  const grand = Number(inv.total ?? totals.sub + totals.tax);
  const paid = Number(inv.amount_paid ?? 0);
  const cgst = inv.gst_mode === "cgst_sgst" ? totals.tax / 2 : 0;
  const sgst = inv.gst_mode === "cgst_sgst" ? totals.tax / 2 : 0;
  const igst = inv.gst_mode === "igst" ? totals.tax : 0;

  const endY = (doc as any).lastAutoTable.finalY + 24;
  const boxW = 240;
  const boxX = W - M - boxW;
  const rowsSum: [string, string, boolean?][] = [
    ["Sub Total", fmt(totals.sub, cur)],
  ];
  if (cgst) rowsSum.push(["CGST", fmt(cgst, cur)]);
  if (sgst) rowsSum.push(["SGST", fmt(sgst, cur)]);
  if (igst) rowsSum.push(["IGST", fmt(igst, cur)]);
  rowsSum.push(["Tax Total", fmt(totals.tax, cur)]);
  rowsSum.push(["Grand Total", fmt(grand, cur), true]);
  rowsSum.push(["Paid", fmt(paid, cur)]);
  rowsSum.push(["Balance Due", fmt(grand - paid, cur)]);

  const rowH = 20;
  rowsSum.forEach(([k, v, bold], i) => {
    const yy = endY + i * rowH;
    if (bold) { doc.setFillColor(pr, pg, pb).rect(boxX, yy - 14, boxW, rowH, "F"); doc.setTextColor(255); }
    else { doc.setFillColor(i % 2 ? 249 : 255, i % 2 ? 250 : 255, i % 2 ? 252 : 255).rect(boxX, yy - 14, boxW, rowH, "F"); doc.setTextColor(30, 41, 59); }
    doc.setDrawColor(230, 232, 240).rect(boxX, yy - 14, boxW, rowH);
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(10);
    doc.text(k, boxX + 12, yy);
    doc.text(v, boxX + boxW - 12, yy, { align: "right" });
  });

  // Amount in words (left column, aligned with totals)
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42).text("AMOUNT IN WORDS", M, endY);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80);
  const words = doc.splitTextToSize(numToWords(grand), boxX - M - 20);
  doc.text(words, M, endY + 14);

  // Bank + Notes + Terms below both columns
  let ny = Math.max(endY + rowsSum.length * rowH, endY + 14 + words.length * 11) + 24;
  if (inv.bank_accounts) {
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42).text("BANK DETAILS", M, ny);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80);
    const b = inv.bank_accounts;
    const bl = [b.bank_name && `Bank: ${b.bank_name}`, b.account_number && `A/C: ${b.account_number}`, b.ifsc && `IFSC: ${b.ifsc}`, b.label && `(${b.label})`].filter(Boolean) as string[];
    doc.text(bl.join("   ·   "), M, ny + 14);
    ny += 34;
  }
  if (inv.terms) { ny = block(doc, "TERMS & CONDITIONS", inv.terms, M, ny, W - M * 2); }
  if (inv.notes) { ny = block(doc, "NOTES", inv.notes, M, ny, W - M * 2); }

  // Signature
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  doc.text("Authorized Signatory", W - M, H - 70, { align: "right" });
  doc.setDrawColor(200).line(W - M - 140, H - 55, W - M, H - 55);
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42).text(t.name || "TraWe", W - M, H - 42, { align: "right" });

  // Footer
  doc.setDrawColor(230).line(M, H - 30, W - M, H - 30);
  doc.setFontSize(8).setTextColor(140).text("Powered by TraWe · trawe.in", W / 2, H - 18, { align: "center" });

  doc.save(`${inv.code || "invoice"}.pdf`);
}

function panel(doc: jsPDF, x: number, y: number, w: number, h: number, title: string) {
  doc.setFillColor(248, 250, 252).rect(x, y, w, h, "F");
  doc.setDrawColor(230, 232, 240).rect(x, y, w, h);
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(120).text(title, x + 12, y + 18);
}

function block(doc: jsPDF, title: string, body: string, x: number, y: number, w: number): number {
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42).text(title, x, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80);
  const lines = doc.splitTextToSize(body, w);
  doc.text(lines, x, y + 14);
  return y + 20 + lines.length * 11;
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = () => resolve(null); r.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ============ CLASSIC layout: minimal black/white, compact, no colored ribbons ============
async function renderClassic(inv: Invoice) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const t = inv.tenant || {};
  const cur = inv.currency || "INR";

  // Simple header — no ribbon
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(20).text("INVOICE", M, 60);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100).text(inv.code || "—", M, 78);

  // Right block: company block
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(20).text(t.name || "TraWe", W - M, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  [t.address, [t.phone, t.email].filter(Boolean).join(" · "), t.gst_no ? `GSTIN: ${t.gst_no}` : ""].filter(Boolean)
    .forEach((l, i) => doc.text(String(l), W - M, 76 + i * 12, { align: "right" }));

  // Divider
  doc.setDrawColor(220).line(M, 110, W - M, 110);

  // Bill To
  const c = inv.customers || {};
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(120).text("BILL TO", M, 130);
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20).text(c.full_name || "—", M, 148);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
  [c.phone, c.email, c.gstin ? `GSTIN: ${c.gstin}` : "", c.address].filter(Boolean)
    .forEach((l, i) => doc.text(String(l), M, 164 + i * 11));

  // Meta right column
  const meta: [string, string][] = [
    ["Invoice Date", inv.invoice_date || "—"],
    ["Due Date", inv.due_date || "—"],
    ["Status", (inv.status || "unpaid").toUpperCase()],
    ["Currency", cur],
  ];
  meta.forEach(([k, v], i) => {
    const yy = 130 + i * 16;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120).text(k, W - M - 140, yy);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(20).text(v, W - M, yy, { align: "right" });
  });

  // Line items
  const items = inv.invoice_items ?? [];
  const rows = items.map((it, i) => {
    const taxable = Math.max(0, Number(it.qty) * Number(it.rate) - Number(it.discount || 0));
    return [
      String(i + 1), it.description || "—", String(it.qty),
      fmt(Number(it.rate), cur), `${it.tax_rate || 0}%`,
      fmt(taxable + (taxable * Number(it.tax_rate || 0)) / 100, cur),
    ];
  });

  autoTable(doc, {
    startY: 240,
    head: [["#", "Description", "Qty", "Rate", "Tax", "Amount"]],
    body: rows,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 8, textColor: [30, 30, 30] },
    headStyles: { fillColor: [245, 245, 245], textColor: [60, 60, 60], fontStyle: "bold", lineWidth: 0.5, lineColor: [220, 220, 220] },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { halign: "right" },
      4: { cellWidth: 50, halign: "right" },
      5: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: M, right: M },
  });

  // Totals — right aligned simple stack
  const totals = items.reduce((a, it) => {
    const taxable = Math.max(0, Number(it.qty) * Number(it.rate) - Number(it.discount || 0));
    return { sub: a.sub + taxable, tax: a.tax + (taxable * Number(it.tax_rate || 0)) / 100 };
  }, { sub: 0, tax: 0 });
  const grand = Number(inv.total ?? totals.sub + totals.tax);
  const paid = Number(inv.amount_paid ?? 0);

  let ey = (doc as any).lastAutoTable.finalY + 24;
  const stack: [string, string, boolean?][] = [
    ["Subtotal", fmt(totals.sub, cur)],
    ["Tax", fmt(totals.tax, cur)],
    ["Total", fmt(grand, cur), true],
    ["Paid", fmt(paid, cur)],
    ["Balance Due", fmt(grand - paid, cur), true],
  ];
  stack.forEach(([k, v, bold]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 11 : 10).setTextColor(bold ? 20 : 90);
    doc.text(k, W - M - 160, ey);
    doc.text(v, W - M, ey, { align: "right" });
    ey += 16;
  });

  // Notes/terms below
  ey += 12;
  if (inv.notes) {
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(20).text("NOTES", M, ey);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
    const l = doc.splitTextToSize(inv.notes, W - M * 2); doc.text(l, M, ey + 14); ey += 20 + l.length * 11;
  }
  if (inv.terms) {
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(20).text("TERMS", M, ey);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
    const l = doc.splitTextToSize(inv.terms, W - M * 2); doc.text(l, M, ey + 14);
  }

  // Footer
  doc.setDrawColor(230).line(M, H - 30, W - M, H - 30);
  doc.setFontSize(8).setTextColor(140).text("Powered by TraWe · trawe.in", W / 2, H - 18, { align: "center" });

  doc.save(`${inv.code || "invoice"}.pdf`);
}