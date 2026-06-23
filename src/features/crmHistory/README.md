# crmHistory

Historique CRM unifié — slot Quality Management (`CRM_HISTORY_SLOT_INDEX`).

## Points d'entrée

| Fichier                                     | Rôle                                    |
| ------------------------------------------- | --------------------------------------- |
| `components/CrmHistoryPage.tsx`             | Page slot triple panel                  |
| `components/CrmHistoryCenterFeed.tsx`       | Feed central (~120 lignes)              |
| `components/CrmHistoryEventDetailPanel.tsx` | Panneau détail événement (~95 lignes)   |
| `components/CrmHistoryQmSnapshotPanel.tsx`  | Grille stats QM (état vide / sélection) |
| `components/crmHistoryEventDetailFormat.ts` | Formatage date période + horodatage     |
| `hooks/useCrmActivityFeed.ts`               | Agrégation feeds                        |
| `logCrmInterventionAction.ts`               | Log actions (import public)             |

## Données

- Feeds synthétisés : interventions, emails, commandes, chat portail
- Agent : `crmHistoryAgentRouteHandler.ts`

## Dépendances

- `backoffice`, `featureHub`, `clients`, `dashboard`, `interventions`, `billingHub`, `chatbot`

## Pièges

- Event `CRMSLOT_CRM_ORDERS_CHANGED_EVENT` pour refresh commandes
- Filtres dans `crmActivityFilters.ts`

## Tests

```bash
npm run test:crm
```
