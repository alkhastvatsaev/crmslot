import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { toast } from "sonner";
import { firestore, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import {
  REQUESTER_GEOLOC_ADDRESS_PENDING,
  SMART_INTERVENTION_DRAFT_STORAGE_KEY,
} from "@/features/interventions/smartInterventionConstants";
import { recordDuplicateAlertIfNeeded } from "@/features/interventions/recordDuplicateAlertIfNeeded";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { findPotentialDuplicates } from "@/features/interventions/detectDuplicates";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/smartFormTypes";
import {
  createSilentWavBlob,
  ensureUserForInterventionSubmit,
} from "@/features/interventions/smartFormSubmitHelpers";
import type { Intervention } from "@/features/interventions/types";
import { capitalizeName } from "@/utils/stringUtils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
export type SmartFormAudioRecorderApi = {
  audioBlob: Blob | null;
  transcription: string;
  transcriptionPromise: (() => Promise<string | null>) | null;
  isTranscribing: boolean;
  resetRecording: () => void;
};

export type SmartFormSubmitInput = {
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
  audioBlob: Blob | null;
  demoAudioUrl: string | null;
  parentInterventionId: string | null;
  tenantCompanyId: string | null;
  interventionCompanyId: string | null;
  isTenantUser: boolean;
  audioRecorder: SmartFormAudioRecorderApi;
  setBusy: (busy: boolean) => void;
  resetForm: () => void;
};

export async function submitSmartFormIntervention(input: SmartFormSubmitInput): Promise<void> {
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
    audioBlob,
    demoAudioUrl,
    parentInterventionId,
    tenantCompanyId,
    interventionCompanyId,
    isTenantUser,
    audioRecorder,
    setBusy,
    resetForm,
  } = input;

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
  if (isTenantUser && !tenantCompanyId) {
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

    const finalTitle = (description.trim() || finalTranscription || "Demande d'intervention").slice(
      0,
      140
    );

    const { portalAccessFields } = await import("@/features/interventions/ensurePortalAccessToken");
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
    resetForm();
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
}
