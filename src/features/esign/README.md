# esign

Signature portail mock (flag remoteESign).

## Points d'entrée

| Fichier     | Rôle                                  |
| ----------- | ------------------------------------- |
| _(dossier)_ | Voir fichiers racine et `components/` |

## Données

- Voir implémentation — pas de hub pager dédié sauf mention contraire.

## Dépendances

- `interventions`, `dashboard`, `context/CompanyWorkspaceContext` selon feature.

## Pièges

- Feature fine ou stub — vérifier montage réel avant modification UI.

## Tests

```bash
npx jest src/features/esign --no-coverage
```
