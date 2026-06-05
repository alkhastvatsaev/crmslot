## Summary

<!-- Quoi et pourquoi (1–3 phrases). -->

## Type de changement

- [ ] Feature
- [ ] Correctif
- [ ] Refactoring
- [ ] Tests / CI uniquement
- [ ] Docs

## Tests

- [ ] `npm run typecheck`
- [ ] `npm run test:ci` (ou `npm run test:coverage` si CI complète trop lourde en local)
- [ ] Tests colocalisés ajoutés ou mis à jour pour le code modifié

### Chatbot / Codex

Si cette PR touche `src/features/chatbot/**` ou `src/app/api/ai/chatbot/**` :

- [ ] `npm run test:chatbot` (boucle rapide)
- [ ] Pas de modification des fichiers dupliqués `* 2.ts` / `* 3.ts`
- [ ] Nouvel outil OpenAI → `chatbot-tools.ts` + `chatbot-tool-executor.ts` + tests routing/executor
- [ ] Logique API dans `chatbot-route-handler.ts` / `chatbot-document-action-handler.ts` (pas seulement `route.ts`)

Voir [`docs/TESTING.md`](../docs/TESTING.md).

### Interventions / facturation

Si cette PR touche `src/features/interventions/**` ou `src/app/api/interventions/**` :

- [ ] `npm run test:interventions` (boucle rapide)
- [ ] Logique serveur dans `src/features/interventions/server/` (routes = wrappers)
- [ ] Nouveau flux facturation → tests `server/__tests__/` + `draftInvoiceBilling` si applicable

## E2E (si parcours UI critique)

- [ ] `npm run test:e2e` (serveur `localhost:3000` requis)
- [ ] Facturation / IVANA : `npm run test:e2e:invoice`
- [ ] Non concerné

## Captures / notes

<!-- Optionnel : screenshots, variables d’env, migration Firestore. -->
