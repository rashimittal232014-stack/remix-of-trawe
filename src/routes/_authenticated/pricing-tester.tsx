import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/pricing-tester")({
  head: () => ({ meta: [{ title: "Pricing Tester — TraWe" }, { name: "robots", content: "noindex" }] }),
  component: PricingTester,
});

function PricingTester() {
  const [subtotal, setSubtotal] = useState(100000);
  const [markupType, setMarkupType] = useState<"flat" | "percent">("flat");
  const [markupValue, setMarkupValue] = useState(2500);
  const [gstApplyOn, setGstApplyOn] = useState<"total" | "markup">("total");
  const [igst, setIgst] = useState(5);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [tcs, setTcs] = useState(0);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const r = useMemo(() => {
    const markup = markupType === "percent" ? subtotal * markupValue / 100 : markupValue;
    const taxable = subtotal + markup;
    const gstBase = gstApplyOn === "markup" ? markup : taxable;
    const igstAmt = gstBase * igst / 100;
    const cgstAmt = gstBase * cgst / 100;
    const sgstAmt = gstBase * sgst / 100;
    const tax = igstAmt + cgstAmt + sgstAmt;
    const tcsAmt = taxable * tcs / 100;
    const total = taxable + tax + tcsAmt;
    return { markup, taxable, gstBase, igstAmt, cgstAmt, sgstAmt, tax, tcsAmt, total };
  }, [subtotal, markupType, markupValue, gstApplyOn, igst, cgst, sgst, tcs]);

  const fmt = (n: number) => `INR ${n.toFixed(2)}`;

  return (
    <div className="p-4 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pricing Calculation Tester</h1>
        <p className="text-sm text-muted-foreground">Mirrors the itinerary sidebar formula. Use to verify saved totals.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Subtotal (sum of services)"><Input type="number" value={subtotal} onChange={(e) => setSubtotal(Number(e.target.value))} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Markup Type">
                <Select value={markupType} onValueChange={(v) => setMarkupType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="flat">Flat</SelectItem><SelectItem value="percent">Percent</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Markup Value"><Input type="number" value={markupValue} onChange={(e) => setMarkupValue(Number(e.target.value))} /></Field>
            </div>
            <Field label="GST Apply On">
              <Select value={gstApplyOn} onValueChange={(v) => setGstApplyOn(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="total">GST on Total (Subtotal + Markup)</SelectItem><SelectItem value="markup">GST on Markup only</SelectItem></SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-4 gap-2">
              <Field label="IGST %"><Input type="number" value={igst} onChange={(e) => setIgst(Number(e.target.value))} /></Field>
              <Field label="CGST %"><Input type="number" value={cgst} onChange={(e) => setCgst(Number(e.target.value))} /></Field>
              <Field label="SGST %"><Input type="number" value={sgst} onChange={(e) => setSgst(Number(e.target.value))} /></Field>
              <Field label="TCS %"><Input type="number" value={tcs} onChange={(e) => setTcs(Number(e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Adults"><Input type="number" value={adults} onChange={(e) => setAdults(Number(e.target.value))} /></Field>
              <Field label="Children"><Input type="number" value={children} onChange={(e) => setChildren(Number(e.target.value))} /></Field>
              <Field label="Infants"><Input type="number" value={infants} onChange={(e) => setInfants(Number(e.target.value))} /></Field>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Computed</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Subtotal" value={fmt(subtotal)} />
            <Row label={`Markup (${markupType})`} value={`+ ${fmt(r.markup)}`} />
            <Row label="Taxable (Subtotal + Markup)" value={fmt(r.taxable)} />
            <Row label={`GST Base (${gstApplyOn})`} value={fmt(r.gstBase)} muted />
            <Row label={`IGST ${igst}%`} value={`+ ${fmt(r.igstAmt)}`} />
            <Row label={`CGST ${cgst}%`} value={`+ ${fmt(r.cgstAmt)}`} />
            <Row label={`SGST ${sgst}%`} value={`+ ${fmt(r.sgstAmt)}`} />
            <Row label={`TCS ${tcs}% of Taxable`} value={`+ ${fmt(r.tcsAmt)}`} />
            <div className="border-t pt-2"><Row label="Grand Total" value={fmt(r.total)} bold /></div>
            <div className="border-t pt-2 grid grid-cols-3 gap-2 text-center">
              <Per label="Per Adult" value={fmt(adults > 0 ? r.total / adults : 0)} />
              <Per label="Per Child" value={fmt(children > 0 ? r.total / children : 0)} />
              <Per label="Per Infant" value={fmt(infants > 0 ? r.total / infants : 0)} />
            </div>
            <details className="pt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Formula reference</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px]">{`markup = type==="percent" ? subtotal * value/100 : value
taxable = subtotal + markup
gstBase = gstApplyOn==="markup" ? markup : taxable
tax = gstBase * (igst + cgst + sgst) / 100
tcs = taxable * tcs% / 100
total = taxable + tax + tcs`}</pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-bold text-base" : ""} ${muted ? "text-muted-foreground" : ""}`}><span className={bold ? "" : "text-muted-foreground"}>{label}</span><span>{value}</span></div>;
}
function Per({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-2"><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>;
}