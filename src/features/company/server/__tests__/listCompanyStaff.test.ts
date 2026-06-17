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

    const technicianDoc = {
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
    };

    const membershipGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ role: "collaborateur" }),
    });

    const db = {
      collectionGroup: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ docs: membershipDocs }),
        })),
      })),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return {
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                docs: [{ id: "uid-tech-1" }],
              }),
            })),
            doc: jest.fn(() => technicianDoc),
          };
        }
        if (name === "companies") {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
            })),
          };
        }
        throw new Error(name);
      }),
      doc: jest.fn((path: string) => {
        if (path === "users/uid-tech-1/company_memberships/co-abc") {
          return { get: membershipGet };
        }
        throw new Error(path);
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

  it("retourne les techniciens même si l'index collectionGroup manque", async () => {
    const technicianDoc = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          companyId: "co-abc",
          authUid: "uid-tech-2",
          name: "Paul Dupont",
          active: true,
        }),
      }),
    };

    const db = {
      collectionGroup: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockRejectedValue(new Error("FAILED_PRECONDITION: missing index")),
        })),
      })),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return {
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                docs: [{ id: "uid-tech-2" }],
              }),
            })),
            doc: jest.fn(() => technicianDoc),
          };
        }
        if (name === "companies") {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
            })),
          };
        }
        throw new Error(name);
      }),
      doc: jest.fn((path: string) => {
        if (path === "users/uid-tech-2/company_memberships/co-abc") {
          return {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ role: "collaborateur" }),
            }),
          };
        }
        throw new Error(path);
      }),
    };

    const auth = jest.fn(() => ({
      getUser: jest.fn().mockResolvedValue({ email: "paul@abc.be", displayName: "Paul Dupont" }),
    }));

    const staff = await listCompanyStaff(db as never, auth as never, "co-abc");

    expect(staff).toHaveLength(1);
    expect(staff[0]?.uid).toBe("uid-tech-2");
  });
});
