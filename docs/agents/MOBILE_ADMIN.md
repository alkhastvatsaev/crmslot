# PWA admin mobile (`/m/admin`)

## Produit

- **Route** : `/m/admin` — inbox + missions du jour (carte lite, pas Mapbox WebGL par défaut).
- **Desktop** : `/` inchangé (9 hubs carrousel).
- **Échappatoire** : `/?fullCrm=1` sur mobile pour le CRM complet.
- **Redirect** : compte CRM tenant + mobile + PWA web → `/m/admin` (`src/app/page.tsx`).

## Architecture

| Fichier                       | Rôle                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `AdminMobileProviders.tsx`    | Pager 1 page, inbox intent — **sans** ChatbotProvider ni bridges agent |
| `AdminMobileApp.tsx`          | Shell + `MobileMapHubLite`                                             |
| `AdminMobileShell.tsx`        | Chrome header/footer (calqué terrain)                                  |
| `adminMobileShellContract.ts` | Invariants verrouillés par `npm run test:mobile-admin`                 |

## Perf `/` (utilisateurs full CRM)

- **B** : `mobileMapWebGL` défaut `false` → `MobileMapHubLite` dans `MapPageSlot`.
- **C** : `useMobileMountedPageIndices` — max 3 hubs, TTL 5 min (LRU).
- **D** : `PwaStaleBundleGuard` + `PwaUpdateBanner` i18n avant reload.

## Offline (phase 2)

- Liste inbox : `adminInboxInterventionsCache` + `useBackOfficeInterventions`.
- Détail fiche ouverte : `adminInterventionDetailCache` + `useBackOfficeHubSelectedIntervention`.
- Hors scope : assignation offline, Gmail, chatbot, PDF.

## Tests

```bash
npm run test:mobile-admin   # contrat /m/admin + PWA update + caches offline
npm run test:mobile-shell   # carrousel desktop/mobile /
```

## Flags

- `mobileMapWebGL` — carte WebGL sur mobile (défaut off).
- `dispatchVoice` — footer dispatch Galaxy sur `/m/admin`.
