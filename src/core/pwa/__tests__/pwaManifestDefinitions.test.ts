import { buildPwaManifestJson, PWA_MANIFEST_DEFINITIONS } from "@/core/pwa/pwaManifestDefinitions";

describe("PWA_MANIFEST_DEFINITIONS", () => {
  it("assigns opaque unique ids for Android multi-install", () => {
    const ids = PWA_MANIFEST_DEFINITIONS.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith("crmslot-pwa-")).toBe(true);
      expect(id.includes("/")).toBe(false);
    }
  });

  it("keeps satellite scopes narrow and distinct from each other", () => {
    const satellites = PWA_MANIFEST_DEFINITIONS.filter((definition) =>
      definition.start_url.startsWith("/m/")
    );
    const scopes = satellites.map((definition) => definition.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    for (const definition of satellites) {
      expect(definition.scope).toBe(definition.start_url);
    }
  });

  it("uses per-surface icon paths in generated JSON", () => {
    const demande = PWA_MANIFEST_DEFINITIONS.find(
      (definition) => definition.filename === "manifest-demande.json"
    );
    expect(demande).toBeDefined();
    const json = JSON.parse(buildPwaManifestJson(demande!));
    expect(json.id).toBe("crmslot-pwa-demande");
    expect(json.icons.some((icon: { src: string }) => icon.src.includes("/pwa/icon-demande"))).toBe(
      true
    );
  });
});
