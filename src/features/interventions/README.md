# interventions

Cœur métier CRM : création demande client, workflow statuts, app technicien terrain, planning, facturation terrain.

## Points d'entrée

| Fichier                                     | Rôle                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `types.ts`                                  | Type `Intervention` — **import public #1** pour toute l'app  |
| `technicianSchedule.ts`                     | Filtres/tri missions (utilisé par map, backoffice, hubs)     |
| `hooks/useSmartForm.ts`                     | Wizard demande client 5 steps — **968 lignes, P0 découpage** |
| `components/TechnicianMobileApp.tsx`        | App terrain `/m/technician`                                  |
| `components/RequesterInterventionPanel.tsx` | Portail demandeur                                            |
| `workflow/interventionWorkflow.ts`          | Transitions statut                                           |
| `assignInterventionToTechnician.ts`         | Assignation (seuil coverage P0 100 %)                        |

## Données

- Firestore : `interventions/{id}`, sous-collection `timeline`
- Firestore : brouillons client via localStorage (`smartInterventionConstants`)
- API : `src/app/api/interventions/**` (PDF, assignation, notifications…)

## Dépendances autorisées

- `crmHistory` — log création/action
- `billing` — lignes facturation, PDF
- `scheduling` — conflits créneaux
- `auth` — portail client
- `dashboard` — navigation pager (minimal)

**Hub partagé** : `context/RequesterHubContext.tsx`, `TechnicianFinishJobContext.tsx`

## Pièges

- Feature la plus importée (86 outbound, 77 inbound depuis backoffice)
- Ne pas dupliquer la logique schedule — tout passe par `technicianSchedule.ts`
- `useSmartForm` + `useRequesterInterventionForm` se chevauchent partiellement

## Tests

```bash
npm run test:interventions
# ou ciblé :
npx jest src/features/interventions/hooks --no-coverage
```
