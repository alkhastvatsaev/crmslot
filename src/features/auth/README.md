# auth

Auth staff + portail client, détection rôle, guards session.

## Points d'entrée

| Fichier                                      | Rôle                                    |
| -------------------------------------------- | --------------------------------------- |
| `components/LoginOverlay.tsx`                | Gate admin                              |
| `components/CrmEmailLoginPanel.tsx`          | Orchestrateur login staff (~65 lignes)  |
| `components/CrmEmailLoginPanelHeader.tsx`    | Logo + titre login staff                |
| `components/CrmEmailLoginForm.tsx`           | Champs email / mot de passe staff       |
| `hooks/useCrmEmailLoginForm.ts`              | État + submit / reset staff             |
| `components/ClientPortalAuthPanel.tsx`       | Orchestrateur auth portail (~95 lignes) |
| `hooks/useClientPortalAuthPanel.ts`          | État pager + hooks auth / suivi         |
| `components/ClientPortalAuthForm.tsx`        | Email, mot de passe, Google             |
| `components/ClientPortalMfaPanel.tsx`        | Double authentification SMS / TOTP      |
| `components/ClientPortalAuthedView.tsx`      | Session connectée (dashboard, logout)   |
| `components/ClientPortalAuthCard.tsx`        | Carte login / register (hub complet)    |
| `components/ClientPortalAuthRailContent.tsx` | Formulaire rail hub demandeur           |
| `components/ClientPortalAuthOffline.tsx`     | Firebase non configuré                  |
| `useAccountRole.ts`                          | Admin / technicien / client satellite   |

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
