# Matrice d'automatisation — CRMSLOT

Référence rapide : quelle commande lancer selon la zone modifiée.

## Par zone fonctionnelle

| Zone             | Chemins                                    | Tests unitaires              | E2E                                               | Workflow CI               |
| ---------------- | ------------------------------------------ | ---------------------------- | ------------------------------------------------- | ------------------------- |
| Chatbot          | `src/features/chatbot/**`                  | `npm run test:chatbot`       | `npm run test:e2e:chatbot`                        | `chatbot-tests.yml`       |
| Interventions    | `src/features/interventions/**`            | `npm run test:interventions` | `critical-path-dispatch`, `technician-finish-job` | `interventions-tests.yml` |
| Matériel / Lecot | `src/features/featureHub/**`, `catalog/**` | `npm run test:feature-hub`   | —                                                 | `material-tests.yml`      |
| Gmail            | `src/features/gmail/**`                    | `npm run test:gmail`         | —                                                 | `gmail-tests.yml`         |
| CRM Historique   | `src/features/crmHistory/**`               | `npm run test:crm`           | —                                                 | `crm-tests.yml`           |
| Facturation      | `src/features/billingHub/**`               | `npm run test:billing-hub`   | `npm run test:e2e:invoice`                        | `billing-hub-tests.yml`   |
| Webhooks         | `src/app/api/webhooks/**`                  | `npm run test:webhooks`      | —                                                 | `webhooks-tests.yml`      |
| API auth         | toutes routes protégées                    | —                            | `npm run test:e2e:api-matrix`                     | `e2e.yml`                 |

## Commandes globales

| Action                | Commande                      |
| --------------------- | ----------------------------- |
| CI locale             | `npm run ci`                  |
| CI + E2E              | `npm run ci:all`              |
| E2E (mode CI local)   | `npm run test:e2e:ci`         |
| Release staging       | `npm run release:check`       |
| Release prod          | `npm run release:check:prod`  |
| Régénérer matrice API | `npm run generate:api-routes` |

## Hooks Git

| Hook         | Action                                                 |
| ------------ | ------------------------------------------------------ |
| `pre-commit` | ESLint + Prettier (`lint-staged`)                      |
| `pre-push`   | `jest --findRelatedTests` sur fichiers `src/` modifiés |

## Seeds E2E (dev uniquement)

| Endpoint                                   | Usage              |
| ------------------------------------------ | ------------------ |
| `POST /api/e2e/seed-done-intervention`     | Facturation IVANA  |
| `POST /api/e2e/seed-assigned-intervention` | Clôture technicien |

Variables : `E2E_DONE_INTERVENTION_ID`, `E2E_ASSIGNED_INTERVENTION_ID`, `E2E_SKIP_SEED=true`.

## Definition of Done (automatisation)

1. Zone touchée → test unitaire ciblé vert
2. Flux utilisateur critique → E2E smoke si applicable
3. `npm run test:ci` vert avant merge
4. Nouvelle route API protégée → `npm run generate:api-routes` + matrice E2E

## Ops planifiées

| Workflow                   | Fréquence          | Rôle                                        |
| -------------------------- | ------------------ | ------------------------------------------- |
| `release.yml`              | push main + manuel | Qualité + E2E + smoke deploy                |
| `ops-weekly.yml`           | lundi 6h UTC       | Vérif images Lecot + drift UIDs techniciens |
| `lecot-images-refresh.yml` | manuel             | Refresh catalogue images                    |
