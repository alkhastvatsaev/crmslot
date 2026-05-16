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
npm run ci                # lint + typecheck + tests + build (recommandé avant merge)
npm run ci:all            # ci + Playwright E2E
npm run lint:ci           # ESLint (erreurs bloquantes sur src/)
npm run test:ci           # typecheck + coverage
npm run test:e2e          # Playwright (carte + navigation carrousel)
npx playwright install    # une fois, avant les E2E en local
npm run lint              # rapport complet (avertissements inclus)
```

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
