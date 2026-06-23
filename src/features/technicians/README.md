# technicians

Profils techniciens (`technicians` Firestore), compétences, cockpit terrain (lab hors carrousel) et dashboard de performance.

## Points d'entrée

| Fichier                                         | Rôle                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| `hooks.ts`                                      | `useTechnicians` — abonnement société              |
| `types.ts`                                      | Types `Technician`, `TechnicianSkill` (20 imports) |
| `skillConstants.ts`                             | Catalogue compétences                              |
| `components/TechnicianCockpit.tsx`              | Cockpit terrain (~275 lignes)                      |
| `components/TechnicianLabCarouselPage.tsx`      | Page lab (hors slots admin)                        |
| `components/TechnicianLabView.tsx`              | Vue lab (3 panneaux)                               |
| `components/{Left,Center,Right}Panel.tsx`       | Layout lab                                         |
| `components/TechnicianPerformanceDashboard.tsx` | Dashboard KPI technicien (~290 L)                  |
| `components/MissionFinishModal.tsx`             | Modal fin mission (signature, photos)              |
| `components/TapToPayModal.tsx`                  | Modal paiement Tap-to-Pay                          |
| `components/SkillsTagEditor.tsx`                | Édition compétences                                |
| `components/TourOptimizeButton.tsx`             | Optimisation tournée (consommé par `map/`)         |
| `components/ARScanner.tsx`                      | Scanner AR (caméra)                                |
| `technicianLabConstants.ts`                     | Constantes lab                                     |
| `withTechnicianAuthUid.ts`                      | Guard auth pour routes techniciens                 |
| `demoTechnicianCatalog.ts`                      | Données démo                                       |

## Données

- Firestore : `technicians`
- Liens : `interventions.technicianId` (assignation)

## Dépendances autorisées

- `map/` — `TourOptimizeButton` consommé par carte
- `dispatch/` — ranking, assignation
- `backoffice/` — sélecteur technicien inbox
- `planningHub/` — rows technicien
- `teamHub/` — annuaire staff

## Pièges

- Lab `/technicians/lab` = page hors carrousel — pas dans `dashboardCarouselRegistry`
- `useAccountRole` (auth) détermine si user = technicien
- `TechnicianPerformanceDashboard` et `TechnicianCockpit` >250 L sans test — candidats P1

## Tests

```bash
npx jest src/features/technicians --no-coverage
```
