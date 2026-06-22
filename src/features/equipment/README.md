# equipment

Inventaire équipements par client.

## Points d'entrée

| Fichier              | Rôle                     |
| -------------------- | ------------------------ |
| `EquipmentPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_     | Modules colocalisés      |

## Données

- companies/{id}/equipment

## Dépendances

- clients, backoffice

## Pièges

- Flag equipmentInventory

## Tests

```bash
npx jest src/features/equipment --no-coverage
```
