# map

Carte Mapbox (slot 0 du DashboardPager) : missions dispatch/terrain, markers, routes, transcription IA, galaxy layer.

## Points d'entrée

| Fichier                                         | Rôle                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `components/MapPageSlot.tsx`                    | Slot lazy-loadé depuis `src/app/page.tsx`                             |
| `components/MapboxView.tsx`                     | Orchestrateur carte (~230 lignes)                                     |
| `hooks/useMapHubMissions.ts`                    | Missions + inbox partagé avec MobileMapHubLite                        |
| `mapMissionTransforms.ts`                       | Pure functions Intervention → Mission                                 |
| `hooks/useMapboxInstance.ts`                    | Init / lifecycle WebGL Mapbox                                         |
| `hooks/useMapMissionMarkers.ts`                 | Sync markers DOM                                                      |
| `components/MapboxViewDesktopLayout.tsx`        | Layout 3 colonnes desktop                                             |
| `components/DashboardGalaxyLayer.tsx`           | Overlay galaxy + bridge chatbot                                       |
| `components/MapTranscriptionActionsPanel.tsx`   | Panneau création intervention depuis audio                            |
| `hooks/useMapTranscriptionActionsController.ts` | Orchestrateur actions transcription (~105 lignes)                     |
| `hooks/useMapTranscriptionActionsPoll.ts`       | Polling `/api/ai/latest-audio` ou clip scopé                          |
| `hooks/useMapTranscriptionActionsRailRect.ts`   | Alignement panneau édition sur rail gauche                            |
| `hooks/useMapTranscriptionActionsCreate.ts`     | Refus + création intervention (API / fallback Firestore)              |
| `components/MapTranscriptionOverlay.tsx`        | Orchestrateur calque transcription (~35 lignes)                       |
| `hooks/useMapTranscriptionOverlayController.ts` | Orchestrateur overlay transcription (~75 lignes)                      |
| `hooks/useMapTranscriptionOverlayPoll.ts`       | Polling API + sessions transcript                                     |
| `hooks/useMapTranscriptionOverlayReveal.ts`     | Révélation texte synchronisée audio / fallback                        |
| `components/MapTranscriptionOverlayView.tsx`    | Scrim + texte + fermeture                                             |
| `mapTranscriptionReveal.ts`                     | Pure functions révélation synchronisée audio                          |
| `mapTranscriptionOverlayTypes.ts`               | Types props overlay transcription                                     |
| `components/MobileMapHubLite.tsx`               | Variante mobile allégée                                               |
| `missionTypes.ts`                               | Type `Mission` — importable par dashboard sans toucher aux composants |

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

- `MapboxView.tsx` découpé en hooks + layout — ne pas ré-agglomérer
- Policy mobile : `mapMobileWebGLPolicy.ts`, `useMobileMapRenderGate.ts`, `mapMobilePower.ts`
- Doublons macOS `* 2.ts` — supprimer immédiatement

## Tests

```bash
npx jest src/features/map --no-coverage
```
