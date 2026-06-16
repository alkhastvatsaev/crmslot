import { CLIENT_MOBILE_APP_SLOT_INDEX } from "@/features/company/clientMobileAppConstants";

/**
 * Index pager dans la shell `/m/demande` (plus dans le carrousel admin).
 * Alias historique — préférer `CLIENT_MOBILE_APP_SLOT_INDEX`.
 */
export const COMPANY_HUB_PAGE_INDEX = CLIENT_MOBILE_APP_SLOT_INDEX;

/** Numéro de page « humain » dans l’app client (1-based). */
export const COMPANY_HUB_CAROUSEL_HUMAN_INDEX = 1;

/**
 * Nom du rail gauche du hub société (`SmartInterventionRequestForm`).
 * Préférer ce libellé à « page 2, panneau gauche ».
 */
export const COMPANY_HUB_RAIL_DEMANDE_LABEL = "Demande express" as const;
