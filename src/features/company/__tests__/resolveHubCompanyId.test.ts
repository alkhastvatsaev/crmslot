import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";

function workspace(partial: Partial<CompanyWorkspaceApi>): CompanyWorkspaceApi {
  return {
    firebaseUid: "uid",
    memberships: [],
    activeCompanyId: "",
    setActiveCompanyId: () => {},
    activeRole: null,
    workspaceReady: true,
    isTenantUser: false,
    refreshClaimsSilent: async () => false,
    ...partial,
  };
}

describe("resolveHubCompanyId", () => {
  it("reste en loading tant que workspaceReady est false", () => {
    expect(
      resolveHubCompanyId(workspace({ workspaceReady: false, activeCompanyId: "co-1" }))
    ).toEqual({
      companyId: null,
      phase: "loading",
    });
  });

  it("utilise activeCompanyId quand prêt", () => {
    expect(
      resolveHubCompanyId(workspace({ activeCompanyId: "co-abc", isTenantUser: true }))
    ).toEqual({
      companyId: "co-abc",
      phase: "ready",
    });
  });

  it("retombe sur demo quand tenant sans id explicite", () => {
    expect(resolveHubCompanyId(workspace({ isTenantUser: true }))).toEqual({
      companyId: "demo-local-company",
      phase: "ready",
    });
  });

  it("signale missing quand prêt sans tenant", () => {
    expect(resolveHubCompanyId(workspace({ workspaceReady: true }))).toEqual({
      companyId: null,
      phase: "missing",
    });
  });
});
