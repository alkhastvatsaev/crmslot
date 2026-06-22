# gmail

Hub Gmail carrousel (`GMAIL_HUB_SLOT_INDEX`, accès Spotlight). OAuth, lecture/envoi, lien ou création intervention.

## Points d'entrée

| Fichier                              | Rôle                             |
| ------------------------------------ | -------------------------------- |
| `components/GmailHubPage.tsx`        | Layout page (~136 lignes)        |
| `hooks/useGmailHubPageController.ts` | Orchestrateur UI, OAuth, clavier |
| `useGmailHub.ts`                     | État API Gmail                   |
| `hooks/useGmailHubPdfPreview.ts`     | Aperçu PDF inline                |

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
