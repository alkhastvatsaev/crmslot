"use client";

import { useEffect } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import { SMART_INTERVENTION_DRAFT_STORAGE_KEY } from "@/features/interventions/smartInterventionConstants";
import {
  emptyDraft,
  initialStepFromPayload,
  loadStorageDraft,
} from "@/features/interventions/smartFormDraftStorage";
import type { DraftPayload, WizardStep } from "@/features/interventions/smartFormTypes";

type DraftFieldSetters = {
  setAddress: (v: string) => void;
  setUrgency: (v: boolean) => void;
  setPhotoDataUrls: (v: string[]) => void;
  setPlaceLatLng: (v: { lat: number; lng: number } | undefined) => void;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPhone: (v: string) => void;
  setScheduledDate: (v: string) => void;
  setScheduledTime: (v: string) => void;
  setAudioTranscription: (v: string) => void;
  setStep: (v: WizardStep) => void;
};

type DraftEffectsArgs = DraftFieldSetters & {
  address: string;
  description: string;
  urgency: boolean;
  photoDataUrls: string[];
  placeLatLng?: { lat: number; lng: number };
  firstName: string;
  lastName: string;
  phone: string;
  scheduledDate: string;
  scheduledTime: string;
  audioTranscription: string;
  step: WizardStep;
  interventionCompanyId: string | null;
  pregeneratedDocId: string;
  setPregeneratedDocId: (id: string) => void;
  setTakenSlots: (slots: Record<string, string[]>) => void;
  setParentInterventionId: (id: string | null) => void;
  audioBlob: Blob | null;
  setDemoAudioUrl: (url: string | null) => void;
  setDemoAudioSaving: (saving: boolean) => void;
  recapPhotosOpen: boolean;
  setRecapPhotosOpen: (open: boolean) => void;
  audioRecorderBlob: Blob | null;
  audioRecorderTranscription: string;
  setAudioBlob: (blob: Blob | null) => void;
  setAudioTranscription: (v: string) => void;
};

