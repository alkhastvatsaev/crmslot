# backoffice

Inbox patron / dispatch : demandes entrantes, chat portail Ivana, rapports terrain, assignation techniciens.

## Points d'entrée

| Fichier                               | Rôle                                      |
| ------------------------------------- | ----------------------------------------- |
| `components/BackOfficeInboxPanel.tsx` | Panel inbox (rail droit carte + hub)      |
| `hooks/useBackOfficeInboxState.ts`    | État inbox — **758 lignes, P0 découpage** |
| `useBackOfficeInterventions.ts`       | Hook Firestore interventions société      |
| `assignInterventionFromBackoffice.ts` | Assignation depuis inbox                  |
| `components/IvanaClientChatPanel.tsx` | Chat portail client — **706 lignes**      |
| `ivanaChatFirestore.ts`               | Messages portail Firestore                |

## Données

- Firestore : `interventions`, messages portail (via `ivanaChatFirestore`)
- Pas de collection `backoffice` dédiée

## Dépendances autorisées

- `interventions` — types, workflow, schedule (**77 imports — normal**)
- `crmHistory` — `logCrmInterventionAction`
- `scheduling` — conflits, `updateInterventionSchedule`
- `billing` — preview facture, PDF devis
- `auth` — session portail client

**Intent** : `context/BackofficeInboxIntentContext.tsx` (focus depuis map/autres pages)

## Pièges

- `useBackOfficeInboxState` concentre tabs, chat Ivana, assignation, terrain bridge
- Inbox aussi embarquée dans `MapboxView.tsx` — tester les deux layouts
- `isSyntheticInterventionId` pour démos

## Tests

```bash
npx jest src/features/backoffice --no-coverage
```
