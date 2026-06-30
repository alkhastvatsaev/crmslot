import type { Intervention } from "@/features/interventions";
import {
  interventionCountsForCompanyCommissions,
  mergeCommissionsHubInterventions,
} from "@/features/commissionsHub/commissionsHubInterventionsScope";
import { buildPatronTechnicianRows } from "@/features/commissionsHub/commissionsHubPatronTechnicianRows";
import { monthKeyFromDate } from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
import type { Technician } from "@/features/technicians";

const COMPANY = "co-1";
const AUTH_UID = "auth-tech-1";
const DOC_ID = "tech-doc-1";

const technician: Technician = {
  id: DOC_ID,
  name: "Jean Tech",
  initial: "J",
  vehicle: "V1",
  status: "available",
  location: { lat: 0, lng: 0 },
  authUid: AUTH_UID,
  companyId: COMPANY,
};

function mission(overrides: Partial<Intervention> & Pick<Intervention, "id">): Intervention {
  const month = monthKeyFromDate(new Date());
  const { id, ...rest } = overrides;
  return {
    title: "Mission",
    address: "Rue Test",
    time: "10:00",
    status: "done",
    location: { lat: 0, lng: 0 },
    assignedTechnicianUid: AUTH_UID,
    completedAt: month + "-15T10:00:00.000Z",
    invoiceAmountCents: 16_000,
    ...rest,
    id,
  };
}

describe("mergeCommissionsHubInterventions", () => {
  it("inclut une mission assignée au technicien sans companyId", () => {
    const missingCompany = mission({ id: "iv-missing-co", companyId: null });
    const merged = mergeCommissionsHubInterventions(COMPANY, [], [missingCompany], [technician]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("iv-missing-co");
  });

  it("ignore une mission hors société et hors équipe", () => {
    const foreign = mission({
      id: "iv-foreign",
      companyId: "other-co",
      assignedTechnicianUid: "unknown-uid",
    });
    const merged = mergeCommissionsHubInterventions(COMPANY, [], [foreign], [technician]);
    expect(merged).toHaveLength(0);
  });
});

describe("interventionCountsForCompanyCommissions", () => {
  it("accepte companyId manquant si assigné à un technicien de la société", () => {
    const iv = mission({ id: "iv-1", companyId: undefined });
    expect(interventionCountsForCompanyCommissions(COMPANY, iv, [technician])).toBe(true);
  });
});

describe("buildPatronTechnicianRows", () => {
  it("agrège docId et authUid sur une seule ligne technicien", () => {
    const rows = buildPatronTechnicianRows({
      interventions: [
        mission({ id: "iv-auth", assignedTechnicianUid: AUTH_UID, invoiceAmountCents: 156_000 }),
        mission({ id: "iv-doc", assignedTechnicianUid: DOC_ID, invoiceAmountCents: 16_000 }),
      ],
      manualEntries: [],
      rules: [],
      companyId: COMPANY,
      technicians: [technician],
    });

    const row = rows.find((r) => r.uid === AUTH_UID);
    expect(row).toBeDefined();
    expect(row?.revenueMissionCount).toBe(2);
    expect(row?.monthRevenueCents).toBe(172_000);
  });
});
