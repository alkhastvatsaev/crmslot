# interventions

Cœur métier CRM : création demande client, workflow statuts, app technicien terrain, planning, facturation terrain.

## Points d'entrée

| Fichier                                   | Rôle                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `types.ts`                                | Type `Intervention` — **import public #1** pour toute l'app |
| `technicianSchedule.ts`                   | Barrel schedule technicien (filtres/tri missions)           |
| `technicianScheduleParse.ts`              | Ancrage dates, coercion Firestore                           |
| `technicianScheduleVisibility.ts`         | Filtres onglets / file back-office                          |
| `technicianScheduleLabels.ts`             | Libellés horaires et client                                 |
| `hooks/useSmartForm.ts`                   | Orchestrateur wizard demande client (~220 lignes)           |
| `smartFormDraftStorage.ts`                | Brouillon localStorage + step initial                       |
| `smartFormSubmit.ts`                      | Soumission Firestore + upload audio                         |
| `hooks/useSmartFormDraftEffects.ts`       | Autosave, prefill, slots pris                               |
| `components/TechnicianFinishJobPanel.tsx` | Wizard clôture terrain (~155 lignes)                        |
| `hooks/useFinishJobWizard.ts`             | État photos / signature / facture                           |
| `hooks/useRequesterInterventionForm.ts`   | Portail demandeur (~195 lignes)                             |
| `requesterInterventionFormSubmit.ts`      | Soumission Firestore portail client                         |
| `requesterInterventionFormHelpers.ts`     | Auth anonyme + timeout géoloc                               |
| `workflow/interventionWorkflow.ts`        | Transitions statut                                          |
| `assignInterventionToTechnician.ts`       | Assignation (seuil coverage P0 100 %)                       |

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
