import { portalAccessFields, portalAccessTokenField } from "../ensurePortalAccessToken";

describe("portalAccessFields", () => {
  it("génère un token et un code non vides", () => {
    const a = portalAccessFields();
    const b = portalAccessFields();
    expect(a.portalAccessToken.length).toBeGreaterThan(10);
    expect(a.portalAccessCode.length).toBeGreaterThanOrEqual(6);
    expect(a.portalAccessToken).not.toBe(b.portalAccessToken);
    expect(a.portalAccessCode).not.toBe(b.portalAccessCode);
  });

  it("portalAccessTokenField reste compatible", () => {
    const fields = portalAccessTokenField();
    expect(fields.portalAccessToken).toBeTruthy();
    expect(fields.portalAccessCode).toBeTruthy();
  });
});
