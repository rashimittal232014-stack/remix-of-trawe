import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_query",
  title: "Get a travel query",
  description: "Fetch one travel query (lead) with its itineraries and recent activities.",
  inputSchema: { id: z.string().uuid().describe("The query id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    await assertMcpAccess(supabase, userId);
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!lead) return { content: [{ type: "text", text: "No query found with that id." }], isError: true };
    const [itineraries, activities] = await Promise.all([
      supabase.from("itineraries").select("id, title, status, created_at").eq("lead_id", id),
      supabase.from("activities").select("id, type, subject, due_at, status").eq("lead_id", id).order("due_at", { ascending: false }).limit(10),
    ]);
    const payload = { query: lead, itineraries: itineraries.data ?? [], activities: activities.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
