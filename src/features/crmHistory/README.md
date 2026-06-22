# crmHistory

Historique CRM unifié (slot pager) : timeline activité société, détail événement, agent IA.

## Points d'entrée

| Fichier                               | Rôle                                   |
| ------------------------------------- | -------------------------------------- |
| `components/CrmHistoryPage.tsx`       | Page slot lazy-loadée                  |
| `components/CrmHistoryCenterFeed.tsx` | Feed central grille (~120 lignes)      |
| `crmHistoryEventMeta.tsx`             | Icônes / couleurs par type d'événement |
| `hooks/useCrmActivityFeed.ts`         | Agrégation feeds Firestore             |
| `crmActivityTypes.ts`                 | Type `CrmActivityEvent`                |

## Tests

```bash
npx jest src/features/crmHistory --no-coverage
```
