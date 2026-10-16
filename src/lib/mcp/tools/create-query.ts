import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_query",
  title: "Create a travel query",
  description: "Create a new travel query (lead) in the signed-in user's TraWe workspace.",
  inputSchema: {
    full_name: z.string().trim().min(1).describe("Traveller or contact name."),
    email: z.string().email().optional(),
    phone: z.string().trim().min(3).optional(),
    to_location: z.string().trim().min(1).optional().describe("Destination."),
    from_location: z.string().trim().min(1).optional(),
    travel_date: z.string().trim().optional().describe("Travel start date, YYYY-MM-DD."),
    nights: z.number().int().min(0).max(365).optional(),
    adults: z.number().int().min(0).max(99).optional(),
    children: z.number().int().min(0).max(99).optional(),
    estimated_value: z.number().min(0).optional(),
    notes: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const tenantId = await assertMcpAccess(supabase, userId);
    const { data, error } = await supabase
      .from("leads")
      .insert({ ...input, tenant_id: tenantId, owner_id: userId })
      .select("id, code, full_name, to_location, travel_date")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created query ${data.code ?? data.id} for ${data.full_name}.` }],
      structuredContent: { query: data },
    };
  },
});
