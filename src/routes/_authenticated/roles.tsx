import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRolePermissions, upsertRolePermission } from "@/lib/hr.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roles")({
  head: () => ({ meta: [
    { title: "Roles & Permissions — TraWe" },
    { name: "description", content: "Configure per-module CRUD permissions for each workspace role." },
    { name: "robots", content: "noindex" },
  ]}),
  component: RolesPage,
});

type Perm = { role: string; module: string; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean };
const ACTIONS: (keyof Perm)[] = ["can_view", "can_create", "can_edit", "can_delete"];
const LABELS: Record<string, string> = { can_view: "View", can_create: "Create", can_edit: "Edit", can_delete: "Delete" };

function RolesPage() {
  const list = useServerFn(listRolePermissions);
  const save = useServerFn(upsertRolePermission);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["role-perms"], queryFn: () => list() });
  const saveM = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["role-perms"] }); toast.success("Updated"); },
  });

  const roles: string[] = data?.roles ?? ["admin", "manager", "agent"];
  const modules: string[] = data?.modules ?? [];
  const rows: Perm[] = data?.rows ?? [];
  const get = (role: string, module: string): Perm =>
    rows.find(r => r.role === role && r.module === module) ?? { role, module, can_view: role === "admin", can_create: role === "admin", can_edit: role === "admin", can_delete: role === "admin" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a] flex items-center gap-2"><Shield className="h-6 w-6 text-primary" />Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">Fine-grained control over what each role can do in every module.</p>
      </div>

      <Tabs defaultValue={roles[0]}>
        <TabsList>{roles.map(r => <TabsTrigger key={r} value={r} className="capitalize">{r}</TabsTrigger>)}</TabsList>
        {roles.map(role => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader><CardTitle className="text-base capitalize">{role} permissions</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Module</th>
                      {ACTIONS.map(a => <th key={a} className="text-center px-4 py-2 font-medium w-24">{LABELS[a]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(mod => {
                      const p = get(role, mod);
                      return (
                        <tr key={mod} className="border-t">
                          <td className="px-4 py-2 capitalize">{mod.replace(/_/g, " ")}</td>
                          {ACTIONS.map(a => (
                            <td key={a} className="text-center px-4 py-2">
                              <Checkbox checked={!!p[a]} onCheckedChange={(v) => saveM.mutate({ ...p, [a]: !!v })} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}