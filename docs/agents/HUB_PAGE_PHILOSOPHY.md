# Philosophie des pages hub (CRMSLOT)

Guide pour créer ou refondre une page du carrousel admin (`src/app/page.tsx`).

## Principes UX (style Apple — pas le visuel)

| Principe                 | En pratique                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Une info essentielle** | Un seul gros chiffre + une phrase courte (`PatronHubGuide`). Pas de bandeau KPI à 3 colonnes. |
| **Une action claire**    | Une phrase « Touchez X pour… » sous le chiffre. Langage parlé, pas jargon métier.             |
| **Peu de choix**         | 2 chips max (`PatronHubChipRow`) : ex. « En cours \| Terminés », pas 4 filtres avec icônes.   |
| **Tuiles légères**       | Nom + 1 détail (montant, statut). Pas d’e-mail, règle, adresse et date sur la même tuile.     |
| **3 panneaux**           | Gauche = comprendre + filtrer · Centre = liste · Droite = détail / édition.                   |
| **One click**            | 1 clic = sélectionner · formulaire dans le panneau droit, pas de modale.                      |

## Composants partagés

```
src/core/ui/hub/
  PatronHubGuide.tsx      # chiffre hero + label + hint (+ footer optionnel)
  PatronHubChipRow.tsx    # 2–3 filtres texte
  HubButton.tsx           # actions panneau droit
  HubSegmentedControl.tsx # enums compacts
```

## Structure type

```
src/features/<feature>Hub/
  components/
    <Feature>HubPage.tsx        # guide + chips + grille + panneau droit
    <Feature>HubCenterGrid.tsx  # tuiles cliquables (peu de texte)
    <Feature>HubRightPanel.tsx  # détail ou formulaire
  hooks/
    use<Feature>HubData.ts
```

Enregistrer dans `page.tsx`, `dashboardCarouselRegistry.ts`, i18n `*.guide.*`.

## Ce qu’on évite

- Titre + sous-titre + paragraphe d’intro
- Bandeau « brouillon » en prod
- Tableaux à 4 colonnes
- Statuts en anglais (`in_progress`) visibles par l’utilisateur
- Modes multiples (4 boutons icône) quand 2 suffisent

## Tests minimum

- Smoke : guide (`*-kpi-strip`), chips, grille, panneau droit après clic
- Mocker `CompanyWorkspaceContext` + hook data
- `npx jest <feature>Hub --no-coverage`

## Pages hub admin (2026)

| Page        | Pattern                                                        |
| ----------- | -------------------------------------------------------------- |
| Commissions | € du mois · Techniciens \| Réglages · tuile = nom + montant    |
| Équipe      | X actifs · Actifs \| Tous · tuile = initiale + nom             |
| Dossiers    | X en cours · En cours \| Terminés · tuile = client + statut FR |
| Planning    | X missions aujourd’hui · tech à gauche · créneaux au centre    |

---

_Dernière mise à jour : juin 2026_