export function useSmartFormDraftEffects(args: DraftEffectsArgs) {
  const {
    address,
    description,
    urgency,
    photoDataUrls,
    placeLatLng,
    firstName,
    lastName,
    phone,
    scheduledDate,
    scheduledTime,
    audioTranscription,
    step,
    interventionCompanyId,
    pregeneratedDocId,
    setPregeneratedDocId,
    setTakenSlots,
    setParentInterventionId,
    setAddress,
    setUrgency,
    setPhotoDataUrls,
    setPlaceLatLng,
    setFirstName,
    setLastName,
    setPhone,
    setScheduledDate,
    setScheduledTime,
    setAudioTranscription,
    setStep,
    audioBlob,
    setDemoAudioUrl,
    setDemoAudioSaving,
    recapPhotosOpen,
    setRecapPhotosOpen,
    audioRecorderBlob,
    audioRecorderTranscription,
    setAudioBlob,
  } = args;

  useEffect(() => {
    if (firestore && !pregeneratedDocId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPregeneratedDocId(doc(collection(firestore, "interventions")).id);
    }
  }, [pregeneratedDocId, setPregeneratedDocId]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    const raw = sessionStorage.getItem("crmslot_prefill_client");
    if (!raw) return;
    sessionStorage.removeItem("crmslot_prefill_client");
    try {
      const prefill = JSON.parse(raw) as {
        clientName?: string;
        phone?: string;
        clientId?: string;
        parentInterventionId?: string;
      };
      const name = prefill.clientName?.trim() ?? "";
      if (name) {
        const parts = name.split(/\s+/);
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      }
      if (prefill.phone?.trim()) setPhone(prefill.phone.trim());
      if (prefill.parentInterventionId?.trim()) {
        setParentInterventionId(prefill.parentInterventionId.trim());
      }
      void prefill.clientId;
    } catch {
      /* ignore */
    }
    const savRaw = sessionStorage.getItem("crmslot_prefill_sav");
    if (savRaw) {
      sessionStorage.removeItem("crmslot_prefill_sav");
      setParentInterventionId(savRaw.trim());
    }
  }, [setFirstName, setLastName, setParentInterventionId, setPhone]);

  useEffect(() => {
    if (audioRecorderBlob !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAudioBlob(audioRecorderBlob);
    }
    if (audioRecorderTranscription !== "") {
      setAudioTranscription(audioRecorderTranscription);
    }
  }, [audioRecorderBlob, audioRecorderTranscription, setAudioBlob, setAudioTranscription]);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step !== 5) setRecapPhotosOpen(false);
  }, [step, setRecapPhotosOpen]);

  useEffect(() => {
    if (!recapPhotosOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRecapPhotosOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [recapPhotosOpen, setRecapPhotosOpen]);

  useEffect(() => {
    const db = firestore;
    if (!db || !auth) return;
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || cancelled) return;
      try {
        const snap = await getDoc(doc(db, "intervention_request_drafts", user.uid));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as { payload?: DraftPayload; updatedAt?: Timestamp };
        const remoteMs = data.updatedAt?.toMillis?.() ?? 0;
        const localMs = loadStorageDraft()?.updatedAt ?? 0;
        if (remoteMs <= localMs) return;
        const p = data.payload;
        if (!p) return;
        const merged = { ...emptyDraft(), ...p };
        setAddress(merged.address);
        setUrgency(Boolean(merged.urgency));
        setPhotoDataUrls(Array.isArray(merged.photoDataUrls) ? merged.photoDataUrls : []);
        setPlaceLatLng(merged.placeLatLng);
        setFirstName(merged.firstName ?? "");
        setLastName(merged.lastName ?? "");
        setPhone(merged.phone ?? "");
        setScheduledDate(merged.scheduledDate ?? "");
        setScheduledTime(merged.scheduledTime ?? "");
        setAudioTranscription(merged.audioTranscription ?? "");
        setStep(initialStepFromPayload(merged));
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [
    setAddress,
    setAudioTranscription,
    setFirstName,
    setLastName,
    setPhone,
    setPhotoDataUrls,
    setPlaceLatLng,
    setScheduledDate,
    setScheduledTime,
    setStep,
    setUrgency,
  ]);

  useEffect(() => {
    const payload: DraftPayload = {
      address,
      description,
      urgency,
      photoDataUrls,
      placeLatLng,
      firstName,
      lastName,
      phone,
      scheduledDate,
      scheduledTime,
      audioTranscription,
    };
    const updatedAt = Date.now();
    try {
      localStorage.setItem(
        SMART_INTERVENTION_DRAFT_STORAGE_KEY,
        JSON.stringify({ payload, updatedAt })
      );
    } catch {
      /* quota */
    }

    const timer = window.setTimeout(async () => {
      const db = firestore;
      const user = auth?.currentUser;
      if (!db || !user) return;
      try {
        await setDoc(
          doc(db, "intervention_request_drafts", user.uid),
          { payload, updatedAt: Timestamp.now() },
          { merge: true }
        );
      } catch {
        /* hors ligne */
      }
    }, 850);

    return () => window.clearTimeout(timer);
  }, [
    address,
    audioTranscription,
    description,
    firstName,
    lastName,
    phone,
    photoDataUrls,
    placeLatLng,
    scheduledDate,
    scheduledTime,
    urgency,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step > 1 && !address.trim()) setStep(1);
  }, [address, setStep, step]);

  useEffect(() => {
    if (step !== 5) return;
    const fetchSlots = async () => {
      const db = firestore;
      if (!db) return;
      try {
        let q;
        if (interventionCompanyId) {
          q = query(
            collection(db, "interventions"),
            where("companyId", "==", interventionCompanyId),
            where("status", "in", ["pending", "accepted", "in_progress", "resolved"])
          );
        } else {
          return;
        }
        const snap = await getDocs(q);
        const slots: Record<string, string[]> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (data.scheduledDate && data.scheduledTime) {
            if (!slots[data.scheduledDate]) slots[data.scheduledDate] = [];
            slots[data.scheduledDate].push(data.scheduledTime);
          }
        });
        setTakenSlots(slots);
      } catch (err) {
        logger.error("Erreur récupération dispos", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };
    void fetchSlots();
  }, [interventionCompanyId, setTakenSlots, step]);
}
