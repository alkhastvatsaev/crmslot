import { isCapacitorNative } from "./capacitorRuntime";

export type NativePhoto = {
  dataUrl: string;
  format: string;
};

export type CapturePhotoSource = "camera" | "library" | "prompt";

export async function captureNativePhoto(
  source: CapturePhotoSource = "prompt"
): Promise<NativePhoto | null> {
  if (!isCapacitorNative()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const sourceMap = {
    camera: CameraSource.Camera,
    library: CameraSource.Photos,
    prompt: CameraSource.Prompt,
  } as const;
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: sourceMap[source],
      correctOrientation: true,
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch {
    return null;
  }
}

export async function pickNativeFromGallery(): Promise<NativePhoto[] | null> {
  if (!isCapacitorNative()) return null;
  const { Camera } = await import("@capacitor/camera");
  try {
    const result = await Camera.pickImages({ quality: 80, limit: 10 });
    const photos = await Promise.all(
      result.photos.map(async (p) => {
        const res = await fetch(p.webPath);
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return { dataUrl, format: p.format };
      })
    );
    return photos;
  } catch {
    return null;
  }
}
