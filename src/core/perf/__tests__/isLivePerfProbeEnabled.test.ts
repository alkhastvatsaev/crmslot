/** @jest-environment jsdom */

import { disableLivePerfProbe, isLivePerfProbeEnabled } from "@/core/perf/isLivePerfProbeEnabled";

describe("isLivePerfProbeEnabled", () => {
  beforeEach(() => {
    disableLivePerfProbe();
    window.history.replaceState({}, "", "/");
  });

  it("active avec ?perf=1", () => {
    window.history.replaceState({}, "", "/?perf=1");
    expect(isLivePerfProbeEnabled()).toBe(true);
    expect(window.localStorage.getItem("crmslot:perf")).toBe("1");
  });

  it("reste actif via localStorage", () => {
    window.localStorage.setItem("crmslot:perf", "1");
    expect(isLivePerfProbeEnabled()).toBe(true);
  });
});
