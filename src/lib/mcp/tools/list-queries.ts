import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_queries",
  title: "List travel queries",
  description: "List recent travel queries (leads) in the signed-in user's TraWe workspace, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("How many queries to return."),
    search: z.string().trim().min(1).optional().describe("Optional name, email or destination to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    await assertMcpAccess(supabase, userId);
    let q = supabase
      .from("leads")
      .select("id, code, full_name, email, phone, to_location, travel_date, nights, adults, children, estimated_value, priority, source, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,to_location.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { queries: data ?? [] },
    };
  },
});
