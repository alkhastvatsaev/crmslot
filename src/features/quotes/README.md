# quotes

Devis société, acceptation portail.

## Points d'entrée

| Fichier              | Rôle                     |
| -------------------- | ------------------------ |
| `QuoteListPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_     | Modules colocalisés      |

## Données

- companies/{id}/quotes

## Dépendances

- billing, interventions

## Pièges

- Accept via routes admin

## Tests

```bash
npx jest src/features/quotes --no-coverage
```
