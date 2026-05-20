/**
 * Index carrousel du hub hors-ligne — page NON présente dans le carrousel actuellement.
 * Index 6 (0-based, 7ᵉ page) réservé pour éviter collision avec GMAIL_HUB_SLOT_INDEX=5.
 * Réintégration : ajouter la page dans src/app/page.tsx + incrémenter pageCount à 7.
 */
export const OFFLINE_HUB_SLOT_INDEX = 6;
