# map

Carte Mapbox (slot 0 du DashboardPager) : missions dispatch/terrain, markers, routes, transcription IA, galaxy layer.

## Points d'entrée

| Fichier                               | Rôle                                                                  |
| ------------------------------------- | --------------------------------------------------------------------- |
| `components/MapPageSlot.tsx`          | Slot lazy-loadé depuis `src/app/page.tsx`                             |
| `components/MapboxView.tsx`           | Hub carte desktop (3 colonnes) — **1137 lignes, P0 découpage**        |
| `components/DashboardGalaxyLayer.tsx` | Overlay galaxy + bridge chatbot                                       |
| `components/MobileMapHubLite.tsx`     | Variante mobile allégée                                               |
| `missionTypes.ts`                     | Type `Mission` — importable par dashboard sans toucher aux composants |

## Données

- Firestore : `interventions` (via hooks backoffice / technicien, pas de collection dédiée map)
- Firestore : `ai_status/macrodroid` (audio MacroDroid, consommé par `dispatch/useAiAudioPlayback`)
- API : `/api/ai/audios`, `/api/ai/resolve-audio-url`

## Dépendances autorisées (imports cross-feature)

- `dashboard` — pager, DailyMissions, layout mobile
- `backoffice` — inbox embarquée, interventions dispatch
- `interventions` — types, `technicianSchedule`, tracking
- `technicians` — TourOptimizeButton
- `dispatch` — AiAssistant strip
- `company` — `isCompanyDispatchViewer`

**Éviter** : importer des composants profonds d'autres features — préférer types/helpers racine.

## Pièges

- `MapboxView.tsx` mélange init WebGL, markers, layout 3 colonnes et inbox
- Policy mobile : `mapMobileWebGLPolicy.ts`, `useMobileMapRenderGate.ts`, `mapMobilePower.ts`
- Doublons macOS `* 2.ts` — supprimer immédiatement

## Tests

```bash
npx jest src/features/map --no-coverage
```
