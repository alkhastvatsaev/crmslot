import { buildPwaManifestJson, PWA_MANIFEST_DEFINITIONS } from "@/core/pwa/pwaManifestDefinitions";

describe("pwaManifestDefinitions", () => {
  it("donne un scope distinct par app satellite (évite fusion PWA Android)", () => {
    const demande = PWA_MANIFEST_DEFINITIONS.find((d) => d.filename === "manifest-demande.json");
    const terrain = PWA_MANIFEST_DEFINITIONS.find((d) => d.filename === "manifest-technician.json");
    const admin = PWA_MANIFEST_DEFINITIONS.find((d) => d.filename === "manifest.json");

    expect(demande?.scope).toBe("/m/demande");
    expect(terrain?.scope).toBe("/m/technician");
    expect(admin?.scope).toBe("/");

    expect(demande?.start_url.startsWith(demande?.scope ?? "")).toBe(true);
    expect(terrain?.start_url.startsWith(terrain?.scope ?? "")).toBe(true);
  });

  it("aligne id et start_url pour chaque manifest", () => {
    for (const def of PWA_MANIFEST_DEFINITIONS) {
      expect(def.id).toBe(def.start_url);
    }
  });

  it("produit un JSON valide avec icônes et couleurs", () => {
    const def = PWA_MANIFEST_DEFINITIONS[0];
    const parsed = JSON.parse(buildPwaManifestJson(def));

    expect(parsed.display).toBe("standalone");
    expect(parsed.theme_color).toBe("#09090B");
    expect(parsed.icons.length).toBeGreaterThanOrEqual(3);
  });
});
