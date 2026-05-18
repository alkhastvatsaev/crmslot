import type { Intervention } from "@/features/interventions/types";

type WithCompletionPhotos = Pick<Intervention, "completionPhotoUrls" | "completionPhotos">;

/** URLs de preuve chantier : préfère `completionPhotos`, sinon `completionPhotoUrls`. */
export function completionPhotoUrlsFromIntervention(
  iv: Partial<WithCompletionPhotos> | null | undefined,
): string[] {
  const structured = Array.isArray(iv?.completionPhotos)
    ? iv.completionPhotos
        .map((p) => (typeof p?.url === "string" ? p.url.trim() : ""))
        .filter((u) => u.length > 0)
    : [];
  if (structured.length > 0) return structured;

  const legacy = Array.isArray(iv?.completionPhotoUrls) ? iv.completionPhotoUrls : [];
  return legacy.filter((u) => typeof u === "string" && u.trim() !== "");
}
