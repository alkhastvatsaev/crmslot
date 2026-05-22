import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention>): Intervention {
  return {
    id: "id",
    title: "Test",
    address: "123 Rue de la Paix, Paris",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    status: "pending",
    ...partial,
  } as Intervention;
}

describe("detectDuplicates", () => {
  it("returns empty when no existing interventions", () => {
    const candidate = { address: "123 Rue", problem: "Serrure cassée" };
    expect(findPotentialDuplicates(candidate, [])).toEqual([]);
  });

  it("ignores cancelled interventions", () => {
    const candidate = { address: "123 Rue de la Paix", problem: "Serrure cassée" };
    const existing = [
      iv({ id: "1", address: "123 Rue de la Paix", problem: "Serrure cassée", status: "cancelled" }),
    ];
    expect(findPotentialDuplicates(candidate, existing, 0.5)).toEqual([]);
  });

  it("detects exact duplicate (score 1.0)", () => {
    const candidate = { address: "123 Rue de la Paix", problem: "Serrure cassée" };
    const existing = [
      iv({ id: "1", address: "123 Rue de la Paix", problem: "Serrure cassée" }),
    ];
    const matches = findPotentialDuplicates(candidate, existing, 0.9);
    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(1.0);
    expect(matches[0].reason).toContain("adresse similaire");
    expect(matches[0].reason).toContain("problème similaire");
  });

  it("detects partial duplicate (different address, same problem)", () => {
    const candidate = { address: "456 Avenue Victor Hugo", problem: "Serrure bloquée" };
    const existing = [
      iv({ id: "1", address: "123 Rue de la Paix", problem: "Serrure bloquée" }), // Address score 0, Problem score 1.0. Total = 0.4
    ];
    const matches = findPotentialDuplicates(candidate, existing, 0.4);
    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(0.4);
    expect(matches[0].reason).not.toContain("adresse similaire");
    expect(matches[0].reason).toContain("problème similaire");
  });

  it("handles case-insensitive and punctuation in text", () => {
    const candidate = { address: "123 rue de la paix!", problem: "serrure, cassée?" };
    const existing = [
      iv({ id: "1", address: "123 Rue de la Paix", problem: "Serrure cassée" }),
    ];
    const matches = findPotentialDuplicates(candidate, existing, 0.9);
    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(1.0);
  });

  it("returns up to 3 highest scoring duplicates sorted by score", () => {
    const candidate = { address: "123 Rue", problem: "Serrure" };
    const existing = [
      iv({ id: "1", address: "123 Rue", problem: "Serrure" }), // score 1.0
      iv({ id: "2", address: "123 Rue", problem: "Porte" }), // addr score 1.0, prob 0 => 0.6
      iv({ id: "3", address: "456 Ave", problem: "Serrure" }), // addr 0, prob 1.0 => 0.4
      iv({ id: "4", address: "123 Rue", problem: "Serrure Porte" }), // prob 0.5 => 0.6 + 0.2 = 0.8
    ];
    
    const matches = findPotentialDuplicates(candidate, existing, 0.1);
    expect(matches).toHaveLength(3);
    expect(matches[0].intervention.id).toBe("1"); // 1.0
    expect(matches[1].intervention.id).toBe("4"); // 0.8
    expect(matches[2].intervention.id).toBe("2"); // 0.6
  });

  it("returns 0 score when tokens are shorter than 3 characters", () => {
    // Only "de", "la" are present which are < 3 chars, so tokens set size is 0
    const candidate = { address: "de la", problem: "a b" };
    const existing = [
      iv({ id: "1", address: "de la", problem: "a b" }),
    ];
    const matches = findPotentialDuplicates(candidate, existing, 0.0);
    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBe(0.0);
  });
});
