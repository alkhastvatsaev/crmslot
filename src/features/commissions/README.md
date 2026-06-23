# commissions

Moteur commissions techniciens : calcul, Firestore, dashboard règles.

**Ne pas confondre avec `commissionsHub/`** — ce dossier = domaine ; `commissionsHub/` = page patron slot pager.

## Points d'entrée

| Fichier                                       | Rôle                                      |
| --------------------------------------------- | ----------------------------------------- |
| `commissionFirestore.ts`                      | Barrel réexport CRUD (import path stable) |
| `commissionFirestoreTypes.ts`                 | Constantes collections + types audit      |
| `commissionFirestoreRules.ts`                 | CRUD règles + audit règles                |
| `commissionFirestoreInterventions.ts`         | Overrides intervention + audit calcul     |
| `commissionFirestoreManual.ts`                | Saisies manuelles technicien              |
| `components/CommissionDashboard.tsx`          | Orchestrateur dashboard (~50 lignes)      |
| `hooks/useCommissionDashboardController.ts`   | État + handlers règles / saisie manuelle  |
| `components/CommissionDashboardRulesTab.tsx`  | Onglet règles auto                        |
| `components/CommissionDashboardManualTab.tsx` | Onglet saisie manuelle                    |
| `formatCommissionAuditAt.ts`                  | Format dates audit                        |

## Données

- Firestore : règles commission par société, lignes liées aux interventions clôturées

## Dépendances autorisées

- `interventions/types` — montants et statuts dossier

## Voir aussi

- `src/features/commissionsHub/README.md`

## Tests

```bash
npx jest src/features/commissions --no-coverage
```
