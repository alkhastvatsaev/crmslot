# Panneaux mobile ↔ desktop

Mapping entre la géométrie desktop (rails milimétrés) et le shell mobile PWA.

## Principe

| Couche                | Desktop                            | Mobile                                             |
| --------------------- | ---------------------------------- | -------------------------------------------------- |
| **Structure logique** | 3 rails : gauche · centre · droite | Même 3 slots, **1 visible** + swipe                |
| **Pont React**        | `DashboardTriplePanelLayout`       | `MobileHubLayout` via `AdaptiveTriplePanelLayout`  |
| **Chrome visuel**     | `GlassPanel` + `.panel-glass`      | Idem (`mobileHubPanelGlassShellClass`)             |
| **CSS tokens**        | `dashboard-layout.css`             | `dashboard-mobile-layout.css` + `panel-tokens.css` |

## Composants

```
AdaptiveTriplePanelLayout
├── desktop → DashboardTriplePanelLayout (grille 3 colonnes)
└── mobile  → MobileHubLayout (swipe, GlassPanel)
```

**Page carte** : `MapHubMobileTripleLayout` → même pont que les hubs.

Ordre des rails **carte** :

| Rail   | Desktop          | Mobile           |
| ------ | ---------------- | ---------------- |
| Gauche | Missions du jour | Carte            |
| Centre | Carte Mapbox     | Missions du jour |
| Droite | Inbox            | Inbox            |

Les autres hubs gardent le même ordre gauche/centre/droite sur les deux plateformes.

## Fichiers source de vérité

| Fichier                                 | Rôle                                             |
| --------------------------------------- | ------------------------------------------------ |
| `src/core/ui/dashboardDesktopLayout.ts` | Rails 380 \| 500 \| 380 px, coques glass desktop |
| `src/core/ui/dashboardMobileLayout.ts`  | Shell mobile, `mobileHubPanelGlassShellClass`    |
| `src/app/dashboard-layout.css`          | Grille desktop, galaxy aligné colonne 2          |
| `src/app/dashboard-mobile-layout.css`   | Shell, gouttières, swipe rails                   |
| `src/app/panel-tokens.css`              | Ombres / blur `.panel-glass` (partagé)           |

## Radius

Desktop et mobile : **24px** (`--mobile-panel-radius: 1.5rem` = `panel-glass` desktop).

## Tests

```bash
npm run test:mobile-shell
npx jest src/features/map src/features/dashboard --no-coverage
```

## Évolutions possibles

1. Carte desktop → `AdaptiveTriplePanelLayout` + shells map dédiés (aujourd'hui `MapboxViewDesktopLayout` custom).
2. Variables mobile dérivées des ratios rails desktop (largeur effective du panneau unique).
3. Galaxy mobile aligné sur la même logique « colonne centre » que desktop.
