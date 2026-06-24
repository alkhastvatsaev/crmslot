import {
  buildPwaBootRecoveryInlineScript,
  isPwaBootRecoveryHost,
  isRecoverableClientBootError,
} from "@/core/pwa/pwaBootRecoveryCore";

describe("pwaBootRecovery", () => {
  it("détecte les erreurs de chunk webpack", () => {
    expect(isRecoverableClientBootError("ChunkLoadError: Loading chunk 123 failed")).toBe(true);
    expect(isRecoverableClientBootError("Failed to fetch dynamically imported module")).toBe(true);
    expect(isRecoverableClientBootError("random error")).toBe(false);
  });

  it("cible PWA standalone", () => {
    const win = {
      matchMedia: () => ({ matches: true }),
      navigator: { standalone: false, userAgent: "" },
    } as unknown as Window;
    expect(isPwaBootRecoveryHost("", win)).toBe(true);
  });

  it("génère un script inline avec le SHA", () => {
    const script = buildPwaBootRecoveryInlineScript("abc123");
    expect(script).toContain("abc123");
    expect(script).toContain("serviceWorker");
  });
});
