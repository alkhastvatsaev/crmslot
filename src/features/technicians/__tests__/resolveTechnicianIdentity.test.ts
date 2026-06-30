import type { Technician } from "@/features/technicians/types";
import {
  buildTechnicianDocIdToAuthUidMap,
  findTechnicianByAssignUid,
  isTechnicianPlaceholderLabel,
  resolveTechnicianProfileLabel,
} from "@/features/technicians/resolveTechnicianIdentity";
import { buildPatronTechnicianRows } from "@/features/commissionsHub/commissionsHubPatronTechnicianRows";
import type { Intervention } from "@/features/interventions/types";

const tech = (overrides: Partial<Technician> = {}): Technician =>
  ({
    id: "doc-tech-1",
    name: "alkhast vatsaev",
    initial: "A",
    authUid: "firebase-auth-yIEPn2",
    companyId: "co-1",
    active: true,
    vehicle: "Van",
    status: "available",
    location: { lat: 0, lng: 0 },
    email: "alkhastvatsaev@icloud.com",
    ...overrides,
  }) as Technician;

describe("resolveTechnicianIdentity", () => {
  it("finds technician by auth uid or doc id", () => {
    const row = tech();
    expect(findTechnicianByAssignUid([row], "firebase-auth-yIEPn2")?.name).toBe("alkhast vatsaev");
    expect(findTechnicianByAssignUid([row], "doc-tech-1")?.name).toBe("alkhast vatsaev");
  });

  it("finds technician by email when auth uid is missing on profile", () => {
    const row = tech({ authUid: undefined });
    expect(
      findTechnicianByAssignUid([row], "firebase-auth-yIEPn2", {
        email: "alkhastvatsaev@icloud.com",
      })?.name
    ).toBe("alkhast vatsaev");
  });

  it("ignore le libellé générique Technicien sur le doc Firestore", () => {
    expect(
      resolveTechnicianProfileLabel(
        tech({ name: "Technicien", firstName: "alkhast", lastName: "vatsaev" })
      )
    ).toBe("alkhast vatsaev");
    expect(isTechnicianPlaceholderLabel("Technicien")).toBe(true);
  });

  it("resolves profile label from technician profile", () => {
    expect(resolveTechnicianProfileLabel(tech())).toBe("alkhast vatsaev");
    expect(
      resolveTechnicianProfileLabel(null, {
        displayName: "alkhast vatsaev",
        email: "alkhastvatsaev@icloud.com",
      })
    ).toBe("alkhast vatsaev");
  });

  it("maps doc id to auth uid", () => {
    const map = buildTechnicianDocIdToAuthUidMap([tech()]);
    expect(map.get("doc-tech-1")).toBe("firebase-auth-yIEPn2");
  });
});

describe("buildPatronTechnicianRows", () => {
  it("uses technician name when assigned uid matches authUid on profile", () => {
    const interventions = [
      {
        id: "iv-1",
        status: "done",
        assignedTechnicianUid: "firebase-auth-yIEPn2",
        completedAt: "2026-06-10T10:00:00.000Z",
        invoiceAmountCents: 12_000,
      } as Intervention,
    ];

    const rows = buildPatronTechnicianRows({
      interventions,
      manualEntries: [],
      rules: [],
      companyId: "co-1",
      technicians: [tech()],
      now: new Date("2026-06-15T12:00:00.000Z"),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("alkhast vatsaev");
    expect(rows[0]?.uid).toBe("firebase-auth-yIEPn2");
  });
});

it("utilise l'annuaire staff quand le doc technicien est générique", () => {
  const interventions = [
    {
      id: "iv-1",
      status: "done",
      assignedTechnicianUid: "firebase-auth-yIEPn2",
      completedAt: "2026-06-10T10:00:00.000Z",
      invoiceAmountCents: 12_000,
    } as Intervention,
  ];

  const rows = buildPatronTechnicianRows({
    interventions,
    manualEntries: [],
    rules: [],
    companyId: "co-1",
    technicians: [tech({ name: "Technicien", authUid: "firebase-auth-yIEPn2" })],
    staffMembers: [
      {
        uid: "firebase-auth-yIEPn2",
        role: "collaborateur",
        email: "alkhastvatsaev@icloud.com",
        firstName: "alkhast",
        lastName: "vatsaev",
        displayName: "alkhast vatsaev",
        hasTechnicianProfile: true,
        active: true,
        authUid: "firebase-auth-yIEPn2",
      },
    ],
    now: new Date("2026-06-15T12:00:00.000Z"),
  });

  expect(rows[0]?.name).toBe("alkhast vatsaev");
});
