# MAP BELGIQUE - Dashboard Intelligent de Gestion d'Interventions

Ce projet est une application Next.js premium dédiée à la gestion d'interventions techniques (serrurerie, etc.) à Bruxelles. Elle propose une interface fluide sous forme de carrousel permettant de basculer entre la vue cartographique, le hub société et le hub technicien.

## Fonctionnalités clés

- **Carte interactive (Mapbox)** : visualisation en temps réel des interventions, filtrage par date et accès rapide aux dossiers.
- **Hub société** : formulaire intelligent avec dictée vocale, géocodage inverse et portail client pour le suivi en direct.
- **Hub technicien** : gestion des missions assignées, capture de photos avant/après et signature électronique.
- **Mode hors-ligne (PWA)** : synchronisation automatique des données lors du retour de la connexion.
- **Multilingue** : français, néerlandais et anglais.

## Tech stack

- **Framework** : Next.js 16 (App Router, webpack)
- **UI** : React 19, Tailwind CSS v4, Framer Motion, shadcn (base-nova)
- **Backend** : Firebase (Firestore, Auth, Storage)
- **Cartographie** : Mapbox GL JS
- **Data** : React Context et TanStack Query (persistance offline technicien)

## Installation

1. Cloner le dépôt.
2. Installer les dépendances : `npm install`
3. Copier `.env.example` vers `.env.local` et renseigner les variables.
4. Lancer le dev : `npm run dev` (PWA en dev : `npm run dev:pwa`)

## Tests

```bash
npm run release:check       # .env (staging) + ci + E2E — avant merge
npm run release:check:prod  # idem tier production
npm run verify:env          # variables manquantes
npm run smoke:url https://votre-app.vercel.app

npm run ci                  # lint + typecheck + tests + build
npm run ci:all              # ci + Playwright E2E
npx playwright install      # une fois, avant les E2E en local
```

**GitHub Actions** : `test.yml` + `e2e.yml` sur chaque PR ; `release.yml` sur `main` (qualité + E2E, déploiement Vercel manuel via _Run workflow_). Secrets : `VERCEL_*`, `PRODUCTION_URL` (smoke hebdo).

**Premier déploiement** : guide détaillé → [docs/ops/SETUP_VERCEL_GITHUB.md](docs/ops/SETUP_VERCEL_GITHUB.md)

## Documentation

Index complet → [**docs/README.md**](docs/README.md)

### Référence stratégique

| Document                                                                                 | Contenu                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| [docs/reference/PLAN_STRATEGIQUE.md](docs/reference/PLAN_STRATEGIQUE.md)                 | Phases 0–6, ordre d’exécution, commandes   |
| [docs/reference/CHANTIERS_COMPLEXES.md](docs/reference/CHANTIERS_COMPLEXES.md)           | Analyse des gros chantiers techniques      |
| [docs/ops/CHECKLIST_PRODUCTION.md](docs/ops/CHECKLIST_PRODUCTION.md)                     | Cases à cocher avant mise en prod          |
| [docs/ops/FIRESTORE_PRODUCTION_MIGRATION.md](docs/ops/FIRESTORE_PRODUCTION_MIGRATION.md) | Durcissement des rules Firestore           |
| [docs/reference/TRAVAIL_AUTONOME.md](docs/reference/TRAVAIL_AUTONOME.md)                 | Sessions longues / agent sans clic         |
| [docs/ops/TECHNICIENS_AUTH_UID.md](docs/ops/TECHNICIENS_AUTH_UID.md)                     | Lier techniciens Firestore ↔ Firebase Auth |

Voir `AGENTS.md` pour les règles de tests (colocation, `data-testid`, modules P0).

## Sécurité API

Les routes `/api/*` sensibles exigent un jeton Firebase (`Authorization: Bearer`). Exceptions documentées :

- `GET /api/health` — sonde publique
- `GET|POST /api/ai/audio-dispatch` — MacroDroid (secret `AUDIO_DISPATCH_SECRET` en production)
- `POST /api/ai/process-uploads` — secret, jeton ou IP bureau
- `/api/webhooks/twilio/*` — callbacks Twilio
- `/api/demo/*` — désactivé en production

## Structure

- `src/features` — modules métier (map, interventions, auth, backoffice…)
- `src/core` — config Firebase, i18n, helpers API (`src/core/api/routeAuth.ts`)
- `src/app` — pages et routes API Next
- `tests/e2e` — Playwright

## Page prototype

`/technician` est un laboratoire UI (AR, paiement) distinct du hub technicien du carrousel principal (`/`).
