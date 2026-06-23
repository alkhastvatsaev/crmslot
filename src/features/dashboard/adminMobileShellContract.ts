/**
 * Contrat `/m/admin` — shell allégé, providers, redirect satellite.
 *
 *   npm run test:mobile-admin
 */
export const ADMIN_MOBILE_SHELL_CONTRACT = {
  route: "/m/admin",
  fullCrmQueryParam: "fullCrm",
  testIds: {
    app: "admin-mobile-app",
    headerRail: "admin-mobile-header-rail",
    headerCalendar: "admin-mobile-header-calendar",
    headerProfile: "admin-mobile-header-profile",
    footer: "admin-mobile-shell-footer",
    dock: "admin-mobile-shell-dock",
    fullCrmLink: "admin-mobile-full-crm-link",
    offlineBar: "admin-mobile-offline-bar",
    inboxLoading: "admin-mobile-inbox-loading",
  },
  guardedSourceFiles: [
    "src/features/dashboard/AdminMobileProviders.tsx",
    "src/features/dashboard/components/AdminMobileApp.tsx",
    "src/features/dashboard/components/AdminMobileShell.tsx",
    "src/app/m/admin/page.tsx",
    "src/app/page.tsx",
  ] as const,
  guardedSourceSnippets: {
    "src/features/dashboard/AdminMobileProviders.tsx": [
      "ADMIN_MOBILE_PAGE_COUNT = 1",
      "BackofficeInboxIntentProvider",
      "DashboardPagerProvider pageCount={ADMIN_MOBILE_PAGE_COUNT}",
    ],
    "src/features/dashboard/components/AdminMobileApp.tsx": [
      "MobileMapHubLite",
      "AdminMobileOfflineBar",
      "buildFullCrmMobileHref",
      "admin-mobile-full-crm-link",
    ],
    "src/features/dashboard/components/AdminMobileShell.tsx": [
      "admin-mobile-app",
      "AdminMobileProfileChip",
      "data-admin-shell-dock",
    ],
    "src/app/m/admin/page.tsx": ["AdminMobileApp"],
    "src/app/page.tsx": ["ADMIN_MOBILE_APP_ROUTE", "prefersFullCrmOnMobile", "isCrmTenantAccount"],
  } as const,
  /** Providers desktop lourds — ne doivent pas apparaître dans AdminMobileProviders. */
  forbiddenProviderSnippets: [
    "ChatbotProvider",
    "BillingHubAgentBridge",
    "CrmHistoryAgentBridge",
    "CompanyStockAgentBridge",
    "OfflineSyncProvider",
  ] as const,
} as const;
