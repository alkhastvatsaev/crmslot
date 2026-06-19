<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

Read `node_modules/next/dist/docs/` before writing Next.js code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Testing — règles essentielles

Workflow Cursor : `docs/CURSOR_WORKFLOW.md`. Patterns stepper / glossaire : `docs/AGENTS_EXTENDED.md`.

1. **Tests colocalisés** : tout hook ou logique métier modifié dans `src/features/*` → `__tests__/` à côté. Fichier > 50 lignes métier → au moins 1 test (sauf types/constantes purs).
2. **data-testid** : éléments interactifs testés en RTL.
3. **Mocks globaux** : `jest.setup.ts` (Firebase, Mapbox, Framer, OpenAI) — étendre une fois, pas par spec.
4. **Helpers** : `render` / `renderWithPager` (`src/test-utils/`), fixtures `makeIntervention` (`factories.ts`).
5. **Boucle** : `npx jest <path> --no-coverage` · **merge** : `npm run test:ci`.
6. **Zones** : `npm run test:chatbot` · `test:interventions` · `test:feature-hub` · `test:crm` · `test:billing-hub` · `test:patron-hubs` · `test:mobile-infra`.
7. **Chatbot** : après modif → `test:chatbot` + `test:ci`. Détail `docs/TESTING.md` §3.
8. **Interventions serveur** : logique dans `server/*.ts`, routes API = wrappers minces.
9. **HubAgents** : tests dans `src/features/hubAgents/__tests__/` (stream mock via `body.getReader()`).
10. **E2E** : `tests/e2e/` — parcours critiques seulement.
11. **Parallèle** : `docs/PARALLEL_WORK.md` — une zone, un propriétaire.
