import {
  clientIdentitiesConflict,
  extractClientIdentityFromIntervention,
  findPotentialDuplicateAmong,
} from "@/features/interventions/duplicateDetectionCore";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention>): Intervention {
  return {
    id: "id",
    title: "Test",
    address: "12 Rue Neuve, Bruxelles",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    status: "pending",
    createdAt: new Date().toISOString(),
    ...partial,
  } as Intervention;
}

describe("duplicateDetectionCore client identity", () => {
  it("detects conflict when last names differ", () => {
    expect(
      clientIdentitiesConflict(
        { firstName: "Marie", lastName: "Dupont" },
        { firstName: "Marie", lastName: "Martin" }
      )
    ).toBe(true);
  });

  it("detects conflict when phones differ", () => {
    expect(clientIdentitiesConflict({ phone: "0470123456" }, { phone: "0480111222" })).toBe(true);
  });

  it("conflicts when both first names are filled and differ", () => {
    expect(clientIdentitiesConflict({ firstName: "Marie" }, { firstName: "Jean" })).toBe(true);
  });

  it("parses legacy clientName on interventions", () => {
    expect(
      extractClientIdentityFromIntervention({
        clientName: "Jean Martin",
      } as Intervention)
    ).toEqual({
      firstName: "Jean",
      lastName: "Martin",
      phone: "",
      email: "",
    });
  });

  it("skips duplicate among different clients at same address", () => {
    const now = Date.now();
    const dup = findPotentialDuplicateAmong({
      excludeId: "new",
      address: "12 Rue Neuve, Bruxelles",
      problem: "Serrure cassée",
      client: { firstName: "Paul", lastName: "Durant", phone: "0470998877" },
      candidates: [
        iv({
          id: "old",
          clientFirstName: "Alice",
          clientLastName: "Bernard",
          clientPhone: "0470111222",
          createdAt: new Date(now - 60_000).toISOString(),
        }),
      ],
      now,
    });
    expect(dup).toBeNull();
  });
});
