/**
 * @jest-environment node
 */
import { FieldPath } from "firebase-admin/firestore";

jest.mock("firebase-admin/firestore", () => ({
  FieldPath: {
    documentId: jest.fn(() => "__name__"),
  },
}));

import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";

const mockGetUser = jest.fn();

describe("listCompanyStaff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ email: "tech@abc.be", displayName: "Jean Martin" });
  });

  it("merges membership role with technician profile", async () => {
    const membershipDocs = [
      {
        ref: {
          parent: { parent: { id: "uid-tech-1" } },
        },
        data: () => ({ role: "collaborateur" }),
      },
    ];

    const db = {
      collectionGroup: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ docs: membershipDocs }),
        })),
      })),
      collection: jest.fn((name: string) => {
        if (name !== "technicians") throw new Error(name);
        return {
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                companyId: "co-abc",
                authUid: "uid-tech-1",
                name: "Jean Martin",
                firstName: "Jean",
                lastName: "Martin",
                email: "tech@abc.be",
                active: true,
              }),
            }),
          })),
        };
      }),
    };

    const auth = jest.fn(() => ({ getUser: mockGetUser }));

    const staff = await listCompanyStaff(db as never, auth as never, "co-abc");

    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({
      uid: "uid-tech-1",
      role: "collaborateur",
      displayName: "Jean Martin",
      active: true,
      hasTechnicianProfile: true,
      authUid: "uid-tech-1",
    });
  });
});
