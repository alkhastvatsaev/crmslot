"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { compressImageToDataUrl } from "@/features/interventions/compressImageToDataUrl";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/smartFormTypes";

export function useSmartFormPhotoIngest(
  setPhotoDataUrls: React.Dispatch<React.SetStateAction<string[]>>
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const max = SMART_FORM_MAX_PHOTOS;
      const encoded: string[] = [];
      for (const file of list) {
        if (encoded.length >= max) break;
        try {
          encoded.push(await compressImageToDataUrl(file));
        } catch {
          toast.error("Image non lue");
        }
      }
      setPhotoDataUrls((prev) => {
        const room = Math.max(0, max - prev.length);
        return [...prev, ...encoded.slice(0, room)];
      });
    },
    [setPhotoDataUrls]
  );

  const removePhoto = useCallback(
    (idx: number) => {
      setPhotoDataUrls((prev) => prev.filter((_, i) => i !== idx));
    },
    [setPhotoDataUrls]
  );

  return { fileInputRef, ingestFiles, removePhoto };
}
