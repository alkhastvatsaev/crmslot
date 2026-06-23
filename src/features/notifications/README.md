# notifications

Push FCM, prefs, rappels RDV.

## Points d'entrée

| Fichier                       | Rôle                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| \`index.ts\`                  | **Barrel public** — imports cross-feature via \`@/features/notifications\` |
| `BackofficePushBootstrap.tsx` | Point d'entrée principal                                                   |
| _(voir dossier)_              | Modules colocalisés                                                        |

## Données

- users/{uid}/fcm_tokens

## Dépendances

- interventions, backoffice

## Pièges

- PWA requise pour web push

## Tests

```bash
npm run test:native-infra
```
