import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";

/** Dispatch / back-office : voit les interventions de la société active (carte, inbox). */
export function isCompanyDispatchViewer(
  workspace: Pick<CompanyWorkspaceApi, "isTenantUser" | "activeRole"> | null | undefined
): boolean {
  if (!workspace?.isTenantUser) return false;
  return workspace.activeRole === "admin" || workspace.activeRole === "collaborateur";
}
