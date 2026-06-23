/**
 * API serveur featureHub — handler route agent matériel (routes API uniquement).
 */
export {
  MATERIAL_AGENT_TOOL_SCOPE,
  handleMaterialAgentPost,
} from "@/features/featureHub/materialAgentRouteHandler";
export type {
  MaterialAgentPostBody,
  MaterialAgentRouteAuth,
} from "@/features/featureHub/materialAgentRouteHandler";
