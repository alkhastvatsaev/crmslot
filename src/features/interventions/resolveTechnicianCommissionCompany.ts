import type { CompanyWorkspaceApi } from "@/context/companyWorkspaceContextTypes";
import type { HubCompanyPhase } from "@/features/company/resolveHubCompanyId";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import type { Technician } from "@/features/technicians";

/** Société active pour le panneau gains terrain (workspace admin ou profil technicien satellite). */
export function resolveTechnicianCommissionCompany(params: {
  workspace: CompanyWorkspaceApi | null | undefined;
  selfTechnician: Technician | null;
  selfTechnicianLoading: boolean;
}): { companyId: string | null; phase: HubCompanyPhase } {
  const hub = resolveHubCompanyId(params.workspace);
  if (hub.phase === "ready" && hub.companyId) {
    return hub;
  }

  const profileCompanyId = (params.selfTechnician?.companyId ?? "").trim();
  if (profileCompanyId) {
    return { companyId: profileCompanyId, phase: "ready" };
  }

  if (hub.phase === "loading" || params.selfTechnicianLoading) {
    return { companyId: null, phase: "loading" };
  }

  if (hub.phase === "missing") {
    return { companyId: null, phase: "missing" };
  }

  return hub;
}
