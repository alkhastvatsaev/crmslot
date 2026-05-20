import {
  buildLecotSearchUrl,
  resolveLecotLinkHref,
} from "@/features/chatbot/chatbot-lecot-url";

describe("chatbot-lecot-url", () => {
  it("builds shop search URL", () => {
    expect(buildLecotSearchUrl("cylindre Yale")).toContain("lecot.be");
    expect(buildLecotSearchUrl("cylindre Yale")).toContain("cylindre");
  });

  it("resolves lecot: absolute https links", () => {
    expect(resolveLecotLinkHref("lecot:https://lecot.be/nl-be/p/123")).toBe(
      "https://lecot.be/nl-be/p/123",
    );
  });

  it("resolves relative lecot paths to configured origin", () => {
    expect(resolveLecotLinkHref("lecot:/nl-be/catalogsearch/result?q=test")).toBe(
      "https://lecot.be/nl-be/catalogsearch/result?q=test",
    );
  });
});
