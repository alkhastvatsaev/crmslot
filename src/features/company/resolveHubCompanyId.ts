import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

export type HubCompanyPhase = "loading" | "ready" | "missing";

/** Société active pour les hubs — attend `workspaceReady` avant le gate « société requise ». */
export function resolveHubCompanyId(workspace: CompanyWorkspaceApi | null | undefined): {
  companyId: string | null;
  phase: HubCompanyPhase;
} {
  if (!workspace || workspace.workspaceReady !== true) {
    return { companyId: null, phase: "loading" };
  }

  const trimmed = (workspace.activeCompanyId ?? "").trim();
  if (trimmed) return { companyId: trimmed, phase: "ready" };
  if (workspace.isTenantUser) return { companyId: DEMO_COMPANY_ID, phase: "ready" };
  return { companyId: null, phase: "missing" };
}
