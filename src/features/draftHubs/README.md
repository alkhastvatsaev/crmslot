# draftHubs

Stub bandeau UI brouillon hub (non importé).

## Points d'entrée

| Fichier      | Rôle                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| \`index.ts\` | **Barrel public** — imports cross-feature via \`@/features/draftHubs\` |
| _(dossier)_  | Voir fichiers racine et `components/`                                  |

## Données

- Voir implémentation — pas de hub pager dédié sauf mention contraire.

## Dépendances

- `interventions`, `dashboard`, `context/CompanyWorkspaceContext` selon feature.

## Pièges

- Feature fine ou stub — vérifier montage réel avant modification UI.

## Tests

```bash
npx jest src/features/draftHubs --no-coverage
```
