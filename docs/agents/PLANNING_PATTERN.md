# Convention features planning (CRMSLOT)

Quatre features touchent à l'assignation et au planning. La frontière n'est pas évidente (dispatch ≠ scheduling ≠ planningHub ≠ calendar) — voici qui fait quoi.

## Tableau de répartition

| Feature        | Rôle                                                                             | Surface UI principale                               | Imports cross-feature |
| -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| `dispatch/`    | Assignation **temps réel** (rangement IA + audio MacroDroid + picker technicien) | `TechnicianAssignPicker`, `AiAssistant` strip carte | **75**                |
| `scheduling/`  | Créneaux, conflits, drag-board planning                                          | Drag-board inbox + helpers                          | 55                    |
| `planningHub/` | UI hub patron : vue jour techniciens (slot 8)                                    | `PlanningHubPage` (carrousel)                       | 28                    |
| `calendar/`    | Vue calendrier mensuelle + export ICS + deep links                               | Grille mensuelle                                    | 17                    |

## Distinctions critiques

- **`dispatch/` ≠ `scheduling/`** :
  - `dispatch/` répond à « **qui maintenant** ? » — temps réel, IA, audio MacroDroid, picker.
  - `scheduling/` répond à « **quand exactement** ? » — créneaux, conflits, drag-board.
- **`planningHub/` ≠ `calendar/`** :
  - `planningHub/` = page slot 8 du pager admin (vue jour, focus opérationnel).
  - `calendar/` = grille mensuelle macro + ICS, deep links → ouvre dans planningHub ou backoffice.
- **`planningHub/` est un Hub** (voir [`HUB_PATTERN.md`](./HUB_PATTERN.md)) — UI + métriques + (pas d'agent IA dédié actuellement). Sa source de vérité reste `interventions/` et `technicians/`.

## Frontière import

- `dispatch/` consomme `interventions/`, `technicians/`, `map/` — couche temps réel orchestrée.
- `scheduling/` consomme `interventions/` (lecture/écriture `scheduledDate`, `scheduledTime`).
- `planningHub/` consomme `scheduling/` + `technicians/` + `interventions/` — couche **présentation** seulement.
- `calendar/` reste isolée (export ICS, deep link) — pas de logique métier d'assignation.

## Flux typique

```
nouvelle demande (interventions/)
    → dispatch IA (dispatch/rankTechniciansForIntervention) → picker
    → assignation (interventions/assignInterventionToTechnician)
    → planification (scheduling/updateInterventionSchedule)
    → visualisation patron (planningHub/PlanningHubPage)
    → vue calendaire (calendar/, export ICS)
```

## Pour un agent

1. Modifier l'algorithme de scoring technicien → `dispatch/rankTechniciansForIntervention.ts`.
2. Ajouter une règle de conflit créneau → `scheduling/`.
3. Changer l'apparence de la page slot 8 → `planningHub/`.
4. Toucher à l'export ICS → `calendar/`.
5. Ne **pas** mélanger : un changement d'algo dispatch n'a rien à faire dans planningHub (vue), et inversement.

---

_Convention documentée juin 2026._
