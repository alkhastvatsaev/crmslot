import { mapInterventionDoc } from "@/features/clients/clientInterventions";

describe("clientInterventions", () => {
  it("mapInterventionDoc preserves id and fields", () => {
    const iv = mapInterventionDoc("iv-1", {
      title: "Porte bloquée",
      address: "Bruxelles",
      status: "done",
      companyId: "co-1",
      clientId: "cl-1",
      createdAt: "2026-05-01T10:00:00.000Z",
    });
    expect(iv.id).toBe("iv-1");
    expect(iv.title).toBe("Porte bloquée");
    expect(iv.clientId).toBe("cl-1");
  });
});
