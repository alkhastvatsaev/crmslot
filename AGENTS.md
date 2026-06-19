<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

Read `node_modules/next/dist/docs/` before writing Next.js code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Testing — essentiel

Guides : `docs/agents/CURSOR_WORKFLOW.md` · `docs/agents/PARALLEL_WORK.md` · steppers → `docs/agents/AGENTS_EXTENDED.md`

1. Tests colocalisés `__tests__/` · fichier > 50 lignes métier → ≥ 1 test.
2. `data-testid` · mocks `jest.setup.ts` · `render` / `factories.ts`.
3. `npx jest <path> --no-coverage` · merge : `npm run test:ci`.
4. Zones : `test:chatbot` · `test:interventions` · `test:feature-hub` · `test:crm` · `test:billing-hub` · `test:patron-hubs` · `test:mobile-infra`.
5. Chatbot : `docs/agents/TESTING.md` §3.
6. Nettoyage : `npm run clean:dev`.
