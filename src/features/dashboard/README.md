# dashboard

Shell admin CRMSLOT : carrousel 9 pages (`src/app/page.tsx`), layout desktop/mobile, pager et providers.

## Points d'entrée

| Fichier                                    | Rôle                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| \`index.ts\`                               | **Barrel public** — imports cross-feature via \`@/features/dashboard\` |
| `AdminDashboardProviders.tsx`              | Providers admin (auth, pager, chatbot, intents)                        |
| `dashboardPagerContext.tsx`                | `DashboardPagerProvider`, `setPageIndex`                               |
| `dashboardCarouselRegistry.ts`             | Ordre / labels carrousel (9 slots)                                     |
| `components/DashboardPager.tsx`            | Carrousel horizontal desktop                                           |
| `components/DashboardDesktopShell.tsx`     | Layout 3 colonnes + spotlight                                          |
| `components/MobileShell.tsx`               | Shell mobile                                                           |
| `components/AdaptiveTriplePanelLayout.tsx` | Layout 3 panneaux hubs                                                 |
| `hooks/useIsMobile.ts`                     | Détection mobile                                                       |
| `hooks/useHubRailActive.ts`                | Rail hub actif — desktop = toujours true, mobile = snapshot rail       |

## Contrat mobile / desktop

- **Shell** : `LayoutShellProvider` (`mode="desktop"` | `"mobile"`) — source de vérité pour `useMobileHubLayout()`.
- **Rails hub** : toute logique `MobileHubRailContext` dans un composant partagé doit passer par `useHubRailActive()` / `useHubAnyRailActive()` (jamais `useMobileHubRailSnapshot()` seul).
- **Desktop** : `DashboardPager` garde toutes les pages montées ; `useHubPageActive` coupe les listeners Firestore hors page.
- **Mobile** : `MobileScreenHost` démonte les hubs hors écran (thermique iOS).

## Données

- Pas de collection Firestore dédiée
- Query `?initialPageIndex=N` via pager context

## Dépendances

- `auth`, `map`, `chatbot`, `billingHub`, `crmHistory`, `featureHub`, `backoffice`, `interventions`, `analytics`

## Pièges

- Ordre slots = `DASHBOARD_CAROUSEL_PAGES` **doit** matcher `page.tsx`
- Gmail slot 4 : `inCarouselNav: false`
- Redirect satellite mobile → `/m/demande` ou `/m/technician`

## Tests

```bash
npm run test:mobile
npm run test:mobile-shell
npm run test:e2e:desktop
npx jest src/features/dashboard --no-coverage
```

Voir `docs/agents/MOBILE_TESTING.md`.
