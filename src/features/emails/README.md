# emails

Emails liés intervention.

## Points d'entrée

| Fichier                      | Rôle                     |
| ---------------------------- | ------------------------ |
| `InterventionEmailPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_             | Modules colocalisés      |

## Données

- intervention_emails

## Dépendances

- interventions, crmHistory

## Pièges

- Panel ~450 lignes

## Tests

```bash
npx jest src/features/emails --no-coverage
```
