# Gmail hub (page carrousel)

Hub Gmail intégré au carrousel (`GMAIL_HUB_SLOT_INDEX`). Layout dans `components/GmailHubPage.tsx` ; logique dans `hooks/useGmailHubPageController.ts`.

- **`useGmailHub`** — état API (liste, fil, envoi, pièces jointes).
- **`useGmailHubPageController`** — état UI, effets OAuth, handlers clavier/actions.
- **`useGmailHubPdfPreview`** — aperçu PDF inline (blob URL, cache miniature).
- **API** — routes `/api/integrations/gmail/*` (OAuth, messages, lien intervention).

Tests : `npm run test:gmail` ou `npx jest src/features/gmail --no-coverage`.
