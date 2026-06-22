# clients

CRM contacts : fiches client, sites, import CSV, contrats.

## Points d'entrée

| Fichier               | Rôle                     |
| --------------------- | ------------------------ |
| `ClientsCrmPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_      | Modules colocalisés      |

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
