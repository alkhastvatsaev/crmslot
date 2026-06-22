# commissions

Moteur commissions techniciens : calcul, Firestore, dashboard règles.

**Ne pas confondre avec `commissionsHub/`** — ce dossier = domaine ; `commissionsHub/` = page patron slot pager.

## Points d'entrée

| Fichier                              | Rôle                                 |
| ------------------------------------ | ------------------------------------ |
| `commissionFirestore.ts`             | CRUD règles et lignes commission     |
| `components/CommissionDashboard.tsx` | Dashboard règles (legacy / embarqué) |
| `formatCommissionAuditAt.ts`         | Format dates audit                   |

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
