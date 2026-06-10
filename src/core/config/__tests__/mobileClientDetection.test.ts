import {
  detectMobileClient,
  isForceMobileQuery,
  isPhoneUserAgent,
} from "@/core/config/mobileClientDetection";

describe("mobileClientDetection", () => {
  describe("isForceMobileQuery", () => {
    it("accepte forceMobile=1", () => {
      expect(isForceMobileQuery("?forceMobile=1")).toBe(true);
      expect(isForceMobileQuery("?foo=1&forceMobile=1")).toBe(true);
    });

    it("refuse les autres valeurs", () => {
      expect(isForceMobileQuery("")).toBe(false);
      expect(isForceMobileQuery("?forceMobile=0")).toBe(false);
    });
  });

  describe("isPhoneUserAgent", () => {
    it("détecte iPhone et Android phone", () => {
      expect(isPhoneUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(true);
      expect(isPhoneUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(true);
    });

    it("ignore iPad et desktop", () => {
      expect(isPhoneUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(false);
      expect(isPhoneUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)")).toBe(false);
    });
  });

  describe("detectMobileClient", () => {
    it("priorise forceMobile sur desktop UA", () => {
      expect(detectMobileClient("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "?forceMobile=1")).toBe(
        true
      );
    });

    it("utilise le UA si pas de query", () => {
      expect(detectMobileClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "")).toBe(
        true
      );
      expect(detectMobileClient("Mozilla/5.0 (Macintosh; Intel Mac OS X)", "")).toBe(false);
    });
  });
});
