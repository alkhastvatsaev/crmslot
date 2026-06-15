import { isCapacitorNative } from "./capacitorRuntime";

export type CapturedPhoto = {
  dataUrl: string;
  mimeType: string;
  file: File;
};

function inferMimeFromFormat(format: string): string {
  const f = format.toLowerCase();
  if (f === "jpg" || f === "jpeg") return "image/jpeg";
  if (f === "png") return "image/png";
  if (f === "webp") return "image/webp";
  if (f === "heic" || f === "heif") return "image/heic";
  return "image/jpeg";
}

async function dataUrlToFile(dataUrl: string, mimeType: string, name: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], name, { type: mimeType });
}

export async function captureNativePhotoFile(
  source: "camera" | "library" | "prompt" = "prompt"
): Promise<CapturedPhoto | null> {
  if (!isCapacitorNative()) return null;
  const { captureNativePhoto } = await import("./nativeCamera");
  const photo = await captureNativePhoto(source);
  if (!photo) return null;
  const mimeType = inferMimeFromFormat(photo.format);
  const fileName = `photo-${Date.now()}.${photo.format || "jpg"}`;
  const file = await dataUrlToFile(photo.dataUrl, mimeType, fileName);
  return { dataUrl: photo.dataUrl, mimeType, file };
}
