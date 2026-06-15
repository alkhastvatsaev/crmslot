export type ClientRecord = {
  id: string;
  companyId: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Opt-in notifications email transactionnelles (par défaut true). */
  emailNotifications?: boolean | null;
  /** Token unsubscribe RGPD — généré à la première notif si absent. */
  unsubscribeToken?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SiteRecord = {
  id: string;
  companyId: string;
  clientId: string;
  label: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | null;
};
