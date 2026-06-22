# dashboard

Shell admin CRMSLOT : carrousel 9 pages (`src/app/page.tsx`), layout desktop/mobile, pager et providers.

## Points d'entrée

| Fichier                                    | Rôle                                            |
| ------------------------------------------ | ----------------------------------------------- |
| `AdminDashboardProviders.tsx`              | Providers admin (auth, pager, chatbot, intents) |
| `dashboardPagerContext.tsx`                | `DashboardPagerProvider`, `setPageIndex`        |
| `dashboardCarouselRegistry.ts`             | Ordre / labels carrousel (9 slots)              |
| `components/DashboardPager.tsx`            | Carrousel horizontal desktop                    |
| `components/DashboardDesktopShell.tsx`     | Layout 3 colonnes + spotlight                   |
| `components/MobileShell.tsx`               | Shell mobile                                    |
| `components/AdaptiveTriplePanelLayout.tsx` | Layout 3 panneaux hubs                          |
| `hooks/useIsMobile.ts`                     | Détection mobile                                |

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
npm run test:mobile-shell
npx jest src/features/dashboard --no-coverage
```
