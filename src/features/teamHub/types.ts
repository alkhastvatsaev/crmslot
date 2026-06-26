export type CompanyStaffRole = "admin" | "collaborateur";

/** Rôle métier choisi à l'ajout d'un employé. */
export type CompanyStaffKind = "dirigeant" | "dispatcher" | "technician";

export type CompanyStaffMember = {
  uid: string;
  role: CompanyStaffRole;
  email: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  hasTechnicianProfile: boolean;
  active: boolean;
  authUid: string | null;
  vehicle?: string;
};

export type CompanyStaffUpdateInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  vehicle?: string;
  staffKind?: CompanyStaffKind;
};

export type CreateCompanyStaffInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  staffKind: CompanyStaffKind;
};

export type CreateCompanyStaffResult =
  | {
      ok: true;
      mode: "member";
      uid: string;
      created: boolean;
      alreadyMember: boolean;
      passwordResetLink?: string;
    }
  | { ok: true; mode: "invite"; inviteId: string }
  | { ok: false; status: number; error: string };
