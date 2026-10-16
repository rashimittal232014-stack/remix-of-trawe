import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_itineraries",
  title: "List itineraries",
  description: "List itineraries in the signed-in user's TraWe workspace, newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20),
    status: z.string().trim().min(1).optional().describe("Optional status filter, e.g. draft or confirmed."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    await assertMcpAccess(supabase, userId);
    let q = supabase
      .from("itineraries")
      .select("id, title, status, lead_id, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status as never);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { itineraries: data ?? [] },
    };
  },
});
