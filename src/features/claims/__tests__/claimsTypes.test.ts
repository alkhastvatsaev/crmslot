import { CLAIM_STATUS_LABELS, CLAIM_CATEGORY_LABELS, CLAIM_STATUS_STYLES } from "../types";

describe("CLAIM_STATUS_LABELS", () => {
  it("has labels for all statuses", () => {
    expect(CLAIM_STATUS_LABELS.open).toBe("Ouverte");
    expect(CLAIM_STATUS_LABELS.resolved).toBe("Résolue");
  });
});

describe("CLAIM_CATEGORY_LABELS", () => {
  it("has labels for all categories", () => {
    expect(CLAIM_CATEGORY_LABELS.quality).toBe("Qualité");
    expect(CLAIM_CATEGORY_LABELS.billing).toBe("Facturation");
  });
});

describe("CLAIM_STATUS_STYLES", () => {
  it("open is red", () => {
    expect(CLAIM_STATUS_STYLES.open).toContain("red");
  });
  it("resolved is emerald", () => {
    expect(CLAIM_STATUS_STYLES.resolved).toContain("emerald");
  });
});
