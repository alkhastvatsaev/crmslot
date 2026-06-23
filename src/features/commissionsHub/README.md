# commissionsHub

UI hub commissions patron : métriques revenus, distribution, taux techniciens (slot pager).

**Ne pas confondre avec `commissions/`** — `commissions/` = moteur Firestore ; **ce dossier** = visualisation patron.

## Points d'entrée

| Fichier                                 | Rôle                                 |
| --------------------------------------- | ------------------------------------ |
| `components/CommissionsHubPage.tsx`     | Page slot                            |
| `commissionsHubPatronMetrics.ts`        | Barrel agrégats (import path stable) |
| `commissionsHubPatronMetricsTypes.ts`   | Types KPI / séries / techniciens     |
| `commissionsHubPatronMonthKeys.ts`      | Clés mois + CA intervention          |
| `commissionsHubPatronRules.ts`          | Résolution taux + previews           |
| `commissionsHubPatronKpis.ts`           | KPIs mois courant                    |
| `commissionsHubPatronSeries.ts`         | Séries mensuelles + tendance         |
| `commissionsHubPatronTechnicianRows.ts` | Lignes technicien mois               |
| `hooks/useCommissionsHubData.ts`        | Chargement Firestore                 |
| `commissionsHubConstants.ts`            | Index pager                          |

## Dépendances autorisées

- `commissions/commissionFirestore.ts` — données brutes
- `interventions/technicianSchedule.ts` — filtres missions

## Voir aussi

- `src/features/commissions/README.md`

## Tests

```bash
npx jest src/features/commissionsHub --no-coverage
```
