export interface Technician {
  id: string;
  name: string;
  initial: string;
  vehicle: string;
  status: "available" | "en_route" | "on_site";
  location: {
    lat: number;
    lng: number;
  };
  /** UID Firebase Auth pour `assignedTechnicianUid` (sinon repli back-office). */
  authUid?: string;
  realEta?: string;
  /** Compétences du technicien (Phase 13). */
  skills?: string[] | null;
  companyId?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  /** `false` = masqué du picker assignation (désactivé par l'admin). */
  active?: boolean;
}
