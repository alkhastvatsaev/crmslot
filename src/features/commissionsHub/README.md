# commissionsHub

UI hub commissions patron : métriques revenus, distribution, taux techniciens (slot pager).

**Ne pas confondre avec `commissions/`** — `commissions/` = moteur Firestore ; **ce dossier** = visualisation patron.

## Points d'entrée

| Fichier                             | Rôle                     |
| ----------------------------------- | ------------------------ |
| `components/CommissionsHubPage.tsx` | Page slot                |
| `commissionsHubPatronMetrics.ts`    | Agrégats revenus / parts |
| `hooks/useCommissionsHubData.ts`    | Chargement Firestore     |
| `commissionsHubConstants.ts`        | Index pager              |

## Dépendances autorisées

- `commissions/commissionFirestore.ts` — données brutes
- `interventions/technicianSchedule.ts` — filtres missions

## Voir aussi

- `src/features/commissions/README.md`

## Tests

```bash
npx jest src/features/commissionsHub --no-coverage
```
