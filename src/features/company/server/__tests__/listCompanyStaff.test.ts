/**
 * @jest-environment node
 */
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";

const mockGetUser = jest.fn();
const mockGetUsers = jest.fn();

describe("listCompanyStaff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ uid: "uid", email: "tech@abc.be", displayName: "Jean Martin" });
    mockGetUsers.mockImplementation(async (identifiers: { uid: string }[]) => ({
      users: identifiers.map((id) => ({
        uid: id.uid,
        email: id.uid === "uid-admin-1" ? "admin@abc.be" : "tech@abc.be",
        displayName: id.uid === "uid-admin-1" ? "Admin ABC" : "Jean Martin",
      })),
      notFound: [],
    }));
  });

  function makeAuth() {
    return jest.fn(() => ({ getUser: mockGetUser, getUsers: mockGetUsers }));
  }

  it("merges membership role with technician profile", async () => {
    const technicianData = {
      companyId: "co-abc",
      authUid: "uid-tech-1",
      name: "Jean Martin",
      firstName: "Jean",
      lastName: "Martin",
      email: "tech@abc.be",
      active: true,
    };

    const db = {
      getAll: jest.fn((...refs: { path: string }[]) => {
        const paths = refs.map((ref) => ref.path);
        if (paths.some((path) => path.includes("company_memberships"))) {
          return Promise.resolve([
            {
              exists: true,
              ref: { parent: { parent: { id: "uid-tech-1" } } },
              data: () => ({ role: "collaborateur" }),
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return {
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({
                docs: [{ id: "uid-tech-1", data: () => technicianData }],
              }),
            })),
            doc: jest.fn(),
          };
        }
        if (name === "companies/co-abc/staff_directory") {
          return { get: jest.fn().mockResolvedValue({ docs: [] }) };
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
      doc: jest.fn((path: string) => ({ path })),
    };

    const staff = await listCompanyStaff(db as never, makeAuth() as never, "co-abc");

    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({
      uid: "uid-tech-1",
      role: "collaborateur",
      displayName: "Jean Martin",
      active: true,
      hasTechnicianProfile: true,
      authUid: "uid-tech-1",
    });
    expect(mockGetUsers).not.toHaveBeenCalled();
  });

  it("inclut les admins listés dans staff_directory sans fiche technicien", async () => {
    const db = {
      getAll: jest.fn((...refs: { path: string }[]) => {
        const paths = refs.map((ref) => ref.path);
        if (paths.some((path) => path.includes("company_memberships"))) {
          return Promise.resolve([
            {
              exists: true,
              ref: { parent: { parent: { id: "uid-admin-1" } } },
              data: () => ({ role: "admin" }),
            },
          ]);
        }
        if (paths.some((path) => path.startsWith("technicians/"))) {
          return Promise.resolve([{ exists: false, id: "uid-admin-1" }]);
        }
        return Promise.resolve([]);
      }),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return {
            where: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ docs: [] }),
            })),
            doc: jest.fn((uid: string) => ({ path: `technicians/${uid}` })),
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
      doc: jest.fn((path: string) => ({ path })),
    };

    const staff = await listCompanyStaff(db as never, makeAuth() as never, "co-abc");

    expect(staff).toHaveLength(1);
    expect(staff[0]).toMatchObject({
      uid: "uid-admin-1",
      role: "admin",
      hasTechnicianProfile: false,
    });
    expect(mockGetUsers).toHaveBeenCalled();
  });
});
