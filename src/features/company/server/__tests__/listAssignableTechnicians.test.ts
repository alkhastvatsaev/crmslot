import type * as admin from "firebase-admin";
import type { CompanyStaffMember } from "@/features/teamHub/types";

jest.mock("@/features/company/server/listCompanyStaff", () => ({
  listCompanyStaff: jest.fn(),
}));

jest.mock("@/features/company/server/provisionTechnicianStaff", () => ({
  provisionTechnicianStaffRecord: jest.fn(),
}));

import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { listAssignableTechnicians } from "@/features/company/server/listAssignableTechnicians";

const listCompanyStaffMock = listCompanyStaff as jest.MockedFunction<typeof listCompanyStaff>;
const provisionTechnicianStaffRecordMock = provisionTechnicianStaffRecord as jest.MockedFunction<
  typeof provisionTechnicianStaffRecord
>;

function staffMember(overrides: Partial<CompanyStaffMember> & Pick<CompanyStaffMember, "uid">) {
  return {
    role: "collaborateur",
    email: null,
    firstName: "Test",
    lastName: "User",
    displayName: "Test User",
    hasTechnicianProfile: true,
    active: true,
    authUid: overrides.uid,
    ...overrides,
  } satisfies CompanyStaffMember;
}

function makeDb(technicians: Array<{ id: string; data: Record<string, unknown> }>) {
  const byId = new Map(technicians.map((row) => [row.id, row.data]));
  const set = jest.fn().mockImplementation(async (id: string, data: Record<string, unknown>) => {
    const existing = byId.get(id) ?? {};
    byId.set(id, { ...existing, ...data });
  });
  const where = jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation(async () => ({
      docs: [...byId.entries()].map(([id, data]) => ({
        id,
        data: () => data,
      })),
    })),
  });
  const doc = jest.fn().mockImplementation((id: string) => ({
    set: (data: Record<string, unknown>, opts?: { merge?: boolean }) =>
      set(id, opts?.merge ? { ...(byId.get(id) ?? {}), ...data } : data),
    get: jest.fn().mockImplementation(async () => ({
      id,
      exists: byId.has(id),
      data: () => byId.get(id) ?? {},
    })),
  }));
  const collection = jest.fn().mockReturnValue({ where, doc });

  return {
    db: { collection } as unknown as admin.firestore.Firestore,
    set,
    where,
    byId,
  };
}

describe("listAssignableTechnicians", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists assignable technicians and provisions only missing profiles", async () => {
    listCompanyStaffMock
      .mockResolvedValueOnce([
        staffMember({
          uid: "admin-1",
          role: "admin",
          displayName: "Alkhast",
          hasTechnicianProfile: false,
          authUid: null,
        }),
        staffMember({
          uid: "tech-1",
          displayName: "Mansour",
          hasTechnicianProfile: true,
        }),
        staffMember({
          uid: "dispatch-1",
          displayName: "Dispatcher",
          hasTechnicianProfile: false,
          authUid: null,
        }),
      ])
      .mockResolvedValueOnce([
        staffMember({
          uid: "admin-1",
          role: "admin",
          displayName: "Alkhast",
          hasTechnicianProfile: true,
          authUid: "admin-1",
        }),
        staffMember({
          uid: "tech-1",
          displayName: "Mansour",
          hasTechnicianProfile: true,
        }),
      ]);

    const { db } = makeDb([
      {
        id: "admin-1",
        data: {
          authUid: "admin-1",
          companyId: "company-1",
          name: "Alkhast",
          status: "available",
          active: true,
        },
      },
      {
        id: "tech-1",
        data: {
          authUid: "tech-1",
          companyId: "company-1",
          name: "Mansour",
          status: "available",
          active: true,
        },
      },
    ]);

    const technicians = await listAssignableTechnicians(db, {} as typeof admin.auth, "company-1");

    expect(provisionTechnicianStaffRecordMock).not.toHaveBeenCalled();
    expect(technicians.map((row) => row.id).sort()).toEqual(["admin-1", "tech-1"]);
  });
});
