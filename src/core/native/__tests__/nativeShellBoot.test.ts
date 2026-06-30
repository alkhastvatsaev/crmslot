import { bootNativeShell } from "@/core/native/nativeShellBoot";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
}));

describe("bootNativeShell", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
  });

  it("no-op sur web (pas d'import Capacitor)", async () => {
    await bootNativeShell();
    await bootNativeShell();
    expect(capacitorRuntime.isCapacitorNative).toHaveBeenCalled();
  });
});
