export type BackOfficeInboxTab = "chat" | "requests" | "reports" | "documents";

export type BackOfficeInboxStateOptions = {
  /** Coupe Firestore inbox hors rail droit / onglet caché. */
  inboxDataActive?: boolean;
};
