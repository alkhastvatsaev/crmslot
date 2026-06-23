"use client";

import { useEffect } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import { toast } from "sonner";

export function useSmartFormDraftAudioRecorderSync(
  audioRecorderBlob: Blob | null,
  audioRecorderTranscription: string,
  setAudioBlob: (blob: Blob | null) => void,
  setAudioTranscription: (v: string) => void
) {
  useEffect(() => {
    if (audioRecorderBlob !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAudioBlob(audioRecorderBlob);
    }
    if (audioRecorderTranscription !== "") {
      setAudioTranscription(audioRecorderTranscription);
    }
  }, [audioRecorderBlob, audioRecorderTranscription, setAudioBlob, setAudioTranscription]);
}

export function useSmartFormDraftDemoAudioSave(
  audioBlob: Blob | null,
  setDemoAudioSaving: (saving: boolean) => void,
  setDemoAudioUrl: (url: string | null) => void
) {
  useEffect(() => {
    if (!PRESENTATION_PRIVACY_MODE) return;
    if (!audioBlob || !(audioBlob instanceof Blob) || audioBlob.size === 0) return;
    let cancelled = false;
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemoAudioSaving(true);
    (async () => {
      try {
        const formData = new FormData();
        const mime = audioBlob.type || "audio/webm";
        const ext = mime.includes("mp4")
          ? "m4a"
          : mime.includes("ogg")
            ? "ogg"
            : mime.includes("wav")
              ? "wav"
              : "webm";
        formData.append("audio", audioBlob, `message.${ext}`);
        const res = await fetchWithAuth("/api/demo/client-audio", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          logger.error("Demo local audio save failed:", { status: res.status, error: txt });
          if (!cancelled)
            toast.error("Audio démo", {
              description: "Impossible d'enregistrer l'audio localement.",
            });
          return;
        }
        const json = (await res.json()) as { url?: string };
        if (!cancelled) setDemoAudioUrl(json.url ?? null);
        const list = await fetchWithAuth("/api/demo/client-audio", { signal: controller.signal })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        if (!cancelled && json.url && list?.files && Array.isArray(list.files)) {
          const name = String(json.url).split("/").pop() || "";
          const exists = list.files.some((f: { name?: string }) => f?.name === name);
          if (!exists) {
            toast.error("Audio démo", { description: "Fichier non trouvé sur le serveur (démo)." });
          } else {
            toast.success("Audio démo enregistré", { description: name });
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        logger.error("Demo local audio save failed:", {
          error: e instanceof Error ? e.message : String(e),
        });
        if (!cancelled)
          toast.error("Audio démo", {
            description: "Impossible d'enregistrer l'audio localement.",
          });
      } finally {
        if (!cancelled) setDemoAudioSaving(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [audioBlob, setDemoAudioSaving, setDemoAudioUrl]);
}
