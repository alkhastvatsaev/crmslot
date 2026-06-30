import { captureNativePhotoFile } from "@/core/native/photoCapture";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";
import * as nativeCamera from "@/core/native/nativeCamera";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
}));

jest.mock("@/core/native/nativeCamera", () => ({
  captureNativePhoto: jest.fn(),
}));

const captureNativePhotoMock = nativeCamera.captureNativePhoto as jest.MockedFunction<
  typeof nativeCamera.captureNativePhoto
>;

describe("captureNativePhotoFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
  });

  it("retourne null sur web", async () => {
    expect(await captureNativePhotoFile()).toBeNull();
    expect(captureNativePhotoMock).not.toHaveBeenCalled();
  });

  it("retourne null si capture annulée", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    captureNativePhotoMock.mockResolvedValue(null);

    expect(await captureNativePhotoFile("camera")).toBeNull();
  });

  it("construit un File JPEG depuis la dataUrl native", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    captureNativePhotoMock.mockResolvedValue({
      dataUrl: "data:image/jpeg;base64,YWJj",
      format: "jpg",
    });
    global.fetch = jest.fn().mockResolvedValue({
      blob: async () => new Blob(["abc"], { type: "image/jpeg" }),
    }) as unknown as typeof fetch;

    const captured = await captureNativePhotoFile("library");
    expect(captureNativePhotoMock).toHaveBeenCalledWith("library");
    expect(captured?.mimeType).toBe("image/jpeg");
    expect(captured?.dataUrl).toBe("data:image/jpeg;base64,YWJj");
    expect(captured?.file).toBeInstanceOf(File);
    expect(captured?.file.type).toBe("image/jpeg");
    expect(captured?.file.name).toMatch(/^photo-\d+\.jpg$/);
  });
});
