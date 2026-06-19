import { DEMO_DISPATCH_TECHNICIANS } from "@/features/technicians/demoTechnicianCatalog";

describe("DEMO_DISPATCH_TECHNICIANS", () => {
  it("lists only Mansour", () => {
    expect(DEMO_DISPATCH_TECHNICIANS).toHaveLength(1);
    expect(DEMO_DISPATCH_TECHNICIANS[0]?.name).toBe("Mansour");
    expect(DEMO_DISPATCH_TECHNICIANS[0]?.status).toBe("available");
  });

  it("does not include legacy demo technicians", () => {
    const names = DEMO_DISPATCH_TECHNICIANS.map((t) => t.name);
    expect(names.some((n) => /alexandre|thomas|boris/i.test(n))).toBe(false);
  });
});
