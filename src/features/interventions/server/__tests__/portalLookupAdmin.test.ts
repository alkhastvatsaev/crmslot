import { isValidPortalAccessToken } from "../portalLookupAdmin";

describe("portalLookupAdmin", () => {
  it("valide les tokens UUID", () => {
    expect(isValidPortalAccessToken("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidPortalAccessToken("not-a-uuid")).toBe(false);
    expect(isValidPortalAccessToken("")).toBe(false);
  });
});
