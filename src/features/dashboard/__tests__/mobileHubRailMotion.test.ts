import {
  MOBILE_HUB_RAIL_LAYER_ACTIVE_CLASS,
  MOBILE_HUB_RAIL_LAYER_AFTER_CLASS,
  MOBILE_HUB_RAIL_LAYER_BEFORE_CLASS,
  mobileHubRailLayerSideClass,
  stepMobileHubRail,
} from "@/features/dashboard/mobileHubRailMotion";

describe("mobileHubRailLayerSideClass", () => {
  const rails = ["left", "center", "right"] as const;

  it("marque le rail actif", () => {
    expect(mobileHubRailLayerSideClass("center", "center", rails)).toBe(
      MOBILE_HUB_RAIL_LAYER_ACTIVE_CLASS
    );
  });

  it("place les rails inactifs avant/après selon l’index", () => {
    expect(mobileHubRailLayerSideClass("left", "center", rails)).toBe(
      MOBILE_HUB_RAIL_LAYER_BEFORE_CLASS
    );
    expect(mobileHubRailLayerSideClass("right", "center", rails)).toBe(
      MOBILE_HUB_RAIL_LAYER_AFTER_CLASS
    );
  });
});

describe("stepMobileHubRail", () => {
  const rails = ["left", "center", "right"] as const;

  it("avance gauche → centre → droite sans boucler", () => {
    expect(stepMobileHubRail(rails, "center", "next")).toBe("right");
    expect(stepMobileHubRail(rails, "right", "next")).toBe("right");
  });

  it("recule droite → centre → gauche sans boucler", () => {
    expect(stepMobileHubRail(rails, "center", "prev")).toBe("left");
    expect(stepMobileHubRail(rails, "left", "prev")).toBe("left");
  });
});
