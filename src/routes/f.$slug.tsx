import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/f/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — TraWe Form` },
      { name: "description", content: "Get in touch — quick enquiry form." },
    ],
  }),
  loader: async ({ params }) => {
    const { data } = await supabase.from("forms").select("*").eq("slug", params.slug).eq("active", true).maybeSingle();
    return { form: data };
  },
  component: PublicFormPage,
});

function PublicFormPage() {
  const data = Route.useLoaderData() as { form: any };
  const form = data?.form;
  const [values, setValues] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!form) {
    return <div className="min-h-screen grid place-items-center p-6"><div className="text-center"><h1 className="text-2xl font-bold">Form not found</h1><p className="text-muted-foreground text-sm mt-1">This form is inactive or does not exist.</p></div></div>;
  }

  const theme = form.theme ?? {};
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("form_submissions").insert({ tenant_id: form.tenant_id, form_id: form.id, payload: values });
      if (error) throw error;
      // Auto-create lead when full_name/email/phone present
      const lead: any = {
        tenant_id: form.tenant_id,
        full_name: values.full_name || values.name || "Web enquiry",
        email: values.email || null,
        phone: values.phone || values.tel || null,
        source: `form:${form.slug}`,
        notes: JSON.stringify(values),
      };
      await supabase.from("leads").insert(lead);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen p-6 grid place-items-center" style={{ background: theme.bg ?? "linear-gradient(135deg,#f0f9f7,#fdf3ee)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-lg p-8" style={{ background: theme.card ?? "#ffffff", color: "#111" }}>
        {done ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-bold">Thank you!</h1>
            <p className="text-sm opacity-70">We received your enquiry and will get back to you shortly.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{form.title}</h1>
            {form.description && <p className="text-sm opacity-70 mt-1">{form.description}</p>}
            <form onSubmit={submit} className="space-y-3 mt-5">
              {(form.schema ?? []).map((f: any) => (
                <div key={f.name}>
                  <Label className="text-xs">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                  {f.type === "textarea"
                    ? <Textarea required={f.required} rows={4} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
                    : <Input required={f.required} type={f.type} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />}
                </div>
              ))}
              <Button type="submit" disabled={busy} className="w-full" style={{ background: theme.button ?? "#48a890", color: theme.button_text ?? "#fff" }}>
                {busy ? "Sending…" : "Submit"}
              </Button>
            </form>
            {theme.branding !== false && <div className="text-center text-[10px] uppercase tracking-wider opacity-60 mt-6">Powered by TraWe</div>}
          </>
        )}
      </div>
    </div>
  );
}