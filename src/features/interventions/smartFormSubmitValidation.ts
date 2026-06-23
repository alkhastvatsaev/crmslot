import { toast } from "sonner";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import type { SmartFormSubmitInput } from "@/features/interventions/smartFormSubmitTypes";

export type SmartFormValidationFailure = {
  ok: false;
  message: string;
  description?: string;
};

export type SmartFormValidationSuccess = { ok: true };

export type SmartFormValidationResult = SmartFormValidationSuccess | SmartFormValidationFailure;

export function validateSmartFormSubmitInput(
  input: Pick<
    SmartFormSubmitInput,
    | "address"
    | "description"
    | "audioTranscription"
    | "audioBlob"
    | "isTenantUser"
    | "tenantCompanyId"
    | "audioRecorder"
  >
): SmartFormValidationResult {
  const {
    address,
    description,
    audioTranscription,
    audioBlob,
    isTenantUser,
    tenantCompanyId,
    audioRecorder,
  } = input;

  if (!address.trim()) {
    return { ok: false, message: "Adresse requise" };
  }

  const finalAudioBlob = audioRecorder.audioBlob || audioBlob;
  const finalTranscription = audioTranscription || audioRecorder.transcription;

  if (address === REQUESTER_GEOLOC_ADDRESS_PENDING) {
    return { ok: false, message: "Adresse encore en cours de recherche" };
  }

  if (
    !description.trim() &&
    !finalAudioBlob &&
    !finalTranscription.trim() &&
    !audioRecorder.isTranscribing
  ) {
    return { ok: false, message: "Description ou audio requis" };
  }

  if (isTenantUser && !tenantCompanyId) {
    return { ok: false, message: "Société active requise" };
  }

  return { ok: true };
}

export function showSmartFormValidationError(result: SmartFormValidationFailure): void {
  if (result.description) {
    toast.error(result.message, { description: result.description });
  } else {
    toast.error(result.message);
  }
}
