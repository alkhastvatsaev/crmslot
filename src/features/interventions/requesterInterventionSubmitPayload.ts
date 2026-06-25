import type { ClientPortalAccountFields } from "@/features/auth";
import { clientPortalAuth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { User } from "firebase/auth";
import {
  isPersistableClientAudioUrl,
  uploadInterventionAudioToFirebase,
} from "@/features/interventions/clientAudioUpload";
import type { InterventionRequestData, RequesterProfile } from "@/context/RequesterHubContext";
import { capitalizeName } from "@/utils/stringUtils";
import { normalizePortalEmail } from "@/features/interventions/portalEmail";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";
import { estimateInterventionBilling } from "@/features/interventions/estimateInterventionBilling";

export type RequesterClientFields = {
  clientFirstRaw: string;
  clientLastRaw: string;
  clientPhoneRaw: string;
  clientEmailRaw: string;
};

export function resolveRequesterClientFields(params: {
  profile: RequesterProfile;
  clientAccountFields: ClientPortalAccountFields | null;
  user: User;
}): RequesterClientFields {
  const { profile, clientAccountFields, user } = params;

  const portalUser =
    (profile.type === "login" || profile.type === "register") &&
    clientPortalAuth?.currentUser &&
    !clientPortalAuth.currentUser.isAnonymous
      ? clientPortalAuth.currentUser
      : null;

  let clientFirstRaw = profile.firstName.trim();
  let clientLastRaw = profile.lastName.trim();
  if (portalUser && !clientFirstRaw && !clientLastRaw && portalUser.displayName?.trim()) {
    const parts = portalUser.displayName.trim().split(/\s+/);
    clientFirstRaw = parts[0] ?? "";
    clientLastRaw = parts.slice(1).join(" ");
  }

  const clientPhoneRaw = profile.phone.trim() || (portalUser?.phoneNumber ?? "").trim();
  const clientEmailRaw =
    profile.email.trim() ||
    clientAccountFields?.email.trim() ||
    (portalUser?.email ?? user.email ?? "").trim();

  return { clientFirstRaw, clientLastRaw, clientPhoneRaw, clientEmailRaw };
}

export async function resolveRequesterSubmitAudioUrl(
  requestData: InterventionRequestData
): Promise<string | null> {
  let audioUrlForDoc = (requestData.audioUrl ?? "").trim() || null;
  if (!isPersistableClientAudioUrl(audioUrlForDoc)) {
    audioUrlForDoc = null;
  }

  const blobForAudio = requestData.audioBlob;
  if (blobForAudio && blobForAudio.size > 0 && !audioUrlForDoc) {
    try {
      const quick = await uploadInterventionAudioToFirebase(blobForAudio);
      if (quick?.url) {
        audioUrlForDoc = quick.url;
      }
    } catch (e) {
      logger.error("Persist vocal at submit failed", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return audioUrlForDoc;
}

export async function buildRequesterInterventionDocPayload(params: {
  requestData: InterventionRequestData;
  interventionCompanyId: string;
  user: User;
  clientFields: RequesterClientFields;
  audioUrlForDoc: string | null;
  locale: string;
  lat: number;
  lng: number;
  portalFields: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const {
    requestData,
    interventionCompanyId,
    user,
    clientFields,
    audioUrlForDoc,
    locale,
    lat,
    lng,
    portalFields,
  } = params;

  const {
    problemTemplateId,
    problemLabel,
    description,
    urgency,
    photoDataUrls,
    interventionAddress,
    interventionDate,
    interventionTime,
  } = requestData;

  const { clientFirstRaw, clientLastRaw, clientPhoneRaw, clientEmailRaw } = clientFields;
  const problemForDedupe = description.trim() || problemLabel.trim();
  const title = (problemLabel.trim() || description.trim()).slice(0, 140);
  const nowIso = new Date().toISOString();
  const hour =
    interventionTime ||
    new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const priceEstimate = estimateInterventionBilling({
    problemTemplateId,
    problemLabel,
    problem: problemForDedupe,
    category: "serrurerie",
    address: interventionAddress.trim(),
    urgency,
    requestedDate: interventionDate,
    requestedTime: interventionTime,
  });

  return {
    title,
    address: interventionAddress.trim(),
    time: hour,
    status: "pending",
    location: { lat, lng },
    urgency,
    problem: problemForDedupe,
    category: "serrurerie",
    createdAt: nowIso,
    createdByUid: user.uid,
    assignedTechnicianUid: null,
    companyId: interventionCompanyId,
    ...portalFields,
    ...(photoDataUrls.length
      ? { attachmentThumbnails: photoDataUrls.slice(0, SMART_FORM_MAX_PHOTOS) }
      : {}),
    ...(clientFirstRaw ? { clientFirstName: capitalizeName(clientFirstRaw) } : {}),
    ...(clientLastRaw ? { clientLastName: capitalizeName(clientLastRaw) } : {}),
    ...(clientPhoneRaw ? { clientPhone: clientPhoneRaw } : {}),
    ...(clientEmailRaw ? { clientEmail: clientEmailRaw } : {}),
    ...(clientEmailRaw ? { clientEmailNormalized: normalizePortalEmail(clientEmailRaw) } : {}),
    ...(interventionDate ? { requestedDate: interventionDate } : {}),
    ...(interventionTime ? { requestedTime: interventionTime } : {}),
    ...(problemTemplateId ? { problemTemplateId } : {}),
    ...(priceEstimate
      ? {
          billingLines: priceEstimate.lines,
          invoiceAmountCents: priceEstimate.totalCents,
          draftBillingSource: "template",
          draftBillingPreparedAt: nowIso,
        }
      : {}),
    ...(audioUrlForDoc && isPersistableClientAudioUrl(audioUrlForDoc)
      ? { audioUrl: audioUrlForDoc }
      : {}),
  };
}
