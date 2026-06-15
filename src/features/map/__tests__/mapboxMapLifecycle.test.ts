import {
  destroyMapboxMap,
  pauseMapboxMap,
  resolveMapboxLifecycleMode,
  resumeMapboxMap,
} from "@/features/map/mapboxMapLifecycle";

describe("mapboxMapLifecycle", () => {
  it("mobile → pause, desktop → destroy", () => {
    expect(resolveMapboxLifecycleMode(true)).toBe("pause");
    expect(resolveMapboxLifecycleMode(false)).toBe("destroy");
  });

  it("pause appelle stop sans throw", () => {
    const stop = jest.fn();
    pauseMapboxMap({ stop });
    expect(stop).toHaveBeenCalled();
  });

  it("resume appelle resize sans throw", () => {
    const resize = jest.fn();
    resumeMapboxMap({ resize });
    expect(resize).toHaveBeenCalled();
  });

  it("destroy appelle remove sans throw", () => {
    const remove = jest.fn();
    destroyMapboxMap({ remove });
    expect(remove).toHaveBeenCalled();
  });
});
