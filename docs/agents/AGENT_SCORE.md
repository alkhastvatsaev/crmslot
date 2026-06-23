# Score agent-readiness

Mesure la préparation du repo pour **Cursor** et **Claude** (navigation, barrels, sécurité build).

## Commande

```bash
npm run agent:score
npm run agent:score -- --json
npm run agent:score -- --min=90   # exit 1 si sous le seuil
```

## Paliers

|     Score | Signification                                                             |
| --------: | ------------------------------------------------------------------------- |
|  **70 %** | Production OK pour agents — README, barrels, 0 god file ≥300 L            |
|  **90 %** | Cible — index.server complet, <10 fichiers ≥250 L, types ≥85 % via barrel |
| **100 %** | Irréaliste sans casser cycles / bundle                                    |

## Pondération

- **Structure** (15 %) — README + `index.ts` par zone
- **Taille fichiers** (20 %) — pénalité ≥250 L et ≥300 L
- **Imports** (25 %) — `import type` via barrel (hors intra-zone)
- **Serveur** (15 %) — `index.server.ts` pour zones avec `server/`
- **Hubs** (10 %) — `page.tsx` et contextes stables
- **Tests** (10 %) — peu de fichiers test ≥300 L
- **Freeze** (5 %) — règle + ce doc présents

## Vers 90 %

1. Compléter `index.server.ts` (billing, commissions, interventions, …)
2. Découper les ~34 fichiers prod ≥250 L (priorité chatbot, interventions)
3. Migrer `import type` cross-feature deep → barrel
4. Éclater `chatbot-tool-executor.test.ts` (757 L)
5. **Geler** les refactors structure sans ticket

## Hors scope

- Migrer les imports **valeur** deep entre features
- Découper sous 200 L partout

- **Constantes de slot** (`*_SLOT_INDEX`) : deep `*Constants.ts`, pas barrel hub (cycles Jest).
