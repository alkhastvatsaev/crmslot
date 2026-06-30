import { captureNativePhoto, pickNativeFromGallery } from "@/core/native/nativeCamera";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
}));

const getPhoto = jest.fn();
const pickImages = jest.fn();

jest.mock("@capacitor/camera", () => ({
  Camera: {
    getPhoto: (...args: unknown[]) => getPhoto(...args),
    pickImages: (...args: unknown[]) => pickImages(...args),
  },
  CameraResultType: { DataUrl: "dataUrl" },
  CameraSource: { Camera: "CAMERA", Photos: "PHOTOS", Prompt: "PROMPT" },
}));

describe("nativeCamera", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
  });

  it("captureNativePhoto retourne null sur web", async () => {
    expect(await captureNativePhoto()).toBeNull();
    expect(getPhoto).not.toHaveBeenCalled();
  });

  it("pickNativeFromGallery retourne null sur web", async () => {
    expect(await pickNativeFromGallery()).toBeNull();
    expect(pickImages).not.toHaveBeenCalled();
  });

  it("captureNativePhoto retourne dataUrl en natif", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    getPhoto.mockResolvedValue({ dataUrl: "data:image/jpeg;base64,abc", format: "jpeg" });

    const photo = await captureNativePhoto("camera");
    expect(photo).toEqual({ dataUrl: "data:image/jpeg;base64,abc", format: "jpeg" });
    expect(getPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ source: "CAMERA", resultType: "dataUrl" })
    );
  });

  it("captureNativePhoto retourne null si utilisateur annule", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    getPhoto.mockRejectedValue(new Error("cancelled"));

    expect(await captureNativePhoto()).toBeNull();
  });
});
