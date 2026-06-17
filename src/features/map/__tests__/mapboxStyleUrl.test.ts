import { needsHttpsMapboxStyleUrl, resolveMapboxStyleUrl } from "@/features/map/mapboxStyleUrl";

describe("mapboxStyleUrl", () => {
  it("force HTTPS sur WebView Android", () => {
    expect(needsHttpsMapboxStyleUrl("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36")).toBe(
      true
    );
    expect(needsHttpsMapboxStyleUrl("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      false
    );
  });

  it("retourne une URL api.mapbox.com sur Android", () => {
    const url = resolveMapboxStyleUrl(
      "mapbox/streets-v12",
      "pk.test-token",
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36"
    );
    expect(url).toMatch(
      /^https:\/\/api\.mapbox\.com\/styles\/v1\/mapbox\/streets-v12\?access_token=/
    );
  });

  it("garde mapbox:// sur desktop", () => {
    const url = resolveMapboxStyleUrl(
      "mapbox/standard",
      "pk.test-token",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    );
    expect(url).toBe("mapbox://styles/mapbox/standard");
  });
});
