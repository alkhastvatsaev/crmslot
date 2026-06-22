"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { toast } from "sonner";
import { auth, firestore, isConfigured, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { compressImageToDataUrl } from "@/features/interventions/compressImageToDataUrl";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import {
  REQUESTER_GEOLOC_ADDRESS_PENDING,
  SMART_INTERVENTION_DRAFT_STORAGE_KEY,
  smartFormAddressEligibleForStep2,
} from "@/features/interventions/smartInterventionConstants";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import { resolveInterventionAddressFromCoords } from "@/features/interventions/smartFormReverseGeocode";
import type { Intervention } from "@/features/interventions/types";
import { capitalizeName } from "@/utils/stringUtils";
import { useAudioRecorder } from "@/features/interventions/useAudioRecorder";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTranslation } from "@/core/i18n/I18nContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DraftPayload = {
  address: string;
  problemLabel?: string;
  description: string;
  urgency: boolean;
  photoDataUrls: string[];
  audioBlob?: Blob | null;
  audioTranscription?: string;
  placeLatLng?: { lat: number; lng: number };
  firstName: string;
  lastName: string;
  phone: string;
  scheduledDate?: string;
  scheduledTime?: string;
};

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const SMART_FORM_MAX_PHOTOS = 4;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function emptyDraft(): DraftPayload {
  return {
    address: "",
    description: "",
    urgency: false,
    photoDataUrls: [],
    firstName: "",
    lastName: "",
    phone: "",
  };
}

function isPayloadEmpty(p: DraftPayload): boolean {
  return (
    !p.address?.trim() &&
    !p.firstName?.trim() &&
    !p.lastName?.trim() &&
    !p.phone?.trim() &&
    !p.description?.trim() &&
    !(p.photoDataUrls?.length ?? 0)
  );
}

function initialStepFromPayload(p: DraftPayload): WizardStep {
  if (isPayloadEmpty(p)) return 1;
  if (!smartFormAddressEligibleForStep2(p.address, p.placeLatLng)) return 1;
  if (!p.description?.trim() && !p.audioBlob && !p.audioTranscription?.trim()) return 2;
  if (!p.photoDataUrls?.length) return 3;
  if (!p.scheduledDate || !p.scheduledTime) return 4;
  return 5;
}

