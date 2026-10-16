import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listQueries from "./tools/list-queries";
import getQuery from "./tools/get-query";
import createQuery from "./tools/create-query";
import listCustomers from "./tools/list-customers";
import listItineraries from "./tools/list-itineraries";
import workspaceSummary from "./tools/workspace-summary";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "trawe",
  title: "TraWe",
  version: "0.1.0",
  instructions:
    "Tools for TraWe, a travel agency CRM. Read and create travel queries (leads), browse customers and itineraries, and get a workspace summary. All data is scoped to the signed-in TraWe user's workspace.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listQueries, getQuery, createQuery, listCustomers, listItineraries, workspaceSummary],
});
