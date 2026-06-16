import {
  TERRAIN_TEMPLATES,
  BILLING_TEMPLATES,
  type TerrainTemplate,
  type BillingTemplate,
} from "@/features/interventions/config/terrainTemplates";

describe("TERRAIN_TEMPLATES (commandes fournisseur)", () => {
  it("contient au moins un template par catégorie principale", () => {
    const cats = new Set(TERRAIN_TEMPLATES.map((t) => t.category));
    expect(cats.has("serrurerie")).toBe(true);
  });

  it("chaque template a un id unique", () => {
    const ids = TERRAIN_TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("chaque template a au moins une ligne", () => {
    for (const t of TERRAIN_TEMPLATES) {
      expect(t.lines.length).toBeGreaterThan(0);
    }
  });

  it("toutes les quantités sont strictement positives", () => {
    for (const t of TERRAIN_TEMPLATES) {
      for (const line of t.lines) {
        expect(line.quantity).toBeGreaterThan(0);
      }
    }
  });

  it("unitPriceCents (si défini) est un entier non-négatif", () => {
    for (const t of TERRAIN_TEMPLATES) {
      for (const line of t.lines) {
        if (line.unitPriceCents !== undefined) {
          expect(Number.isInteger(line.unitPriceCents)).toBe(true);
          expect(line.unitPriceCents).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("respecte la forme TerrainTemplate (regression schema)", () => {
    // Si un dev ajoute un nouveau champ obligatoire au type, ce test casse.
    const t: TerrainTemplate = TERRAIN_TEMPLATES[0]!;
    expect(typeof t.id).toBe("string");
    expect(typeof t.name).toBe("string");
    expect(Array.isArray(t.lines)).toBe(true);
  });
});

describe("BILLING_TEMPLATES (facturation)", () => {
  it("chaque template a un id unique", () => {
    const ids = BILLING_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("les ids billing commencent par 'bill-'", () => {
    for (const t of BILLING_TEMPLATES) {
      expect(t.id.startsWith("bill-")).toBe(true);
    }
  });

  it("chaque ligne facturation a un unitPriceCents (obligatoire)", () => {
    for (const t of BILLING_TEMPLATES) {
      for (const line of t.lines) {
        expect(line.unitPriceCents).toBeDefined();
        expect(line.unitPriceCents).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("respecte la forme BillingTemplate (regression schema)", () => {
    const t: BillingTemplate = BILLING_TEMPLATES[0]!;
    expect(typeof t.id).toBe("string");
    expect(typeof t.category).toBe("string");
  });
});
