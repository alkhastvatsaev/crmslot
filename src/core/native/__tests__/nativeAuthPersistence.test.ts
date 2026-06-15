import { setPersistence, browserLocalPersistence } from "firebase/auth";
import {
  ensureNativeAuthPersistence,
  resetNativeAuthPersistenceForTests,
} from "@/core/native/nativeAuthPersistence";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(() => true),
}));

const { isCapacitorNative } = jest.requireMock("@/core/native/capacitorRuntime") as {
  isCapacitorNative: jest.Mock;
};

describe("nativeAuthPersistence", () => {
  beforeEach(() => {
    resetNativeAuthPersistenceForTests();
    isCapacitorNative.mockReturnValue(true);
    (setPersistence as jest.Mock).mockResolvedValue(undefined);
  });

  it("sets browserLocalPersistence once on native", async () => {
    const auth = {} as never;
    await ensureNativeAuthPersistence(auth);
    await ensureNativeAuthPersistence(auth);

    expect(setPersistence).toHaveBeenCalledTimes(1);
    expect(setPersistence).toHaveBeenCalledWith(auth, browserLocalPersistence);
  });

  it("skips when not Capacitor native", async () => {
    isCapacitorNative.mockReturnValue(false);
    await ensureNativeAuthPersistence({} as never);
    expect(setPersistence).not.toHaveBeenCalled();
  });
});
