import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTenantSettings, updateTenantProfile, updateProfile,
  exportBackup, getStorageStats,
  getLoginHistory,
  listPipelines, upsertPipeline, deletePipeline,
  upsertStage, deleteStage,
  assignRole, removeRole,
} from "@/lib/settings.functions";
import {
  updateOrganization,
  listPackageTerms, upsertPackageTerm, deletePackageTerm,
  listCurrencyRates, refreshCurrencyRates, toggleCurrencyActive, setBaseCurrency,
  getWhatsAppDiagnostics, testWhatsAppConnection, rotateWhatsAppWebhookSecret,
  sendWhatsAppTestMessage,
  testAiProvider,
} from "@/lib/org.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, RefreshCw, Check, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User, Lock, Bell, History, Users as UsersIcon, Shield, Building2, Palette,
  Coins, FileText, Layers, Database, KeyRound, Trash2, Download, Upload,
  HardDrive, MessageCircle, Cloud, Cpu, Plus, GitBranch, Copy, Eye, EyeOff, RotateCcw, PlugZap, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SingleImagePicker } from "@/components/masters/single-image-picker";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { UsersControls } from "@/components/settings/users-controls";
import { DataAdministration } from "@/components/settings/data-admin";
import { EmailConfig } from "@/components/settings/email-config";
import { GoogleSheets } from "@/components/settings/google-sheets";
import { WeatherSettingsPanel } from "@/components/settings/weather-settings";
import { StorageCleaner } from "@/components/settings/storage-cleaner";
import { DobGreeting } from "@/components/settings/dob-greeting";
import { AutomationTrigger } from "@/components/settings/automation-trigger";
import { TraweWhatsAppPanel } from "@/components/settings/trawe-whatsapp";
import { useFeature } from "@/components/app/subscription-banner";
import { setWhatsAppEngine } from "@/lib/trawe-whatsapp.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [
    { title: "Settings · TraWe" },
    { name: "description", content: "Manage your TraWe workspace, organization profile, users, integrations, templates and data." },
  ]}),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["settings"], queryFn: () => getTenantSettings() });
    return null;
  },
  component: SettingsPage,
});

type Section =
  | "profile" | "password" | "notifications" | "history"
  | "users-controls"
  | "org" | "manage-ids" | "theme" | "currencies" | "terms" | "invoice-tpl" | "itinerary-tpl" | "whatsapp" | "pipelines"
  | "stages" | "forms" | "automation"
  | "data-admin"
  | "channels" | "email" | "gsheet" | "widget" | "weather" | "storage-cleaner" | "dob" | "automation-trigger";

const NAV: { label: string; items: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { label: "Account", items: [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "history", label: "Login History", icon: History },
  ]},
  { label: "Users & Controls", items: [
    { id: "users-controls", label: "Users and Controls", icon: UsersIcon },
  ]},
  { label: "Organization", items: [
    { id: "org", label: "Details", icon: Building2 },
    { id: "manage-ids", label: "Manage IDs", icon: KeyRound },
    { id: "theme", label: "Theme", icon: Palette },
    { id: "currencies", label: "Currencies", icon: Coins },
    { id: "pipelines", label: "Pipelines & Stages", icon: GitBranch },
    { id: "terms", label: "Package Terms", icon: FileText },
    { id: "invoice-tpl", label: "Invoice Template", icon: Layers },
    { id: "itinerary-tpl", label: "Itinerary Template", icon: Layers },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ]},
  { label: "Data Administration", items: [
    { id: "data-admin", label: "Data Administration", icon: Database },
  ]},
  { label: "Channels", items: [
    { id: "email", label: "Email", icon: Cpu },
    { id: "gsheet", label: "Google Sheet", icon: Cpu },
    { id: "widget", label: "Widget", icon: Cpu },
    { id: "weather", label: "Weather", icon: Cloud },
    { id: "storage-cleaner", label: "Storage Cleaner", icon: HardDrive },
    { id: "dob", label: "DOB Greeting", icon: Bell },
    { id: "automation-trigger", label: "Automation Trigger", icon: PlugZap },
  ]},
];

