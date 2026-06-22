# featureHub

Hub Matériel (slot 1) : stock entreprise, commandes Lecot, agent IA matériel.

## Points d'entrée

| Fichier                                  | Rôle                          |
| ---------------------------------------- | ----------------------------- |
| `components/FeatureHubPage.tsx`          | Page carrousel                |
| `components/CompanyStockCenterPanel.tsx` | Inventaire + commandes        |
| `hooks/useMaterialAgent.ts`              | Agent SSE matériel            |
| `companyStockChatbot.ts`                 | Navigation pager + events DOM |
| `featureHubConstants.ts`                 | `FEATURE_HUB_SLOT_INDEX = 1`  |

## Données

- Firestore : `stockItems`, `material_orders`, `companies/{id}/supplierOrders`
- API : `POST /api/ai/material-agent`, `/api/catalog/lecot-images`

## Dépendances

- `dashboard`, `materials`, `catalog`, `suppliers`, `chatbot`, `hubAgents`, `backoffice`

## Pièges

- `useHubPageActive` : pas d'abonnement hors page active
- Agent matériel ≠ chatbot global

## Tests

```bash
npm run test:feature-hub
```
