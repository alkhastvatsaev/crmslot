# Convention features `*Hub*` (CRMSLOT)

Pourquoi le repo a-t-il à la fois `billing/` **et** `billingHub/`, `commissions/` **et** `commissionsHub/` ? Cette page répond. Lire avant de toucher un dossier dont le nom contient `Hub`.

> UX/layout des pages hub : voir [`HUB_PAGE_PHILOSOPHY.md`](./HUB_PAGE_PHILOSOPHY.md). Ce document-ci traite uniquement de la **séparation des responsabilités** entre `<domaine>/` et `<domaine>Hub/`.

## Règle générale

| Type            | Contient                                                                      | Exemple                                                         |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `<domaine>/`    | Logique métier pure : Firestore, calculs, génération PDF, types canoniques.   | `billing/` = PDF, UBL, Stripe ; `commissions/` = moteur règles. |
| `<domaine>Hub/` | UI **page du carrousel** + **agent IA** scopé domaine + métriques KPI patron. | `billingHub/` = page slot + agent IA facturation.               |

Un Hub **importe** son `<domaine>/` (jamais l'inverse). Un Hub n'a pas le droit de stocker la vérité métier — c'est une couche de présentation et d'orchestration agent.

## Les 8 dossiers `*Hub*`

| Dossier           | Slot pager | Domaine sous-jacent                | Rôle principal                             |
| ----------------- | ---------- | ---------------------------------- | ------------------------------------------ |
| `featureHub/`     | 1          | `materials/`, `stock/`, `catalog/` | Hub Matériel + agent matériel              |
| `billingHub/`     | 3          | `billing/`                         | Hub Facturation + agent billing            |
| `teamHub/`        | 5          | `technicians/`, `company/`         | Hub Équipe (annuaire staff)                |
| `caseHub/`        | 6          | `interventions/`, `backoffice/`    | Hub Dossiers (pipeline Situation→Agir)     |
| `commissionsHub/` | 7          | `commissions/`                     | Hub Commissions patron (KPI, distribution) |
| `planningHub/`    | 8          | `interventions/`, `technicians/`   | Hub Planning (jour technicien, créneaux)   |
| `hubAgents/`      | —          | transversal                        | Panel agent IA partagé + scopes outils     |
| `draftHubs/`      | —          | (stub)                             | Brouillon non importé — à supprimer ou doc |

Source de vérité pour le slot : `src/features/<hub>/<hub>Constants.ts` (`*_SLOT_INDEX`). Le tableau de `CLAUDE.md` peut être en retard — toujours préférer le constant.

## Frontière Hub ↔ domaine

- `billingHub/` peut importer `@/features/billing` (barrel). **Pas** `billing/server/*` interne.
- `commissionsHub/` peut importer `@/features/commissions/types`, pas `commissionFirestoreRules.ts` directement (passer par un export du barrel).
- Inverse interdit : `billing/` ne doit jamais importer `billingHub/`.

## Structure type d'un Hub

```
src/features/<x>Hub/
  components/
    <X>HubPage.tsx                # page slot pager (lazy-loadée)
    <X>HubCenterGrid.tsx          # tuiles
    <X>HubRightPanel.tsx          # détail / édition
  hooks/
    use<X>HubData.ts              # chargement Firestore
    use<X>HubAgent.ts             # client SSE agent IA (si applicable)
  <x>HubAgentRouteHandler.ts      # handler route API agent
  <x>HubAgentScope.ts             # outils chatbot autorisés
  <x>HubAgentSystemPrompt.ts      # prompt système agent
  <x>HubAgentSnapshot.ts          # contexte injecté à l'agent
  <x>HubConstants.ts              # SLOT_INDEX, events DOM
  <x>HubMetrics.ts                # agrégations KPI
```

Tous les hubs n'ont pas toutes ces pièces (`teamHub` n'a pas d'agent IA, `hubAgents` n'a pas de page). Adapter selon le besoin.

## Agent IA scopé Hub

Pattern : chaque Hub avec agent expose une route `/api/ai/<hub>-agent` qui réutilise `runChatbotOpenAI` mais avec un **scope d'outils restreint** (voir `*Agent*Scope.ts`) et un **system prompt** dédié (`*Agent*SystemPrompt.ts`). Le pipeline SSE est celui du chatbot, le scope filtre les outils côté serveur. Voir `src/features/chatbot/` pour le pipeline partagé.

## Pour un agent (Cursor / Claude Code)

1. Tâche dans `<x>Hub/` : lire son `README.md` puis ce fichier.
2. Ne pas déplacer un fichier de `<domaine>/` vers `<domaine>Hub/` (ni l'inverse) sans demande explicite — ça change l'API publique.
3. Modifier un outil chatbot ? Probablement dans `chatbot/`, pas dans le Hub.
4. Ajouter une page slot ? Voir [`HUB_PAGE_PHILOSOPHY.md`](./HUB_PAGE_PHILOSOPHY.md) **après** ce document.

---

_Convention documentée juin 2026. Si tu ajoutes un 9ᵉ Hub, mettre à jour le tableau ci-dessus._
