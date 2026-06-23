# ai

Constante historique slot chatbot déprécié — voir dispatch/ et chatbot/.

## Points d'entrée

| Fichier      | Rôle                                                            |
| ------------ | --------------------------------------------------------------- |
| \`index.ts\` | **Barrel public** — imports cross-feature via \`@/features/ai\` |
| _(dossier)_  | Voir fichiers racine et `components/`                           |

## Données

- Voir implémentation — pas de hub pager dédié sauf mention contraire.

## Dépendances

- `interventions`, `dashboard`, `context/CompanyWorkspaceContext` selon feature.

## Pièges

- Feature fine ou stub — vérifier montage réel avant modification UI.

## Tests

```bash
npx jest src/features/ai --no-coverage
```
