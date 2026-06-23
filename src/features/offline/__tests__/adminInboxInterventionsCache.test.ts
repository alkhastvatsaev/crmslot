import {
  readAdminInboxInterventionsCache,
  splitInterventionsByCompanyIds,
  writeAdminInboxInterventionsCache,
} from "@/features/offline/adminInboxInterventionsCache";
import type { Intervention } from "@/features/interventions";

const row = (id: string, companyId: string): Intervention =>
  ({ id, companyId, title: id }) as Intervention;

describe("adminInboxInterventionsCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("écrit et relit le cache par scope société", () => {
    writeAdminInboxInterventionsCache("co-a", [row("1", "co-a"), row("2", "co-a")]);
    expect(readAdminInboxInterventionsCache("co-a")).toHaveLength(2);
  });

  it("répartit les lignes par companyId", () => {
    const split = splitInterventionsByCompanyIds(
      ["co-a", "co-b"],
      [row("1", "co-a"), row("2", "co-b")]
    );
    expect(split["co-a"]).toHaveLength(1);
    expect(split["co-b"]).toHaveLength(1);
  });
});
