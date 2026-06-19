# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

CRMSLOT. Plan mode gros diff. @fichier:ligne. Tests → AGENTS.md si besoin.

## Travail parallèle avec Cursor

Si l’utilisateur a aussi **Cursor / l’Agent** ouvert sur ce repo :

1. Lire **`docs/PARALLEL_WORK.md`** — zones, propriétaire de session, branche.
2. Ne modifier que les chemins de **ta** zone ; un fichier = un outil à la fois.
3. Branche conseillée : `claude/<sujet>` (pas `cursor/*`, pas force-push sur `main`).
4. Début de session : `git status` + annoncer les dossiers visés.
5. Pas de `git add .` ; commit seulement si l’utilisateur le demande.
6. Hub partagé (`src/app/page.tsx`, `src/context/**`, i18n) → coordination obligatoire.

Worktree pour deux clones physiques : voir PARALLEL_WORK.md. Perf Cursor : **`docs/CURSOR_WORKFLOW.md`**.

## Commands

```bash
npm run dev              # Next.js dev server (webpack)
npm run dev:pwa          # Dev avec PWA activée
npm run build            # Build production
npm run typecheck        # tsc --noEmit (avec prune-next-type-duplicates en pre)
npm run lint:ci          # ESLint src/ tests/ jest.setup.ts scripts/
npm run test             # Jest (sans coverage)
npm run test:coverage    # Jest avec coverage — seuils par jest.config.ts
npm run test:ci          # typecheck + test:coverage (à lancer avant tout merge)
npx jest <path-or-pattern> --no-coverage  # Un seul fichier / pattern
npm run test:e2e         # Playwright (tests/e2e/)
npm run ci               # lint:ci + test:ci + build (pipeline complet)
```

## Architecture

### Structure principale

- `src/app/` — pages Next.js App Router + `api/` route handlers
- `src/features/` — modules métier (map, interventions, chatbot, billing, catalog…)
- `src/core/` — config Firebase, helpers API, i18n, feature flags, UI partagée
- `src/context/` — React Contexts (CompanyWorkspace, Date, OfflineSync, TechnicianIntent…)
- `src/test-utils/` — `render.tsx` (renderWithProviders), `mockState.ts`, `renderWithPager.tsx`
- `tests/e2e/` — Playwright

### Carrousel de pages (DashboardPager)

L'app principale (`/`) est un carrousel horizontal piloté par `DashboardPagerProvider`. Chaque "slot" est un index constant défini dans un fichier `*Constants.ts` du feature concerné. Les pages sont assemblées dans `src/app/page.tsx`.

**7 pages actuelles (0-based)** :
| Index | Constante | Feature |
|-------|-----------|---------|
| 0 | — | Carte (MapboxView) |
| 1 | — | Espace société |
| 2 | `TECHNICIAN_HUB_SLOT_INDEX` | Hub technicien |
| 3 | `GMAIL_HUB_SLOT_INDEX` | Gmail |
| 4 | `FEATURE_HUB_SLOT_INDEX` | Matériel entreprise |
| 5 | `CRM_HISTORY_SLOT_INDEX` | Historique CRM |
| 6 | `BILLING_HUB_SLOT_INDEX` | Facturation |

**Navigation inter-pages** : `pager.setPageIndex(N)` via `useDashboardPagerOptional()`. Pour pré-remplir le Chatbot depuis une autre page, dispatch les événements DOM `chatbot-draft-prompt` (pre-fill composer) ou `chatbot-quick-prompt` (envoi direct) — écoutés dans `ChatbotGalaxyComposer`. Pattern centralisé dans `src/features/featureHub/companyStockChatbot.ts`.

**Intent contexts** (communication inter-pages) : chaque feature qui doit envoyer un focus/prompt au Chatbot ou à une autre page utilise un context léger dans `src/context/` (ex. `CompanyStockIntentContext`, `BackofficeInboxIntentContext`, `TechnicianCaseIntentContext`). Tous wrappés dans `src/app/page.tsx`.

