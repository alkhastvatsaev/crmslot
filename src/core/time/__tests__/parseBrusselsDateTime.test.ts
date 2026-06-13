import { parseBrusselsDateTime } from "../parseBrusselsDateTime";

describe("parseBrusselsDateTime", () => {
  it("convertit 14:00 Bruxelles été en UTC", () => {
    const d = parseBrusselsDateTime("2026-05-20", "14:00");
    expect(d?.toISOString()).toBe("2026-05-20T12:00:00.000Z");
  });

  it("retourne null si format invalide", () => {
    expect(parseBrusselsDateTime("bad", "14:00")).toBeNull();
    expect(parseBrusselsDateTime("2026-05-20", "25:99")).toBeNull();
  });
});
