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
  const set = jest.fn().mockResolvedValue(undefined);
  const where = jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      docs: technicians.map((row) => ({
        id: row.id,
        data: () => row.data,
      })),
    }),
  });
  const doc = jest.fn().mockReturnValue({ set });
  const collection = jest.fn().mockReturnValue({ where, doc });

  return {
    db: { collection } as unknown as admin.firestore.Firestore,
    set,
    where,
  };
}

describe("listAssignableTechnicians", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provisions missing profiles for dirigeants and active technicians", async () => {
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

    const { db, set } = makeDb([
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

    expect(provisionTechnicianStaffRecordMock).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledTimes(2);
    expect(technicians.map((row) => row.id).sort()).toEqual(["admin-1", "tech-1"]);
  });
});
