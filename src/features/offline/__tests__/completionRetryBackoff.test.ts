import { isRetryDue, nextRetryAfter } from "@/features/offline/completionRetryBackoff";

describe("completionRetryBackoff", () => {
  describe("nextRetryAfter", () => {
    it("1ère tentative échouée : 30s plus tard", () => {
      const now = 1_000_000;
      expect(nextRetryAfter(1, now)).toBe(now + 30_000);
    });

    it("doublement exponentiel : 2e=60s, 3e=120s", () => {
      const now = 0;
      expect(nextRetryAfter(2, now)).toBe(60_000);
      expect(nextRetryAfter(3, now)).toBe(120_000);
    });

    it("clamped à 30min même après nombreuses tentatives", () => {
      const now = 0;
      expect(nextRetryAfter(20, now)).toBe(30 * 60_000);
    });

    it("traite attemptCount=0 comme 1 (sécurité)", () => {
      const now = 0;
      expect(nextRetryAfter(0, now)).toBe(30_000);
    });
  });

  describe("isRetryDue", () => {
    it("vrai quand nextAttemptAtMs absent (jamais échoué)", () => {
      expect(isRetryDue({}, 1_000)).toBe(true);
    });

    it("vrai quand cooldown expiré", () => {
      expect(isRetryDue({ nextAttemptAtMs: 500 }, 1_000)).toBe(true);
    });

    it("faux quand encore en cooldown", () => {
      expect(isRetryDue({ nextAttemptAtMs: 2_000 }, 1_000)).toBe(false);
    });
  });
});
