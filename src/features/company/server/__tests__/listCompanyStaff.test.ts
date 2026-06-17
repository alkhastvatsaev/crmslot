/**
 * @jest-environment node
 */
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";

const mockGetUser = jest.fn();

describe("listCompanyStaff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ email: "tech@abc.be", displayName: "Jean Martin" });
  });

  it("merges membership role with technician profile", async () => {
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

    const staffDirectoryGet = jest.fn().mockResolvedValue({ docs: [] });

    const db = {
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
        if (name === "companies/co-abc/staff_directory") {
          return { get: staffDirectoryGet };
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
          return {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ role: "collaborateur" }),
            }),
          };
        }
        if (path === "companies/co-abc/staff_directory/uid-tech-1") {
          return { set: jest.fn().mockResolvedValue(undefined) };
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

  it("inclut les admins listés dans staff_directory sans fiche technicien", async () => {
    const technicianDoc = {
      get: jest.fn().mockResolvedValue({ exists: false }),
    };

    const db = {
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return {
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ docs: [] }),
            })),
            doc: jest.fn(() => technicianDoc),
          };
        }
        if (name === "companies/co-abc/staff_directory") {
          return {
            get: jest.fn().mockResolvedValue({
              docs: [{ id: "uid-admin-1" }],
            }),
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
        if (path === "users/uid-admin-1/company_memberships/co-abc") {
          return {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ role: "admin" }),
            }),
          };
        }
        if (path.startsWith("companies/co-abc/staff_directory/")) {
          return { set: jest.fn().mockResolvedValue(undefined) };
        }
        throw new Error(path);
      }),
    };

    const auth = jest.fn(() => ({
      getUser: jest.fn().mockResolvedValue({ email: "admin@abc.be", displayName: "Admin ABC" }),
    }));

    const staff = await listCompanyStaff(db as never, auth as never, "co-abc");

    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({
      uid: "uid-admin-1",
      role: "admin",
      hasTechnicianProfile: false,
    });
  });
});
