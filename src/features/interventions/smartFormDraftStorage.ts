import {
  SMART_INTERVENTION_DRAFT_STORAGE_KEY,
  smartFormAddressEligibleForStep2,
} from "@/features/interventions/smartInterventionConstants";
import type { DraftPayload, WizardStep } from "@/features/interventions/smartFormTypes";

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

export function initialStepFromPayload(p: DraftPayload): WizardStep {
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
