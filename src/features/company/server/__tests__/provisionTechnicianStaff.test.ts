/**
 * @jest-environment node
 */
import {
  buildTechnicianDisplayName,
  provisionTechnicianStaffRecord,
  technicianInitialFromName,
} from "@/features/company/server/provisionTechnicianStaff";

describe("provisionTechnicianStaff", () => {
  it("buildTechnicianDisplayName prefers first and last name", () => {
    expect(
      buildTechnicianDisplayName({
        firstName: "Mansour",
        lastName: "Dupont",
        email: "m@example.com",
      })
    ).toBe("Mansour Dupont");
  });

  it("buildTechnicianDisplayName falls back to email local part", () => {
    expect(buildTechnicianDisplayName({ email: "tech@abc.be" })).toBe("tech");
  });

  it("technicianInitialFromName returns uppercase first letter", () => {
    expect(technicianInitialFromName("Mansour Dupont")).toBe("M");
  });

  it("creates technicians doc with authUid equal to firebase uid", async () => {
    const directorySet = jest.fn().mockResolvedValue(undefined);
    const technicianSet = jest.fn();
    const technicianGet = jest.fn().mockResolvedValue({ exists: false, data: () => undefined });
    const db = {
      collection: jest.fn((path: string) => {
        if (path !== "technicians") throw new Error(`unexpected ${path}`);
        return {
          doc: jest.fn(() => ({
            get: technicianGet,
            set: technicianSet,
          })),
        };
      }),
      doc: jest.fn((path: string) => {
        if (!path.startsWith("companies/co-abc/staff_directory/")) {
          throw new Error(`unexpected ${path}`);
        }
        return { set: directorySet };
      }),
    };

    await provisionTechnicianStaffRecord(db as never, {
      uid: "firebase-uid-1",
      companyId: "co-abc",
      profile: { firstName: "Jean", lastName: "Martin", email: "jean@example.com" },
    });

    expect(technicianSet).toHaveBeenCalledWith(
      expect.objectContaining({
        authUid: "firebase-uid-1",
        companyId: "co-abc",
        name: "Jean Martin",
        initial: "J",
        status: "available",
      })
    );
  });
});
