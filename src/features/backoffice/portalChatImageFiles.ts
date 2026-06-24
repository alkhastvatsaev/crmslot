import { compressImageToDataUrl } from "@/features/interventions/compressImageToDataUrl";

const MAX_FILES = 6;
const MAX_TOTAL = 6;
/** Bord max + qualité JPEG — cible ~200–500 Ko par photo (upload chat). */
const CHAT_IMAGE_MAX_EDGE = 1280;
const CHAT_IMAGE_QUALITY = 0.78;

export async function readPortalChatImageDataUrls(
  files: FileList | null,
  currentCount: number
): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const allowed = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (allowed.length === 0) return [];

  const remaining = Math.max(0, MAX_TOTAL - currentCount);
  const sliced = allowed.slice(0, Math.min(MAX_FILES, remaining));

  const compressed = await Promise.all(
    sliced.map(async (file) => {
      try {
        return await compressImageToDataUrl(file, CHAT_IMAGE_MAX_EDGE, CHAT_IMAGE_QUALITY);
      } catch {
        return null;
      }
    })
  );

  return compressed.filter(Boolean) as string[];
}
