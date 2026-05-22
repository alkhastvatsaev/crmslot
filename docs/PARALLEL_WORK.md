# Travail parallèle Cursor + Claude Code

Un seul clone Git, deux outils possibles en même temps. Ce fichier est la **source de vérité** pour qui touche quoi.

## Zones (à mettre à jour avant chaque session)

| Zone | Chemins | Propriétaire session | Branche suggérée |
|------|---------|----------------------|------------------|
| A — Chatbot | `src/features/chatbot/**`, `src/app/api/ai/chatbot/**` | _à remplir_ | `cursor/chatbot` ou `claude/chatbot` |
| B — Matériel | `src/features/featureHub/**`, `src/app/api/ai/material-agent/**` | _à remplir_ | `cursor/materiel` ou `claude/materiel` |
| C — Historique CRM | `src/features/crmHistory/**`, `src/app/api/ai/crm-history-agent/**` | _à remplir_ | `cursor/crm` ou `claude/crm` |
| D — Facturation | `src/features/billingHub/**`, `src/app/api/ai/billing-hub-agent/**` | _à remplir_ | `cursor/billing` ou `claude/billing` |
| E — Hub partagé | `src/app/page.tsx`, `src/features/dashboard/**`, `src/core/i18n/**`, `src/context/**` | **coordination obligatoire** | une seule branche |

**Règle d’or** : un fichier = un propriétaire à la fois. Si les deux outils doivent toucher le même fichier, enchaîner (pas en parallèle) ou utiliser un worktree.

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

## Repo BELGMAP

- Pas de fichiers `* 2.ts` / `* 2.tsx` (doublons macOS → supprimer).
- Tests colocalisés `__tests__/` — voir `AGENTS.md`.
- Gros diff chatbot → `npm run test:chatbot` puis `npm run test:ci`.
