# Travail parallèle Cursor + Claude Code

Un seul clone Git, deux outils possibles en même temps. Ce fichier est la **source de vérité** pour qui touche quoi.

## Zones (à mettre à jour avant chaque session)

| Zone                     | Chemins                                                                                                        | Propriétaire session | Branche suggérée                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| A — Chatbot              | `src/features/chatbot/**`, `src/app/api/ai/chatbot/**`                                                         | _à remplir_          | `cursor/chatbot` ou `claude/chatbot`   |
| B — Matériel             | `src/features/featureHub/**`, `src/app/api/ai/material-agent/**`                                               | _à remplir_          | `cursor/materiel` ou `claude/materiel` |
| C — Historique CRM       | `src/features/crmHistory/**`, `src/app/api/ai/crm-history-agent/**`                                            | _à remplir_          | `cursor/crm` ou `claude/crm`           |
| D — Facturation          | `src/features/billingHub/**`, `src/app/api/ai/billing-hub-agent/**`                                            | _à remplir_          | `cursor/billing` ou `claude/billing`   |
| E — Hub partagé          | `src/app/page.tsx` (switch mobile/desktop uniquement), `src/context/**`                                        | _coordination_       | `cursor/mobile-corrections`            |
| **F-UI — Mobile shell**  | `dashboard-mobile-layout.css`, `Mobile*.tsx`, `UserProfile`, `AdaptiveTriplePanelLayout`, hubs (layout mobile) | **Claude Code**      | `cursor/mobile-corrections`            |
| **F-infra — Mobile app** | `useIsMobile`, `mobileAccess.ts`, `DesktopOnlyGate`, PWA/manifest, ngrok, tests E2E mobile                     | **Cursor**           | `cursor/mobile-corrections`            |

**Règle d’or** : un fichier = un propriétaire à la fois. Si les deux outils doivent toucher le même fichier, enchaîner (pas en parallèle) ou utiliser un worktree.

---

## Split mobile — juin 2026 (actif)

**Claude Code** = tout ce que l’utilisateur voit : header, drawer, tab bar, segments, CSS, spacing, couleurs.

**Cursor** = couche « app mobile » invisible :

| Sujet                             | Fichiers typiques                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Détection mobile / bypass desktop | `useIsMobile.ts`, `mobileAccess.ts`, `DesktopOnlyGate.tsx` (+ bootstrap **`GET /api/mobile/config`**)                                                             |
| PWA & iPhone                      | `manifest.json`, `layout.tsx` (viewport), `public/sw.js` (si prod)                                                                                                |
| Dev iPhone / ngrok                | `next.config.ts`, `DevServiceWorkerCleanup.tsx`, `.env.example`                                                                                                   |
| Tests infra                       | `useIsMobile` hook test, `mobileAccess` test, E2E `?forceMobile=1`, **`GET /api/mobile/config`**, **`GET /api/companies/:id/pwa-registry`** (auth + admin loader) |
| i18n                              | **Ne pas toucher** sauf clés demandées par Claude                                                                                                                 |

**Interdit en parallèle** : modifier le même fichier F-UI (ex. `MobileTopBar.tsx` = Claude uniquement tant que session UI ouverte).

### Test iPhone / ngrok (infra — inchangé)

```bash
# Dev (Cursor a peut-être déjà lancé — un seul npm run dev :3000)
NGROK_DEV_ORIGIN=<ton-domaine>.ngrok-free.dev NEXT_PUBLIC_ALLOW_MOBILE=true npm run dev

ngrok http 3000
```

- Badge rouge **「N Issues」** = overlay Next.js **dev** (normal via ngrok).
- PWA : supprimer icône écran d’accueil + ré-ajouter après changement manifest.
- Wi‑Fi local possible sans ngrok.

### Tests avant merge

```bash
npm run test:mobile-infra
npm run test:mobile-shell        # profil · sélecteur · panneau central · galaxy
npm run test:e2e:mobile        # shell iPhone + API smoke (port 3000)
npm run test:e2e:desktop-gate    # gate prod-like build+start port 3001 (~3 min)
npm run test:ci           # avant merge main
```

---

## Avant de coder (les deux outils)

```bash
git status
git branch --show-current
```

- Ne pas lancer `git add .` / `git add -A`.
- Ne pas `commit` / `push` sans demande explicite (sauf convention d’équipe convenue).
- Un seul `npm run dev` sur le port 3000.

## Branches

```bash
# Exemple Claude Code (terminal)
git checkout -b claude/nom-tache

# Exemple Cursor (Agent)
git checkout -b cursor/nom-tache
```

Avant merge : `npm run test:ci` (ou `npm run test:chatbot` si zone chatbot).

## Worktree (vrai parallèle, deux dossiers)

```bash
cd /chemin/vers/testbelgium
git worktree add ../testbelgium-claude claude/work
# Cursor  → testbelgium (branche A)
# Claude  → testbelgium-claude (branche B)
```

Suppression après usage : `git worktree remove ../testbelgium-claude`

## Fin de session

1. `git status` + `git diff` — rien d’inattendu hors zone ?
2. Commit sur **ta** branche uniquement.
3. Mettre à jour le tableau « Propriétaire session » ci-dessus (ou le vider).

## Repo CRMSLOT

- Pas de fichiers `* 2.ts` / `* 2.tsx` (doublons macOS → supprimer).
- Tests colocalisés `__tests__/` — voir `AGENTS.md`.
- Gros diff chatbot → `npm run test:chatbot` puis `npm run test:ci`.
