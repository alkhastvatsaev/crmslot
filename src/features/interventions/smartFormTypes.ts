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
