import type { Intervention } from "@/features/interventions";

/** Mission affichée sur la carte / rail « du jour » (Firestore ou création live Galaxy). */
export type Mission = {
  id: number;
  clientName: string;
  coordinates: [number, number];
  time: string;
  status: string;
  statusCode?: Intervention["status"];
  source?: "live";
  /** YYYY-MM-DD */
  date?: string;
  key?: string;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
};
