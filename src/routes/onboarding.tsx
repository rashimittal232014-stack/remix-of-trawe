import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/crm.functions";
import { updateTenantProfile } from "@/lib/settings.functions";
import { SingleImagePicker } from "@/components/masters/single-image-picker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plane, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Welcome to TraWe — Set up your workspace" },
      { name: "description", content: "Upload your company logo to brand every itinerary, invoice and voucher you share with clients." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const meFn = useServerFn(getMe);
  const saveFn = useServerFn(updateTenantProfile);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
    });
  }, [navigate]);

  const tenant = me?.tenant as any;
  const agencyName = tenant?.name || "Your workspace";

  async function persist(url: string | null) {
    setSaving(true);
    try {
      await saveFn({
        data: {
          name: tenant?.name ?? agencyName,
          logo_url: url ?? null,
          primary_color: tenant?.primary_color ?? "#48a890",
          currency: tenant?.currency ?? "INR",
        },
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save logo");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  }

  async function saveAndContinue() {
    if (!logo) return toast.info("Pick a logo or click Skip.");
    if (await persist(logo)) {
      toast.success("Logo saved");
      navigate({ to: "/dashboard" });
    }
  }
  async function skip() {
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border bg-card/90 backdrop-blur-xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Plane className="h-4 w-4 text-primary" /> TraWe
        </div>
        <h1 className="mt-3 text-2xl font-bold">Welcome{me?.profile?.display_name ? `, ${me.profile.display_name.split(" ")[0]}` : ""} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload <span className="font-medium text-foreground">{agencyName}</span>'s logo. It'll appear on your dashboard and on every itinerary, ticket and invoice you share with clients.
        </p>

        <div className="mt-6 rounded-xl border bg-background/60 p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Company logo
          </div>
          <SingleImagePicker value={logo} onChange={setLogo} bucket="agency-logos" folder="logos" />
          <p className="mt-2 text-[11px] text-muted-foreground">PNG or JPG. Square works best. You can change this later in Settings → Organization.</p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={skip} disabled={saving}>Skip for now</Button>
          <Button onClick={saveAndContinue} disabled={saving || !logo}>{saving ? "Saving…" : "Save & continue"}</Button>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground text-center">
          If you skip, we'll use your initials in the sidebar and your full company name on shared documents.
        </p>
      </div>
    </div>
  );
}