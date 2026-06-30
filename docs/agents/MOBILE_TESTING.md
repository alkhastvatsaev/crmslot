# Tests mobile (PWA + Capacitor)

Guide agent pour Android / iPhone — shell admin, apps satellites et bridges natifs.

Référence complémentaire : [`TESTING.md`](TESTING.md) (pyramide globale) · [`MOBILE_ADMIN.md`](MOBILE_ADMIN.md) · [`MOBILE_DESKTOP_PANELS.md`](MOBILE_DESKTOP_PANELS.md)

---

## Apps et routes

| Route           | App                 | Manifest                      | testId racine           |
| --------------- | ------------------- | ----------------------------- | ----------------------- |
| `/` (phone UA)  | CRM admin carrousel | `/manifest.json`              | `mobile-shell`          |
| `/m/admin`      | Inbox admin lite    | `/manifest-admin-mobile.json` | `admin-mobile-app`      |
| `/m/technician` | Terrain technicien  | `/manifest-technician.json`   | `technician-mobile-app` |
| `/m/demande`    | Portail client      | `/manifest-demande.json`      | (hub client)            |

Override dev : `?forceMobile=1` · desktop forcé : `?fullCrm=1`

---

## Commandes

| Action                        | Commande                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| **Tout le mobile (unit)**     | `npm run test:mobile`                                                                         |
| Infra (détection, config API) | `npm run test:mobile-infra`                                                                   |
| Shell carrousel `/`           | `npm run test:mobile-shell`                                                                   |
| Admin `/m/admin` + offline    | `npm run test:mobile-admin`                                                                   |
| Capacitor bridges             | `npm run test:native-infra`                                                                   |
| E2E smoke PWA                 | `npm run test:e2e:mobile`                                                                     |
| E2E apps satellites           | `npm run test:e2e:satellite-apps`                                                             |
| Un fichier                    | `npx jest src/features/dashboard/components/__tests__/MobileHubLayout.test.tsx --no-coverage` |

## Helpers test (`src/test-utils/`)

| Module                  | Usage                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `renderMobileShell.tsx` | `renderMobileShell(pages, { initialSelectorOpen?, initialPageIndex? })` — pile providers `MobileShell` |
| `mobileGestures.ts`     | `swipeLeft(el, clientY?)` · `swipeRight(el, clientY?)` — pointer events pour rails hub/header          |

Les mocks (`useCrmStaffAccountPanel`, `useMobileFooterGalaxyVisible`, Mapbox) restent **dans chaque fichier test** — pas dans le helper.

---

## Contrats source (anti-régression structurelle)

Deux fichiers verrouillent les invariants par **sniffing de code** + tests RTL :

| Contrat               | Fichier                                              | Commande                    |
| --------------------- | ---------------------------------------------------- | --------------------------- |
| Shell admin `/`       | `src/features/dashboard/mobileShellContract.ts`      | `npm run test:mobile-shell` |
| Admin lite `/m/admin` | `src/features/dashboard/adminMobileShellContract.ts` | `npm run test:mobile-admin` |

### Règles agent

1. **Fichier dans `guardedSourceSnippets`** → lancer la commande contrat correspondante.
2. **Nouveau `data-testid` mobile** → l'ajouter dans `MOBILE_SHELL_CONTRACT.testIds` ou `ADMIN_MOBILE_SHELL_CONTRACT.testIds`.
3. **Nouvelle classe CSS mobile** → l'ajouter aux snippets `dashboard-mobile-layout.css` du contrat.
4. **Hook Firestore / API** → règles CODEX mobile ([`TESTING.md` § Phase 11](TESTING.md)) : test avec `firebaseUid = null / "anon"`.
5. **Ne pas dupliquer** la logique métier en E2E : le détail reste en Jest.

---

## Matrice fichier modifié → tests

