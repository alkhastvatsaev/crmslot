import {
  staffPasswordResetActionCodeSettings,
  staffPasswordResetContinueUrl,
  staffPasswordResetErrorFeedback,
} from "@/features/auth/staffPasswordResetFeedback";

describe("staffPasswordResetFeedback", () => {
  const originalOrigin = window.location.origin;

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("construit une URL de continuation sur l'origine courante", () => {
    expect(staffPasswordResetContinueUrl()).toBe(`${originalOrigin}/`);
  });

  it("passe handleCodeInApp: false pour la page Firebase hébergée", () => {
    expect(staffPasswordResetActionCodeSettings()).toEqual({
      url: `${originalOrigin}/`,
      handleCodeInApp: false,
    });
  });

  it("signale un domaine non autorisé", () => {
    const feedback = staffPasswordResetErrorFeedback(
      { code: "auth/unauthorized-continue-uri" },
      "https://app.crmslot.be"
    );
    expect(feedback.title).toMatch(/Domaine non autorisé/i);
    expect(feedback.description).toContain("https://app.crmslot.be");
  });

  it("signale une adresse e-mail invalide", () => {
    const feedback = staffPasswordResetErrorFeedback({ code: "auth/invalid-email" }, "");
    expect(feedback.title).toMatch(/invalide/i);
    expect(feedback.description).toBeUndefined();
  });
});
