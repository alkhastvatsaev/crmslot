import {
  formatPortalAccessCode,
  generatePortalAccessCode,
  isValidPortalAccessCode,
  normalizePortalAccessCode,
} from "../portalAccessCode";

describe("portalAccessCode", () => {
  it("génère un code alphanumérique de 8 caractères", () => {
    const code = generatePortalAccessCode();
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
  });

  it("normalise espaces et tirets", () => {
    expect(normalizePortalAccessCode("ab12-cd34")).toBe("AB12CD34");
    expect(normalizePortalAccessCode(" AB12 CD34 ")).toBe("AB12CD34");
  });

  it("formate le code en deux blocs", () => {
    expect(formatPortalAccessCode("AB12CD34")).toBe("AB12 CD34");
  });

  it("valide la longueur du code", () => {
    expect(isValidPortalAccessCode("AB12CD")).toBe(true);
    expect(isValidPortalAccessCode("AB1")).toBe(false);
  });
});
