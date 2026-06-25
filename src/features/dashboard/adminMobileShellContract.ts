/**
 * Contrat shell admin legacy (`AdminMobileShell` — tests) · `/m/admin` → redirect `/`.
 *
 *   npm run test:mobile-admin
 */
export const ADMIN_MOBILE_SHELL_CONTRACT = {
  legacyRoute: "/m/admin",
  testIds: {
    app: "admin-mobile-app",
    headerRail: "admin-mobile-header-rail",
    headerProfile: "admin-mobile-header-profile",
    footerCalendar: "admin-mobile-footer-calendar",
    footer: "admin-mobile-shell-footer",
    dock: "admin-mobile-shell-dock",
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
      "MapboxView",
      "AdminMobileOfflineBar",
      "MobileShellFooterDock",
      "MobileHubRailProvider",
    ],
    "src/features/dashboard/components/AdminMobileShell.tsx": [
      "admin-mobile-app",
      "admin-mobile-header-profile",
      "MobileShellFooterDockRow",
      "admin-mobile-shell-footer",
    ],
    "src/app/m/admin/page.tsx": ['redirect("/")'],
    "src/app/page.tsx": ["MobileShell", "isTechnicianAccount", "isClientPortalAccount"],
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
