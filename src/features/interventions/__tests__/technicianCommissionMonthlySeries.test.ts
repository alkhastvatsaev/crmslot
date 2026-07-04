import type { CompanyWorkspaceApi } from "@/context/companyWorkspaceContextTypes";
import { resolveTechnicianCommissionCompany } from "@/features/interventions/resolveTechnicianCommissionCompany";
import { buildTechnicianGainsMonthlySeries } from "@/features/interventions/technicianCommissionMonthlySeries";
import type { Intervention } from "@/features/interventions/types";
import type { Technician } from "@/features/technicians";

const baseIv = (overrides: Partial<Intervention> = {}): Intervention =>
  ({
    id: "iv-1",
    status: "done",
    assignedTechnicianUid: "auth-uid-1",
    completedAt: "2026-07-01T10:00:00.000Z",
    billingLines: [{ description: "Main d'oeuvre", quantity: 1, unitPriceCents: 10_000 }],
    ...overrides,
  }) as Intervention;

const tech = (overrides: Partial<Technician> = {}): Technician =>
  ({
    id: "tech-doc-1",
    name: "Jean",
    initial: "J",
    authUid: "auth-uid-1",
    companyId: "co-terrain",
    active: true,
    ...overrides,
  }) as Technician;

const workspaceLoading = {
  workspaceReady: false,
  activeCompanyId: "",
} as CompanyWorkspaceApi;

const workspaceMissing = {
  workspaceReady: true,
  activeCompanyId: "",
} as CompanyWorkspaceApi;

describe("resolveTechnicianCommissionCompany", () => {
  it("utilise la société workspace quand elle est disponible", () => {
    expect(
      resolveTechnicianCommissionCompany({
        workspace: { workspaceReady: true, activeCompanyId: "co-admin" } as CompanyWorkspaceApi,
        selfTechnician: tech(),
        selfTechnicianLoading: false,
      })
    ).toEqual({ companyId: "co-admin", phase: "ready" });
  });

  it("retombe sur companyId du profil technicien satellite", () => {
    expect(
      resolveTechnicianCommissionCompany({
        workspace: workspaceMissing,
        selfTechnician: tech({ companyId: "co-terrain" }),
        selfTechnicianLoading: false,
      })
    ).toEqual({ companyId: "co-terrain", phase: "ready" });
  });

  it("reste en chargement tant que le profil terrain n'est pas résolu", () => {
    expect(
      resolveTechnicianCommissionCompany({
        workspace: workspaceLoading,
        selfTechnician: null,
        selfTechnicianLoading: true,
      })
    ).toEqual({ companyId: null, phase: "loading" });
  });
});

describe("buildTechnicianGainsMonthlySeries", () => {
  it("projette les gains depuis le CA même sans commissionAmountCents persistée", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");
    const interventions = [
      baseIv({
        id: "jul",
        completedAt: "2026-07-10T10:00:00.000Z",
        billingLines: [{ description: "Travaux", quantity: 1, unitPriceCents: 20_000 }],
      }),
      baseIv({
        id: "jun",
        completedAt: "2026-06-12T10:00:00.000Z",
        billingLines: [{ description: "Travaux", quantity: 1, unitPriceCents: 10_000 }],
      }),
    ];

    const series = buildTechnicianGainsMonthlySeries({
      interventions,
      manualEntries: [],
      valueType: "percentage",
      value: 10,
      months: 6,
      now,
    });

    const july = series.find((point) => point.monthKey === "2026-07");
    const june = series.find((point) => point.monthKey === "2026-06");

    expect(july?.revenueCents).toBe(20_000);
    expect(july?.commissionCents).toBe(2_000);
    expect(june?.revenueCents).toBe(10_000);
    expect(june?.commissionCents).toBe(1_000);
  });
});
