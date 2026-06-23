# integrations

Webhooks sortants société HMAC.

## Points d'entrée

| Fichier                      | Rôle                                                                      |
| ---------------------------- | ------------------------------------------------------------------------- |
| \`index.ts\`                 | **Barrel public** — imports cross-feature via \`@/features/integrations\` |
| `dispatchOutboundWebhook.ts` | Point d'entrée principal                                                  |
| _(voir dossier)_             | Modules colocalisés                                                       |

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
