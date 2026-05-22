import { DEMO_DISPATCH_TECHNICIANS } from "@/features/technicians/demoTechnicianCatalog";

describe("DEMO_DISPATCH_TECHNICIANS", () => {
  it("lists Mansour as the only available technician", () => {
    const mansour = DEMO_DISPATCH_TECHNICIANS.find((t) => t.id === "mansour");
    expect(mansour?.name).toBe("Mansour");
    expect(mansour?.status).toBe("available");
    expect(DEMO_DISPATCH_TECHNICIANS.filter((t) => t.status === "available")).toHaveLength(1);
  });

  it("does not include legacy Thomas demo row", () => {
    expect(DEMO_DISPATCH_TECHNICIANS.some((t) => /thomas/i.test(t.name))).toBe(false);
  });
});
