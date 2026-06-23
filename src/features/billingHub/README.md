# billingHub

UI hub facturation (slot 6 `BILLING_HUB_SLOT_INDEX`) : liste dossiers à facturer, agent IA billing, panneau assisté.

**Ne pas confondre avec `billing/`** — `billing/` = PDF, UBL, Stripe ; **ce dossier** = layout pager + agent.

## Points d'entrée

| Fichier                          | Rôle                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| \`index.ts\`                     | **Barrel public** — imports cross-feature via \`@/features/billingHub\` |
| `components/BillingHubPage.tsx`  | Page slot lazy-loadée                                                   |
| `hooks/useBillingHubAgent.ts`    | Agent IA dédié facturation                                              |
| `billingHubAgentRouteHandler.ts` | Route API agent                                                         |
| `billingHubConstants.ts`         | Index pager, events DOM                                                 |
| `filterBillingHub.ts`            | Filtres liste dossiers                                                  |

## Dépendances autorisées

- `billing/` — export CSV, preview, PDF (via barrel `@/features/billing`)
- `chatbot/` — pipeline SSE partagé (`runChatbotOpenAI`)
- `interventions/` — types + statuts
- `hubAgents/` — side effects outils

## Pièges

- Toute logique PDF reste dans `billing/` — le hub ne génère rien serveur
- Agent scope limité : `billingHubAgentScope.ts`

## Voir aussi

- `src/features/billing/README.md`

## Tests

```bash
npx jest src/features/billingHub --no-coverage
```
