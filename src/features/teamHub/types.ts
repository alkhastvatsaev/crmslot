export type CompanyStaffRole = "admin" | "collaborateur";

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
};
