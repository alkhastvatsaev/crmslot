import {
  detectMobileClient,
  isAppleOAuthClient,
  isForceMobileQuery,
  isIphoneUserAgent,
  isMacDesktopUserAgent,
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

  describe("isIphoneUserAgent", () => {
    it("détecte iPhone et iPod", () => {
      expect(isIphoneUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
        true
      );
      expect(isIphoneUserAgent("Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)")).toBe(
        true
      );
    });

    it("ignore Android, iPad et desktop", () => {
      expect(isIphoneUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe(false);
      expect(isIphoneUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(false);
      expect(isIphoneUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)")).toBe(false);
    });
  });

  describe("isMacDesktopUserAgent", () => {
    it("détecte Mac bureau", () => {
      expect(
        isMacDesktopUserAgent(
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0"
        )
      ).toBe(true);
    });

    it("ignore iPhone, iPad et Windows", () => {
      expect(isMacDesktopUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
        false
      );
      expect(isMacDesktopUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(false);
      expect(isMacDesktopUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
    });
  });

  describe("isAppleOAuthClient", () => {
    it("accepte iPhone et Mac bureau", () => {
      expect(
        isAppleOAuthClient({
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        })
      ).toBe(true);
      expect(
        isAppleOAuthClient({
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          maxTouchPoints: 0,
        })
      ).toBe(true);
    });

    it("refuse Android, Windows et iPad déguisé en Mac", () => {
      expect(
        isAppleOAuthClient({
          userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)",
        })
      ).toBe(false);
      expect(
        isAppleOAuthClient({
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        })
      ).toBe(false);
      expect(
        isAppleOAuthClient({
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          maxTouchPoints: 5,
        })
      ).toBe(false);
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
