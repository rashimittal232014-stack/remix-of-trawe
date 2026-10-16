import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, XCircle, LifeBuoy, CreditCard, FileText, Globe2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getMySubscription, getMyBilling, getMyDomains, listMyTickets, createSupportTicket } from "@/lib/plan.functions";
import { FEATURE_LABELS, LIMIT_LABELS, planLabel, type FeatureKey, type LimitKey } from "@/lib/plan-config";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription & Support — TraWe CRM" },
      { name: "description", content: "Your TraWe plan, seat usage, monthly limits, payment history and support requests." },
      { property: "og:title", content: "Subscription & Support — TraWe CRM" },
      { property: "og:description", content: "Your TraWe plan, seat usage, monthly limits, payment history and support requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubscriptionPage,
});

const money = (n: number) => "₹" + Number(n ?? 0).toLocaleString("en-IN");
const serif = { fontFamily: '"Instrument Serif", ui-serif, Georgia, serif' } as const;

function SubscriptionPage() {
  const subFn = useServerFn(getMySubscription);
  const billFn = useServerFn(getMyBilling);
  const ticketsFn = useServerFn(listMyTickets);
  const domainsFn = useServerFn(getMyDomains);

  const { data: sub } = useQuery({ queryKey: ["my-subscription"], queryFn: () => subFn() });
  const { data: billing } = useQuery({ queryKey: ["my-billing"], queryFn: () => billFn() });
  const { data: tickets } = useQuery({ queryKey: ["my-tickets"], queryFn: () => ticketsFn() });
  const { data: domains } = useQuery({ queryKey: ["my-domains"], queryFn: () => domainsFn() });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-[#e8ecf1] bg-gradient-to-br from-[#eff7f4] via-white to-[#f6f2ee] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[#48a890]">Your account</p>
          <h1 className="mt-1 text-3xl text-[#001830]" style={serif}>Subscription & support</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
            Plan entitlements, monthly usage, payment history and a direct line to the TraWe team.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Plan" value={planLabel(sub?.plan)} sub={sub ? `${money(sub.plan_price)} / ${sub.billing_cycle}` : "—"} />
          <Kpi label="Status" value={sub?.subscription_status ?? "—"} sub={sub?.in_grace ? "In grace period" : sub?.locked ? "On hold" : "Healthy"} />
          <Kpi label="Renews on" value={sub?.renewal_date ?? "—"} sub={sub?.days_left != null ? `${sub.days_left} day(s) left` : "No renewal set"} />
          <Kpi label="Users" value={`${sub?.seats_used ?? 0} / ${sub?.seat_limit ?? 0}`} sub="Seats in use" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="What's included">
            <ul className="space-y-2 text-sm">
              {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((k) => {
                const on = !!sub?.features?.[k];
                return (
                  <li key={k} className="flex items-center gap-2">
                    {on ? <CheckCircle2 className="h-4 w-4 text-[#48a890]" /> : <XCircle className="h-4 w-4 text-[#cbd5e1]" />}
                    <span className={on ? "text-[#0f172a]" : "text-[#94a3b8]"}>{FEATURE_LABELS[k]}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="This month's usage">
            <div className="space-y-4">
              {(Object.keys(LIMIT_LABELS) as LimitKey[]).map((k) => {
                const limit = Number(sub?.limits?.[k] ?? 0);
                const used = Number((sub?.usage as any)?.[k] ?? 0);
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">{LIMIT_LABELS[k]}</span>
                      <span className="tabular-nums text-[#0f172a]">
                        {used.toLocaleString("en-IN")} / {limit > 0 ? limit.toLocaleString("en-IN") : "Unlimited"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-[#eef2f6]">
                      <div
                        className={`h-2 rounded-full ${pct >= 90 ? "bg-[#c04818]" : "bg-[#48a890]"}`}
                        style={{ width: `${limit > 0 ? pct : 4}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <Panel title="Payment history" icon={CreditCard}>
          {(billing?.payments ?? []).length === 0 ? (
            <Empty text="No subscription payments recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[#94a3b8]">
                  <tr><th className="py-2">Paid on</th><th>Period</th><th>Mode</th><th>Reference</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {(billing?.payments ?? []).map((p: any) => (
                    <tr key={p.id} className="border-t border-[#eef2f6]">
                      <td className="py-2.5">{p.paid_on}</td>
                      <td className="text-[#64748b]">{p.period_from ? `${p.period_from} → ${p.period_to ?? "—"}` : "—"}</td>
                      <td className="text-[#64748b]">{p.mode ?? "—"}</td>
                      <td className="text-[#64748b]">{p.reference ?? "—"}</td>
                      <td className="text-right tabular-nums">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Subscription invoices" icon={FileText}>
          {(billing?.invoices ?? []).length === 0 ? (
            <Empty text="No subscription invoices issued yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[#94a3b8]">
                  <tr><th className="py-2">Invoice</th><th>Issued</th><th>Due</th><th>Status</th><th className="text-right">Amount</th><th className="text-right">Document</th></tr>
                </thead>
                <tbody>
                  {(billing?.invoices ?? []).map((invoice: any) => (
                    <tr key={invoice.id} className="border-t border-[#eef2f6]">
                      <td className="py-2.5 font-medium">{invoice.invoice_no}</td>
                      <td className="text-[#64748b]">{invoice.issue_date}</td>
                      <td className="text-[#64748b]">{invoice.due_date ?? "—"}</td>
                      <td className="capitalize text-[#64748b]">{invoice.status}</td>
                      <td className="text-right tabular-nums">{invoice.currency === "INR" ? money(invoice.amount) : `${invoice.currency} ${Number(invoice.amount).toLocaleString()}`}</td>
                      <td className="text-right">
                        {invoice.pdf_url ? <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#287b68]">Open <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-[#94a3b8]">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Custom domain" icon={Globe2}>
          {!domains?.enabled ? (
            <Empty text="Custom domains are not enabled for this workspace." />
          ) : (domains.domains ?? []).length === 0 ? (
            <Empty text="No custom domain has been assigned yet. Contact TraWe support to add one." />
          ) : (
            <div className="space-y-3">
              {domains.domains.map((domain: any) => (
                <div key={domain.id} className="rounded-2xl border border-[#eef2f6] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-medium text-[#001830]">{domain.hostname}</p><p className="mt-1 text-xs text-[#64748b]">Last checked: {domain.last_checked_at ? new Date(domain.last_checked_at).toLocaleString("en-IN") : "Not checked"}</p></div>
                    <div className="flex gap-2"><span className="rounded-full bg-[#f2f6fb] px-2.5 py-1 text-xs capitalize">{domain.status}</span><span className="rounded-full bg-[#effaf5] px-2.5 py-1 text-xs text-[#0d4f3f]">SSL: {domain.ssl_status ?? "pending"}</span></div>
                  </div>
                  {domain.verification_txt_name && <div className="mt-3 grid gap-2 rounded-xl bg-[#f8fafc] p-3 text-xs sm:grid-cols-2"><div><span className="text-[#94a3b8]">DNS name</span><p className="mt-1 break-all font-mono text-[#334155]">{domain.verification_txt_name}</p></div><div><span className="text-[#94a3b8]">DNS value</span><p className="mt-1 break-all font-mono text-[#334155]">{domain.verification_txt_value ?? "—"}</p></div></div>}
                  {domain.error_message && <p className="mt-3 text-xs text-[#c04818]">{domain.error_message}</p>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <SupportPanel tickets={tickets ?? []} />
      </div>
    </AppShell>
  );
}

function SupportPanel({ tickets }: { tickets: any[] }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  const submit = useMutation({
    mutationFn: () => createFn({ data: { subject, message, priority } }),
    onSuccess: () => {
      setSubject(""); setMessage(""); setPriority("normal");
      toast.success("Support request sent to the TraWe team");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send your request"),
  });

  return (
    <Panel title="Support" icon={LifeBuoy}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea rows={5} placeholder="Describe the issue or request…" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="flex items-center gap-3">
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-[#48a890] hover:bg-[#3d9280]"
              disabled={submit.isPending || subject.trim().length < 3 || message.trim().length < 5}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Sending…" : "Send request"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {tickets.length === 0 ? (
            <Empty text="No support requests yet." />
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-[#eef2f6] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#0f172a]">{t.subject}</p>
                  <span className="rounded-full bg-[#f2f6fb] px-2.5 py-0.5 text-xs text-[#64748b]">{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-[#94a3b8]">{new Date(t.created_at).toLocaleString("en-IN")}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#64748b]">{t.message}</p>
                {t.reply && (
                  <div className="mt-3 rounded-xl bg-[#effaf5] p-3 text-sm text-[#0d4f3f]">
                    <span className="text-xs uppercase tracking-wide">TraWe replied</span>
                    <p className="mt-1 whitespace-pre-wrap">{t.reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-[#e8ecf1] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-[#94a3b8]">{label}</p>
      <p className="mt-1 text-2xl capitalize tracking-tight text-[#001830]" style={serif}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[#64748b]">{sub}</p>}
    </div>
  );
}

function Panel({
  title, children, icon: Icon,
}: { title: string; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <section className="rounded-3xl border border-[#e8ecf1] bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#64748b]">
        {Icon && <Icon className="h-4 w-4 text-[#48a890]" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-[#e8ecf1] p-6 text-center text-sm text-[#94a3b8]">{text}</p>;
}
