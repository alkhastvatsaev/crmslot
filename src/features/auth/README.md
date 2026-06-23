# auth

Auth staff + portail client, détection rôle, guards session.

## Points d'entrée

| Fichier                                   | Rôle                                   |
| ----------------------------------------- | -------------------------------------- |
| `components/LoginOverlay.tsx`             | Gate admin                             |
| `components/CrmEmailLoginPanel.tsx`       | Orchestrateur login staff (~65 lignes) |
| `components/CrmEmailLoginPanelHeader.tsx` | Logo + titre login staff               |
| `components/CrmEmailLoginForm.tsx`        | Champs email / mot de passe staff      |
| `hooks/useCrmEmailLoginForm.ts`           | État + submit / reset staff            |
| `components/ClientPortalAuthPanel.tsx`    | Auth portail client                    |
| `useAccountRole.ts`                       | Admin / technicien / client satellite  |

## Données

- Firebase Auth
- Firestore : `client_portal_profiles`, `users/{uid}/company_memberships`
- API : `/api/company/join-default`

## Dépendances

- `company`, `dashboard`, `interventions`, `gmail` (OAuth Google)

## Pièges

- Deux Firestore : CRM vs portail client
- Redirect satellite mobile depuis `page.tsx`

## Tests

```bash
npx jest src/features/auth --no-coverage
```
