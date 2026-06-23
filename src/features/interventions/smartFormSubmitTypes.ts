export type SmartFormAudioRecorderApi = {
  audioBlob: Blob | null;
  transcription: string;
  transcriptionPromise: () => Promise<string> | null;
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
