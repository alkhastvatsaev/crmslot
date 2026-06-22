# notifications

Push FCM, prefs, rappels RDV.

## Points d'entrée

| Fichier                       | Rôle                     |
| ----------------------------- | ------------------------ |
| `BackofficePushBootstrap.tsx` | Point d'entrée principal |
| _(voir dossier)_              | Modules colocalisés      |

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
