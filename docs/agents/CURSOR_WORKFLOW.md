# Workflow Cursor — repo CRMSLOT

Guide pour sessions **rapides**, **peu gourmandes** et **focalisées**. Complète `docs/agents/PARALLEL_WORK.md` (qui touche quoi) et `AGENTS.md` (tests essentiels).

## Après mise à jour de `.cursorignore`

1. Redémarrer Cursor **ou** Settings → Features → Codebase indexing → **Resync index**.
2. Vérifier que l’index ne liste plus `node_modules` / `.next` (plusieurs Go économisés).

## Nettoyage disque (mensuel ou si lent)

```bash
rm -rf .next .next-e2e-gate
du -sh . node_modules .next 2>/dev/null
```

Un seul `npm run dev` sur le port 3000. Ne pas lancer `test:ci` + `dev` + plusieurs agents en parallèle sur la même machine.

## Démarrer une session Agent

**Premier message** (copier-coller et adapter) :

```text
Zone : [caseHub | chatbot | billing | mobile-infra | …]
Chemins : src/features/caseHub/**
Branche : cursor/case-hub-xxx
Tests : npm run test:patron-hubs
Ne pas toucher : i18n, page.tsx, autres hubs
```

### Références `@` utiles

| Besoin                                        | Cible                                              |
| --------------------------------------------- | -------------------------------------------------- |
| Zone & propriétaire                           | `@docs/agents/PARALLEL_WORK.md`                    |
| Tests chatbot                                 | `@docs/agents/TESTING.md`                          |
| Philosophie hubs patron                       | `@docs/agents/HUB_PAGE_PHILOSOPHY.md`              |
| Stepper / formulaires / glossaire hub société | `@docs/agents/AGENTS_EXTENDED.md`                  |
| Un composant                                  | `@src/features/caseHub/components/CaseHubPage.tsx` |

## Scripts Jest par zone (boucle rapide)

| Zone                                            | Commande                                      |
| ----------------------------------------------- | --------------------------------------------- |
| Chatbot                                         | `npm run test:chatbot`                        |
| Interventions                                   | `npm run test:interventions`                  |
| Matériel                                        | `npm run test:feature-hub`                    |
| CRM historique                                  | `npm run test:crm`                            |
| Facturation                                     | `npm run test:billing-hub`                    |
| Hubs patron (case, team, planning, commissions) | `npm run test:patron-hubs`                    |
| Mobile infra                                    | `npm run test:mobile-infra`                   |
| Mobile shell UI                                 | `npm run test:mobile-shell`                   |
| Un fichier                                      | `npx jest src/features/caseHub --no-coverage` |
| Avant merge `main`                              | `npm run test:ci`                             |

## Perf max (index Cursor)

| Exclu de l'index                   | Pourquoi        | Accès agent                  |
| ---------------------------------- | --------------- | ---------------------------- |
| `node_modules`, `ios/`, `android/` | ~2 Go           | —                            |
| `**/__tests__/**`, `*.test.ts`     | ~700 fichiers   | `@src/.../MonTest.test.tsx`  |
| `src/core/i18n/locales/`           | ~7k lignes × 3  | `Grep` la clé                |
| `src/app/api/`                     | wrappers minces | logique dans `src/features/` |
| `package-lock.json`                | 21k lignes      | —                            |

**Après modif `.cursorignore`** : Resync index Cursor.

**Nettoyage disque** : `npm run clean:dev` (supprime `.next`, `ios/build`, `android/app/build`, coverage…).

**Indexé** : `src/features/**`, `src/app/page.tsx`, `src/context/**`, 2 guides agents.

## i18n (2 300+ clés × 3 langues)

- N’ajouter que les clés de **ta** feature dans `en.json` / `fr.json` / `nl.json`.
- Pour trouver une clé : `rg "caseHub" src/core/i18n/locales/en.json` — ne pas lire tout le fichier.

## Worktree (Cursor + Claude Code en vrai parallèle)

```bash
git worktree add ../CRMSLOT-claude claude/work
# Cursor  → CRMSLOT/
# Claude  → CRMSLOT-claude/
```

Chaque clone a son index Cursor séparé → moins de conflits et moins de RAM partagée.

## Checklist fin de session

1. `git status` — rien hors zone ?
2. `npx jest <zone> --no-coverage` (ou script zone ci-dessus)
3. Commit sur **ta** branche si demandé (jamais `git add .`)
4. Vider la colonne « Propriétaire session » dans `PARALLEL_WORK.md`

## Explorateur VS Code / Cursor (files.exclude)

L'explorateur masque par défaut : natif (`android/`, `ios/`), infra (`scripts/`, `functions/`, `tests/`, `data/`), builds (`.next`, `coverage`), tests colocalisés, docs `ops/` et `reference/`, configs Firebase/Jest rarement éditées.

**Visible au quotidien** : `src/`, `docs/agents/`, `package.json`, `next.config.ts`, `jest.config.ts`.

Pour rouvrir un fichier masqué : Cmd+P puis le nom du fichier.

## Fichiers clés perf

| Fichier                          | Rôle                                              |
| -------------------------------- | ------------------------------------------------- |
| `.cursorignore`                  | Index Cursor minimal (features + 2 guides agents) |
| `.vscode/settings.json`          | Masquage explorateur + watchers / search          |
| `.cursor/rules/agent-core.mdc`   | Règle unique session Agent                        |
| `docs/agents/AGENTS_EXTENDED.md` | Steppers / glossaire hub société                  |
| `scripts/README.md`              | Index scripts (`ci/`, `dev/`, `lecot/`, …)        |
