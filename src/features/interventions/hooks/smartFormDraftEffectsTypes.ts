import type { WizardStep } from "@/features/interventions/smartFormTypes";

export type DraftFieldSetters = {
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

export type DraftEffectsArgs = DraftFieldSetters & {
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
};
