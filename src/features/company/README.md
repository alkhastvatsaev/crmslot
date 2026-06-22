# company

Portail demandeur `/m/demande`, workspace multi-société, helpers hubs.

## Points d'entrée

| Fichier                            | Rôle                      |
| ---------------------------------- | ------------------------- |
| `components/ClientMobileApp.tsx`   | Shell `/m/demande`        |
| `components/CompanyHubPage.tsx`    | UI portail client         |
| `resolveHubCompanyId.ts`           | Société active hubs admin |
| `components/CompanySpacePanel.tsx` | Paramètres admin société  |

## Données

- Firestore : `companies`, `users/{uid}/company_memberships`, `interventions`
- API : `/api/company/join-default`, `/api/company/sync-claims`, `/api/company/staff`

## Dépendances

- `auth`, `interventions`, `dashboard`, `backoffice`, `clients`, `materials`

## Pièges

- Hors carrousel admin — route `/m/demande`
- `sync-claims` après changement membership

## Tests

```bash
npm run test:native-infra
npx jest src/features/company --no-coverage
```