function SettingsPage() {
  const [section, setSection] = useState<Section>("profile");
  const { data } = useSuspenseQuery({ queryKey: ["settings"], queryFn: () => getTenantSettings() });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <aside className="lg:sticky lg:top-16 lg:self-start">
        <div className="rounded-2xl border bg-card/60 backdrop-blur-xl p-3 space-y-4">
          {NAV.map((g) => (
            <div key={g.label}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1">{g.label}</div>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = section === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => setSection(it.id)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors",
                          active ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:bg-accent/40",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{it.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
      <div className="min-w-0">
        {section === "profile" && <ProfileSection data={data} />}
        {section === "password" && <PasswordSection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "history" && <HistorySection />}
        {section === "users-controls" && <UsersControls />}
        {section === "org" && <OrgSection data={data} />}
        {section === "manage-ids" && <ManageIdsSection data={data} />}
        {section === "theme" && <ThemeSection />}
        {section === "currencies" && <CurrenciesSection />}
        {section === "pipelines" && <PipelinesSection />}
        {section === "terms" && <TermsSection />}
        {section === "invoice-tpl" && <TemplatePicker data={data} kind="invoice" options={[
          { id: "classic", label: "Classic Invoice", desc: "Clean professional invoice layout with balance due highlight and modern spacing." },
          { id: "travel_tax", label: "Travel Tax Invoice", desc: "Travel agency tax invoice with trip details, GST/TCS summary, bank details and terms." },
        ]} />}
        {section === "itinerary-tpl" && <TemplatePicker data={data} kind="itinerary" options={[
          { id: "default", label: "Default", desc: "Current CRM itinerary preview, download, email and WhatsApp PDF layout." },
          { id: "scenic_a4", label: "Scenic A4", desc: "Full-bleed A4 itinerary with one image-led page for every day and dedicated pricing pages." },
          { id: "journey_a4", label: "Journey A4", desc: "Client-ready A4 itinerary with day tabs, stay, meal, flight and summary sections." },
        ]} />}
        {section === "whatsapp" && <WhatsAppSection data={data} />}
        {section === "data-admin" && <DataAdministration />}
        {section === "channels" && <ChannelsSection />}
        {section === "email" && <EmailConfig />}
        {section === "gsheet" && <GoogleSheets />}
        {section === "widget" && <WidgetSection />}
        {section === "weather" && <WeatherSettingsPanel />}
        {section === "storage-cleaner" && <StorageCleaner />}
        {section === "dob" && <DobGreeting />}
        {section === "automation-trigger" && <AutomationTrigger />}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card/60 backdrop-blur-xl border-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ---------- Account ----------
function AccountHeader({
  icon: Icon,
  title,
  description,
  meta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 pb-5 border-b border-border/60">
      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
        {meta && <div className="text-xs mt-1 text-primary font-medium">{meta}</div>}
      </div>
    </div>
  );
}

function AccountPanel({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-2xl border bg-card/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
        <div className="text-sm font-semibold">{title}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-border/60 flex justify-end">{footer}</div>}
    </div>
  );
}

function ProfileSection({ data }: { data: any }) {
  const qc = useQueryClient();
  const initialDisplay = data?.profile?.display_name ?? "";
  const [first, ...rest] = initialDisplay.split(" ");
  const [firstName, setFirstName] = useState(first ?? "");
  const [lastName, setLastName] = useState(rest.join(" "));
  const [display, setDisplay] = useState(initialDisplay);
  const [phone, setPhone] = useState(data?.profile?.phone ?? "");
  const [extras, setExtras] = useLocal("trawe:profile-extras", {
    jobTitle: "",
    timeZone: "Asia/Kolkata",
    language: "English",
  });
  const email = data?.profile?.email ?? "";
  const initials = (display || email || "U").slice(0, 1).toUpperCase();
  const primaryRole = data?.roles?.find((r: any) => r.user_id === data?.profile?.id)?.role ?? "member";
  const mut = useMutation({
    mutationFn: useServerFn(updateProfile),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <AccountHeader
        icon={User}
        title="My Profile"
        description="Manage your personal information and CRM account preferences."
        meta={
          <span className="capitalize">
            {primaryRole} · {email}
          </span>
        }
      />
      <AccountPanel
        title="Profile Information"
        hint="Your visible CRM identity"
        footer={
          <Button
            className="rounded-full"
            onClick={() =>
              mut.mutate({
                data: {
                  display_name: display || `${firstName} ${lastName}`.trim(),
                  phone,
                  avatar_url: data?.profile?.avatar_url ?? null,
                },
              })
            }
            disabled={mut.isPending}
          >
            Save Profile
          </Button>
        }
      >
        <div className="flex items-center gap-3 -mt-1">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center text-lg font-semibold">
            {initials}
          </div>
          <div className="text-xs text-muted-foreground">Avatar auto-generated from your name.</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Display Name *</Label>
            <Input value={display} onChange={(e) => setDisplay(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={email} disabled className="bg-muted/40" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Mobile</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Job Title</Label>
            <Input
              value={extras.jobTitle}
              onChange={(e) => setExtras({ ...extras, jobTitle: e.target.value })}
              placeholder="Administrator"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Time Zone</Label>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={extras.timeZone}
              onChange={(e) => setExtras({ ...extras, timeZone: e.target.value })}
            >
              {["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "UTC"].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Language</Label>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={extras.language}
              onChange={(e) => setExtras({ ...extras, language: e.target.value })}
            >
              {["English", "Hindi", "Marathi", "Gujarati", "Tamil", "Arabic"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </AccountPanel>
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!next || next.length < 8) return toast.error("Password must be at least 8 characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setCurrent(""); setNext(""); setConfirm("");
  };
  return (
    <div>
      <AccountHeader
        icon={Lock}
        title="Change Password"
        description="Update your login password. Use a strong password for better account safety."
      />
      <AccountPanel
        title="Password"
        hint="Keep your account secure"
        footer={
          <Button className="rounded-full" onClick={submit} disabled={busy}>
            Update Password
          </Button>
        }
      >
        <div className="grid gap-4 max-w-lg">
          <div className="grid gap-1.5">
            <Label className="text-xs">Current Password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">New Password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
      </AccountPanel>
    </div>
  );
}

const NOTIF_OPTIONS: { key: string; title: string; desc: string }[] = [
  { key: "inApp", title: "In-app reminders", desc: "Show reminder badge, drawer and bottom alert box." },
  { key: "email", title: "Email reminders", desc: "Allow CRM reminder emails when email account is configured." },
  { key: "activity", title: "Activity updates", desc: "Task, event and call reminders." },
  { key: "query", title: "Query updates", desc: "Query follow-up and customer related alerts." },
  { key: "billing", title: "Billing reminders", desc: "Invoice, due date and payment reminders." },
  { key: "waSound", title: "WhatsApp message sound", desc: "Play sound when a new WhatsApp message arrives in CRM." },
  { key: "digest", title: "Daily digest", desc: "Daily summary of pending reminders." },
];

function NotificationsSection() {
  const [prefs, setPrefs] = useLocal("trawe:notif", {
    inApp: true, email: true, activity: true, query: true, billing: true, waSound: true, digest: true,
  });
  const [draft, setDraft] = useState(prefs);
  useEffect(() => { setDraft(prefs); }, [prefs]);
  return (
    <div>
      <AccountHeader
        icon={Bell}
        title="Notification Settings"
        description="Choose which CRM alerts should appear for your account."
      />
      <AccountPanel
        title="CRM Notifications"
        hint="Applies to your user account"
        footer={
          <Button
            className="rounded-full"
            onClick={() => { setPrefs(draft); toast.success("Notification settings saved"); }}
          >
            Save Settings
          </Button>
        }
      >
        <div className="divide-y">
          {NOTIF_OPTIONS.map((o) => (
            <div key={o.key} className="flex items-start justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-sm font-medium">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
              </div>
              <Switch
                checked={Boolean((draft as any)[o.key])}
                onCheckedChange={(v) => setDraft({ ...(draft as any), [o.key]: v })}
              />
            </div>
          ))}
        </div>
      </AccountPanel>
    </div>
  );
}

function HistorySection() {
  const { data, isLoading } = useQuery({ queryKey: ["login-history"], queryFn: () => getLoginHistory() });
  const rows = data ?? [];
  return (
    <div>
      <AccountHeader
        icon={History}
        title="Login History"
        description="Review your recent sign-in activity."
      />
      <AccountPanel title="Recent Logins" hint={`Last ${Math.min(rows.length || 50, 50)} login records`}>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">No login events recorded yet.</div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                  <th className="text-left font-medium px-5 py-2">Date &amp; Time</th>
                  <th className="text-left font-medium px-4 py-2">Status</th>
                  <th className="text-left font-medium px-4 py-2">IP Address</th>
                  <th className="text-left font-medium px-5 py-2">Device / Browser</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e: any) => {
                  const success = /success|sign_?in|login/i.test(e.event) && !/fail/i.test(e.event);
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-accent/30">
                      <td className="px-5 py-2.5 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("text-xs font-medium", success ? "text-emerald-600" : "text-destructive")}>
                          {success ? "Success" : String(e.event).replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{e.ip ?? "—"}</td>
                      <td className="px-5 py-2.5 text-xs text-muted-foreground truncate max-w-[520px]">
                        {e.user_agent ?? "Unknown device"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AccountPanel>
    </div>
  );
}

// ---------- Users & Roles ----------
function UsersSection({ data }: { data: any }) {
  const qc = useQueryClient();
  const assign = useMutation({
    mutationFn: useServerFn(assignRole),
    onSuccess: () => { toast.success("Role assigned"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: useServerFn(removeRole),
    onSuccess: () => { toast.success("Role removed"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const roleOptions = ["admin", "manager", "agent", "viewer"] as const;
  return (
    <Section title="Team Members" description={`${data?.users?.length ?? 0} user(s) in this workspace.`}>
      <div className="border rounded-lg divide-y">
        {(data?.users ?? []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm gap-3">
            <div>
              <div className="font-medium">{u.display_name}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {(data.roles ?? []).filter((r: any) => r.user_id === u.id).map((r: any) => (
                <button
                  key={r.role}
                  className="group"
                  title="Click to remove"
                  onClick={() => remove.mutate({ data: { user_id: u.id, role: r.role } })}
                >
                  <Badge variant="secondary" className="cursor-pointer group-hover:bg-destructive/20">
                    {r.role} ×
                  </Badge>
                </button>
              ))}
              <select
                className="h-7 rounded border bg-background text-xs px-1"
                defaultValue=""
                onChange={(e) => {
                  const role = e.target.value;
                  if (!role) return;
                  assign.mutate({ data: { user_id: u.id, role: role as any } });
                  e.currentTarget.value = "";
                }}
              >
                <option value="">+ role</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- Pipelines & Stages ----------
function PipelinesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pipelines-stages"], queryFn: () => listPipelines() });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newPipeline, setNewPipeline] = useState("");

  const active = activeId ?? data?.pipelines?.[0]?.id ?? null;
  const stages = (data?.stages ?? []).filter((s: any) => s.pipeline_id === active);

  const savePipeline = useMutation({
    mutationFn: useServerFn(upsertPipeline),
    onSuccess: () => { toast.success("Pipeline saved"); setNewPipeline(""); qc.invalidateQueries({ queryKey: ["pipelines-stages"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const removePipeline = useMutation({
    mutationFn: useServerFn(deletePipeline),
    onSuccess: () => { toast.success("Pipeline removed"); setActiveId(null); qc.invalidateQueries({ queryKey: ["pipelines-stages"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const saveStage = useMutation({
    mutationFn: useServerFn(upsertStage),
    onSuccess: () => { toast.success("Stage saved"); qc.invalidateQueries({ queryKey: ["pipelines-stages"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeStage = useMutation({
    mutationFn: useServerFn(deleteStage),
    onSuccess: () => { toast.success("Stage removed"); qc.invalidateQueries({ queryKey: ["pipelines-stages"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Section title="Pipelines & Stages" description="Model your lead journey. Each pipeline has ordered stages with win probability.">
      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground tracking-wider">Pipelines</div>
          <ul className="space-y-1">
            {(data?.pipelines ?? []).map((p: any) => (
              <li key={p.id}>
                <button
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-left",
                    active === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent/40",
                  )}
                >
                  <span>{p.name}</span>
                  {p.is_default && <Badge variant="outline" className="text-[10px]">default</Badge>}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1 pt-2">
            <Input
              value={newPipeline}
              onChange={(e) => setNewPipeline(e.target.value)}
              placeholder="New pipeline"
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              disabled={!newPipeline.trim() || savePipeline.isPending}
              onClick={() => savePipeline.mutate({ data: { name: newPipeline.trim() } })}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {active && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Delete this pipeline and its stages?")) removePipeline.mutate({ data: { id: active } });
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete pipeline
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground tracking-wider">Stages</div>
          {!active && <div className="text-sm text-muted-foreground">Create a pipeline to add stages.</div>}
          {active && (
            <div className="border rounded-lg divide-y">
              {stages.map((s: any) => (
                <StageRow
                  key={s.id}
                  stage={s}
                  onSave={(payload) => saveStage.mutate({ data: { ...payload, pipeline_id: active } })}
                  onDelete={() => removeStage.mutate({ data: { id: s.id } })}
                />
              ))}
              {stages.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No stages yet.</div>
              )}
              <div className="p-2 bg-muted/30">
                <StageRow
                  key="new"
                  onSave={(payload) => saveStage.mutate({ data: { ...payload, pipeline_id: active, sort_order: stages.length } })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function StageRow({
  stage,
  onSave,
  onDelete,
}: {
  stage?: any;
  onSave: (payload: any) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(stage?.name ?? "");
  const [type, setType] = useState(stage?.type ?? "open");
  const [probability, setProbability] = useState<number>(stage?.probability ?? 50);
  const [color, setColor] = useState(stage?.color ?? "#48a890");
  const isNew = !stage?.id;

  return (
    <div className="grid grid-cols-[1fr_100px_80px_60px_auto] gap-2 items-center px-3 py-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Stage name" className="h-8 text-sm" />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="h-8 rounded border bg-background text-xs px-2"
      >
        <option value="open">Open</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
      <Input
        type="number"
        min={0}
        max={100}
        value={probability}
        onChange={(e) => setProbability(Number(e.target.value))}
        className="h-8 text-sm"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-8 w-full rounded border cursor-pointer"
      />
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={isNew ? "default" : "outline"}
          disabled={!name.trim()}
          onClick={() => {
            onSave({
              id: stage?.id,
              name: name.trim(),
              type,
              probability,
              color,
              sort_order: stage?.sort_order ?? 0,
            });
            if (isNew) { setName(""); setProbability(50); }
          }}
        >
          {isNew ? <Plus className="h-3.5 w-3.5" /> : "Save"}
        </Button>
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
function RolesSection({ data }: { data: any }) {
  const rolesSet = new Set((data?.roles ?? []).map((r: any) => r.role));
  const all = ["admin", "manager", "agent", "viewer", "super_admin"];
  return (
    <Section title="Roles" description="Role assignments in your workspace.">
      <div className="grid gap-2">
        {all.map((r) => (
          <div key={r} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
            <span className="capitalize">{r.replace("_", " ")}</span>
            <Badge variant={rolesSet.has(r) ? "default" : "outline"}>{rolesSet.has(r) ? "In use" : "Available"}</Badge>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------- Organization ----------
function OrgSection({ data }: { data: any }) {
  const qc = useQueryClient();
  const t = data?.tenant ?? {};
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold">Organization</h2>
          <div className="text-sm text-muted-foreground mt-0.5">Details shown on invoices, itineraries and client-facing pages.</div>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>
      <div className="mt-5 rounded-2xl border bg-card/60 backdrop-blur-xl p-5 flex items-center gap-4">
        <div className="h-16 w-32 rounded-lg border bg-muted/30 grid place-items-center overflow-hidden">
          {t.logo_url
            ? <img src={t.logo_url} alt="logo" className="max-h-full max-w-full object-contain" />
            : <div className="text-xs text-muted-foreground">No logo</div>}
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{t.name || "—"}</div>
          <div className="text-xs text-muted-foreground">{t.crm_name || t.name} · {t.email || ""}</div>
        </div>
      </div>

      <AccountPanel title="Basic Information">
        <InfoRow label="Phone" value={t.phone} />
        <InfoRow label="Mobile" value={t.mobile} />
        <InfoRow label="Fax" value={t.fax} />
        <InfoRow label="Email" value={t.email} />
        <InfoRow label="Website" value={t.website} />
        <InfoRow label="GST No." value={t.gst_no} />
        <InfoRow label="PAN No." value={t.pan_no} />
        <InfoRow label="Description" value={t.description} />
      </AccountPanel>
      <AccountPanel title="Address">
        <div className="text-sm">{t.address || "—"}</div>
        <div className="text-sm text-muted-foreground">
          {[t.city, t.state, t.country].filter(Boolean).join(", ") || "—"}
        </div>
      </AccountPanel>
      <AccountPanel title="Locale Information">
        <InfoRow label="Currency" value={t.currency} />
        <InfoRow label="Time Zone" value={t.timezone} />
      </AccountPanel>

      <OrgEditSheet open={open} onOpenChange={setOpen} tenant={t} onSaved={() => qc.invalidateQueries({ queryKey: ["settings"] })} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-1.5 text-sm">
      <div className="text-muted-foreground text-xs uppercase tracking-wide pt-0.5">{label}</div>
      <div>{value || "--"}</div>
    </div>
  );
}

// ---------- AI Provider Panel (multi-provider: ChatGPT / Gemini / Claude) ----------
const AI_PROVIDERS: Array<{ key: "chatgpt" | "gemini" | "claude"; label: string; note: string; defaultModel: string }> = [
  { key: "chatgpt", label: "ChatGPT",  note: "OpenAI compatible ChatGPT API key.", defaultModel: "gpt-4o-mini" },
  { key: "gemini",  label: "Gemini",   note: "Google Gemini API key.", defaultModel: "gemini-2.5-flash" },
  { key: "claude",  label: "Claude AI", note: "Anthropic Claude API key.", defaultModel: "claude-3-5-haiku-latest" },
];

function AiProviderPanel({ form, set }: { form: any; set: (k: string, v: any) => void }) {
  const cfg = form.ai_provider_config ?? { active: "gemini", providers: {} };
  const providers: Record<string, { api_key?: string; model?: string }> = cfg.providers ?? {};
  const active = cfg.active ?? "gemini";
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string; latency_ms?: number }>>({});
  const runTest = useServerFn(testAiProvider);

  const handleTest = async (key: "chatgpt" | "gemini" | "claude") => {
    const state = providers[key] ?? {};
    const apiKey = (state.api_key ?? "").trim();
    if (!apiKey) {
      setResults((r) => ({ ...r, [key]: { ok: false, message: "Enter an API key first, then click Test." } }));
      return;
    }
    setTesting((t) => ({ ...t, [key]: true }));
    setResults((r) => ({ ...r, [key]: { ok: false, message: "Testing..." } }));
    try {
      const res: any = await runTest({ data: { provider: key, api_key: apiKey, model: state.model } });
      if (res?.ok) {
        setResults((r) => ({ ...r, [key]: { ok: true, message: `Connected · replied "${(res.sample || "").trim() || "ok"}"`, latency_ms: res.latency_ms } }));
        toast.success(`${key.toUpperCase()} API key is working`);
      } else {
        const msg = res?.error || `Failed (${res?.status ?? "no response"})`;
        setResults((r) => ({ ...r, [key]: { ok: false, message: msg, latency_ms: res?.latency_ms } }));
        toast.error(`${key.toUpperCase()} test failed: ${msg}`);
      }
    } catch (e: any) {
      const msg = e?.message || "Request failed";
      setResults((r) => ({ ...r, [key]: { ok: false, message: msg } }));
      toast.error(msg);
    } finally {
      setTesting((t) => ({ ...t, [key]: false }));
    }
  };

  const updateProvider = (key: string, patch: Partial<{ api_key: string; model: string }>) => {
    const next = {
      ...cfg,
      providers: {
        ...providers,
        [key]: { ...(providers[key] ?? {}), ...patch },
      },
    };
    set("ai_provider_config", next);
    if (key === "gemini" && patch.api_key !== undefined) set("gemini_api_key", patch.api_key);
  };
  const setActive = (key: string) => set("ai_provider_config", { ...cfg, active: key });

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" /> AI Provider Settings
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Choose one active provider. Other saved providers remain available for switching later.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Active Provider</Label>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            onClick={() => handleTest(active as any)}
            disabled={!((providers[active]?.api_key ?? "").trim()) || testing[active]}
          >
            <PlugZap className="h-3.5 w-3.5 mr-1.5" />
            {testing[active] ? "Testing..." : "Test active key"}
          </Button>
        </div>
      </div>

      {results[active] && (
        <div
          className={cn(
            "mb-3 rounded-lg border px-3 py-2 text-xs flex items-start gap-2",
            results[active].ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          <span className="font-semibold shrink-0">
            {results[active].ok ? "✓ API is connected" : "✕ API test failed"}
          </span>
          <span className="opacity-90">
            {results[active].message}
            {results[active].latency_ms != null ? ` · ${results[active].latency_ms}ms` : ""}
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {AI_PROVIDERS.map((p) => {
          const state = providers[p.key] ?? { api_key: "", model: p.defaultModel };
          const isActive = active === p.key;
          const hasKey = Boolean((state.api_key ?? "").trim());
          return (
            <div
              key={p.key}
              className={cn(
                "rounded-xl border p-4 transition",
                isActive ? "border-emerald-300 bg-emerald-50/40 shadow-sm" : "bg-card/60",
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">AI</span>
                  {p.label}
                </div>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                ) : hasKey ? (
                  <button
                    type="button"
                    onClick={() => setActive(p.key)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-medium hover:bg-primary/20"
                    title="Set as active provider"
                  >
                    Set active
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border px-2 py-0.5 text-[10px] font-medium">
                    Available
                  </span>
                )}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs flex items-center gap-2">
                  API Key
                  {hasKey ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border px-1.5 py-0.5 text-[10px] font-medium">
                      Not connected
                    </span>
                  )}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    type={reveal[p.key] ? "text" : "password"}
                    value={state.api_key ?? ""}
                    onChange={(e) => updateProvider(p.key, { api_key: e.target.value })}
                    placeholder={`Enter ${p.label} API key`}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setReveal({ ...reveal, [p.key]: !reveal[p.key] })}
                    title={reveal[p.key] ? "Hide" : "Show"}
                  >
                    {reveal[p.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-1.5 mt-3">
                <Label className="text-xs">Model</Label>
                <Input
                  value={state.model ?? p.defaultModel}
                  onChange={(e) => updateProvider(p.key, { model: e.target.value })}
                  placeholder={p.defaultModel}
                />
              </div>

              <p className="text-[11px] text-muted-foreground mt-2">{p.note}</p>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(p.key)}
                  disabled={!hasKey || testing[p.key]}
                >
                  <PlugZap className="h-3.5 w-3.5 mr-1.5" />
                  {testing[p.key] ? "Testing..." : "Test connection"}
                </Button>
                {results[p.key] && (
                  <span
                    className={cn(
                      "text-[11px] font-medium truncate",
                      results[p.key].ok ? "text-emerald-700" : "text-rose-600",
                    )}
                    title={results[p.key].message}
                  >
                    {results[p.key].ok ? "✓" : "✕"} {results[p.key].message}
                    {results[p.key].latency_ms != null ? ` · ${results[p.key].latency_ms}ms` : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Keys are stored per workspace and used only for your AI features (itineraries, summaries, WhatsApp agent). If the active provider has no key, TraWe falls back to its shared AI gateway.
      </p>
    </div>
  );
}

function OrgEditSheet({ open, onOpenChange, tenant, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; tenant: any; onSaved: () => void }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    const cfg = tenant?.ai_provider_config && Object.keys(tenant.ai_provider_config).length > 0
      ? tenant.ai_provider_config
      : {
          active: tenant?.gemini_api_key ? "gemini" : "chatgpt",
          providers: {
            chatgpt: { api_key: "", model: "gpt-4o-mini" },
            gemini:  { api_key: tenant?.gemini_api_key ?? "", model: "gemini-2.5-flash" },
            claude:  { api_key: "", model: "claude-3-5-haiku-latest" },
          },
        };
    setForm({ ...tenant, ai_provider_config: cfg });
  }, [tenant, open]);
  const mut = useMutation({
    mutationFn: useServerFn(updateOrganization),
    onSuccess: () => { toast.success("Organization saved"); onSaved(); onOpenChange(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Edit Organization</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-6">
          <div>
            <div className="text-sm font-semibold mb-2">Company Logo</div>
            <SingleImagePicker value={form.logo_url ?? ""} onChange={(v) => set("logo_url", v)} bucket="agency-logos" folder="logos" />
            <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG or WEBP. Large logo will be resized automatically to max width 300px.</p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Organization Information</div>
            <div className="grid gap-3">
              <Field label="Organization Name" value={form.name ?? ""} onChange={(v) => set("name", v)} />
              <Field label="CRM Name" value={form.crm_name ?? ""} onChange={(v) => set("crm_name", v)} />
              <Field label="Email" value={form.email ?? ""} onChange={(v) => set("email", v)} />
              <Field label="Phone" value={form.phone ?? ""} onChange={(v) => set("phone", v)} />
              <Field label="Mobile" value={form.mobile ?? ""} onChange={(v) => set("mobile", v)} />
              <Field label="Fax" value={form.fax ?? ""} onChange={(v) => set("fax", v)} />
              <Field label="Website" value={form.website ?? ""} onChange={(v) => set("website", v)} />
              <Field label="GST No." value={form.gst_no ?? ""} onChange={(v) => set("gst_no", v)} />
              <Field label="PAN No." value={form.pan_no ?? ""} onChange={(v) => set("pan_no", v)} />
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Address</div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Address</Label>
                <Textarea rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
              </div>
              <Field label="City" value={form.city ?? ""} onChange={(v) => set("city", v)} />
              <Field label="State" value={form.state ?? ""} onChange={(v) => set("state", v)} />
              <Field label="Country" value={form.country ?? ""} onChange={(v) => set("country", v)} />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Locale Information</div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.currency ?? "INR"} onChange={(e) => set("currency", e.target.value)}>
                  {["INR","USD","EUR","GBP","AED","SGD","THB","MYR","AUD","JPY"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Time Zone</Label>
                <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.timezone ?? "Asia/Kolkata"} onChange={(e) => set("timezone", e.target.value)}>
                  {["Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London","America/New_York","UTC"].map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Invoice Settings</div>
            <div className="grid gap-1.5">
              <Label>Invoice Terms</Label>
              <Textarea rows={4} value={form.invoice_terms ?? ""} onChange={(e) => set("invoice_terms", e.target.value)} placeholder="This invoice is generated for the travel service(s) mentioned above.\nPayment to be made before travel date." />
              <p className="text-[11px] text-muted-foreground">Shown on invoice PDFs.</p>
            </div>
            <div className="grid gap-1.5 mt-3">
              <Label>Authorized Signature</Label>
              <SingleImagePicker value={form.signature_url ?? ""} onChange={(v) => set("signature_url", v)} bucket="agency-logos" folder="signatures" />
              <p className="text-[11px] text-muted-foreground">JPG, PNG or WEBP. Signature will be resized automatically to max width 400px.</p>
            </div>
          </div>
          <div>
          <AiProviderPanel form={form} set={set} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full" onClick={() => mut.mutate({ data: form })} disabled={mut.isPending}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Manage IDs ----------
const ID_FORMATS: Record<string, { id: string; label: string; sample: (p: string) => string }[]> = {
  query: [
    { id: "prefix_fy_seq", label: "Prefix/FY/0001", sample: (p) => `${p}/2026-27/0001 — QRY/2026-27/0001` },
    { id: "prefix_yyyy_seq", label: "Prefix-YYYY-0001", sample: (p) => `${p}-2026-0001` },
  ],
  quotation: [
    { id: "prefix_yyyy_seq", label: "Prefix-YYYY-0001", sample: (p) => `${p}-2026-0001 — QRY-2026-0001` },
    { id: "prefix_fy_seq", label: "Prefix/FY/0001", sample: (p) => `${p}/2026-27/0001` },
  ],
  invoice: [
    { id: "prefix_fy_seq", label: "Prefix/FY/0001", sample: (p) => `${p}/2026-27/0001 — QRY/2026-27/0001` },
    { id: "prefix_yyyy_seq", label: "Prefix-YYYY-0001", sample: (p) => `${p}-2026-0001` },
  ],
};

function ManageIdsSection({ data }: { data: any }) {
  const qc = useQueryClient();
  const t = data?.tenant ?? {};
  const defaults = t.id_prefixes ?? { query: { prefix: "TB", format: "prefix_fy_seq" }, quotation: { prefix: "TBQ", format: "prefix_yyyy_seq" }, invoice: { prefix: "TB", format: "prefix_fy_seq" } };
  const [prefixes, setPrefixes] = useState<any>(defaults);
  useEffect(() => { setPrefixes(defaults); }, [t.id]);
  const mut = useMutation({
    mutationFn: useServerFn(updateOrganization),
    onSuccess: () => { toast.success("ID settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const cards = [
    { key: "query", label: "Query ID" },
    { key: "quotation", label: "Quotation ID" },
    { key: "invoice", label: "Invoice ID" },
  ];
  return (
    <div>
      <div className="pb-3 border-b border-border/60">
        <h2 className="text-lg font-semibold">Manage IDs</h2>
        <div className="text-sm text-muted-foreground mt-0.5">Set prefixes and common ID formats for Query, Quotation and Invoice numbers.</div>
      </div>
      <div className="mt-5 grid md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const v = prefixes[c.key] ?? { prefix: "", format: ID_FORMATS[c.key][0].id };
          const fmt = ID_FORMATS[c.key].find((f) => f.id === v.format) ?? ID_FORMATS[c.key][0];
          return (
            <div key={c.key} className="rounded-2xl border bg-card/60 backdrop-blur-xl p-4">
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Sample: {fmt.sample(v.prefix || "TB")}</div>
              <div className="grid gap-3 mt-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Prefix</Label>
                  <Input value={v.prefix} onChange={(e) => setPrefixes({ ...prefixes, [c.key]: { ...v, prefix: e.target.value } })} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Format</Label>
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" value={v.format} onChange={(e) => setPrefixes({ ...prefixes, [c.key]: { ...v, format: e.target.value } })}>
                    {ID_FORMATS[c.key].map((f) => <option key={f.id} value={f.id}>{f.label} — {f.sample(v.prefix || "TB")}</option>)}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        These settings will apply to newly created IDs and stored IDs will keep showing everywhere in query, quotation, invoice preview, download and email.
      </div>
      <div className="flex justify-end mt-4">
        <Button className="rounded-full" onClick={() => mut.mutate({ data: { id_prefixes: prefixes } })} disabled={mut.isPending}>Save ID Settings</Button>
      </div>
    </div>
  );
}
function Field({ label, value, onChange, showStatus }: { label: string; value: string; onChange: (v: string) => void; showStatus?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label className="flex items-center gap-2">
        {label}
        {showStatus ? (
          value?.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border px-2 py-0.5 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" /> Not connected
            </span>
          )
        ) : null}
      </Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function ThemeSection() {
  const [theme, setTheme] = useLocal("trawe:theme", { primary: "#48a890", accent: "#c04818", surface: "auto" });
  return (
    <Section title="Workspace Theme" description="Personal theme preferences saved locally.">
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Primary" value={theme.primary} onChange={(v) => setTheme({ ...theme, primary: v })} />
        <Field label="Accent" value={theme.accent} onChange={(v) => setTheme({ ...theme, accent: v })} />
        <Field label="Surface" value={theme.surface} onChange={(v) => setTheme({ ...theme, surface: v })} />
      </div>
    </Section>
  );
}
function CurrenciesSection() {
  const qc = useQueryClient();
  const { data: rates } = useQuery({ queryKey: ["currency-rates"], queryFn: () => listCurrencyRates() });
  const refresh = useMutation({
    mutationFn: useServerFn(refreshCurrencyRates),
    onSuccess: (r: any) => { toast.success(r.message || "Rates refreshed"); qc.invalidateQueries({ queryKey: ["currency-rates"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const setBase = useMutation({
    mutationFn: useServerFn(setBaseCurrency),
    onSuccess: () => { toast.success("Base currency updated"); qc.invalidateQueries({ queryKey: ["currency-rates"] }); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: useServerFn(toggleCurrencyActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currency-rates"] }),
  });
  const base = (rates ?? []).find((r: any) => r.is_base)?.code ?? "INR";
  const lastUpdated = (rates ?? []).map((r: any) => r.last_updated).filter(Boolean).sort().reverse()[0];
  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold">Currencies</h2>
          <div className="text-sm text-muted-foreground mt-0.5">Rates update automatically once per day when CRM opens first time after day change.</div>
        </div>
        <Button className="rounded-full" onClick={() => refresh.mutate({})} disabled={refresh.isPending}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1", refresh.isPending && "animate-spin")} /> Update Rates Now
        </Button>
      </div>
      <div className="mt-5 rounded-2xl border bg-card/60 backdrop-blur-xl p-4 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><RefreshCw className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-semibold">Auto Rate API</div>
            <div className="text-xs text-muted-foreground">Frankfurter</div>
          </div>
        </div>
        <RateChip label="Base" value={base} />
        <RateChip label="Last Success" value={lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"} />
        <RateChip label="Message" value={refresh.data?.message ?? "—"} />
      </div>
      <div className="mt-5 rounded-2xl border bg-card/60 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Country</th>
              <th className="text-left px-4 py-2">Currency</th>
              <th className="text-left px-4 py-2">Code</th>
              <th className="text-left px-4 py-2">Symbol</th>
              <th className="text-right px-4 py-2">Rate</th>
              <th className="text-left px-4 py-2">Last Updated</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {(rates ?? []).map((r: any, i: number) => (
              <tr key={r.id} className={cn("border-t", r.is_base && "bg-primary/5")}>
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">{r.country || "—"}</td>
                <td className="px-4 py-2 flex items-center gap-2">{r.name} {r.is_base && <Badge variant="outline" className="text-[10px] text-primary border-primary/40">Base</Badge>}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-2">{r.symbol || ""}</td>
                <td className="px-4 py-2 text-right font-mono">{Number(r.rate).toFixed(6)}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.last_updated ? new Date(r.last_updated).toLocaleString() : "Not updated yet"}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={!!r.is_active} onCheckedChange={(v) => toggle.mutate({ data: { id: r.id, is_active: v } })} />
                    {!r.is_base && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setBase.mutate({ data: { code: r.code } })}>Set base</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 bg-background">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function TermsSection() {
  const qc = useQueryClient();
  const { data: blocks } = useQuery({ queryKey: ["package-terms"], queryFn: () => listPackageTerms() });
  const [editing, setEditing] = useState<any | null>(null);
  const del = useMutation({
    mutationFn: useServerFn(deletePackageTerm),
    onSuccess: () => { toast.success("Terms block removed"); qc.invalidateQueries({ queryKey: ["package-terms"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold">Package Terms</h2>
          <div className="text-sm text-muted-foreground mt-0.5">Default terms blocks will be copied automatically into every new manual or AI itinerary.</div>
        </div>
        <Button className="rounded-full" onClick={() => setEditing({ heading: "", content: "", is_default: true, status: "active", sort_order: (blocks?.length ?? 0) })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Terms Block
        </Button>
      </div>
      <div className="mt-5 space-y-3">
        {(blocks ?? []).length === 0 && (
          <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">No terms blocks yet. Click "Add Terms Block" to create one.</div>
        )}
        {(blocks ?? []).map((b: any) => (
          <div key={b.id} className="rounded-2xl border bg-card/60 backdrop-blur-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold">{b.heading}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Sort: {b.sort_order} · {b.is_default ? "Default" : "Optional"}{b.status === "inactive" ? " · Inactive" : ""}</div>
                <div className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{b.content}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(b)}>Edit</Button>
                <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => { if (confirm("Delete this terms block?")) del.mutate({ data: { id: b.id } }); }}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <TermsEditSheet block={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["package-terms"] })} />
    </div>
  );
}

function TermsEditSheet({ block, onClose, onSaved }: { block: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => { setForm(block ?? {}); }, [block]);
  const mut = useMutation({
    mutationFn: useServerFn(upsertPackageTerm),
    onSuccess: () => { toast.success("Terms block saved"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Sheet open={!!block} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>{form.id ? "Edit Terms Block" : "Add Terms Block"}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid gap-1.5">
            <Label>Heading</Label>
            <Input value={form.heading ?? ""} onChange={(e) => setForm({ ...form, heading: e.target.value })} placeholder="Inclusions, Exclusions, Payment Policy" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: !!v })} /> Default for new itinerary
            </label>
            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.status ?? "active"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Sort</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Content</Label>
            <Textarea rows={10} value={form.content ?? ""} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write package terms and policies..." />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
          <Button className="rounded-full" onClick={() => mut.mutate({ data: form })} disabled={mut.isPending || !form.heading}>Save Terms</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TemplatePicker({ data, kind, options }: { data: any; kind: "invoice" | "itinerary"; options: { id: string; label: string; desc: string }[] }) {
  return <TemplatePickerInner data={data} kind={kind} options={options} />;
}

function TemplateMiniPreview({ kind, id, tenant }: { kind: "invoice" | "itinerary"; id: string; tenant: any }) {
  const brand = tenant?.name ?? "Your Agency";
  const gst = tenant?.gstin ?? "27ABCDE1234F1Z5";
  if (kind === "invoice" && id === "classic") {
    return (
      <div className="p-3 text-[7px] leading-tight text-slate-800 font-sans h-56 flex flex-col">
        <div className="flex justify-between items-start pb-2 border-b">
          <div>
            <div className="text-[10px] font-bold text-slate-900">{brand}</div>
            <div className="text-slate-500">GSTIN {gst}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-extrabold tracking-wider text-slate-900">INVOICE</div>
            <div className="text-slate-500">#INV-000123</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <div className="text-slate-400 uppercase">Bill To</div>
            <div className="font-semibold">Rahul Sharma</div>
            <div className="text-slate-500">Mumbai, India</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 uppercase">Date</div>
            <div>24 Jul 2026</div>
          </div>
        </div>
        <div className="mt-2 border rounded overflow-hidden">
          <div className="grid grid-cols-6 bg-slate-100 text-[6px] font-semibold px-1.5 py-1">
            <div className="col-span-3">Description</div><div className="text-right">Qty</div><div className="text-right">Rate</div><div className="text-right">Amount</div>
          </div>
          {["Bali Package 5N/6D","Airport Transfer","Travel Insurance"].map((t, i) => (
            <div key={i} className="grid grid-cols-6 px-1.5 py-0.5 border-t">
              <div className="col-span-3 truncate">{t}</div><div className="text-right">1</div><div className="text-right">—</div><div className="text-right">—</div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-end pt-2">
          <div className="w-1/2 space-y-0.5">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹85,000</span></div>
            <div className="flex justify-between text-slate-500"><span>GST 5%</span><span>₹4,250</span></div>
            <div className="flex justify-between font-bold bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded"><span>Balance Due</span><span>₹89,250</span></div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "invoice" && id === "travel_tax") {
    return (
      <div className="text-[7px] leading-tight text-slate-800 font-sans h-56 flex flex-col">
        <div className="bg-gradient-to-r from-teal-700 to-teal-500 text-white px-3 py-2 flex justify-between">
          <div>
            <div className="text-[10px] font-bold">{brand}</div>
            <div className="opacity-80">Tax Invoice under GST Act</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold">TAX INVOICE</div>
            <div className="opacity-80">TI/2026/000123</div>
          </div>
        </div>
        <div className="p-2 grid grid-cols-2 gap-2">
          <div className="border rounded p-1.5">
            <div className="text-slate-400 uppercase text-[6px]">Traveller</div>
            <div className="font-semibold">Rahul Sharma · 2 Pax</div>
            <div className="text-slate-500">Delhi → Bali · 12–17 Aug</div>
          </div>
          <div className="border rounded p-1.5">
            <div className="text-slate-400 uppercase text-[6px]">GST Summary</div>
            <div className="flex justify-between"><span>Taxable</span><span>₹85,000</span></div>
            <div className="flex justify-between"><span>IGST 5%</span><span>₹4,250</span></div>
            <div className="flex justify-between"><span>TCS 5%</span><span>₹4,462</span></div>
          </div>
        </div>
        <div className="px-2 mt-auto pb-2">
          <div className="border rounded p-1.5 flex justify-between items-center">
            <div>
              <div className="text-slate-400 uppercase text-[6px]">Bank</div>
              <div>HDFC · A/C 5010 2233 4455 · IFSC HDFC0000123</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 uppercase text-[6px]">Grand Total</div>
              <div className="text-[10px] font-extrabold text-teal-700">₹93,712</div>
            </div>
          </div>
          <div className="mt-1 text-[6px] text-slate-500">Subject to jurisdiction. E. & O.E. Terms apply as per booking.</div>
        </div>
      </div>
    );
  }
  // Itinerary previews
  if (kind === "itinerary" && id === "default") {
    return (
      <div className="p-2 h-56 text-[7px]">
        <div className="rounded bg-slate-100 h-14 grid place-items-center text-slate-400">Cover Image</div>
        <div className="mt-1 font-bold text-[10px]">Bali · 5N/6D</div>
        <div className="text-slate-500">Day-by-day plan · Stay · Meals · Inclusions</div>
        <div className="mt-1 space-y-0.5">
          {["Day 1 · Arrival Denpasar","Day 2 · Ubud Culture","Day 3 · Uluwatu Sunset"].map(d=>(
            <div key={d} className="border-l-2 border-teal-500 pl-1.5">{d}</div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "itinerary" && id === "scenic_a4") {
    return (
      <div className="h-56 flex flex-col text-[7px]">
        <div className="flex-1 bg-gradient-to-br from-teal-600 via-emerald-500 to-amber-400 relative">
          <div className="absolute inset-x-0 bottom-0 p-2 text-white">
            <div className="text-[10px] font-extrabold">Day 03 · Uluwatu</div>
            <div className="opacity-90">Sunset temple · Kecak dance</div>
          </div>
        </div>
        <div className="p-2 flex justify-between bg-white border-t">
          <div className="text-slate-500">Full-bleed image per day</div>
          <div className="font-semibold">Pricing page ↦</div>
        </div>
      </div>
    );
  }
  if (kind === "itinerary" && id === "journey_a4") {
    return (
      <div className="p-2 h-56 text-[7px] flex flex-col">
        <div className="flex gap-1">
          {["D1","D2","D3","D4","D5"].map((d,i)=>(<div key={d} className={cn("px-1.5 py-0.5 rounded-full border", i===1 ? "bg-teal-600 text-white border-teal-600" : "border-slate-300 text-slate-500")}>{d}</div>))}
        </div>
        <div className="mt-1 font-bold text-[10px]">Day 02 · Ubud Culture</div>
        <div className="grid grid-cols-4 gap-1 mt-1 text-center">
          {["Stay","Meals","Flights","Summary"].map(s=>(<div key={s} className="border rounded py-1 bg-slate-50">{s}</div>))}
        </div>
        <div className="mt-1 flex-1 rounded bg-slate-100 grid place-items-center text-slate-400">Day details grid</div>
      </div>
    );
  }
  return <div className="h-56 grid place-items-center text-xs text-muted-foreground">Preview</div>;
}

function TemplatePickerInner({ data, kind, options }: { data: any; kind: "invoice" | "itinerary"; options: { id: string; label: string; desc: string }[] }) {
  const qc = useQueryClient();
  const field = kind === "invoice" ? "invoice_template" : "itinerary_template";
  const current = data?.tenant?.[field] ?? options[0].id;
  const [picked, setPicked] = useState<string>(current);
  useEffect(() => setPicked(current), [current]);
  const mut = useMutation({
    mutationFn: useServerFn(updateOrganization),
    onSuccess: () => { toast.success("Template saved"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <div className="pb-3 border-b border-border/60">
        <h2 className="text-lg font-semibold">{kind === "invoice" ? "Invoice Template" : "Itinerary Template"}</h2>
        <div className="text-sm text-muted-foreground mt-0.5">
          {kind === "invoice"
            ? "Choose how invoices should appear in invoice view, print, download and email PDF."
            : "Select the layout used everywhere for itinerary preview, PDF download, email attachment and WhatsApp PDF."}
        </div>
      </div>
      <div className="mt-5 grid md:grid-cols-2 gap-4">
        {options.map((o) => (
          <div key={o.id} className={cn("rounded-2xl border p-5 transition-all bg-card/60 backdrop-blur-xl", picked === o.id ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-sm">{o.desc}</div>
              </div>
              <input type="radio" checked={picked === o.id} onChange={() => setPicked(o.id)} className="h-4 w-4 accent-primary" />
            </div>
            <div className="mt-4 rounded-lg border bg-white overflow-hidden">
              <TemplateMiniPreview kind={kind} id={o.id} tenant={data?.tenant} />
            </div>
            <div className="mt-4">
              {picked === o.id ? (
                <Button size="sm" className="rounded-full" disabled><Check className="h-3.5 w-3.5 mr-1" /> Selected</Button>
              ) : (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setPicked(o.id)}>Select Template</Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button className="rounded-full" onClick={() => mut.mutate({ data: { [field]: picked } as any })} disabled={mut.isPending || picked === current}>Save Changes</Button>
      </div>
    </div>
  );
}

function WhatsAppSection({ data }: { data: any }) {
  const cloudEnabled = useFeature("whatsapp_cloud");
  // Dropdown catalogs — TraWe WhatsApp settings.
  const WA_SOURCES = ["Auto / WhatsApp", "Website", "Phone Call", "WhatsApp", "Referral", "Walk-in", "Instagram", "Facebook", "Google"] as const;
  const WA_SERVICES = [
    "Auto / Package", "Full Package", "GIT Package", "Flight", "Hotel", "Visa", "Passport",
    "Transport", "Sightseeing", "Cruise", "Ferry", "Bus", "Train",
  ] as const;
  const WA_STAGES: { label: string; stages: string[] }[] = [
    { label: "Package Booking", stages: ["New", "No Connect", "Follow Up", "Proposal Sent", "Proposal Confirmed", "Hot Lead", "Confirmed", "Lost"] },
    { label: "Visa", stages: ["New Lead", "Ringing", "Quotation", "Quotation confirm", "Doc.. Received", "Doc.. Submitted", "Doc.. Hold", "Approved"] },
    { label: "Flight Booking", stages: ["New", "Quotation", "Quotation Confirm", "Converted"] },
    { label: "Hotel Booking", stages: ["New", "Call Back / Ringing", "Quotation", "Quotation Confirmed", "Converted"] },
    { label: "GIT Package", stages: ["New", "Follow Up", "Proposal Sent", "Confirmed", "Lost"] },
    { label: "Transport", stages: ["New", "Quotation", "Confirmed", "Lost"] },
    { label: "Sightseeing", stages: ["New", "Quotation", "Confirmed", "Lost"] },
    { label: "Passport", stages: ["New", "Docs Received", "Submitted", "Delivered"] },
    { label: "Cruise", stages: ["New", "Quotation", "Confirmed", "Lost"] },
    { label: "Ferry", stages: ["New", "Quotation", "Confirmed", "Lost"] },
    { label: "Bus", stages: ["New", "Quotation", "Confirmed", "Lost"] },
    { label: "Train", stages: ["New", "Quotation", "Confirmed", "Lost"] },
  ];
  const qc = useQueryClient();
  const t = data?.tenant ?? {};
  const defaultCfg = {
    enabled: true, auto_create_client: true, pause_after_manual: false, pause_minutes: 2,
    auto_create_query: true, default_owner: "auto", default_source: "WhatsApp",
    default_stage: "auto", default_service: "Package",
    prompt: "",
  };
  const initial = { ...defaultCfg, ...(t.whatsapp_ai_config ?? {}) };
  const [cfg, setCfg] = useState<any>(initial);
  useEffect(() => setCfg({ ...defaultCfg, ...(t.whatsapp_ai_config ?? {}) }), [t.id]);

  // WA Sender API provider config
  // Provider presets — pick from dropdown to auto-fill base URL and endpoints.
  const PROVIDER_PRESETS: Record<string, { label: string; base_url: string; status_endpoint: string; send_endpoint: string; api_key_placeholder: string; hint: string }> = {
    wasender: {
      label: "WasenderAPI (wasenderapi.com)",
      base_url: "https://wasenderapi.com",
      status_endpoint: "https://wasenderapi.com/api/status",
      send_endpoint: "https://wasenderapi.com/api/send-message",
      api_key_placeholder: "4251921e395bb76e...",
      hint: "Official WasenderAPI cloud. Use the Private API Key from Dashboard → Sessions.",
    },
    wa_sender_legacy: {
      label: "WA Sender API (self-hosted / legacy)",
      base_url: "https://api.wasender.io",
      status_endpoint: "https://api.wasender.io/api/status",
      send_endpoint: "https://api.wasender.io/api/send-message",
      api_key_placeholder: "wa_sender_api_key_...",
      hint: "Older WA Sender deployments. Adjust base URL if you self-host.",
    },
    meta_cloud: {
      label: "Meta WhatsApp Cloud API",
      base_url: "https://graph.facebook.com/v20.0",
      status_endpoint: "https://graph.facebook.com/v20.0",
      send_endpoint: "https://graph.facebook.com/v20.0/{phone_number_id}/messages",
      api_key_placeholder: "EAAG... (permanent access token)",
      hint: "Enter your Phone Number ID in the Instance ID field. Send endpoint uses {phone_number_id}.",
    },
    custom: {
      label: "Custom / Other",
      base_url: "",
      status_endpoint: "",
      send_endpoint: "",
      api_key_placeholder: "your_api_key_...",
      hint: "Enter your own provider endpoints below.",
    },
  };
  const providerDefaults = {
    engine: "wasender",
    provider: "wasender",
    enabled: true,
    api_key: "",
    instance_id: "",
    sender_mobile: "",
    base_url: PROVIDER_PRESETS.wasender.base_url,
    status_endpoint: PROVIDER_PRESETS.wasender.status_endpoint,
    send_endpoint: PROVIDER_PRESETS.wasender.send_endpoint,
    webhook_secret: "",
    show_disconnect_alert: true,
  };
  const [prov, setProv] = useState<any>({ ...providerDefaults, ...(t.whatsapp_provider_config ?? {}) });
  useEffect(() => setProv({ ...providerDefaults, ...(t.whatsapp_provider_config ?? {}) }), [t.id]);
  const setP = (k: string, v: any) => setProv({ ...prov, [k]: v });
  const applyPreset = (key: string) => {
    const preset = PROVIDER_PRESETS[key];
    if (!preset) return;
    setProv({
      ...prov,
      provider: key,
      // Only overwrite endpoints when user hasn't customised them, or when switching to a real preset.
      base_url: preset.base_url || prov.base_url,
      status_endpoint: preset.status_endpoint || prov.status_endpoint,
      send_endpoint: preset.send_endpoint || prov.send_endpoint,
    });
  };
  const activePreset = PROVIDER_PRESETS[prov.provider] ?? PROVIDER_PRESETS.custom;
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const diag = useQuery({
    queryKey: ["wa-diagnostics"],
    queryFn: () => getWhatsAppDiagnostics(),
    refetchInterval: 15000,
  });
  const testMut = useMutation({
    mutationFn: useServerFn(testWhatsAppConnection),
    onSuccess: (r: any) => {
      if (r.ok) toast.success(r.message ?? "Connection OK");
      else toast.error(r.message ?? "Connection failed");
      qc.invalidateQueries({ queryKey: ["wa-diagnostics"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const [testTo, setTestTo] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; to?: string } | null>(null);
  const sendTestMut = useMutation({
    mutationFn: useServerFn(sendWhatsAppTestMessage),
    onSuccess: (r: any) => {
      setTestResult({ ok: !!r.ok, message: r.message ?? "", to: r.to });
      if (r.ok) toast.success(`WhatsApp test sent to ${r.to}`);
      else toast.error(r.message ?? "Send failed");
      qc.invalidateQueries({ queryKey: ["wa-diagnostics"] });
    },
    onError: (e: any) => { setTestResult({ ok: false, message: e.message }); toast.error(e.message); },
  });
  const rotateMut = useMutation({
    mutationFn: useServerFn(rotateWhatsAppWebhookSecret),
    onSuccess: (r: any) => {
      toast.success("Webhook secret rotated");
      setP("webhook_secret", r.secret);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const engineMut = useMutation({
    mutationFn: useServerFn(setWhatsAppEngine),
    onSuccess: (r: any) => {
      toast.success(r.engine === "trawe" ? "Using TraWe WhatsApp" : "Using WasenderAPI");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["trawe-wa-status"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.trawe.in";
  const webhookUrl = `${origin}/api/public/whatsapp/webhook?tenant=${t.id ?? ""}`;
  const copy = (v: string, label = "Copied") => { navigator.clipboard.writeText(v); toast.success(label); };

  const mut = useMutation({
    mutationFn: useServerFn(updateOrganization),
    onSuccess: () => { toast.success("WhatsApp AI settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const set = (k: string, v: any) => setCfg({ ...cfg, [k]: v });

  const connected = !!(diag.data as any)?.connected;
  const hasAnyTest = !!diag.data?.lastTest || !!(diag.data as any)?.lastSend || !!(diag.data as any)?.latestHealthy;
  const statusColor = connected ? "text-emerald-600" : (hasAnyTest ? "text-rose-600" : "text-muted-foreground");
  const statusLabel = (diag.data as any)?.statusLabel ?? (connected ? "Connected" : (hasAnyTest ? "Disconnected" : "Not tested yet"));

  return (
    <div>
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold">WhatsApp</h2>
          <div className="text-sm text-muted-foreground mt-0.5">Connect your WA Sender API instance, configure the AI Travel Agent, and monitor incoming webhooks.</div>
        </div>
        <Badge variant="outline" className={cn("border-primary/40", statusColor)}>
          <PlugZap className="h-3 w-3 mr-1" /> {statusLabel}
        </Badge>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold flex items-center gap-2">
            WhatsApp API
            <Badge variant="outline" className={cn("text-[10px]", prov.enabled === false ? "border-rose-500/40 text-rose-600" : "border-emerald-500/40 text-emerald-600")}>
              {prov.enabled === false ? "Inactive" : "Active"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Turn off to pause all outgoing sends (tests, campaigns, automations, DOB greetings, inbox replies) and ignore incoming webhooks — useful for nights or holidays.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{prov.enabled === false ? "OFF" : "ON"}</span>
          <Switch
            checked={prov.enabled !== false}
            onCheckedChange={(v) => {
              const next = { ...prov, enabled: v };
              setProv(next);
              mut.mutate({ data: { whatsapp_provider_config: next } as any }, {
                onSuccess: () => {
                  toast.success(v ? "WhatsApp turned ON" : "WhatsApp turned OFF");
                  qc.invalidateQueries({ queryKey: ["wa-diagnostics"] });
                },
              });
            }}
            disabled={mut.isPending}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card/50 p-4">
        <div className="text-sm font-semibold">Which WhatsApp engine should this workspace use?</div>
        <div className="text-xs text-muted-foreground mt-0.5">You can switch any time. Only the selected engine sends messages.</div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { key: "wasender", title: "WasenderAPI", desc: cloudEnabled ? "Paid third-party gateway. Reliable, works with campaigns and high volume." : "Not included in your current plan." },
            { key: "trawe", title: "TraWe WhatsApp", desc: "Our own QR connection using your number. No provider fee. Best for one-to-one chats." },
          ].map((o) => {
            const active = (prov.engine ?? "wasender") === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  if (o.key === "wasender" && !cloudEnabled) return toast.error("WhatsApp Cloud is not included in your current plan.");
                  const next = { ...prov, engine: o.key };
                  setProv(next);
                  engineMut.mutate({ data: { engine: o.key } } as any);
                }}
                className={cn(
                  "text-left rounded-xl border p-3.5 transition",
                  active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{o.title}</span>
                  {active && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Selected</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{o.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {(prov.engine ?? "wasender") === "trawe" && (
        <div className="mt-4"><TraweWhatsAppPanel /></div>
      )}

      {(prov.engine ?? "wasender") !== "trawe" && (
      <AccountPanel title="WA Sender API Integration" hint="Store your WA Sender API credentials, define endpoints, and share the CRM webhook URL with WA Sender for incoming messages">
        <div className="grid gap-1.5 mb-4">
          <Label className="text-xs">Provider</Label>
          <Select value={prov.provider ?? "wasender"} onValueChange={applyPreset}>
            <SelectTrigger className="w-full md:w-[420px]">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
                <SelectItem key={key} value={key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{activePreset.hint}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">API Key</Label>
            <div className="flex gap-2">
              <Input type={showKey ? "text" : "password"} value={prov.api_key ?? ""} onChange={(e) => setP("api_key", e.target.value)} placeholder={activePreset.api_key_placeholder} />
              <Button variant="outline" size="icon" onClick={() => setShowKey((v) => !v)} type="button">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              <Button variant="outline" size="icon" onClick={() => copy(prov.api_key ?? "")} type="button"><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Instance ID</Label>
            <Input value={prov.instance_id ?? ""} onChange={(e) => setP("instance_id", e.target.value)} placeholder="e.g. 6789ABCD" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Sender Mobile Number</Label>
            <Input value={prov.sender_mobile ?? ""} onChange={(e) => setP("sender_mobile", e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Base URL</Label>
            <Input value={prov.base_url ?? ""} onChange={(e) => setP("base_url", e.target.value)} placeholder="https://wasenderapi.com" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Status Endpoint (GET)</Label>
            <Input value={prov.status_endpoint ?? ""} onChange={(e) => setP("status_endpoint", e.target.value)} placeholder="https://wasenderapi.com/api/status" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Send Message Endpoint (POST)</Label>
            <Input value={prov.send_endpoint ?? ""} onChange={(e) => setP("send_endpoint", e.target.value)} placeholder="https://wasenderapi.com/api/send-message" />
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">CRM Receive Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(webhookUrl, "Webhook URL copied")} type="button"><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" asChild><a href={webhookUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Paste this URL into your WA Sender API dashboard as the incoming-message webhook. Add header <span className="font-mono">X-Webhook-Secret</span> with the secret below (or append <span className="font-mono">&amp;secret=…</span> to the URL).</p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">Webhook Secret</Label>
            <div className="flex gap-2">
              <Input
                type={showSecret ? "text" : "password"}
                value={prov.webhook_secret ?? ""}
                onChange={(e) => setP("webhook_secret", e.target.value)}
                placeholder="Paste WA Sender webhook secret or click Rotate"
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={() => setShowSecret((v) => !v)} type="button">{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              <Button variant="outline" size="icon" onClick={() => copy(prov.webhook_secret ?? "", "Secret copied")} type="button"><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => { if (confirm("Clear the webhook secret? Save afterwards to persist. Incoming webhooks will be rejected until a new secret is set.")) setP("webhook_secret", ""); }} type="button" disabled={!prov.webhook_secret}>
                Clear
              </Button>
              <Button variant="outline" onClick={() => { if (confirm("Rotate the webhook secret? Existing WA Sender configuration will stop working until you update it.")) rotateMut.mutate({} as any); }} type="button" disabled={rotateMut.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" /> Rotate
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Edit to paste a secret you generated in WA Sender, then click <b>Save API Settings</b>. Use <b>Clear</b> to remove it or <b>Rotate</b> to generate a new one server-side.</p>
          </div>

          <ToggleRow
            label="Show disconnect alert"
            desc="Display a banner in CRM whenever the WA Sender API status endpoint reports the instance as disconnected."
            checked={!!prov.show_disconnect_alert}
            onChange={(v) => setP("show_disconnect_alert", v)}
          />
        </div>

        <Separator className="my-5" />

        <div className="grid gap-3">
          <div>
            <div className="text-sm font-medium">Send Test WhatsApp Message</div>
            <div className="text-xs text-muted-foreground">Delivers a real message via your configured send endpoint. Include country code (e.g. +919876543210).</div>
          </div>
          <div className="grid md:grid-cols-[220px_1fr_auto] gap-2">
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="+91 9876543210" />
            <Input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Optional custom message (defaults to a friendly test)" />
            <Button
              onClick={async () => {
                try {
                  await mut.mutateAsync({ data: { whatsapp_provider_config: prov } as any });
                } catch { /* toast already shown */ return; }
                sendTestMut.mutate({ data: { to: testTo, message: testMsg || undefined } } as any);
              }}
              disabled={sendTestMut.isPending || !testTo.trim()}
              className="rounded-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {sendTestMut.isPending ? "Sending…" : "Send Test"}
            </Button>
          </div>
          {testResult && (
            <div className={cn(
              "rounded-md border p-3 text-xs font-mono whitespace-pre-wrap break-words",
              testResult.ok ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                            : "border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-300",
            )}>
              {testResult.ok ? "✓ " : "✗ "}{testResult.message}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={async () => {
            try { await mut.mutateAsync({ data: { whatsapp_provider_config: prov } as any }); } catch { return; }
            testMut.mutate({} as any);
          }} disabled={testMut.isPending || mut.isPending}>
            <PlugZap className="h-4 w-4 mr-2" /> {testMut.isPending ? "Testing…" : "Test Connection"}
          </Button>
          <Button className="rounded-full" onClick={() => mut.mutate({ data: { whatsapp_provider_config: prov } as any })} disabled={mut.isPending}>Save API Settings</Button>
        </div>
      </AccountPanel>
      )}


      <AccountPanel title="AI Travel Agent" hint="Auto reply to incoming WhatsApp messages, create clients and avoid duplicate same-date queries">
        <div className="grid md:grid-cols-2 gap-4">
          <ToggleRow label="AI Agent ON/OFF" desc="When enabled, incoming WhatsApp text messages will receive an AI travel-agent reply in the customer's language." checked={!!cfg.enabled} onChange={(v) => set("enabled", v)} />
          <ToggleRow label="Auto-create client for unknown numbers" desc="If the number is not found in clients, CRM will create a new client. If disabled, only the WhatsApp conversation will be saved." checked={!!cfg.auto_create_client} onChange={(v) => set("auto_create_client", v)} />
          <ToggleRow label="Pause AI after manual staff reply" desc="When a staff member replies manually from CRM or the connected WhatsApp phone, AI will stay silent for the selected time for that customer." checked={!!cfg.pause_after_manual} onChange={(v) => set("pause_after_manual", v)} />
          <div className="grid gap-1.5">
            <Label className="text-xs">Manual Reply Pause Duration (minutes)</Label>
            <Input type="number" min={0} value={cfg.pause_minutes ?? 2} onChange={(e) => set("pause_minutes", Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Default is 2 minutes. During this time, incoming customer messages are saved but AI replies are not sent.</p>
          </div>
          <ToggleRow label="Auto-create query from new messages" desc="If the same mobile already has a query for the same date, a new query will not be created and the message will be attached as a note." checked={!!cfg.auto_create_query} onChange={(v) => set("auto_create_query", v)} />
          <div className="grid gap-1.5">
            <Label className="text-xs">Default Query Owner</Label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={cfg.default_owner} onChange={(e) => set("default_owner", e.target.value)}>
              <option value="auto">Auto / First active user</option>
              {(data?.users ?? []).map((u: any) => (<option key={u.id} value={u.id}>{u.display_name || u.email}</option>))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Default Lead Source</Label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={cfg.default_source} onChange={(e) => set("default_source", e.target.value)}>
              {WA_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Default Query Stage</Label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={cfg.default_stage} onChange={(e) => set("default_stage", e.target.value)}>
              <option value="auto">Auto / First stage</option>
              {WA_STAGES.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.stages.map((s) => (<option key={`${group.label}-${s}`} value={`${group.label} - ${s}`}>{group.label} - {s}</option>))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Default Service Type</Label>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={cfg.default_service} onChange={(e) => set("default_service", e.target.value)}>
              {WA_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-1.5">
          <Label className="text-xs">AI Agent Prompt</Label>
          <Textarea rows={16} value={cfg.prompt ?? ""} onChange={(e) => set("prompt", e.target.value)} className="font-mono text-xs" />
          <p className="text-[11px] text-muted-foreground">Use this prompt to define company tone, reply language rules, travel requirement fields, and rules to avoid fake prices or availability.</p>
        </div>

        <div className="mt-4 rounded-lg border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Duplicate incoming webhook message IDs will be ignored. AI replies will not trigger on outgoing/from-me messages.
        </div>
      </AccountPanel>

      <div className="mt-4 flex justify-end">
        <Button className="rounded-full" onClick={() => mut.mutate({ data: { whatsapp_ai_config: cfg } as any })} disabled={mut.isPending}>Save AI Settings</Button>
      </div>

      <AccountPanel title="Diagnostics" hint="Live status from WA Sender API and the last webhook event received by CRM">
        <div className="grid md:grid-cols-3 gap-3">
          <DiagCard label="Connection Status" value={statusLabel} sub={(diag.data as any)?.latestHealthy?.message ?? diag.data?.lastTest?.message ?? "Run a test to verify credentials."} tone={connected ? "ok" : (diag.data?.lastTest ? "err" : "muted")} />
          <DiagCard label="Last Webhook Hit" value={diag.data?.lastWebhookHit ? new Date(diag.data.lastWebhookHit.created_at).toLocaleString() : "—"} sub={diag.data?.lastWebhookHit?.message ?? "No webhook received yet."} tone={diag.data?.lastWebhookHit ? "ok" : "muted"} />
          <DiagCard label="Last Test Message" value={diag.data?.lastTest ? new Date(diag.data.lastTest.created_at).toLocaleString() : "—"} sub={diag.data?.lastTest?.status ?? "—"} tone={connected ? "ok" : (diag.data?.lastTest ? "err" : "muted")} />
        </div>
        {diag.data?.recent && diag.data.recent.length > 0 && (
          <div className="mt-4 rounded-lg border bg-muted/20 divide-y">
            {diag.data.recent.slice(0, 8).map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="capitalize">{r.kind.replace("_", " ")}</Badge>
                  <span className={cn("font-medium", ["connected", "received", "sent", "delivered"].includes(r.status ?? "") ? "text-emerald-600" : (r.status ? "text-rose-600" : "text-muted-foreground"))}>{r.status ?? "—"}</span>
                  <span className="truncate text-muted-foreground">{r.message}</span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </AccountPanel>
    </div>
  );
}

function DiagCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "ok" | "err" | "muted" }) {
  const dot = tone === "ok" ? "bg-emerald-500" : tone === "err" ? "bg-rose-500" : "bg-muted-foreground/50";
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} /> {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sub}</div>}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-lg border p-3 flex items-start justify-between gap-3 bg-background">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ---------- Data Administration ----------
function ImportSection() {
  return (
    <Section title="Import" description="Bring existing data into TraWe.">
      <div className="text-sm">Use the &quot;Import CSV&quot; action on Leads and Customers to bulk load records.</div>
    </Section>
  );
}
function ExportSection() {
  return (
    <Section title="Export" description="Download workspace data as CSV.">
      <div className="text-sm text-muted-foreground">Every list view (Leads, Invoices, Payments, Bookings) has an Export CSV button on the top-right of the table toolbar.</div>
    </Section>
  );
}
function BackupSection() {
  const fn = useServerFn(exportBackup);
  async function run() {
    toast.info("Preparing backup…");
    try {
      const res = await fn();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `trawe-backup-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (e: any) { toast.error(e.message); }
  }
  return (
    <Section title="Full Workspace Backup" description="Download a JSON snapshot of core tables.">
      <Button onClick={run}><Download className="h-4 w-4 mr-2" />Download Backup</Button>
    </Section>
  );
}
function RecycleSection() {
  return (
    <Section title="Recycle Bin" description="Deleted records are hard-removed by default in TraWe.">
      <div className="text-sm text-muted-foreground">Soft-delete with a Recycle Bin will land in a future release. For now, request a restore via Super Admin audit logs.</div>
    </Section>
  );
}
function StorageSection() {
  const { data } = useQuery({ queryKey: ["storage"], queryFn: () => getStorageStats() });
  return (
    <Section title="Storage" description="Approximate row counts across your workspace.">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Leads" value={data?.leadsCount ?? 0} />
        <Stat label="Invoices" value={data?.invCount ?? 0} />
        <Stat label="Itineraries" value={data?.itCount ?? 0} />
      </div>
    </Section>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}
function ApiDocsSection() {
  return (
    <Section title="API Docs" description="Programmatic access via Lovable Cloud.">
      <div className="text-sm">Server functions live under <code>/api/*</code>. Contact support to enable a personal API token.</div>
    </Section>
  );
}
function ApiKeysSection() {
  const [keys, setKeys] = useLocal("trawe:aikeys", { openai: "", gemini: "", claude: "" });
  return (
    <Section title="AI API Keys (BYO)" description="Bring your own model keys. Stored locally in your browser.">
      <Field label="OpenAI (ChatGPT)" value={keys.openai} onChange={(v) => setKeys({ ...keys, openai: v })} showStatus />
      <Field label="Google Gemini" value={keys.gemini} onChange={(v) => setKeys({ ...keys, gemini: v })} showStatus />
      <Field label="Anthropic Claude" value={keys.claude} onChange={(v) => setKeys({ ...keys, claude: v })} showStatus />
      <div className="text-xs text-muted-foreground">By default TraWe uses the shared Lovable AI Gateway. Providing a key overrides for your session.</div>
    </Section>
  );
}

// ---------- Channels ----------
function ChannelsSection() {
  return (
    <Section title="Channels" description="Integrations that read/write data outside TraWe.">
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { name: "Email (SMTP)", note: "Send from notify.trawe.in — configured by default." },
          { name: "Google Sheets", note: "Push leads and invoices to a linked sheet." },
        ].map((c) => (
          <div key={c.name} className="rounded-xl border p-4">
            <div className="font-semibold text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.note}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
function WidgetSection() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${origin}/widget.js" data-tenant="YOUR-TENANT" async></script>`;
  return (
    <Section title="Website Widget" description="Drop a lead-capture widget on your site.">
      <Textarea rows={3} readOnly value={snippet} />
    </Section>
  );
}
function DobSection() {
  const [cfg, setCfg] = useLocal("trawe:dob", { enabled: true, message: "Happy Birthday {name}! 🎉 Wishing you an amazing year ahead — TraWe" });
  return (
    <Section title="DOB Greeting" description="Automated birthday message to customers.">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Enabled
      </label>
      <div className="grid gap-1.5">
        <Label>Message</Label>
        <Textarea rows={3} value={cfg.message} onChange={(e) => setCfg({ ...cfg, message: e.target.value })} />
      </div>
    </Section>
  );
}

// ---------- helper: localStorage hook ----------
function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw));
    } catch {}
  }, [key]);
  function update(next: T) {
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }
  return [v, update];
}