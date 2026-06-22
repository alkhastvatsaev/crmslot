# catalog

Catalogue produits + recherche Lecot.

## Points d'entrée

| Fichier                   | Rôle                     |
| ------------------------- | ------------------------ |
| `CompanyCatalogPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_          | Modules colocalisés      |

## Données

- companies/{id}/products

## Dépendances

- chatbot, materials, featureHub

## Pièges

- Flag lecotProductSearch

## Tests

```bash
npm run test:feature-hub
```
