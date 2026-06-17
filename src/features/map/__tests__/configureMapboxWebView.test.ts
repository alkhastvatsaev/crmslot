import {
  configureMapboxWebView,
  MAPBOX_CSP_WORKER_PATH,
} from "@/features/map/configureMapboxWebView";

describe("configureMapboxWebView", () => {
  const originalUa = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUa,
      configurable: true,
    });
  });

  it("fixe workerUrl sur Android", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
      configurable: true,
    });

    const mapbox = { workerUrl: "" } as { workerUrl: string };
    configureMapboxWebView(mapbox as never);

    expect(mapbox.workerUrl).toBe(`http://localhost${MAPBOX_CSP_WORKER_PATH}`);
  });

  it("ne change rien sur desktop", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true,
    });

    const mapbox = { workerUrl: "" } as { workerUrl: string };
    configureMapboxWebView(mapbox as never);

    expect(mapbox.workerUrl).toBe("");
  });
});
