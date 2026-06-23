import {
  hasPwaAutoReloadAttempted,
  markPwaAutoReloadAttempted,
  markPwaGitShaStored,
  pwaReloadOnceKey,
  readStoredPwaGitSha,
} from "@/core/pwa/pwaBundleUpdate";

describe("pwaBundleUpdate", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("persiste le SHA déployé", () => {
    markPwaGitShaStored("abc123");
    expect(readStoredPwaGitSha()).toBe("abc123");
  });

  it("marque le reload auto une fois par SHA", () => {
    expect(hasPwaAutoReloadAttempted("sha-1")).toBe(false);
    markPwaAutoReloadAttempted("sha-1");
    expect(hasPwaAutoReloadAttempted("sha-1")).toBe(true);
    expect(sessionStorage.getItem(pwaReloadOnceKey("sha-1"))).toBe("1");
  });
});
