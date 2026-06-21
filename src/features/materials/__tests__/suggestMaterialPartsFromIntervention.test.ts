import { suggestMaterialPartsFromIntervention } from "@/features/materials/suggestMaterialPartsFromIntervention";

describe("suggestMaterialPartsFromIntervention", () => {
  it("returns up to 3 physical parts for a claquée door problem", () => {
    const parts = suggestMaterialPartsFromIntervention({
      problem: "Porte claquée, clé restée à l'intérieur",
      title: "Ouverture porte",
      category: "serrurerie",
    });

    expect(parts.length).toBeGreaterThan(0);
    expect(parts.length).toBeLessThanOrEqual(3);
    expect(parts.every((p) => p.description.trim().length > 0)).toBe(true);
    expect(parts.every((p) => !/main d.?oeuvre|déplacement|forfait/i.test(p.description))).toBe(
      true
    );
  });

  it("suggests cylinder-related parts when barillet is mentioned", () => {
    const parts = suggestMaterialPartsFromIntervention({
      problem: "Cylindre européen cassé, barillet bloqué",
      title: "Remplacement cylindre",
      category: "serrurerie",
    });

    expect(parts.some((p) => /cylindr|barillet/i.test(p.description))).toBe(true);
  });

  it("returns empty list when no client context", () => {
    expect(suggestMaterialPartsFromIntervention({ title: "" })).toEqual([]);
  });

  it("deduplicates parts across templates", () => {
    const parts = suggestMaterialPartsFromIntervention({
      problem: "Serrure multipoint 3 points à remplacer, gâche usée",
      title: "Multipoint",
      category: "serrurerie",
    });

    const descriptions = parts.map((p) => p.description.toLowerCase());
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});
