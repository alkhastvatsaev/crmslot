import { isValidPortalEmail, normalizePortalEmail, portalEmailsMatch } from "../portalEmail";

describe("portalEmail", () => {
  it("normalise en minuscules", () => {
    expect(normalizePortalEmail("  Client@Example.COM ")).toBe("client@example.com");
  });

  it("compare deux e-mails normalisés", () => {
    expect(portalEmailsMatch("A@B.com", "a@b.com")).toBe(true);
    expect(portalEmailsMatch("a@b.com", "c@d.com")).toBe(false);
  });

  it("valide le format e-mail", () => {
    expect(isValidPortalEmail("client@example.com")).toBe(true);
    expect(isValidPortalEmail("invalid")).toBe(false);
  });
});
