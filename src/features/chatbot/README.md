# chatbot

Assistant IA OpenAI (SerrAI) : SSE streaming, outils Firebase Admin, commandes Lecot, documents PDF côté PWA.

## Points d'entrée

| Fichier                                         | Rôle                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| `components/ChatbotChat.tsx` / `SerrAIChat.tsx` | UI chat                                            |
| `components/ChatbotSupplierOrdersPanel.tsx`     | Liste commandes fournisseur/matériel (~120 lignes) |
| `hooks/useChatbotSupplierOrdersPanelView.ts`    | Labels clients, highlight, images rail             |
| `components/ChatbotSupplierOrderRow.tsx`        | Ligne commande fournisseur (embedded)              |
| `components/ChatbotMaterialOrderRow.tsx`        | Ligne commande matériel (embedded)                 |
| `hooks/useChatbot.ts`                           | Hook client SSE — orchestrateur (~330 lignes)      |
| `hooks/useChatbotStreamSession.ts`              | Stream SSE + side effects UI                       |
| `chatbot-route-handler.ts`                      | Handler API (importé par route Next)               |
| `chatbot-openai.ts`                             | Pipeline OpenAI (orchestrateur)                    |
| `chatbot-tool-labels.ts`                        | Labels outils stream                               |
| `index.ts`                                      | **Barrel public** cross-feature                    |
| `chatbot-lecot-order.ts`                        | Orchestrateur commande Lecot (~57 lignes)          |
| `chatbot-lecot-order-lines.ts`                  | Parse lignes + enrichissement prix catalogue       |
| `chatbot-lecot-order-helpers.ts`                | Firestore, CRM, email, sync facturation            |
| `chatbot-lecot-order-demo.ts` / `-prod.ts`      | Branches démo / API Lecot réelle                   |
| `chatbot-tools.ts`                              | Schémas JSON outils — **754 lignes**               |
| `chatbot-executor-queries.ts`                   | Barrel requêtes exécuteur (~35 lignes)             |
| `chatbot-executor-db.ts`                        | `db()`, accès intervention, labels                 |
| `chatbot-executor-workspace-queries.ts`         | Interventions, workspace, stats, facturation       |
| `chatbot-executor-crm-queries.ts`               | Clients, devis, techniciens                        |
| `chatbot-executor-stock-queries.ts`             | Stock entrepôt + véhicule                          |
| `chatbot-executor-order-queries.ts`             | Bons matériel / fournisseur                        |
| `chatbot-executor-comms-queries.ts`             | Inbox, emails, chat portail                        |

## Données

- Firestore : `interventions`, `companies/{id}/supplierOrders`, `material_orders`, `stockItems`
- API : `POST /api/ai/chatbot` (SSE)
- Outils write : flag `userConfirmed: true` (`CHATBOT_WRITE_TOOLS`)

## Dépendances autorisées

- `catalog` — recherche Lecot
- `suppliers` / `materials` — commandes pièces
- `copilot` — contexte workspace
- `hubAgents` — handlers stream partagés (billingHub, featureHub…)
- `interventions` — types uniquement côté client

**Ne pas** générer PDF serveur — focus document via outils zero-token UI.

## Pièges

- Ajouter un outil = 4 fichiers : `chatbot-tools.ts`, `chatbot-tool-executor.ts`, `CHATBOT_WRITE_TOOLS`, `TOOL_LABELS`
- Zero-token tools : `isChatbotZeroTokenUiTool`

## Tests

```bash
npm run test:chatbot
# E2E intent :
npm run test:e2e:chatbot
```