export function loadStorageDraft(): { payload: DraftPayload; updatedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SMART_INTERVENTION_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { payload?: DraftPayload; updatedAt?: number };
    if (!parsed.payload) return null;
    return {
      payload: { ...emptyDraft(), ...parsed.payload },
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

async function ensureUserForInterventionSubmit(): Promise<User | null> {
  if (!isConfigured) {
    toast.error("Firebase non configuré", {
      description:
        "Ajoutez les variables NEXT_PUBLIC_FIREBASE_* dans .env.local (voir .env.example), puis redémarrez npm run dev.",
    });
    return null;
  }
  if (!firestore) {
    toast.error("Base de données indisponible", {
      description:
        "Vérifiez NEXT_PUBLIC_FIREBASE_PROJECT_ID et la configuration du projet Firebase.",
    });
    return null;
  }
  if (!auth) {
    toast.error("Authentification indisponible", {
      description:
        "Firebase Auth n'a pas pu s'initialiser. Contrôlez la console et les clés .env.local.",
    });
    return null;
  }
  const existing = auth.currentUser;
  if (existing) return existing;
  toast.error("Connectez-vous pour envoyer", {
    description: "Utilisez la connexion par téléphone en haut de l'écran ou le portail client.",
  });
  return null;
}

function createSilentWavBlob(durationMs = 1500): Blob {
  const sampleRate = 8000;
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const numSamples = Math.max(1, Math.round((durationMs / 1000) * sampleRate));
  const dataSize = numSamples * numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Haute précision GPS peut bloquer 15–60 s sur bureau / intérieur.
 * La position « réseau » (WiFi / triangulation) suffit et répond en ~1–2 s.
 */
const GEOLOC_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8_000,
  maximumAge: 300_000,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSmartForm() {
  const workspace = useCompanyWorkspaceOptional();
  const tenantCompanyId =
    workspace?.isTenantUser && workspace.activeCompanyId ? workspace.activeCompanyId : null;
  const interventionCompanyId = tenantCompanyId;

  const stored = typeof window !== "undefined" ? loadStorageDraft() : null;
  const initialPayload = stored ? { ...emptyDraft(), ...stored.payload } : emptyDraft();
  const { language } = useTranslation();

  // Form fields
  const [address, setAddress] = useState(initialPayload.address);
  const [description, setDescription] = useState(initialPayload.description ?? "");
  const [urgency, setUrgency] = useState(initialPayload.urgency);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>(initialPayload.photoDataUrls ?? []);
  const [placeLatLng, setPlaceLatLng] = useState<{ lat: number; lng: number } | undefined>(
    initialPayload.placeLatLng
  );
  const [firstName, setFirstName] = useState(initialPayload.firstName ?? "");
  const [lastName, setLastName] = useState(initialPayload.lastName ?? "");
  const [phone, setPhone] = useState(initialPayload.phone ?? "");
  const [scheduledDate, setScheduledDate] = useState(initialPayload.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(initialPayload.scheduledTime ?? "");
  const [audioTranscription, setAudioTranscription] = useState(
    initialPayload.audioTranscription ?? ""
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(
    initialPayload.audioBlob instanceof Blob ? initialPayload.audioBlob : null
  );
  const [demoAudioUrl, setDemoAudioUrl] = useState<string | null>(null);
  const [demoAudioSaving, setDemoAudioSaving] = useState(false);
  const [pregeneratedDocId, setPregeneratedDocId] = useState<string>("");
  const [parentInterventionId, setParentInterventionId] = useState<string | null>(null);

  // Wizard UI state
  const [step, setStep] = useState<WizardStep>(() => initialStepFromPayload(initialPayload));
  const [takenSlots, setTakenSlots] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [recapPhotosOpen, setRecapPhotosOpen] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Audio recorder
  const audioRecorder = useAudioRecorder({ language });

  // -------------------------------------------------------------------------
  // Pre-generated doc id
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (firestore && !pregeneratedDocId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPregeneratedDocId(doc(collection(firestore, "interventions")).id);
    }
  }, [pregeneratedDocId]);

  // -------------------------------------------------------------------------
  // Session storage prefill (from CRM / SAV)
  // -------------------------------------------------------------------------
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
  }, []);

  // -------------------------------------------------------------------------
  // Sync audio recorder state into form
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (audioRecorder.audioBlob !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAudioBlob(audioRecorder.audioBlob);
    }
    if (audioRecorder.transcription !== "") {
      setAudioTranscription(audioRecorder.transcription);
    }
  }, [audioRecorder.audioBlob, audioRecorder.transcription]);

  // -------------------------------------------------------------------------
  // Demo mode: save audio to disk at stop time
  // -------------------------------------------------------------------------
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
  }, [audioBlob]);

  // -------------------------------------------------------------------------
  // Close photos recap when leaving step 5
  // -------------------------------------------------------------------------
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step !== 5) setRecapPhotosOpen(false);
  }, [step]);

  useEffect(() => {
    if (!recapPhotosOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRecapPhotosOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [recapPhotosOpen]);

  // -------------------------------------------------------------------------
  // Hydration from Firestore if remote draft is newer
  // -------------------------------------------------------------------------
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
  }, []);

  // -------------------------------------------------------------------------
  // Auto-save draft (localStorage + Firestore debounced)
  // -------------------------------------------------------------------------
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
  ]);

  // -------------------------------------------------------------------------
  // Guard: without address, always stay on step 1
  // -------------------------------------------------------------------------
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step > 1 && !address.trim()) setStep(1);
  }, [address, step]);

  // -------------------------------------------------------------------------
  // Load taken slots for step 4 scheduling
  // -------------------------------------------------------------------------
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
  }, [step, interventionCompanyId]);

  // -------------------------------------------------------------------------
  // Geolocation
  // -------------------------------------------------------------------------
  const fillAddressFromGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Géolocalisation indisponible sur cet appareil");
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPlaceLatLng({ lat, lng });
        setAddress(REQUESTER_GEOLOC_ADDRESS_PENDING);
        try {
          const { formatted, location } = await resolveInterventionAddressFromCoords(lat, lng);
          setPlaceLatLng(location);
          if (formatted) {
            setAddress(formatted);
          } else {
            setAddress("");
            toast.message("Position enregistrée", {
              description: "Complétez l'adresse si besoin.",
            });
          }
        } catch {
          toast.error("Impossible de récupérer l'adresse");
          setAddress((prev) => (prev === REQUESTER_GEOLOC_ADDRESS_PENDING ? "" : prev));
        } finally {
          setLocatingAddress(false);
          queueMicrotask(() => addressInputRef.current?.focus());
        }
      },
      () => {
        setLocatingAddress(false);
        toast.error("Localisation refusée ou indisponible");
        queueMicrotask(() => addressInputRef.current?.focus());
      },
      GEOLOC_OPTIONS
    );
  }, []);

  // -------------------------------------------------------------------------
  // Photo ingestion
  // -------------------------------------------------------------------------
  const ingestFiles = useCallback(async (files: FileList | File[]) => {
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
  }, []);

  const removePhoto = useCallback((idx: number) => {
    setPhotoDataUrls((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!address.trim()) {
      toast.error("Adresse requise");
      return;
    }
    let finalAudioBlob = audioRecorder.audioBlob || audioBlob;
    const promiseFunc = audioRecorder.transcriptionPromise;
    const tPromise = promiseFunc ? promiseFunc() : null;
    const finalTranscription = audioTranscription || audioRecorder.transcription;

    if (address === REQUESTER_GEOLOC_ADDRESS_PENDING) {
      toast.error("Adresse encore en cours de recherche");
      return;
    }
    if (
      !description.trim() &&
      !finalAudioBlob &&
      !finalTranscription.trim() &&
      !audioRecorder.isTranscribing
    ) {
      toast.error("Description ou audio requis");
      return;
    }
    if (workspace?.isTenantUser && !tenantCompanyId) {
      toast.error("Société active requise");
      return;
    }
    const user = await ensureUserForInterventionSubmit();
    if (!user || !firestore) return;

    const db = firestore;

    setBusy(true);
    try {
      const newDocRef = doc(collection(db, "interventions"));
      const nowIso = new Date().toISOString();
      const hour = new Date().toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });

      const finalProblem = description.trim() || finalTranscription || "Demande d'intervention";

      // Duplicate check before submission
      if (interventionCompanyId) {
        const qDup = tenantCompanyId
          ? query(collection(db, "interventions"), where("companyId", "==", interventionCompanyId))
          : query(collection(db, "interventions"), where("createdByUid", "==", user.uid));
        const snapDup = await getDocs(qDup);
        const existing = snapDup.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as unknown as Intervention[];
        const matches = findPotentialDuplicates(
          {
            address: address.trim(),
            problem: finalProblem,
            client: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim(),
            },
          },
          existing,
          0.95
        );
        if (matches.length > 0) {
          toast.error("VOTRE ENTREPRISE A DEJA FAIT CETTE DEMANDE", {
            description: "Une demande identique a déjà été soumise.",
          });
          setBusy(false);
          return;
        }
      }

      let lat = placeLatLng?.lat;
      let lng = placeLatLng?.lng;
      if (lat === undefined || lng === undefined) {
        try {
          const geo = await fetchWithAuth(
            `/api/maps/geocode?q=${encodeURIComponent(address.trim())}`
          );
          const gj = (await geo.json()) as { location?: { lat: number; lng: number } };
          lat = gj.location?.lat ?? 50.8466;
          lng = gj.location?.lng ?? 4.3522;
        } catch {
          lat = 50.8466;
          lng = 4.3522;
        }
      }

      let uploadedAudioUrl: string | null = null;
      let uploadedAudioStoragePath: string | null = null;
      let uploadedAudioMimeType: string | null = null;

      // If demo audio was already saved at stop-time, reuse it.
      if (PRESENTATION_PRIVACY_MODE && demoAudioUrl) {
        uploadedAudioUrl = demoAudioUrl;
      }

      // Demo mode: ensure audio blob exists
      if (PRESENTATION_PRIVACY_MODE) {
        if (!finalAudioBlob) {
          finalAudioBlob = createSilentWavBlob();
          toast.message("Mode démo", {
            description: "Audio de démonstration généré automatiquement.",
          });
        }
      }

      if (
        PRESENTATION_PRIVACY_MODE &&
        !uploadedAudioUrl &&
        finalAudioBlob &&
        finalAudioBlob.size > 0
      ) {
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
          const storagePath = `intervention-audios/${newDocRef.id}/message.${ext}`;
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

      // Fallback (demo / offline): store as data URL
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
          // ignore
        }
      }

      const finalTitle = (
        description.trim() ||
        finalTranscription ||
        "Demande d'intervention"
      ).slice(0, 140);

      const { portalAccessFields } =
        await import("@/features/interventions/ensurePortalAccessToken");
      const portalFields = portalAccessFields();

      await setDoc(newDocRef, {
        title: finalTitle,
        address: address.trim(),
        time: hour,
        status: "pending",
        location: { lat, lng },
        urgency,
        problem: finalProblem,
        category: "serrurerie",
        createdAt: nowIso,
        createdByUid: user.uid,
        assignedTechnicianUid: null,
        ...portalFields,
        ...(interventionCompanyId ? { companyId: interventionCompanyId } : {}),
        ...(photoDataUrls.length
          ? { attachmentThumbnails: photoDataUrls.slice(0, SMART_FORM_MAX_PHOTOS) }
          : {}),
        ...(firstName.trim() ? { clientFirstName: capitalizeName(firstName) } : {}),
        ...(lastName.trim() ? { clientLastName: capitalizeName(lastName) } : {}),
        ...(phone.trim() ? { clientPhone: phone.trim() } : {}),
        ...(scheduledDate ? { scheduledDate } : {}),
        ...(scheduledTime ? { scheduledTime } : {}),
        ...(uploadedAudioUrl ? { audioUrl: uploadedAudioUrl } : {}),
        ...(uploadedAudioStoragePath ? { audioStoragePath: uploadedAudioStoragePath } : {}),
        ...(uploadedAudioMimeType ? { audioMimeType: uploadedAudioMimeType } : {}),
        ...(finalTranscription ? { transcription: finalTranscription } : {}),
        ...(parentInterventionId ? { parentInterventionId } : {}),
      });

      if (interventionCompanyId) {
        void logCrmInterventionCreated({
          intervention: {
            id: newDocRef.id,
            title: finalTitle,
            address: address.trim(),
            status: "pending",
            companyId: interventionCompanyId,
            ...(firstName.trim() ? { clientFirstName: capitalizeName(firstName) } : {}),
            ...(lastName.trim() ? { clientLastName: capitalizeName(lastName) } : {}),
          },
          actorUid: user.uid,
          actorRole: "client",
          source: "hub_smart_form",
        });
      }

      // Background tasks (duplicate alert + transcript update)
      void (async () => {
        try {
          if (tPromise) {
            const result = await tPromise;
            if (result && !finalTranscription) {
              await setDoc(
                newDocRef,
                { transcription: result, problem: result, title: result.slice(0, 140) },
                { merge: true }
              );
            }
          }

          await recordDuplicateAlertIfNeeded({
            db,
            newInterventionId: newDocRef.id,
            companyId: interventionCompanyId,
            address: address.trim(),
            problem: finalProblem,
            createdByUid: user.uid,
            client: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim(),
            },
          }).catch(() => null);

          await deleteDoc(doc(db, "intervention_request_drafts", user.uid)).catch(() => null);
        } catch (bgErr) {
          logger.error("Background submission error:", {
            error: bgErr instanceof Error ? bgErr.message : String(bgErr),
          });
        }
      })();

      localStorage.removeItem(SMART_INTERVENTION_DRAFT_STORAGE_KEY);
      setAddress("");
      setUrgency(false);
      setPhotoDataUrls([]);
      setPlaceLatLng(undefined);
      setFirstName("");
      setLastName("");
      setPhone("");
      setScheduledTime("");
      setAudioTranscription("");
      setAudioBlob(null);
      audioRecorder.resetRecording();
      setStep(1);
      toast.success("Demande enregistrée");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const errCode =
        e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
      logger.error("useSmartForm submit", { error: errMsg, code: errCode });
      toast.error("Envoi impossible", {
        description: errCode ? `${errCode} — ${errMsg}` : errMsg,
        duration: 12_000,
      });
    } finally {
      setBusy(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const canSubmit =
    step === 5 &&
    address.trim().length > 0 &&
    (description.trim().length > 0 || audioTranscription.trim().length > 0 || audioBlob !== null) &&
    !(workspace?.isTenantUser && !tenantCompanyId);

  const canContinueAddress =
    address !== REQUESTER_GEOLOC_ADDRESS_PENDING &&
    smartFormAddressEligibleForStep2(address, placeLatLng);

  return {
    // Fields
    address,
    setAddress,
    description,
    setDescription,
    urgency,
    setUrgency,
    photoDataUrls,
    placeLatLng,
    setPlaceLatLng,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    audioTranscription,
    setAudioTranscription,
    audioBlob,
    setAudioBlob,
    demoAudioSaving,
    // Wizard state
    step,
    setStep,
    takenSlots,
    busy,
    locatingAddress,
    recapPhotosOpen,
    setRecapPhotosOpen,
    // Refs
    fileInputRef,
    addressInputRef,
    // Audio recorder
    audioRecorder,
    // Actions
    fillAddressFromGeolocation,
    ingestFiles,
    removePhoto,
    handleSubmit,
    // Derived
    canSubmit,
    canContinueAddress,
  };
}
