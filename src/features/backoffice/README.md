# backoffice

Inbox patron / dispatch : demandes entrantes, chat portail Ivana, rapports terrain, assignation techniciens.

## Points d'entrée

| Fichier                                             | Rôle                                               |
| --------------------------------------------------- | -------------------------------------------------- |
| `components/BackOfficeInboxPanel.tsx`               | Panel inbox (rail droit carte + hub)               |
| `components/TerrainReportDetailPanel.tsx`           | Orchestrateur détail rapport terrain (~105 lignes) |
| `hooks/useTerrainReportDetailPanelController.ts`    | État reject + dérivés client / archive             |
| `components/TerrainReportClientCard.tsx`            | Identité client + problème                         |
| `components/TerrainReportAudioSection.tsx`          | Message vocal + transcription                      |
| `components/TerrainReportPhotosGrid.tsx`            | Grille photos rapport                              |
| `components/TerrainReportSignatureSection.tsx`      | Signature client                                   |
| `components/TerrainReportRejectForm.tsx`            | Formulaire rejet inline                            |
| `components/TerrainReportActionBar.tsx`             | Verify / reject / archive                          |
| `terrainReportDetailPanelTypes.ts`                  | Types + lecture transcription                      |
| `components/BackOfficeDashboardPanel.tsx`           | Orchestrateur tableau dossiers (~145 lignes)       |
| `components/BackOfficeDashboardSummaryCards.tsx`    | KPI jour terminé / facturé / CA / nouveau          |
| `components/BackOfficeDashboardFilters.tsx`         | Filtres période, société, technicien, statut       |
| `components/BackOfficeDashboardTableSection.tsx`    | Table interventions + états vide/loading           |
| `components/BackOfficeDashboardGate.tsx`            | Écran invitation société requise                   |
| `backOfficeDashboardFormat.ts`                      | Format EUR + libellés technicien filtres           |
| `components/InterventionDetailPanel.tsx`            | Orchestrateur détail dossier (~187 lignes)         |
| `components/InterventionDetailScrollBody.tsx`       | Orchestrateur scroll détail (~130 lignes)          |
| `hooks/useInterventionDetailScrollBody.ts`          | État dérivé (queue, alertes technicien)            |
| `components/InterventionDetailClientHeader.tsx`     | Badge statut + identité client                     |
| `components/InterventionDetailAddressSection.tsx`   | Adresse intervention                               |
| `components/InterventionDetailProblemSection.tsx`   | Problème / rapport                                 |
| `components/InterventionDetailScheduleSection.tsx`  | Créneau demandé (file entrante)                    |
| `components/InterventionDetailPhotosSection.tsx`    | Grille photos client / complétion                  |
| `components/InterventionDetailAudioSection.tsx`     | Message vocal + transcription                      |
| `components/InterventionDetailSignatureSection.tsx` | Signature client (rapports)                        |
| `components/InterventionDetailAlertsSection.tsx`    | Alertes amendement / revue facture                 |
| `components/InterventionDetailQuotePdfButton.tsx`   | Téléchargement PDF devis (PWA v2)                  |
| `components/InterventionDetailActionBar.tsx`        | Barre d'actions (assign, créneaux, verify/reject)  |
| `components/IncomingClientRequestsPanel.tsx`        | Orchestrateur file entrante (~70 lignes)           |
| `hooks/useIncomingClientRequestsController.ts`      | État + handlers assign / delete / date             |
| `components/IncomingClientRequestsList.tsx`         | Cartes demandes en attente                         |
| `components/IncomingClientRequestDetail.tsx`        | Overlay détail + assignation                       |
| `incomingRequestClientDisplayName.ts`               | Libellé client formaté                             |
| `hooks/useBackOfficeInboxState.ts`                  | Orchestrateur inbox (~270 lignes)                  |
| `hooks/useBackOfficeInboxSelection.ts`              | Tabs, sélection, intent pager                      |
| `hooks/useBackOfficeInboxPortalChat.ts`             | Abonnement chat portail Ivana                      |
| `hooks/useBackOfficeInboxActions.ts`                | Compose handlers inbox (~20 lignes)                |
| `hooks/useBackOfficeInboxAssignActions.ts`          | Assignation + planning drag board                  |
| `hooks/useBackOfficeInboxReportActions.ts`          | Verify / archive / reject rapports                 |
| `hooks/useBackOfficeInboxMiscActions.ts`            | Delete + PDF devis                                 |
| `backOfficeInboxActionsTypes.ts`                    | Types args handlers inbox                          |
| `hooks/useBackOfficeInboxTerrainBridge.ts`          | Rapports terrain bridgés offline                   |
| `backOfficeInboxLists.ts`                           | Pure functions — listes inbox                      |
| `useBackOfficeInterventions.ts`                     | Hook Firestore interventions société               |
| `assignInterventionFromBackoffice.ts`               | Assignation depuis inbox                           |
| `components/IvanaClientChatPanel.tsx`               | Chat portail client (~80 lignes)                   |
| `hooks/useIvanaClientChatPanel.ts`                  | Orchestrateur chat portail (~215 lignes)           |
| `hooks/useIvanaClientChatFirestoreSync.ts`          | Abonnement Firestore + merge optimiste             |
| `hooks/useIvanaClientChatSend.ts`                   | Envoi messages + images                            |
| `ivanaChatMessageMerge.ts`                          | Mapping Firestore → messages UI                    |
| `ivanaChatImageFiles.ts`                            | Lecture fichiers image (data URLs)                 |
| `ivanaChatFirestore.ts`                             | Messages portail Firestore                         |

## Données

- Firestore : `interventions`, messages portail (via `ivanaChatFirestore`)
- Pas de collection `backoffice` dédiée

## Dépendances autorisées

- `interventions` — types, workflow, schedule (**77 imports — normal**)
- `crmHistory` — `logCrmInterventionAction`
- `scheduling` — conflits, `updateInterventionSchedule`
- `billing` — preview facture, PDF devis
- `auth` — session portail client

**Intent** : `context/BackofficeInboxIntentContext.tsx` (focus depuis map/autres pages)

## Pièges

- Inbox découpée en sous-hooks — ne pas rajouter de logique dans l'orchestrateur sans extraire
- Inbox aussi embarquée dans `MapboxView.tsx` — tester les deux layouts
- `isSyntheticInterventionId` pour démos

## Tests

```bash
npx jest src/features/backoffice --no-coverage
```
