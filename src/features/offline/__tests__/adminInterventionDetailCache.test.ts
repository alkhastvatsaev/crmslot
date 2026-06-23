import {
  readAdminInterventionDetailCache,
  writeAdminInterventionDetailCache,
} from "@/features/offline/adminInterventionDetailCache";
import type { Intervention } from "@/features/interventions";

describe("adminInterventionDetailCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a single intervention detail", () => {
    const iv = {
      id: "iv-detail-1",
      companyId: "co-1",
      title: "Détail",
      status: "assigned",
    } as Intervention;
    writeAdminInterventionDetailCache(iv);
    const row = readAdminInterventionDetailCache("iv-detail-1");
    expect(row?.id).toBe("iv-detail-1");
    expect(row?.title).toBe("Détail");
  });
});
