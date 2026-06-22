# hubAgents

Infra agents IA par hub (panel, scopes outils).

## Points d'entrée

| Fichier             | Rôle                     |
| ------------------- | ------------------------ |
| `HubAgentPanel.tsx` | Point d'entrée principal |
| _(voir dossier)_    | Modules colocalisés      |

## Données

- via outils chatbot serveur

## Dépendances

- chatbot, stock, billingHub, crmHistory

## Pièges

- Outils = serveur uniquement

## Tests

```bash
npx jest src/features/hubAgents --no-coverage
```
