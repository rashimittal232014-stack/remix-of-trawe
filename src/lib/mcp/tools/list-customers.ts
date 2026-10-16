import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertMcpAccess, notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_customers",
  title: "List customers",
  description: "List customers in the signed-in user's TraWe workspace, optionally filtered by name, email or phone.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20),
    search: z.string().trim().min(1).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    if (!userId) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    await assertMcpAccess(supabase, userId);
    let q = supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(limit ?? 20);
    if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { customers: data ?? [] },
    };
  },
});
