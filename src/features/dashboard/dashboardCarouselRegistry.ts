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
  /**
   * Si `false`, la page n’est pas atteignable via les flèches carrousel (header / bords).
   * Accès via Spotlight, liens métier (`setPageIndex`) ou actions rapides.
   */
  inCarouselNav?: boolean;
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
    inCarouselNav: false,
    profileName: "SOCIÉTÉ BX",
    profileRoleKey: "client",
    spotlightLabelKey: "spotlight.nav_company",
    guideTitle: "Espace société",
    guideHint: "Demandeur, organisation et portail client.",
  },
  {
    slotIndex: 2,
    inCarouselNav: false,
    profileName: "MANSOUR",
    profileRoleKey: "technician",
    spotlightLabelKey: "spotlight.nav_technician",
    guideTitle: "Technicien",
    guideHint: "Missions, hors-ligne, clôture et notifications terrain.",
  },
  {
    slotIndex: 3,
    profileName: "MATÉRIEL",
    profileRoleKey: "admin",
    spotlightLabelKey: "spotlight.nav_feature_hub",
    guideTitle: "Matériel",
    guideHint: "Stock, commandes Lecot et agent matériel.",
  },
  {
    slotIndex: 4,
    profileName: "QUALITY MANAGEMENT",
    profileRoleKey: "admin",
    spotlightLabelKey: "spotlight.nav_crm_history",
    guideTitle: "Quality Management",
    guideHint: "Fil d’activité et agent historique.",
  },
  {
    slotIndex: 5,
    profileName: "FACTURATION",
    profileRoleKey: "back_office",
    spotlightLabelKey: "spotlight.nav_billing_hub",
    guideTitle: "Facturation",
    guideHint: "Factures, impayés, documents et agent facturation.",
  },
  {
    slotIndex: 6,
    inCarouselNav: false,
    profileName: "GMAIL",
    profileRoleKey: "back_office",
    spotlightLabelKey: "spotlight.nav_gmail",
    guideTitle: "Gmail",
    guideHint: "Boîte mail PWA et pièces jointes.",
  },
] as const;

export const DASHBOARD_CAROUSEL_PAGE_COUNT = DASHBOARD_CAROUSEL_PAGES.length;

/** Indices accessibles par flèches carrousel (header + `DashboardPagerControls`). */
export const DASHBOARD_CAROUSEL_NAV_SLOT_INDICES: readonly number[] =
  DASHBOARD_CAROUSEL_PAGES.filter((page) => page.inCarouselNav !== false).map(
    (page) => page.slotIndex
  );

export function isDashboardCarouselNavSlot(pageIndex: number): boolean {
  return DASHBOARD_CAROUSEL_NAV_SLOT_INDICES.includes(pageIndex);
}

export function getNextDashboardCarouselNavIndex(pageIndex: number): number {
  for (const slot of DASHBOARD_CAROUSEL_NAV_SLOT_INDICES) {
    if (slot > pageIndex) return slot;
  }
  return (
    DASHBOARD_CAROUSEL_NAV_SLOT_INDICES[DASHBOARD_CAROUSEL_NAV_SLOT_INDICES.length - 1] ?? pageIndex
  );
}

export function getPrevDashboardCarouselNavIndex(pageIndex: number): number {
  for (let i = DASHBOARD_CAROUSEL_NAV_SLOT_INDICES.length - 1; i >= 0; i--) {
    const slot = DASHBOARD_CAROUSEL_NAV_SLOT_INDICES[i];
    if (slot !== undefined && slot < pageIndex) return slot;
  }
  return DASHBOARD_CAROUSEL_NAV_SLOT_INDICES[0] ?? pageIndex;
}

/** Pas suivant / précédent dans le carrousel (boucle sur les slots `inCarouselNav`). */
export function stepDashboardCarouselNavIndex(
  pageIndex: number,
  direction: "next" | "prev"
): number {
  const nav = DASHBOARD_CAROUSEL_NAV_SLOT_INDICES;
  if (nav.length === 0) return pageIndex;

  const pos = nav.indexOf(pageIndex);
  if (pos < 0) {
    return direction === "next"
      ? getNextDashboardCarouselNavIndex(pageIndex)
      : getPrevDashboardCarouselNavIndex(pageIndex);
  }

  if (direction === "next") {
    return nav[(pos + 1) % nav.length] ?? pageIndex;
  }
  return nav[(pos - 1 + nav.length) % nav.length] ?? pageIndex;
}

/** Vérifie que les constantes hub correspondent aux indices du registre. */
export function assertDashboardCarouselSlotAlignment(): void {
  const expected = [
    0,
    1,
    TECHNICIAN_HUB_SLOT_INDEX,
    FEATURE_HUB_SLOT_INDEX,
    CRM_HISTORY_SLOT_INDEX,
    BILLING_HUB_SLOT_INDEX,
    GMAIL_HUB_SLOT_INDEX,
  ];
  DASHBOARD_CAROUSEL_PAGES.forEach((page, i) => {
    if (page.slotIndex !== i) {
      throw new Error(
        `[dashboardCarouselRegistry] page ${i} slotIndex=${page.slotIndex} (attendu ${i})`
      );
    }
    if (page.slotIndex !== expected[i]) {
      throw new Error(
        `[dashboardCarouselRegistry] constante hub désalignée à l’index ${i}: slot=${page.slotIndex} expected=${expected[i]}`
      );
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  assertDashboardCarouselSlotAlignment();
}

export function getDashboardCarouselPage(pageIndex: number): DashboardCarouselPageDef | null {
  if (pageIndex < 0 || pageIndex >= DASHBOARD_CAROUSEL_PAGE_COUNT) return null;
  return DASHBOARD_CAROUSEL_PAGES[pageIndex] ?? null;
}

export function clampDashboardCarouselPageIndex(pageIndex: number, pageCount: number): number {
  const max = Math.min(DASHBOARD_CAROUSEL_PAGE_COUNT, Math.max(1, pageCount)) - 1;
  return Math.min(Math.max(0, pageIndex), max);
}
