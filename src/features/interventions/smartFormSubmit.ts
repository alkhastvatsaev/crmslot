import { collection, doc } from "firebase/firestore";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { SMART_INTERVENTION_DRAFT_STORAGE_KEY } from "@/features/interventions/smartInterventionConstants";
import { ensureUserForInterventionSubmit } from "@/features/interventions/smartFormSubmitHelpers";
import { resolveSmartFormAudioUpload } from "@/features/interventions/smartFormSubmitAudio";
import { runSmartFormSubmitBackgroundTasks } from "@/features/interventions/smartFormSubmitBackground";
import {
  findSmartFormDuplicateInterventions,
  geocodeSmartFormAddress,
} from "@/features/interventions/smartFormSubmitQueries";
import type { SmartFormSubmitInput } from "@/features/interventions/smartFormSubmitTypes";
import {
  showSmartFormValidationError,
  validateSmartFormSubmitInput,
} from "@/features/interventions/smartFormSubmitValidation";
import { writeSmartFormInterventionDoc } from "@/features/interventions/smartFormSubmitWrite";
import { notifyStaffNewClientRequestClient } from "@/features/notifications/notifyStaffNewClientRequestClient";

export type {
  SmartFormAudioRecorderApi,
  SmartFormSubmitInput,
} from "@/features/interventions/smartFormSubmitTypes";

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

  const validation = validateSmartFormSubmitInput({
    address,
    description,
    audioTranscription,
    audioBlob,
    isTenantUser,
    tenantCompanyId,
    audioRecorder,
  });
  if (!validation.ok) {
    showSmartFormValidationError(validation);
    return;
  }

  let finalAudioBlob = audioRecorder.audioBlob || audioBlob;
  const promiseFunc = audioRecorder.transcriptionPromise;
  const tPromise = promiseFunc ? promiseFunc() : null;
  const finalTranscription = audioTranscription || audioRecorder.transcription;

  const user = await ensureUserForInterventionSubmit();
  if (!user || !firestore) return;

  const db = firestore;

  setBusy(true);
  try {
    const newDocRef = doc(collection(db, "interventions"));
    const nowIso = new Date().toISOString();
    const hour = new Date().toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });

    const finalProblem = description.trim() || finalTranscription || "Demande d'intervention";

    const duplicates = await findSmartFormDuplicateInterventions({
      db,
      user,
      tenantCompanyId,
      interventionCompanyId,
      address,
      problem: finalProblem,
      firstName,
      lastName,
      phone,
    });
    if (duplicates.length > 0) {
      toast.error("VOTRE ENTREPRISE A DEJA FAIT CETTE DEMANDE", {
        description: "Une demande identique a déjà été soumise.",
      });
      setBusy(false);
      return;
    }

    const { lat, lng } = await geocodeSmartFormAddress(address, placeLatLng);

    const audioUpload = await resolveSmartFormAudioUpload({
      finalAudioBlob,
      demoAudioUrl,
      newDocRefId: newDocRef.id,
    });
    finalAudioBlob = audioUpload.finalAudioBlob;

    const { finalTitle } = await writeSmartFormInterventionDoc({
      db,
      newDocRef,
      user,
      address,
      description,
      urgency,
      lat,
      lng,
      finalProblem,
      finalTranscription,
      photoDataUrls,
      firstName,
      lastName,
      phone,
      scheduledDate,
      scheduledTime,
      uploadedAudioUrl: audioUpload.uploadedAudioUrl,
      uploadedAudioStoragePath: audioUpload.uploadedAudioStoragePath,
      uploadedAudioMimeType: audioUpload.uploadedAudioMimeType,
      parentInterventionId,
      interventionCompanyId,
      nowIso,
      hour,
    });

    if (interventionCompanyId?.trim()) {
      void notifyStaffNewClientRequestClient({
        companyId: interventionCompanyId.trim(),
        interventionId: newDocRef.id,
        title: finalTitle,
        address: address.trim(),
        user,
      });
    }

    runSmartFormSubmitBackgroundTasks({
      db,
      newDocRef,
      transcriptionPromise: tPromise,
      finalTranscription,
      interventionCompanyId,
      address,
      finalProblem,
      userUid: user.uid,
      firstName,
      lastName,
      phone,
    });

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
