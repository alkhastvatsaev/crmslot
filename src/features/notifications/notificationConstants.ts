import { TECHNICIAN_MOBILE_APP_SLOT_INDEX } from "@/features/interventions/technicianMobileAppConstants";

/** Panneau push — app terrain. */
export const PUSH_NOTIFICATIONS_SLOT_INDEX = TECHNICIAN_MOBILE_APP_SLOT_INDEX;

/** Paramètres d’URL pour ouverture depuis une notification Web Push. */
export const BM_TECH_CASE_PARAM = "bmTechCase";
export const BM_TECH_REMINDER_PARAM = "bmTechReminder";

/** Ouverture portail client (hub société — suivi) depuis une notification Web Push. */
export const BM_CLIENT_CASE_PARAM = "bmClientCase";

/** Ouvre l’onglet chat portail client (`/m/demande` ou hub société). */
export const BM_CLIENT_CHAT_PARAM = "bmClientChat";

/** Ouvre l’inbox carte sur l’onglet chat (message client portail). */
export const BM_BACKOFFICE_CHAT_PARAM = "bmBackofficeChat";

/** Ouvre l'inbox carte sur l'onglet Demandes (nouvelle demande client). */
export const BM_BACKOFFICE_REQUEST_PARAM = "bmBackofficeRequest";

/** Ouvre le hub Matériel depuis une push commande matériel. */
export const BM_MATERIAL_ORDER_PARAM = "bmMaterialOrder";
