# clients

CRM contacts : fiches client, sites, import CSV, contrats.

## Points d'entrée

| Fichier                                 | Rôle                                                                 |
| --------------------------------------- | -------------------------------------------------------------------- |
| \`index.ts\`                            | **Barrel public** — imports cross-feature via \`@/features/clients\` |
| `components/ClientsCrmPanel.tsx`        | Orchestrateur UI (Espace société)                                    |
| `hooks/useClientsCrmPanelController.ts` | État + handlers CRM                                                  |
| `components/ClientsCrmClientsList.tsx`  | Liste clients filtrée                                                |
| `components/ClientsCrmClientDetail.tsx` | Fiche client, sites, équipement                                      |

## Données

- clients, sites, recurringContracts

## Dépendances

- company, equipment, interventions, chatbot

## Pièges

- Flag crmContacts; cache offline après import

## Tests

```bash
npx jest src/features/clients --no-coverage
```
