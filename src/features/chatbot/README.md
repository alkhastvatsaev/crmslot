# chatbot

Assistant IA OpenAI (SerrAI) : SSE streaming, outils Firebase Admin, commandes Lecot, documents PDF côté PWA.

## Points d'entrée

| Fichier                                            | Rôle                                               |
| -------------------------------------------------- | -------------------------------------------------- |
| `components/ChatbotChat.tsx` / `SerrAIChat.tsx`    | UI chat                                            |
| `components/ChatbotDocumentsRightPanel.tsx`        | Rail documents PDF page 5 (~170 lignes)            |
| `hooks/useChatbotDocumentsRightPanelController.ts` | Filtres, thumbnails, labels clients                |
| `components/ChatbotDocumentTile.tsx`               | Tuile facture / commande fournisseur               |
| `chatbotDocumentsPanelHelpers.ts`                  | Formatage EUR/date, clé sélection preview          |
| `components/ChatbotSupplierOrdersPanel.tsx`        | Liste commandes fournisseur/matériel (~120 lignes) |
| `hooks/useChatbotSupplierOrdersPanelView.ts`       | Labels clients, highlight, images rail             |
| `components/ChatbotSupplierOrderRow.tsx`           | Ligne commande fournisseur (embedded)              |
| `components/ChatbotMaterialOrderRow.tsx`           | Ligne commande matériel (embedded)                 |
| `hooks/useChatbot.ts`                              | Hook client SSE — orchestrateur (~130 lignes)      |
| `hooks/useChatbotConversations.ts`                 | Persistance localStorage + fil actif               |
| `hooks/useChatbotMessaging.ts`                     | Envoi message, confirmation / annulation outil     |
| `hooks/useChatbotStreamSession.ts`                 | Composer stream SSE (~30 lignes)                   |
| `hooks/useChatbotStreamRun.ts`                     | POST `/api/ai/chatbot` + persistance conversation  |
| `hooks/useChatbotStreamEventHandler.ts`            | Dispatch événements SSE → side effects UI          |
| `hooks/useChatbotStreamBillingSync.ts`             | Auto-preview facture / choix facturation           |
| `hooks/useChatbotStreamDocumentAction.ts`          | POST `/api/ai/chatbot/document-action`             |
| `chatbotStreamSessionTypes.ts`                     | Types partagés hooks stream                        |
| `chatbot-route-handler.ts`                         | Handler API (importé par route Next)               |
| `chatbot-conversation-context.ts`                  | Barrel contexte conversation (scope outils / fils) |
| `chatbot-conversation-context-types.ts`            | Types ChatbotFlowId + contexte tour                |
| `chatbot-conversation-context-messages.ts`         | Normalisation messages + texte récent              |
| `chatbot-conversation-context-flows.ts`            | Détection fils Lecot/email/planning…               |
| `chatbot-conversation-context-scope.ts`            | Scope outils + requête Lecot par tour              |
| `chatbot-conversation-context-resolve.ts`          | `resolveChatbotConversationContext`                |
| `chatbot-openai.ts`                                | Pipeline OpenAI orchestrateur (~145 lignes)        |
| `chatbot-openai-stream.ts`                         | Stream completion + accumulation tool calls        |
| `chatbot-openai-execute-tools.ts`                  | Exécution outils + side effects SSE                |
| `chatbot-openai-forced-lecot.ts`                   | Pré-exécution search_lecot_products                |
| `chatbot-openai-hub-order.ts`                      | Résolution clientName agent matériel               |
| `chatbot-tool-labels.ts`                           | Labels outils stream                               |
| `index.ts`                                         | **Barrel public** cross-feature                    |
| `chatbot-lecot-order.ts`                           | Orchestrateur commande Lecot (~57 lignes)          |
| `chatbot-lecot-order-lines.ts`                     | Parse lignes + enrichissement prix catalogue       |
| `chatbot-lecot-order-helpers.ts`                   | Firestore, CRM, email, sync facturation            |
| `chatbot-lecot-order-demo.ts` / `-prod.ts`         | Branches démo / API Lecot réelle                   |
| `chatbot-tools.ts`                                 | Barrel schémas outils (~23 lignes)                 |
| `chatbot-tools-read-definitions.ts`                | Outils lecture workspace / CRM                     |
| `chatbot-tools-billing-definitions.ts`             | Facturation + exports + focus hub                  |
| `chatbot-tools-intervention-definitions.ts`        | Écriture dossier intervention                      |
| `chatbot-tools-gmail-definitions.ts`               | Gmail inbox / liaison / réponses                   |
| `chatbot-tools-lecot-definitions.ts`               | Catalogue Lecot + commandes                        |
| `chatbot-tools-stock-definitions.ts`               | Stock véhicule + focus inventaire                  |
| `chatbot-tools-ai-definitions.ts`                  | Vision, clôture vocale, churn                      |
| `chatbot-tool-executor.ts`                         | Barrel exécuteur outils (~45 lignes)               |
| `chatbot-tool-executor-context.ts`                 | Contexte + garde-fous confirmation / admin         |
| `chatbot-tool-executor-workspace.ts`               | Dispatch outils lecture workspace / CRM            |
| `chatbot-tool-executor-orders-comms.ts`            | Dispatch commandes, Lecot, Gmail, inbox            |
| `chatbot-tool-executor-intervention-tools.ts`      | Dispatch mutations dossier + stock véhicule        |
| `chatbot-tool-executor-ai-tools.ts`                | Dispatch vision, voix, churn, exports              |
| `chatbot-executor-queries.ts`                      | Barrel requêtes exécuteur (~35 lignes)             |
| `chatbot-executor-db.ts`                           | `db()`, accès intervention, labels                 |
| `chatbot-executor-workspace-queries.ts`            | Interventions, workspace, stats, facturation       |
| `chatbot-executor-crm-queries.ts`                  | Clients, devis, techniciens                        |
| `chatbot-executor-stock-queries.ts`                | Stock entrepôt + véhicule                          |
| `chatbot-executor-order-queries.ts`                | Bons matériel / fournisseur                        |
| `chatbot-executor-comms-queries.ts`                | Inbox, emails, chat portail                        |
| `filterChatbotDocuments.ts`                        | Barrel recherche documents (factures + commandes)  |
| `filterChatbotDocumentsTypes.ts`                   | Types filtre / item liste documents                |
| `filterChatbotDocumentsParse.ts`                   | Normalisation + tokenisation requête               |
| `filterChatbotDocumentsHaystack.ts`                | Haystack facture / bon fournisseur                 |
| `filterChatbotDocumentsScore.ts`                   | Score fuzzy, filtre, tri, merge par date           |
| `chatbot-gmail.ts`                                 | Barrel outils Gmail chatbot (~10 lignes)           |
| `chatbot-gmail-shared.ts`                          | OAuth guard, parse expéditeur, accès intervention  |
| `chatbot-gmail-inbox.ts`                           | Liste inbox + détail message                       |
| `chatbot-gmail-intervention-links.ts`              | Scoring candidats liaison mail ↔ dossier           |
| `chatbot-gmail-reply.ts`                           | Réponse fil Gmail (confirmation requise)           |
| `chatbot-gmail-link.ts`                            | Événement timeline `gmail_link` Firestore          |

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

- Ajouter un outil = 4 fichiers : `chatbot-tools.ts`, `chatbot-tool-executor-*.ts` (domaine), `CHATBOT_WRITE_TOOLS`, `TOOL_LABELS`
- Zero-token tools : `isChatbotZeroTokenUiTool`

## Tests

```bash
npm run test:chatbot
# E2E intent :
npm run test:e2e:chatbot
```
