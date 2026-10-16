import { defineTool } from "@lovable.dev/mcp-js";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "workspace_summary",
  title: "Workspace summary",
  description: "Counts of queries, customers, itineraries, bookings and invoices in the signed-in user's TraWe workspace.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    await assertMcpAccess(supabase, userId);
    const tables = ["leads", "customers", "itineraries", "bookings", "invoices"] as const;
    const counts: Record<string, number> = {};
    await Promise.all(
      tables.map(async (t) => {
        const { count } = await supabase.from(t as never).select("id", { count: "exact", head: true });
        counts[t] = count ?? 0;
      }),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(counts, null, 2) }],
      structuredContent: { counts },
    };
  },
});
