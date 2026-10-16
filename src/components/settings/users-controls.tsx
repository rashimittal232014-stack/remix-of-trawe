import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listUsersControls, upsertUserRecord, setUserStatus,
  upsertCrmRole, deleteCrmRole,
  upsertCrmProfile, deleteCrmProfile,
} from "@/lib/users-controls.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus, Pencil, Trash2, Ban, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tab = "users" | "profiles" | "roles";
type StatusFilter = "active" | "inactive" | "invited" | "deleted";

const STATUS_TABS_USERS: { key: StatusFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "invited", label: "Invited" },
  { key: "deleted", label: "Deleted" },
];

export function UsersControls() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const list = useServerFn(listUsersControls);
  const { data } = useQuery({ queryKey: ["users-controls"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users-controls"] });
  const users = data?.users ?? [];
  const roles = data?.roles ?? [];
  const profiles = data?.profiles ?? [];
  const assigned = data?.assignedCount ?? {};

  return (
    <div>
      <div className="flex items-center gap-6 border-b border-border/60 px-1">
        {(["users", "profiles", "roles"] as Tab[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "relative py-3 text-sm capitalize transition-colors",
              tab === k ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k}
            {tab === k && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary rounded-full" />}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "users" && <UsersTab users={users} roles={roles} profiles={profiles} assigned={assigned} onChange={invalidate} />}
        {tab === "profiles" && <ProfilesTab profiles={profiles} users={users} onChange={invalidate} />}
        {tab === "roles" && <RolesTab roles={roles} users={users} onChange={invalidate} />}
      </div>
    </div>
  );
}

/* =============== USERS TAB =============== */
function UsersTab({ users, roles, profiles, assigned, onChange }: any) {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { active: 0, inactive: 0, invited: 0, deleted: 0 };
    users.forEach((u: any) => { c[(u.status as StatusFilter) ?? "active"] = (c[(u.status as StatusFilter) ?? "active"] ?? 0) + 1; });
    return c;
  }, [users]);
  const filtered = users.filter((u: any) => (u.status ?? "active") === status && (
    !q || `${u.display_name} ${u.email} ${u.first_name} ${u.last_name}`.toLowerCase().includes(q.toLowerCase())
  ));
  const limit = 300;
  const used = users.filter((u: any) => u.status !== "deleted").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {STATUS_TABS_USERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cn("h-8 px-4 text-xs font-medium rounded-full flex items-center gap-2 transition-colors",
                status === s.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {s.label}
              <span className={cn("inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px]",
                status === s.key ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {counts[s.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border bg-card px-4 py-2 min-w-[220px]">
          <div className="text-xs text-muted-foreground">Users <span className="font-semibold text-foreground">{used} / {limit}</span> <span className="text-emerald-600 ml-1">{limit - used} available</span></div>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 w-64 rounded-full h-9" />
          </div>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setEdit(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New User
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Full Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Profile</th>
              <th className="text-center px-4 py-3">Assigned Queries</th>
              <th className="text-center px-4 py-3 w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => {
              const role = roles.find((r: any) => r.id === u.crm_role_id);
              const prof = profiles.find((p: any) => p.id === u.crm_profile_id);
              const name = u.display_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email;
              const initials = (name || "?").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
              const count = assigned[u.id] ?? 0;
              return (
                <tr key={u.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-[11px] font-semibold">{initials}</div>
                      <span className="font-medium">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{role?.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3">{prof?.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded-full text-xs font-semibold",
                      count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground")}>{count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEdit(u); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <DeleteUserBtn id={u.id} onDone={onChange} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No users in this view.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <UserForm initial={edit} roles={roles} profiles={profiles} onClose={() => { setOpen(false); setEdit(null); onChange(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DeleteUserBtn({ id, onDone }: { id: string; onDone: () => void }) {
  const set = useServerFn(setUserStatus);
  const m = useMutation({
    mutationFn: () => set({ data: { id, status: "deleted" } }),
    onSuccess: () => { toast.success("User moved to Deleted"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("Move this user to Deleted?")) m.mutate(); }}>
      <Trash2 className="h-3.5 w-3.5 text-destructive" />
    </Button>
  );
}

function UserForm({ initial, roles, profiles, onClose }: any) {
  const save = useServerFn(upsertUserRecord);
  const [f, setF] = useState<any>(initial ?? {
    first_name: "", last_name: "", display_name: "", email: "", phone: "", job_title: "",
    crm_role_id: "", crm_profile_id: "",
    time_zone: "Asia/Kolkata", language: "English",
    status: "active", send_invite: "No",
  });
  const m = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => { toast.success(initial ? "User updated" : "User created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <SheetHeader className="mb-4"><SheetTitle>{initial ? "Edit User" : "New User"}</SheetTitle></SheetHeader>
      <div className="text-sm font-semibold mb-3">User Information</div>
      <div className="grid grid-cols-2 gap-3">
        <F label="First Name"><Input value={f.first_name ?? ""} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></F>
        <F label="Last Name"><Input value={f.last_name ?? ""} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></F>
        <F label="Display Name" className="col-span-2"><Input value={f.display_name ?? ""} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></F>
        <F label="Email" className="col-span-2"><Input type="email" disabled={!!initial} value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></F>
        <F label="Mobile" className="col-span-2"><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></F>
        <F label="Job Title" className="col-span-2"><Input value={f.job_title ?? ""} onChange={(e) => setF({ ...f, job_title: e.target.value })} /></F>
        <F label="Role"><Sel value={f.crm_role_id ?? ""} onChange={(v) => setF({ ...f, crm_role_id: v })} options={[{value:"",label:"—"}, ...roles.map((r: any) => ({ value: r.id, label: r.name }))]} /></F>
        <F label="Profile"><Sel value={f.crm_profile_id ?? ""} onChange={(v) => setF({ ...f, crm_profile_id: v })} options={[{value:"",label:"—"}, ...profiles.map((p: any) => ({ value: p.id, label: p.name }))]} /></F>
        <F label="Time Zone"><Sel value={f.time_zone ?? "Asia/Kolkata"} onChange={(v) => setF({ ...f, time_zone: v })} options={["Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London","America/New_York","UTC"].map((v)=>({value:v,label:v}))} /></F>
        <F label="Language"><Sel value={f.language ?? "English"} onChange={(v) => setF({ ...f, language: v })} options={["English","Hindi","Marathi","Gujarati","Tamil","Arabic"].map((v)=>({value:v,label:v}))} /></F>
        <F label="Status"><Sel value={f.status ?? "active"} onChange={(v) => setF({ ...f, status: v })} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"},{value:"invited",label:"Invited"},{value:"deleted",label:"Deleted"}]} /></F>
        {!initial && <F label="Send Invite"><Sel value={f.send_invite ?? "No"} onChange={(v) => setF({ ...f, send_invite: v })} options={[{value:"No",label:"No"},{value:"Yes",label:"Yes"}]} /></F>}
      </div>
      <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-3 border-t bg-background flex justify-between items-center">
        <div className="text-xs text-primary flex items-center gap-1"><Lock className="h-3 w-3" /> Manage Profiles from the Profiles tab.</div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={m.isPending || (!initial && !f.email) || !(f.first_name || f.display_name)} onClick={() => m.mutate()}>Save</Button>
        </div>
      </div>
    </>
  );
}

/* =============== PROFILES TAB =============== */
const ACCESS_LEVELS = ["Full", "Standard", "Restricted", "Custom"];
const ACCESS_STYLES: Record<string, string> = {
  Full: "bg-emerald-50 text-emerald-700",
  Standard: "bg-sky-50 text-sky-700",
  Restricted: "bg-amber-50 text-amber-700",
  Custom: "bg-violet-50 text-violet-700",
};

function ProfilesTab({ profiles, users, onChange }: any) {
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const del = useServerFn(deleteCrmProfile);
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); onChange(); } });
  const filtered = profiles.filter((p: any) => (p.status ?? "active") === status && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  const counts = { active: profiles.filter((p: any) => (p.status ?? "active") === "active").length, inactive: profiles.filter((p: any) => p.status === "inactive").length };
  const userCount = (pid: string) => users.filter((u: any) => u.crm_profile_id === pid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {(["active", "inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("h-8 px-4 text-xs font-medium rounded-full flex items-center gap-2 capitalize",
                status === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              {s}
              <span className={cn("inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px]",
                status === s ? "bg-primary/20 text-primary" : "bg-muted")}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 w-64 rounded-full h-9" />
          </div>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setEdit(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Profile
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="px-5 py-4 border-b bg-muted/20">
          <div className="text-base font-semibold">Profiles</div>
          <div className="text-xs text-muted-foreground mt-0.5">Profiles control what users can access inside CRM. Roles define hierarchy, profiles define permissions.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">Profile Name</th>
                <th className="text-left px-5 py-2.5">Description</th>
                <th className="text-left px-5 py-2.5">Access Level</th>
                <th className="text-center px-5 py-2.5">Users</th>
                <th className="text-left px-5 py-2.5">Status</th>
                <th className="text-center px-5 py-2.5 w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const initials = p.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-[11px] font-semibold">{initials}</div>
                        <span className="font-semibold">{p.name}</span>
                        {p.is_system && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">System</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.description || <span className="text-muted-foreground/60">No description</span>}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs font-medium px-2 py-0.5 rounded", ACCESS_STYLES[p.access_level] ?? "bg-muted")}>{p.access_level}</span></td>
                    <td className="px-5 py-3 text-center">{userCount(p.id)}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs font-medium", p.status === "active" ? "text-emerald-600" : "text-muted-foreground")}>{p.status === "active" ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        {p.is_system && p.name === "Super Admin" ? (
                          <span className="text-xs text-muted-foreground">Locked</span>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEdit(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5 text-primary" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("Delete this profile?")) delM.mutate(p.id); }}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No profiles.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <ProfileForm initial={edit} onClose={() => { setOpen(false); setEdit(null); onChange(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProfileForm({ initial, onClose }: any) {
  const save = useServerFn(upsertCrmProfile);
  const [f, setF] = useState<any>(initial ?? { name: "", access_level: "Standard", description: "", status: "active" });
  const m = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => { toast.success(initial ? "Profile updated" : "Profile created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <SheetHeader className="mb-4"><SheetTitle>{initial ? "Edit Profile" : "New Profile"}</SheetTitle></SheetHeader>
      <div className="text-sm font-semibold mb-3">Profile Information</div>
      <div className="grid gap-3">
        <F label="Profile Name"><Input value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
        <F label="Access Level"><Sel value={f.access_level} onChange={(v) => setF({ ...f, access_level: v })} options={ACCESS_LEVELS.map((v) => ({ value: v, label: v }))} /></F>
        <F label="Description"><Textarea rows={3} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
        <F label="Status"><Sel value={f.status ?? "active"} onChange={(v) => setF({ ...f, status: v })} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]} /></F>
      </div>
      <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-3 border-t bg-background flex justify-between items-center">
        <div className="text-xs text-primary">Permission matrix will be managed from profile details.</div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={m.isPending || !f.name} onClick={() => m.mutate()}>Save</Button>
        </div>
      </div>
    </>
  );
}

/* =============== ROLES TAB =============== */
function RolesTab({ roles, users, onChange }: any) {
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const del = useServerFn(deleteCrmRole);
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Deleted"); onChange(); } });
  const filtered = roles.filter((r: any) => (r.status ?? "active") === status && (!q || r.name.toLowerCase().includes(q.toLowerCase())));
  const counts = { active: roles.filter((r: any) => (r.status ?? "active") === "active").length, inactive: roles.filter((r: any) => r.status === "inactive").length };
  const userCount = (rid: string) => users.filter((u: any) => u.crm_role_id === rid).length;
  const roleName = (id?: string | null) => id ? roles.find((r: any) => r.id === id)?.name ?? "—" : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {(["active", "inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("h-8 px-4 text-xs font-medium rounded-full flex items-center gap-2 capitalize",
                status === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              {s}
              <span className={cn("inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[11px]",
                status === s ? "bg-primary/20 text-primary" : "bg-muted")}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 w-64 rounded-full h-9" />
          </div>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { setEdit(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Role
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="px-5 py-4 border-b bg-muted/20">
          <div className="text-base font-semibold">Roles</div>
          <div className="text-xs text-muted-foreground mt-0.5">Roles define user hierarchy and reporting structure. Profiles define module permissions.</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2.5">Role Name</th>
                <th className="text-left px-5 py-2.5">Reports To</th>
                <th className="text-left px-5 py-2.5">Description</th>
                <th className="text-center px-5 py-2.5">Users</th>
                <th className="text-left px-5 py-2.5">Status</th>
                <th className="text-center px-5 py-2.5 w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => {
                const initials = r.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
                const locked = r.is_system && r.name === "Administrator";
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-[11px] font-semibold">{initials}</div>
                        <span className="font-semibold">{r.name}</span>
                        {r.is_system && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">System</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">{roleName(r.reports_to)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.description || <span className="text-muted-foreground/60">No description</span>}</td>
                    <td className="px-5 py-3 text-center">{userCount(r.id)}</td>
                    <td className="px-5 py-3"><span className={cn("text-xs font-medium", r.status === "active" ? "text-emerald-600" : "text-muted-foreground")}>{r.status === "active" ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-1">
                        {locked ? <span className="text-xs text-muted-foreground">Locked</span> : (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5 text-primary" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("Delete this role?")) delM.mutate(r.id); }}><Ban className="h-3.5 w-3.5 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No roles.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <RoleForm initial={edit} roles={roles} onClose={() => { setOpen(false); setEdit(null); onChange(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoleForm({ initial, roles, onClose }: any) {
  const save = useServerFn(upsertCrmRole);
  const [f, setF] = useState<any>(initial ?? { name: "", reports_to: "", dashboard: "Sales Dashboard", description: "", status: "active" });
  const m = useMutation({
    mutationFn: () => save({ data: f }),
    onSuccess: () => { toast.success(initial ? "Role updated" : "Role created"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <>
      <SheetHeader className="mb-4"><SheetTitle>{initial ? "Edit Role" : "New Role"}</SheetTitle></SheetHeader>
      <div className="text-sm font-semibold mb-3">Role Information</div>
      <div className="grid gap-3">
        <F label="Role Name"><Input value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
        <F label="Reports To"><Sel value={f.reports_to ?? ""} onChange={(v) => setF({ ...f, reports_to: v })} options={[{value:"",label:"None"}, ...roles.filter((r: any) => r.id !== initial?.id).map((r: any) => ({ value: r.id, label: r.name }))]} /></F>
        <F label="Dashboard"><Sel value={f.dashboard ?? "Sales Dashboard"} onChange={(v) => setF({ ...f, dashboard: v })} options={["Sales Dashboard","Operations Dashboard","Accounts Dashboard","Admin Dashboard"].map((v)=>({value:v,label:v}))} /></F>
        <F label="Description"><Textarea rows={3} value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
        <F label="Status"><Sel value={f.status ?? "active"} onChange={(v) => setF({ ...f, status: v })} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}]} /></F>
      </div>
      <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-3 border-t bg-background flex justify-between items-center">
        <div className="text-xs text-primary">Role controls hierarchy. Profile controls permissions.</div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
          <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={m.isPending || !f.name} onClick={() => m.mutate()}>Save</Button>
        </div>
      </div>
    </>
  );
}

/* =============== helpers =============== */
function F({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}