import type { Intervention } from "@/features/interventions/types";

export type UseTechnicianAssignmentsResult = {
  interventions: Intervention[];
  loading: boolean;
  error: string | null;
  firebaseUid: string | null;
};

export type UseTechnicianAssignmentsOptions = {
  /** Désactiver l’écoute Firestore (ex. carte dispatch qui utilise le back-office). */
  enabled?: boolean;
};
