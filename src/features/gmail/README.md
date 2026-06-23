# gmail

Hub Gmail carrousel (`GMAIL_HUB_SLOT_INDEX`, accès Spotlight). OAuth, lecture/envoi, lien ou création intervention.

## Points d'entrée

| Fichier                                    | Rôle                                      |
| ------------------------------------------ | ----------------------------------------- |
| `components/GmailHubPage.tsx`              | Layout page (~136 lignes)                 |
| `components/GmailHubReaderPane.tsx`        | Orchestrateur panneau droit (~130 lignes) |
| `components/GmailHubComposePane.tsx`       | Rédaction email inline                    |
| `components/GmailHubPdfPreviewPane.tsx`    | Aperçu PDF pièce jointe                   |
| `components/GmailHubMessageDetailPane.tsx` | Détail message + fil                      |
| `components/GmailHubMessageToolbar.tsx`    | Actions lecture (star, archive…)          |
| `components/GmailHubThreadMessageList.tsx` | Messages du fil                           |
| `gmailHubWrapHtmlEmail.ts`                 | Enveloppe HTML iframe sandbox             |
| `hooks/useGmailHubPageController.ts`       | Orchestrateur hub (~230 lignes)           |
| `hooks/useGmailHubCompose.ts`              | Rédaction / envoi / réponse               |
| `hooks/useGmailHubReaderActions.ts`        | Star, archive, corbeille, labels          |
| `hooks/useGmailHubOAuthReturn.ts`          | Callback OAuth au retour URL              |
| `hooks/useGmailHubAccountActions.ts`       | Connexion / déconnexion Gmail             |
| `useGmailHub.ts`                           | Orchestrateur état API Gmail (~95 lignes) |
| `gmailHubApi.ts`                           | Appels API Gmail purs                     |
| `gmailHubMessagePatches.ts`                | Patch liste (lu / non lu)                 |
| `hooks/useGmailHubConnection.ts`           | Statut OAuth, libellés, déconnexion       |
| `hooks/useGmailHubInbox.ts`                | Liste messages + pagination               |
| `hooks/useGmailHubDetail.ts`               | Fil, détail, actions message              |
| `hooks/useGmailHubPdfPreview.ts`           | Aperçu PDF inline                         |

## Données

- API : `/api/integrations/gmail/*`
- Firestore : tokens OAuth (via routes admin)

## Dépendances

- `backoffice`, `crmHistory`, `dashboard`, `interventions`

## Pièges

- Chargement différé si page inactive (`pageActive`)
- OAuth callback : ref anti double-mount

## Tests

```bash
npm run test:gmail
```
