import { doc, setDoc } from "firebase/firestore";
import type { DocumentReference, Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";
import { logCrmInterventionCreated } from "@/features/crmHistory/logCrmInterventionCreated";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/smartFormTypes";
import { capitalizeName } from "@/utils/stringUtils";

export type SmartFormInterventionDocInput = {
  db: Firestore;
  newDocRef: DocumentReference;
  user: User;
  address: string;
  description: string;
  urgency: boolean;
  lat: number;
  lng: number;
  finalProblem: string;
  finalTranscription: string;
  photoDataUrls: string[];
  firstName: string;
  lastName: string;
  phone: string;
  scheduledDate: string;
  scheduledTime: string;
  uploadedAudioUrl: string | null;
  uploadedAudioStoragePath: string | null;
  uploadedAudioMimeType: string | null;
  parentInterventionId: string | null;
  interventionCompanyId: string | null;
  nowIso: string;
  hour: string;
};

export async function writeSmartFormInterventionDoc(
  input: SmartFormInterventionDocInput
): Promise<{ finalTitle: string }> {
  const {
    newDocRef,
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
    uploadedAudioUrl,
    uploadedAudioStoragePath,
    uploadedAudioMimeType,
    parentInterventionId,
    interventionCompanyId,
    nowIso,
    hour,
    user,
  } = input;

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

  return { finalTitle };
}
