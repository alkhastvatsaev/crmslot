/** @jest-environment jsdom */

import { startGalaxyStarsAnimation } from "@/core/ui/GalaxyButton/galaxyStarsAnimation";

describe("galaxyStarsAnimation", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
    })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("démarre l'animation mobile compact après layout (ResizeObserver)", () => {
    const surface = document.createElement("div");
    const canvas = document.createElement("canvas");
    Object.defineProperty(surface, "offsetWidth", { configurable: true, value: 0 });
    Object.defineProperty(surface, "offsetHeight", { configurable: true, value: 0 });
    surface.appendChild(canvas);
    document.body.appendChild(surface);

    const cleanup = startGalaxyStarsAnimation(canvas, surface, { mobilePowerSave: true });

    Object.defineProperty(surface, "offsetWidth", { configurable: true, value: 320 });
    Object.defineProperty(surface, "offsetHeight", { configurable: true, value: 56 });
    surface.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 56,
        top: 0,
        left: 0,
        right: 320,
        bottom: 56,
      }) as DOMRect;

    window.dispatchEvent(new Event("resize"));

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    cleanup();
    document.body.removeChild(surface);
  });
});
