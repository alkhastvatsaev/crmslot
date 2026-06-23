import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import { createSilentWavBlob } from "@/features/interventions/smartFormSubmitHelpers";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

export type SmartFormAudioUploadResult = {
  uploadedAudioUrl: string | null;
  uploadedAudioStoragePath: string | null;
  uploadedAudioMimeType: string | null;
  finalAudioBlob: Blob | null;
};

export async function resolveSmartFormAudioUpload(params: {
  finalAudioBlob: Blob | null;
  demoAudioUrl: string | null;
  newDocRefId: string;
}): Promise<SmartFormAudioUploadResult> {
  let { finalAudioBlob } = params;
  const { demoAudioUrl, newDocRefId } = params;

  let uploadedAudioUrl: string | null = null;
  let uploadedAudioStoragePath: string | null = null;
  let uploadedAudioMimeType: string | null = null;

  if (PRESENTATION_PRIVACY_MODE && demoAudioUrl) {
    uploadedAudioUrl = demoAudioUrl;
  }

  if (PRESENTATION_PRIVACY_MODE) {
    if (!finalAudioBlob) {
      finalAudioBlob = createSilentWavBlob();
      toast.message("Mode démo", {
        description: "Audio de démonstration généré automatiquement.",
      });
    }
  }

  if (PRESENTATION_PRIVACY_MODE && !uploadedAudioUrl && finalAudioBlob && finalAudioBlob.size > 0) {
    try {
      const formData = new FormData();
      const mime = finalAudioBlob.type || "audio/webm";
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      formData.append("audio", finalAudioBlob, `message.${ext}`);
      const res = await fetchWithAuth("/api/demo/client-audio", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        logger.error("Demo local audio save failed:", { status: res.status, error: txt });
        toast.error("Audio démo", {
          description: "Impossible d'enregistrer l'audio localement.",
        });
      } else {
        const json = (await res.json()) as {
          url?: string;
          storagePath?: string;
          mimeType?: string;
        };
        if (json.url) uploadedAudioUrl = json.url;
        if (json.storagePath) uploadedAudioStoragePath = json.storagePath;
        if (json.mimeType) uploadedAudioMimeType = json.mimeType;
      }
    } catch (e) {
      logger.error("Demo audio local save failed:", {
        error: e instanceof Error ? e.message : String(e),
      });
      toast.error("Audio démo", {
        description: "Impossible d'enregistrer l'audio localement.",
      });
    }
  }

  if (finalAudioBlob && finalAudioBlob.size > 0 && storage) {
    try {
      const mime = finalAudioBlob.type || "audio/webm";
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      const storagePath = `intervention-audios/${newDocRefId}/message.${ext}`;
      const audioRef = ref(storage, storagePath);
      const metadata = { contentType: mime };
      await uploadBytes(audioRef, finalAudioBlob, metadata);
      uploadedAudioStoragePath = storagePath;
      uploadedAudioMimeType = mime;
      try {
        uploadedAudioUrl = await getDownloadURL(audioRef);
      } catch {
        uploadedAudioUrl = null;
      }
    } catch (uploadErr) {
      logger.error("Failed to upload audio blob:", {
        error: uploadErr instanceof Error ? uploadErr.message : String(uploadErr),
      });
    }
  }

  if (!uploadedAudioUrl && finalAudioBlob && finalAudioBlob.size > 0) {
    try {
      if (finalAudioBlob.size > 650_000) {
        throw new Error("Audio trop volumineux pour le mode démo");
      }
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onerror = () => resolve(null);
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
        reader.readAsDataURL(finalAudioBlob as Blob);
      });
      if (dataUrl && dataUrl.length < 980_000) {
        uploadedAudioUrl = dataUrl;
      }
    } catch {
      /* ignore */
    }
  }

  return {
    uploadedAudioUrl,
    uploadedAudioStoragePath,
    uploadedAudioMimeType,
    finalAudioBlob,
  };
}