| Zone modifiée                                                                                       | Commande obligatoire        |
| --------------------------------------------------------------------------------------------------- | --------------------------- |
| `mobileShellContract.ts`, `MobileShell*`, `MobileScreenHost`, `page.tsx`, `AdminDashboardProviders` | `npm run test:mobile-shell` |
| `MobileHubLayout`, `MobileHeaderRailLayout`, `AdaptiveTriplePanelLayout`                            | `npm run test:mobile-shell` |
| `adminMobileShellContract.ts`, `AdminMobile*`, `/m/admin`                                           | `npm run test:mobile-admin` |
| `mobileClientDetection`, `mobileAccess`, `src/features/mobile/`                                     | `npm run test:mobile-infra` |
| `src/core/native/*`                                                                                 | `npm run test:native-infra` |
| Manifest PWA, routes `/m/*`                                                                         | `npm run test:e2e:mobile`   |
| Merge sensible (shell + hub)                                                                        | `npm run test:mobile`       |

---

## Pyramide mobile

```
L1  Pure functions     mobileClientDetection, dashboardMobileLayout, mobileHubRailMotion
L2  Composants RTL     MobileHubLayout (swipe), MobileHeaderRailLayout, MobileShell
L3  Contrats source    mobileShellContract, adminMobileShellContract
L4  E2E Playwright     iPhone 13 (admin), Pixel 7 (terrain) — smoke uniquement
```

**Seuils coverage P0** (dans `jest.config.ts`) : `dashboardMobileLayout.ts`, `mobileShellContract.ts` à 100 %.

---

## testIds canoniques (shell `/`)

Source : `MOBILE_SHELL_CONTRACT.testIds`

| testId                      | Rôle                     |
| --------------------------- | ------------------------ |
| `mobile-shell`              | Racine shell             |
| `mobile-top-bar`            | Bandeau profil           |
| `admin-mobile-profile-chip` | Chip compte              |
| `mobile-screen-host`        | Zone pages carrousel     |
| `dashboard-page-selector`   | Grille sélection hub     |
| `dashboard-account-panel`   | Panneau compte           |
| `mobile-shell-galaxy`       | Dock chatbot             |
| `clock-calendar-toggle`     | Ouvre sélecteur de pages |

---

## Composants shell couverts (Phase 3)

Tests dédiés dans `src/features/dashboard/components/__tests__/` :

| Composant                  | Fichier test                         |
| -------------------------- | ------------------------------------ |
| `MobileShellFooterDockRow` | calendrier vs galaxy dock            |
| `MobileShellSlotGrid`      | grille 3 colonnes                    |
| `MobileCentralPanelFrame`  | chrome `panel-glass`                 |
| `MobileProfileTopBar`      | rail profil + testIds contrat        |
| `AdminMobileProfileChip`   | toggle compte · état `ready`         |
| `MobileNavDrawer`          | navigation pager · Escape · backdrop |

Composants encore sans test isolé (couverture parent/contrat) : `AdminMobileShell`, `MobileShellFooterDock`, `MobileNavDrawer` non monté en prod pour l’instant.

---

## E2E Playwright (Phase 4)

| Commande                        | Rôle                                                      |
| ------------------------------- | --------------------------------------------------------- |
| `npm run test:e2e:mobile-shell` | Spec `mobile-shell.spec.ts` (viewport Pixel 7 / Chromium) |
| `npm run test:e2e:mobile`       | Shell + API config + pwa-registry                         |

**Infra (CI, sans session)** : manifests PWA, routes satellites, smoke login ou shell.

**UX (session requise)** : sélecteur de pages, panneau compte, swipe hub carte — skippés sans auth.

```bash
# Générer une session staff (une fois)
npx playwright codegen --save-storage=tests/e2e/.auth/admin.json http://localhost:3000

# Lancer les tests UX mobile
PLAYWRIGHT_ADMIN_STORAGE_STATE=tests/e2e/.auth/admin.json npm run test:e2e:mobile-shell
```

Helper : `tests/e2e/helpers/mobileShell.ts` (`gotoMobileShellOrSkip`, `dispatchHorizontalSwipe`).

---

## CI

| Workflow           | Déclencheur                                        | Commande locale                                   |
| ------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `mobile-tests.yml` | PR chemins mobile (dashboard, mobile, native, e2e) | `npm run test:mobile` + `npm run test:e2e:mobile` |
| `e2e.yml`          | PR `main`                                          | Playwright complet                                |

`workflow_dispatch` disponible sur `mobile-tests.yml` pour un check manuel.

---

## Capacitor (Android / iOS)

- Tests **unitaires** avec mocks `@capacitor/*` dans `src/core/native/__tests__/`.
- Pas de farm device en CI — validation manuelle : `npm run cap:install:android:debug`.
