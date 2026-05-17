import { filterInterventionsByCompany } from "@/features/backoffice/filterInterventionsByCompany";
import type { Intervention } from "@/features/interventions/types";

function row(id: string, companyId?: string): Intervention {
  return {
    id,
    title: id,
    address: "Bruxelles",
    time: "10:00",
    status: "pending",
    location: { lat: 50.85, lng: 4.35 },
    ...(companyId !== undefined ? { companyId } : {}),
  };
}

describe("filterInterventionsByCompany", () => {
  it("keeps only rows matching the active company", () => {
    const list = [row("a", "co-1"), row("b", "co-2"), row("c", "co-1")];
    expect(filterInterventionsByCompany("co-1", list).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("drops rows with missing or blank companyId", () => {
    const list = [row("legacy"), row("blank", ""), row("ok", "co-1")];
    expect(filterInterventionsByCompany("co-1", list).map((r) => r.id)).toEqual(["ok"]);
  });

  it("returns empty when companyId is blank", () => {
    expect(filterInterventionsByCompany("", [row("x", "co-1")])).toEqual([]);
  });
});
