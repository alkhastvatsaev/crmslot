import {
  adminInboxCacheKey,
  readAdminInboxInterventionsCache,
  splitInterventionsByCompanyIds,
  writeAdminInboxInterventionsCache,
} from "@/features/offline/adminInboxInterventionsCache";
import type { Intervention } from "@/features/interventions";

describe("adminInboxInterventionsCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips inbox rows per company scope", () => {
    const iv = {
      id: "iv-admin-1",
      companyId: "co-1",
      title: "Inbox",
      status: "new",
    } as unknown as Intervention;
    const key = adminInboxCacheKey("co-1");
    expect(key).toBe("crmslot_admin_inbox_co-1");
    writeAdminInboxInterventionsCache("co-1", [iv]);
    const rows = readAdminInboxInterventionsCache("co-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("iv-admin-1");
  });

  it("splits merged rows by company id", () => {
    const a = { id: "a", companyId: "co-1" } as unknown as Intervention;
    const b = { id: "b", companyId: "co-2" } as unknown as Intervention;
    const byCompany = splitInterventionsByCompanyIds(["co-1", "co-2"], [a, b]);
    expect(byCompany["co-1"]).toHaveLength(1);
    expect(byCompany["co-2"]).toHaveLength(1);
    expect(byCompany["co-1"]![0]?.id).toBe("a");
  });
});
