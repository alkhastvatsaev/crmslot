/**
 * Lab technicien (`/technician`) — **archivé du carrousel** pour l’instant.
 * Réintégration (3 étapes obligatoires, dans l’ordre) :
 *   1. Réinsérer `TechnicianLabCarouselPage` dans `src/app/page.tsx` à l’index 5
 *      (avant `GmailHubPage`) et incrémenter `pageCount` à 7.
 *   2. Passer `GMAIL_HUB_SLOT_INDEX` à 6 dans `gmailHubConstants.ts`.
 *   3. Passer `OFFLINE_HUB_SLOT_INDEX` à 7 dans `offlineHubConstants.ts`.
 * ⚠  Ne pas activer `TECHNICIAN_LAB_IN_CAROUSEL = true` sans faire les 3 étapes :
 *    Gmail et Offline seraient sur le mauvais index.
 */
export const TECHNICIAN_LAB_IN_CAROUSEL = false;

/** Index 0-based quand la page est dans le carrousel (sinon ignoré). */
export const TECHNICIAN_LAB_SLOT_INDEX = 5;
