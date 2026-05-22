import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import { TECHNICIAN_HUB_SLOT_INDEX } from "@/features/interventions/technicianDashboardConstants";

/** Rôle affiché sous le nom dans le header (clé i18n `profiles.roles.*`). */
export type DashboardCarouselRoleKey = "back_office" | "client" | "technician" | "admin";

export type DashboardCarouselPageDef = {
  /** Index pager (doit égaler la position dans `dashboardPages` / `page.tsx`). */
  slotIndex: number;
  profileName: string;
  profileRoleKey: DashboardCarouselRoleKey;
  /** Clé i18n `spotlight.*` pour la recherche rapide. */
  spotlightLabelKey:
    | "spotlight.nav_map"
    | "spotlight.nav_company"
    | "spotlight.nav_technician"
    | "spotlight.nav_gmail"
    | "spotlight.nav_feature_hub"
    | "spotlight.nav_crm_history"
    | "spotlight.nav_billing_hub";
  guideTitle: string;
  guideHint: string;
};

/**
 * Source unique — ordre = carrousel `src/app/page.tsx` (7 pages, sans Chatbot).
 * Toute entrée UI (header IVANA/GMAIL/…, spotlight, aide page) doit s’y caler.
 */
export const DASHBOARD_CAROUSEL_PAGES: readonly DashboardCarouselPageDef[] = [
  {
    slotIndex: 0,
    profileName: "IVANA",
    profileRoleKey: "back_office",
    spotlightLabelKey: "spotlight.nav_map",
    guideTitle: "Carte",
    guideHint: "Galaxy, audio, recherche — vue opérationnelle principale.",
  },
  {
    slotIndex: 1,
    profileName: "SOCIÉTÉ BX",
    profileRoleKey: "client",
    spotlightLabelKey: "spotlight.nav_company",
    guideTitle: "Espace société",
    guideHint: "Demandeur, organisation et portail client.",
  },
  {
    slotIndex: 2,
    profileName: "MANSOUR",
    profileRoleKey: "technician",
    spotlightLabelKey: "spotlight.nav_technician",
    guideTitle: "Technicien",
    guideHint: "Missions, hors-ligne, clôture et notifications terrain.",
  },
  {
    slotIndex: 3,
    profileName: "GMAIL",
    profileRoleKey: "back_office",
    spotlightLabelKey: "spotlight.nav_gmail",
    guideTitle: "Gmail",
    guideHint: "Boîte mail PWA et pièces jointes.",
  },
  {
    slotIndex: 4,
    profileName: "MATÉRIEL",
    profileRoleKey: "admin",
    spotlightLabelKey: "spotlight.nav_feature_hub",
    guideTitle: "Matériel",
    guideHint: "Stock, commandes Lecot et agent matériel.",
  },
  {
    slotIndex: 5,
    profileName: "HISTORIQUE",
    profileRoleKey: "admin",
    spotlightLabelKey: "spotlight.nav_crm_history",
    guideTitle: "CRM",
    guideHint: "Fil d’activité et agent historique.",
  },
  {
    slotIndex: 6,
    profileName: "FACTURATION",
    profileRoleKey: "back_office",
    spotlightLabelKey: "spotlight.nav_billing_hub",
    guideTitle: "Facturation",
    guideHint: "Factures, impayés, documents et agent facturation.",
  },
] as const;

export const DASHBOARD_CAROUSEL_PAGE_COUNT = DASHBOARD_CAROUSEL_PAGES.length;

/** Vérifie que les constantes hub correspondent aux indices du registre. */
export function assertDashboardCarouselSlotAlignment(): void {
  const expected = [
    0,
    1,
    TECHNICIAN_HUB_SLOT_INDEX,
    GMAIL_HUB_SLOT_INDEX,
    FEATURE_HUB_SLOT_INDEX,
    CRM_HISTORY_SLOT_INDEX,
    BILLING_HUB_SLOT_INDEX,
  ];
  DASHBOARD_CAROUSEL_PAGES.forEach((page, i) => {
    if (page.slotIndex !== i) {
      throw new Error(
        `[dashboardCarouselRegistry] page ${i} slotIndex=${page.slotIndex} (attendu ${i})`,
      );
    }
    if (page.slotIndex !== expected[i]) {
      throw new Error(
        `[dashboardCarouselRegistry] constante hub désalignée à l’index ${i}: slot=${page.slotIndex} expected=${expected[i]}`,
      );
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  assertDashboardCarouselSlotAlignment();
}

export function getDashboardCarouselPage(
  pageIndex: number,
): DashboardCarouselPageDef | null {
  if (pageIndex < 0 || pageIndex >= DASHBOARD_CAROUSEL_PAGE_COUNT) return null;
  return DASHBOARD_CAROUSEL_PAGES[pageIndex] ?? null;
}

export function clampDashboardCarouselPageIndex(pageIndex: number, pageCount: number): number {
  const max = Math.min(DASHBOARD_CAROUSEL_PAGE_COUNT, Math.max(1, pageCount)) - 1;
  return Math.min(Math.max(0, pageIndex), max);
}
