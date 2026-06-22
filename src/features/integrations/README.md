# integrations

Webhooks sortants société HMAC.

## Points d'entrée

| Fichier                      | Rôle                     |
| ---------------------------- | ------------------------ |
| `dispatchOutboundWebhook.ts` | Point d'entrée principal |
| _(voir dossier)_             | Modules colocalisés      |

## Données

- webhookEndpoints, webhookDeliveries

## Dépendances

- interventions, billing

## Pièges

- Gmail = feature gmail/

## Tests

```bash
npm run test:webhooks
```
