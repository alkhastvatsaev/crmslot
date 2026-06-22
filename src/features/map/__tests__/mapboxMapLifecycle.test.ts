import {
  destroyMapboxMap,
  pauseMapboxMap,
  resolveMapboxLifecycleMode,
  resumeMapboxMap,
} from "@/features/map/mapboxMapLifecycle";

describe("mapboxMapLifecycle", () => {
  it("mobile et desktop → destroy hors écran (libère WebGL)", () => {
    expect(resolveMapboxLifecycleMode(true)).toBe("destroy");
    expect(resolveMapboxLifecycleMode(false)).toBe("destroy");
  });

  it("pause appelle stop sans throw", () => {
    const stop = jest.fn();
    pauseMapboxMap({ stop });
    expect(stop).toHaveBeenCalled();
  });

  it("stop toujours la carte à la pause (batterie — même WebView Android)", () => {
    const stop = jest.fn();
    pauseMapboxMap({ stop }, { skipStop: true });
    expect(stop).toHaveBeenCalled();
  });

  it("resume appelle resize sans throw", () => {
    const resize = jest.fn();
    const triggerRepaint = jest.fn();
    resumeMapboxMap({ resize, triggerRepaint });
    expect(resize).toHaveBeenCalled();
    expect(triggerRepaint).toHaveBeenCalled();
  });

  it("destroy appelle remove sans throw", () => {
    const remove = jest.fn();
    destroyMapboxMap({ remove });
    expect(remove).toHaveBeenCalled();
  });
});
