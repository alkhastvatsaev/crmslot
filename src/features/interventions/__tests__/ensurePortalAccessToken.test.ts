import { portalAccessTokenField } from "../ensurePortalAccessToken";

describe("portalAccessTokenField", () => {
  it("génère un token non vide", () => {
    const a = portalAccessTokenField();
    const b = portalAccessTokenField();
    expect(a.portalAccessToken.length).toBeGreaterThan(10);
    expect(a.portalAccessToken).not.toBe(b.portalAccessToken);
  });
});
