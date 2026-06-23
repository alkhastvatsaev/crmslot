"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { capturePhotoFromVideo } from "@/features/interventions/finishJobCapture";
import { FINISH_JOB_MAX_PHOTOS } from "@/features/interventions/finishJobConstants";
import { FINISH_JOB_DEFAULT_PHOTO_CATEGORY } from "@/features/interventions/finishJobWizardMotion";
import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";
import type { FinishWizardPhoto } from "@/features/interventions/technicianCompletionReport";

type Args = {
  interventionId: string | null;
  step: FinishJobStep;
  photos: FinishWizardPhoto[];
  setPhotos: Dispatch<SetStateAction<FinishWizardPhoto[]>>;
  t: (key: string) => string;
};

export function useFinishJobWizardCamera({ interventionId, step, photos, setPhotos, t }: Args) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  useEffect(() => {
    if (!interventionId || step !== "photos") {
      stopCamera();
      return () => {};
    }

    let cancelled = false;
    void navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          void el.play().catch(() => {});
        }
      })
      .catch(() => {
        toast.error(String(t("technician_hub.finish.toasts.camera_unavailable")), {
          description: String(t("technician_hub.finish.toasts.camera_unavailable_desc")),
        });
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [interventionId, step, stopCamera, t]);

  const captureShot = useCallback(() => {
    const v = videoRef.current;
    if (!v || photos.length >= FINISH_JOB_MAX_PHOTOS) return;
    try {
      const url = capturePhotoFromVideo(v);
      setPhotos((p) => [...p, { url, category: FINISH_JOB_DEFAULT_PHOTO_CATEGORY }]);
    } catch {
      toast.error(String(t("technician_hub.finish.toasts.photo_impossible")));
    }
  }, [photos.length, setPhotos, t]);

  const removePhoto = useCallback(
    (idx: number) => {
      setPhotos((p) => p.filter((_, i) => i !== idx));
    },
    [setPhotos]
  );

  return { videoRef, stopCamera, captureShot, removePhoto };
}
