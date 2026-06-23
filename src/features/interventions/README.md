# interventions

Cœur métier CRM : création demande client, workflow statuts, app technicien terrain, planning, facturation terrain.

## Points d'entrée

| Fichier                                              | Rôle                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `types.ts`                                           | Type `Intervention` — **import public #1** pour toute l'app |
| `technicianSchedule.ts`                              | Barrel schedule technicien (filtres/tri missions)           |
| `technicianScheduleParse.ts`                         | Ancrage dates, coercion Firestore                           |
| `technicianScheduleVisibility.ts`                    | Filtres onglets / file back-office                          |
| `technicianScheduleLabels.ts`                        | Libellés horaires et client                                 |
| `hooks/useSmartForm.ts`                              | Orchestrateur wizard demande client (~220 lignes)           |
| `components/SmartFormStep5Recap.tsx`                 | Orchestrateur étape 5 récap (~95 lignes)                    |
| `components/SmartFormAddressAutocomplete.tsx`        | Orchestrateur autocomplete adresse (~105 lignes)            |
| `hooks/useSmartFormAddressAutocomplete.ts`           | Prédictions Google Places + clavier                         |
| `hooks/smartFormAddressAutocompleteTypes.ts`         | Types Places API + constantes debounce                      |
| `components/SmartFormAddressSuggestionsList.tsx`     | Liste suggestions portail fixed                             |
| `components/SmartFormRecapTiles.tsx`                 | Tuiles contact / lieu / détail / vocal / créneau            |
| `components/SmartFormRecapPhotosSheet.tsx`           | Bandeau photos + modal aperçu                               |
| `components/SmartFormRecapActionBar.tsx`             | Urgence + envoi                                             |
| `smartFormRecapStyles.ts`                            | Classes Tailwind partagées tuiles récap                     |
| `smartFormDraftStorage.ts`                           | Brouillon localStorage + step initial                       |
| `smartFormSubmit.ts`                                 | Orchestrateur soumission wizard smart form (~130 lignes)    |
| `smartFormSubmitTypes.ts`                            | Types input + enregistreur audio                            |
| `smartFormSubmitValidation.ts`                       | Validation pré-soumission smart form                        |
| `smartFormSubmitQueries.ts`                          | Déduplication + géocodage smart form                        |
| `smartFormSubmitAudio.ts`                            | Upload audio démo / Storage / fallback data URL             |
| `smartFormSubmitWrite.ts`                            | Payload Firestore + log CRM création                        |
| `smartFormSubmitBackground.ts`                       | Transcription async, alerte doublon, purge brouillon        |
| `smartFormSubmitHelpers.ts`                          | Auth utilisateur + blob WAV silencieux démo                 |
| `hooks/useSmartFormDraftEffects.ts`                  | Orchestrateur effets brouillon wizard                       |
| `hooks/smartFormDraftEffectsTypes.ts`                | Types args effets brouillon                                 |
| `hooks/useSmartFormDraftPregenerateId.ts`            | Pré-génération id Firestore intervention                    |
| `hooks/useSmartFormDraftPrefill.ts`                  | Prefill sessionStorage client / SAV                         |
| `hooks/useSmartFormDraftAudioEffects.ts`             | Sync enregistreur vocal + sauvegarde démo                   |
| `hooks/useSmartFormDraftRecapEffects.ts`             | Modal photos récap (Escape, reset step)                     |
| `hooks/useSmartFormDraftSyncEffects.ts`              | Chargement remote + autosave local/Firestore + garde step   |
| `hooks/useSmartFormDraftTakenSlots.ts`               | Créneaux déjà pris (étape 5)                                |
| `components/TechnicianFinishJobPanel.tsx`            | Wizard clôture terrain (~155 lignes)                        |
| `hooks/useFinishJobWizard.ts`                        | Orchestrateur wizard clôture (~120 lignes)                  |
| `hooks/useFinishJobWizardCamera.ts`                  | Caméra + capture photos wizard clôture                      |
| `hooks/useFinishJobWizardEffects.ts`                 | Hydratation rapport + prefetch facture brouillon            |
| `hooks/useFinishJobWizardSubmit.ts`                  | Soumission rapport terrain + navigation post-clôture        |
| `hooks/finishJobWizardDraftBilling.ts`               | Prefetch API prepare-draft-billing                          |
| `components/TechnicianFinishInvoiceStep.tsx`         | Orchestrateur étape facture clôture (~55 lignes)            |
| `hooks/useTechnicianFinishInvoice.ts`                | Draft billing + envoi facture terrain                       |
| `components/TechnicianFinishInvoiceSummaryView.tsx`  | Récap total + CTA envoi / ajuster                           |
| `components/TechnicianFinishInvoiceAdjustPanel.tsx`  | Lignes, chips rapides, régénération                         |
| `hooks/useRequesterInterventionForm.ts`              | Portail demandeur (~195 lignes)                             |
| `components/RequesterInterventionPanel.tsx`          | Orchestrateur portail demandeur (~25 lignes)                |
| `hooks/useRequesterInterventionPanelController.ts`   | État + voice + submit portail                               |
| `components/RequesterInterventionSteps.tsx`          | Steps animés AnimatePresence                                |
| `components/RequesterStepPhotos.tsx`                 | Étape photos portail                                        |
| `components/RequesterStepTimeSlot.tsx`               | Étape créneau portail                                       |
| `components/SmartTimeSlotPicker.tsx`                 | Orchestrateur créneaux portail (~55 lignes)                 |
| `components/SmartTimeSlotNextAvailabilities.tsx`     | Liste prochaines dispos                                     |
| `components/SmartTimeSlotSpecificDatePicker.tsx`     | Calendrier + grille horaires jour                           |
| `components/SmartTimeSlotPremiumCalendar.tsx`        | Calendrier mensuel premium                                  |
| `smartTimeSlotConstants.ts`                          | Heures ouvrées + types slots                                |
| `components/RequesterStepAddressSubmit.tsx`          | Étape adresse + envoi                                       |
| `requesterInterventionStepMotion.ts`                 | Variants Framer Motion steps                                |
| `requesterInterventionFormSubmit.ts`                 | Orchestrateur soumission portail (~205 lignes)              |
| `requesterInterventionSubmitValidation.ts`           | Validation pré-soumission portail                           |
| `requesterInterventionSubmitQueries.ts`              | Déduplication + géocodage                                   |
| `requesterInterventionSubmitPayload.ts`              | Champs client + payload Firestore                           |
| `requesterInterventionSubmitBackground.ts`           | Audio async, alerte doublon, notify portal                  |
| `requesterInterventionFormHelpers.ts`                | Auth anonyme + timeout géoloc                               |
| `workflow/interventionWorkflow.ts`                   | Transitions statut                                          |
| `useTechnicianAssignments.ts`                        | Orchestrateur hook missions technicien (~120 lignes)        |
| `useTechnicianAssignmentsTypes.ts`                   | Types retour hook + options                                 |
| `technicianAssignmentsHookCache.ts`                  | Mise à jour cache React Query + terrain offline             |
| `technicianAssignmentsSync.ts`                       | Resync serveur + notifications nouvelles missions           |
| `hooks/useTechnicianAssignmentsFirestoreListener.ts` | Listener auth + snapshot Firestore                          |
| `hooks/useTechnicianAssignmentsResyncEffects.ts`     | Resync foreground, réseau, Capacitor, polling IVANA         |
| `assignInterventionToTechnician.ts`                  | Assignation (seuil coverage P0 100 %)                       |

## Données

- Firestore : `interventions/{id}`, sous-collection `timeline`
- Firestore : brouillons client via localStorage (`smartInterventionConstants`)
- API : `src/app/api/interventions/**` (PDF, assignation, notifications…)

## Dépendances autorisées

- `crmHistory` — log création/action
- `billing` — lignes facturation, PDF
- `scheduling` — conflits créneaux
- `auth` — portail client
- `dashboard` — navigation pager (minimal)

**Hub partagé** : `context/RequesterHubContext.tsx`, `TechnicianFinishJobContext.tsx`

## Pièges

- Feature la plus importée (86 outbound, 77 inbound depuis backoffice)
- Ne pas dupliquer la logique schedule — tout passe par `technicianSchedule.ts`
- `useSmartForm` + `useRequesterInterventionForm` se chevauchent partiellement

## Tests

```bash
npm run test:interventions
# ou ciblé :
npx jest src/features/interventions/hooks --no-coverage
```
