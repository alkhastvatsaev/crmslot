import {
  applyMissionKitAiEnrichment,
  enrichMissionKitWithAi,
  parseMissionKitAiResponse,
} from "@/features/missionKit/enrichMissionKitWithAi";
import type { MissionKit } from "@/features/missionKit/types";

const baseKit: MissionKit = {
  interventionId: "iv-1",
  generatedAt: "2026-01-01T00:00:00.000Z",
  completenessScore: 0,
  items: [
    {
      id: "cyl-euro",
      label: "Cylindre européen 30/35",
      quantity: 1,
      source: "heuristic",
      status: "unknown",
      confidence: 0.8,
    },
  ],
};

describe("parseMissionKitAiResponse", () => {
  it("parse items IA valides", () => {
    const parsed = parseMissionKitAiResponse({
      items: [{ label: "Pied-de-biche", quantity: 1, confidence: 0.9 }],
      summary: "Kit renforcé",
    });
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.summary).toBe("Kit renforcé");
  });
});

describe("applyMissionKitAiEnrichment", () => {
  it("fusionne les items IA sans écraser l'existant", () => {
    const out = applyMissionKitAiEnrichment(baseKit, {
      items: [{ label: "Pied-de-biche", quantity: 1, confidence: 0.85 }],
    });
    expect(out.items.length).toBe(2);
    expect(out.items.some((i) => i.label === "Pied-de-biche")).toBe(true);
    expect(out.items.some((i) => i.label.includes("Cylindre"))).toBe(true);
  });
});

describe("enrichMissionKitWithAi", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("retourne le kit inchangé si l'API échoue", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as typeof fetch;
    const out = await enrichMissionKitWithAi(baseKit, { problem: "Porte bloquée" });
    expect(out).toEqual(baseKit);
  });

  it("enrichit le kit quand l'API répond", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ label: "Extracteur de clé", quantity: 1, confidence: 0.77 }],
      }),
    }) as unknown as typeof fetch;

    const out = await enrichMissionKitWithAi(baseKit, { problem: "Clé cassée dans cylindre" });
    expect(out.items.some((i) => i.label === "Extracteur de clé")).toBe(true);
  });
});
