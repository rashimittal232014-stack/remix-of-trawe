import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getEmailConfig, saveMyEmailAccount, saveMyImap, saveOrgSmtp, saveEmailSharing, sendTestEmail,
} from "@/lib/email.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, ShieldCheck, Send, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { id: "gmail", label: "Gmail", host: "smtp.gmail.com", port: 587, enc: "TLS", imapHost: "imap.gmail.com" },
  { id: "outlook", label: "Outlook / Office 365", host: "smtp.office365.com", port: 587, enc: "TLS", imapHost: "outlook.office365.com" },
  { id: "zoho", label: "Zoho Mail", host: "smtp.zoho.com", port: 465, enc: "SSL", imapHost: "imap.zoho.com" },
  { id: "yahoo", label: "Yahoo", host: "smtp.mail.yahoo.com", port: 465, enc: "SSL", imapHost: "imap.mail.yahoo.com" },
  { id: "custom", label: "Other Mail / Custom SMTP", host: "", port: 587, enc: "TLS", imapHost: "" },
];

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <Label className="text-xs text-right text-muted-foreground">
        {required && <span className="text-destructive mr-0.5">*</span>}{label}
      </Label>
      <div>{children}</div>
    </div>
  );
}

export function EmailConfig() {
  const qc = useQueryClient();
  const load = useServerFn(getEmailConfig);
  const saveMineFn = useServerFn(saveMyEmailAccount);
  const saveImapFn = useServerFn(saveMyImap);
  const saveOrgFn = useServerFn(saveOrgSmtp);
  const saveShareFn = useServerFn(saveEmailSharing);
  const testFn = useServerFn(sendTestEmail);

  const { data } = useQuery({ queryKey: ["email-config"], queryFn: () => load() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["email-config"] });

  const active = data?.mine?.status === "active" || data?.org?.status === "active";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Email Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure user email accounts and organization fallback SMTP for CRM outgoing emails.</p>
        </div>
        <Badge variant="outline" className={cn("gap-1.5", active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-muted-foreground/30 text-muted-foreground")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground")} /> {active ? "Active" : "Not configured"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <Tabs defaultValue="mine" className="min-w-0">
          <TabsList className="mb-4">
            <TabsTrigger value="mine">My Email Account</TabsTrigger>
            <TabsTrigger value="org">Organization SMTP</TabsTrigger>
            <TabsTrigger value="sharing">Email Sharing</TabsTrigger>
          </TabsList>

          <TabsContent value="mine" className="space-y-4">
            <MyAccountForm data={data?.mine} saveFn={saveMineFn} onSaved={invalidate} testFn={testFn} />
            <ImapForm data={data?.mine} saveFn={saveImapFn} onSaved={invalidate} disabled={!data?.mine} />
            <TestEmailBlock testFn={testFn} defaultTo={data?.mine?.email_address ?? ""} />
          </TabsContent>

          <TabsContent value="org" className="space-y-4">
            <OrgForm data={data?.org} saveFn={saveOrgFn} onSaved={invalidate} />
            <TestEmailBlock testFn={testFn} defaultTo={data?.org?.test_email ?? ""} useOrg />
          </TabsContent>

          <TabsContent value="sharing">
            <SharingForm value={data?.sharing ?? "record"} saveFn={saveShareFn} onSaved={invalidate} />
          </TabsContent>
        </Tabs>

        <aside className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Email Rule</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Outgoing emails use your SMTP first and organization SMTP as fallback. Mail uses your own IMAP setting only.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Ports</CardTitle></CardHeader>
            <CardContent className="text-xs">
              <div className="flex justify-between py-1 border-b"><span>TLS</span><span className="font-mono">587</span></div>
              <div className="flex justify-between py-1 border-b"><span>SSL</span><span className="font-mono">465</span></div>
              <div className="flex justify-between py-1"><span>None</span><span className="font-mono">25</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Security Note</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              For Gmail, Outlook or Zoho Mail, use app password if two-step verification is enabled.
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MyAccountForm({ data, saveFn, onSaved, testFn }: any) {
  const [f, setF] = useState({
    provider: "custom", email_address: "", from_name: "", smtp_host: "", smtp_port: 587,
    smtp_username: "", smtp_password: "", smtp_encryption: "TLS", status: "active",
  });
  useEffect(() => {
    if (data) setF({
      provider: data.provider ?? "custom",
      email_address: data.email_address ?? "",
      from_name: data.from_name ?? "",
      smtp_host: data.smtp_host ?? "",
      smtp_port: data.smtp_port ?? 587,
      smtp_username: data.smtp_username ?? "",
      smtp_password: "",
      smtp_encryption: data.smtp_encryption ?? "TLS",
      status: data.status ?? "active",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: f }),
    onSuccess: () => { toast.success("Email account saved"); onSaved(); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const onProvider = (id: string) => {
    const p = PROVIDERS.find((x) => x.id === id)!;
    setF({ ...f, provider: id, smtp_host: p.host || f.smtp_host, smtp_port: p.port, smtp_encryption: p.enc });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Email Account</CardTitle>
        <p className="text-xs text-muted-foreground">CRM emails will be sent from your email account. If not configured, organization SMTP will be used.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Email Provider" required>
          <select value={f.provider} onChange={(e) => onProvider(e.target.value)} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </Row>
        <Row label="Email Address" required><Input value={f.email_address} onChange={(e) => setF({ ...f, email_address: e.target.value })} placeholder="you@company.com" /></Row>
        <Row label="From Name" required><Input value={f.from_name} onChange={(e) => setF({ ...f, from_name: e.target.value })} placeholder="Your Name" /></Row>
        <Row label="SMTP Host" required><Input value={f.smtp_host} onChange={(e) => setF({ ...f, smtp_host: e.target.value })} /></Row>
        <Row label="SMTP Port" required><Input type="number" value={f.smtp_port} onChange={(e) => setF({ ...f, smtp_port: Number(e.target.value) })} /></Row>
        <Row label="Encryption" required>
          <select value={f.smtp_encryption} onChange={(e) => setF({ ...f, smtp_encryption: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option>TLS</option><option>SSL</option><option>None</option>
          </select>
        </Row>
        <Row label="SMTP Username" required><Input value={f.smtp_username} onChange={(e) => setF({ ...f, smtp_username: e.target.value })} /></Row>
        <Row label="SMTP Password" required><Input type="password" value={f.smtp_password} onChange={(e) => setF({ ...f, smtp_password: e.target.value })} placeholder={data?.smtp_host ? "•••••••••••• (leave blank to keep)" : ""} /></Row>
        <Row label="Status">
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </Row>
        <div className="pl-[152px]"><Button onClick={() => save.mutate()} disabled={save.isPending}>Save Email Settings</Button></div>
      </CardContent>
    </Card>
  );
}

function ImapForm({ data, saveFn, onSaved, disabled }: any) {
  const [f, setF] = useState({
    imap_status: "active", imap_host: "", imap_port: 993, imap_username: "",
    imap_password: "", imap_security: "imap/ssl/novalidate-cert", imap_default_folder: "INBOX",
  });
  useEffect(() => {
    if (data) setF({
      imap_status: data.imap_status ?? "inactive",
      imap_host: data.imap_host ?? "",
      imap_port: data.imap_port ?? 993,
      imap_username: data.imap_username ?? data.email_address ?? "",
      imap_password: "",
      imap_security: data.imap_security ?? "imap/ssl/novalidate-cert",
      imap_default_folder: data.imap_default_folder ?? "INBOX",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: f }),
    onSuccess: () => { toast.success("IMAP settings saved"); onSaved(); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <Card className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <CardHeader>
        <CardTitle className="text-base">IMAP Email Setting (Incoming)</CardTitle>
        <p className="text-xs text-muted-foreground">Mail will appear in the left menu only when this IMAP setting is active and your profile has Mail permission.</p>
        <p className="text-xs text-muted-foreground">Enter the server hostname in IMAP Server, not the email address (e.g. <b>imap.gmail.com</b>). Your email ID goes into IMAP Username.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="IMAP Status">
          <select value={f.imap_status} onChange={(e) => setF({ ...f, imap_status: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </Row>
        <Row label="IMAP Server (Incoming)"><Input value={f.imap_host} onChange={(e) => setF({ ...f, imap_host: e.target.value })} placeholder="imap.gmail.com" /></Row>
        <Row label="IMAP Port"><Input type="number" value={f.imap_port} onChange={(e) => setF({ ...f, imap_port: Number(e.target.value) })} /></Row>
        <Row label="Security Type">
          <select value={f.imap_security} onChange={(e) => setF({ ...f, imap_security: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
            <option>imap/ssl/novalidate-cert</option><option>imap/ssl</option><option>imap/tls</option><option>imap</option>
          </select>
        </Row>
        <Row label="IMAP Username"><Input value={f.imap_username} onChange={(e) => setF({ ...f, imap_username: e.target.value })} /></Row>
        <Row label="IMAP Password"><Input type="password" value={f.imap_password} onChange={(e) => setF({ ...f, imap_password: e.target.value })} placeholder={data?.imap_host ? "•••••••••••• (leave blank to keep)" : ""} /></Row>
        <Row label="Default Folder"><Input value={f.imap_default_folder} onChange={(e) => setF({ ...f, imap_default_folder: e.target.value })} /></Row>
        <div className="pl-[152px]"><Button onClick={() => save.mutate()} disabled={save.isPending}>Save Email Settings</Button></div>
      </CardContent>
    </Card>
  );
}

function OrgForm({ data, saveFn, onSaved }: any) {
  const [f, setF] = useState({
    smtp_host: "", smtp_port: 465, smtp_encryption: "SSL", smtp_username: "", smtp_password: "",
    from_name: "", from_email: "", reply_to_email: "", test_email: "", status: "active",
  });
  useEffect(() => {
    if (data) setF({
      smtp_host: data.smtp_host ?? "",
      smtp_port: data.smtp_port ?? 465,
      smtp_encryption: data.smtp_encryption ?? "SSL",
      smtp_username: data.smtp_username ?? "",
      smtp_password: "",
      from_name: data.from_name ?? "",
      from_email: data.from_email ?? "",
      reply_to_email: data.reply_to_email ?? "",
      test_email: data.test_email ?? "",
      status: data.status ?? "active",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: f }),
    onSuccess: () => { toast.success("Organization SMTP saved"); onSaved(); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization SMTP</CardTitle>
          <p className="text-xs text-muted-foreground">This will be used as fallback when user email account is not configured.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="SMTP Host" required><Input value={f.smtp_host} onChange={(e) => setF({ ...f, smtp_host: e.target.value })} /></Row>
          <Row label="SMTP Port" required><Input type="number" value={f.smtp_port} onChange={(e) => setF({ ...f, smtp_port: Number(e.target.value) })} /></Row>
          <Row label="Encryption" required>
            <select value={f.smtp_encryption} onChange={(e) => setF({ ...f, smtp_encryption: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
              <option>SSL</option><option>TLS</option><option>None</option>
            </select>
          </Row>
          <Row label="SMTP Username" required><Input value={f.smtp_username} onChange={(e) => setF({ ...f, smtp_username: e.target.value })} /></Row>
          <Row label="SMTP Password" required><Input type="password" value={f.smtp_password} onChange={(e) => setF({ ...f, smtp_password: e.target.value })} placeholder={data?.smtp_host ? "•••••••••••• (leave blank to keep)" : ""} /></Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sender Information</CardTitle>
          <p className="text-xs text-muted-foreground">This name and email will appear when organization SMTP is used.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="From Name" required><Input value={f.from_name} onChange={(e) => setF({ ...f, from_name: e.target.value })} /></Row>
          <Row label="From Email" required><Input value={f.from_email} onChange={(e) => setF({ ...f, from_email: e.target.value })} /></Row>
          <Row label="Reply To Email"><Input value={f.reply_to_email} onChange={(e) => setF({ ...f, reply_to_email: e.target.value })} /></Row>
          <Row label="Test Email"><Input value={f.test_email} onChange={(e) => setF({ ...f, test_email: e.target.value })} /></Row>
          <Row label="Status">
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </Row>
          <div className="pl-[152px]"><Button onClick={() => save.mutate()} disabled={save.isPending}>Save Organization SMTP</Button></div>
        </CardContent>
      </Card>
    </>
  );
}

function SharingForm({ value, saveFn, onSaved }: any) {
  const [v, setV] = useState<string>(value);
  useEffect(() => setV(value), [value]);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { sharing: v } }),
    onSuccess: () => { toast.success("Sharing updated"); onSaved(); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });
  const opts = [
    { id: "private", label: "Private", desc: "Only you can view your email conversations." },
    { id: "record", label: "Record Related", desc: "Emails related to leads, contacts and deals will be visible in related records." },
    { id: "admin", label: "Shared with Admin", desc: "Admins can view your CRM related email conversations." },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Sharing</CardTitle>
        <p className="text-xs text-muted-foreground">Choose how your email conversations will be visible inside CRM records.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {opts.map((o) => (
          <label key={o.id} className={cn(
            "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition",
            v === o.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30",
          )}>
            <input type="radio" name="share" checked={v === o.id} onChange={() => setV(o.id)} className="mt-1" />
            <div>
              <div className="text-sm font-semibold">{o.label}</div>
              <div className="text-xs text-muted-foreground">{o.desc}</div>
            </div>
          </label>
        ))}
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Email Sharing</Button>
      </CardContent>
    </Card>
  );
}

function TestEmailBlock({ testFn, defaultTo, useOrg }: { testFn: any; defaultTo: string; useOrg?: boolean }) {
  const [to, setTo] = useState("");
  useEffect(() => setTo(defaultTo || ""), [defaultTo]);
  const send = useMutation({
    mutationFn: () => testFn({ data: { to, useOrg: !!useOrg } }),
    onSuccess: (r: any) => toast.success(`Test email sent via ${r.source} SMTP`),
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Test Email</CardTitle>
        <p className="text-xs text-muted-foreground">
          {useOrg ? "Send a test email using the organization SMTP fallback." : "Send a test email using your email account. If not configured, organization SMTP will be used."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Test Email To" required><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@company.com" /></Row>
        <div className="pl-[152px]">
          <Button variant="outline" onClick={() => send.mutate()} disabled={!to || send.isPending}>
            <Send className="h-4 w-4 mr-2" />{send.isPending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
        <div className="pl-[152px] text-[11px] text-muted-foreground flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5" /> Uses real SMTP — check the inbox (and spam) of the recipient.
        </div>
      </CardContent>
    </Card>
  );
}