### Auth & API routes

- **Client → API** : `fetchWithAuth` (`src/core/api/fetchWithAuth.ts`) injecte le token Firebase Bearer.
- **API routes** : `requireAuthenticatedUser` de `src/core/api/routeAuth.ts` vérifie le token via Firebase Admin. Toutes les routes sensibles exigent ce guard sauf exceptions documentées dans README.
- Routes API : `export const runtime = "nodejs"` obligatoire (pas edge).

### Firebase

- **Client** : `src/core/config/firebase.ts` — Firestore avec `experimentalForceLongPolling` (Vercel/Node), Auth, Storage. RTDB optionnelle via `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.
- **Admin** : `src/core/config/firebase-admin.ts` — initialisé une seule fois, importé en tête de chaque route API qui en a besoin.
- **Collections principales** : `interventions`, `clients`, `companies`, `stockItems`, `material_orders`, `companies/{id}/supplierOrders`, `companies/{id}/featureFlags`.
- **Sous-collections** : `interventions/{id}/timeline` (événements CRM), `companies/{id}/supplierOrders`.
- Jamais de fichiers `* 2.ts` / `* 2.tsx` — signe de doublon macOS à supprimer immédiatement.

### Chatbot (OpenAI + outils Firebase Admin)

Pipeline SSE : `POST /api/ai/chatbot` → `runChatbotOpenAI` → stream d'événements `ChatbotStreamEvent`.

- **Outils** : définis dans `chatbot-tools.ts` (schema JSON Schema), exécutés serveur dans `chatbot-tool-executor.ts` via `executeChatbotTool`.
- **Outils d'écriture** (`CHATBOT_WRITE_TOOLS`) : requièrent `userConfirmed: true` — vérification via `requireConfirmed()`.
- **Lecot** : `search_lecot_products` → `chatbot-lecot.ts` → `catalog/lecotApiSearch.ts` (API si `LECOT_API_URL` configuré, sinon catalogue local `lecotCatalog.ts`). `order_lecot_parts` → crée un doc `supplierOrders` + optionnellement `material_orders`, puis tente `submitLecotSupplierOrder`.
- **Documents/PDF** : générés côté PWA (jsPDF). Le chatbot appelle uniquement `focus_intervention_document` ou `patch_intervention_billing` — jamais de génération PDF serveur.
- **Outils zero-token** (`isChatbotZeroTokenUiTool`) : court-circuitent OpenAI, exécutés directement puis SSE.
- Pour ajouter un outil : (1) déclarer dans `chatbot-tools.ts`, (2) ajouter le case dans `chatbot-tool-executor.ts`, (3) si write → ajouter dans `CHATBOT_WRITE_TOOLS`, (4) mettre à jour `TOOL_LABELS` dans `chatbot-openai.ts`, (5) documenter dans le system prompt.

### Feature flags

`src/core/featureFlags.ts` — flags `NEXT_PUBLIC_FF_*` (build-time) surchargeables par Firestore `companies/{id}/featureFlags`. `lecotProductSearch` et `supplierPortal` concernent Lecot.

### Tests

Règles complètes dans `AGENTS.md`. Points essentiels :

- Tests Jest colocalisés dans `__tests__/` à côté du fichier source.
- Utiliser `render` de `src/test-utils/render.tsx` (alias `renderWithProviders`).
- `renderWithPager` uniquement si le composant dépend de `DashboardPagerProvider`.
- Mocks globaux (Firebase, Mapbox, Framer Motion) dans `jest.setup.ts` — ne pas les dupliquer.
- Seuils P0 à 100 % : `assignInterventionToTechnician.ts`, `mapTechnicianMissions.ts`, `dashboardDesktopLayout.ts`.
- `npx jest <pattern> --no-coverage` pour itérer rapidement sur un seul fichier.
