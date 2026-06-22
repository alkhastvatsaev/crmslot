# teamHub

Hub Équipe (slot 5) : annuaire staff société, édition profils.

## Points d'entrée

| Fichier                      | Rôle                      |
| ---------------------------- | ------------------------- |
| `components/TeamHubPage.tsx` | Page carrousel            |
| `hooks/useCompanyStaff.ts`   | Liste staff via API       |
| `teamHubConstants.ts`        | `TEAM_HUB_SLOT_INDEX = 5` |

## Données

- Firestore (serveur) : `companies/{id}/staff_directory`, `technicians`
- API : `GET|PATCH /api/company/staff`

## Dépendances

- `dashboard`, `company` (`resolveHubCompanyId`)

## Pièges

- Pas de realtime — `refresh()` après PATCH
- Gate `workspaceReady` avant affichage

## Tests

```bash
npm run test:patron-hubs
```
