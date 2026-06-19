# AGENTS — patterns étendus (référence on-demand)

Chargé via `@docs/AGENTS_EXTENDED.md` ou règles scoped — **pas** injecté à chaque tour. Voir `AGENTS.md` pour les règles essentielles.

## Steppers (`AnimatePresence`)

Tout wizard multi-étapes (`RequesterInterventionPanel`, `TechnicianFinishJobPanel`, etc.) — **3 tests minimum** :

1. Indicateur d’étape actif sur la bonne étape à chaque transition.
2. Bouton retour ramène à l’étape précédente.
3. Soumission finale appelle le service métier avec les bons arguments.

Utiliser `waitFor` après chaque `fireEvent.click`.

## Context `localStorage`

Pour un context qui persiste (`RequesterHubContext`, etc.) :

1. `persist → restore` — JSON sérialisé conserve les données.
2. `resetAll` — état par défaut.
3. Migration champ legacy (`societe → login`) si applicable.

Ne pas mocker `localStorage` (jsdom suffit).

## Formulaires réseau

Au moins 3 tests :

1. Soumission bloquée si champ obligatoire manquant.
2. Soumission bloquée si utilisateur non authentifié.
3. Soumission réussie — vérifier les arguments du service.

Surcharger `@/core/config/firebase` si le composant lit `auth.currentUser` (mock global = `null`).

## Panneaux vides (`DashboardTriplePanelLayout`)

Rail gauche/droit vide (`<section></section>`) = sous-composants non câblés. Vérifier les orphelins dans `components/`.

Mock si navigation chatbot : `jest.mock("@/features/featureHub/companyStockChatbot", ...)`.

## Glossaire UI — hub société (carrousel)

| Rail                   | Composant                    | testid / ancre                                                                             |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Gauche — Qui demande ? | `RequesterProfilePanel`      | `company-hub-rail-demande`, `requester-login-rail`, ancre `company-hub-workspace`          |
| Centre — Que réparer ? | `RequesterInterventionPanel` | `requester-intervention-panel`, ancre `company-hub-smart-form`                             |
| Droite — Suivi et chat | onglets tracking/chat        | `company-hub-rail-portail`, `company-hub-right-tab-tracking`, `company-hub-right-tab-chat` |

Classes layout : `dashboard-secondary-panel-left` / `center` / `right`.
