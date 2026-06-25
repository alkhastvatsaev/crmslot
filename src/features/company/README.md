# company

Portail demandeur `/m/demande`, workspace multi-société, helpers hubs.

## Points d'entrée

| Fichier                            | Rôle                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| \`index.ts\`                       | **Barrel public** — imports cross-feature via \`@/features/company\` |
| `components/ClientMobileApp.tsx`   | Shell `/m/demande`                                                   |
| `components/CompanyHubPage.tsx`    | UI portail client                                                    |
| `resolveHubCompanyId.ts`           | Société active hubs admin                                            |
| `components/CompanySpacePanel.tsx` | Paramètres admin société                                             |

## Données

- Firestore : `companies`, `users/{uid}/company_memberships`, `interventions`
- API : `/api/company/join-default`, `/api/company/sync-claims`, `/api/company/staff`

## Dépendances

- `auth`, `interventions`, `dashboard`, `backoffice`, `clients`, `materials`

## Pièges

- Hors carrousel admin — route `/m/demande`
- `sync-claims` après changement membership

## Avis Google (GMB) — config en attente

> **Lien GMB à fournir par le patron** (prévu demain ou ce week-end, juin 2026).
> En attendant : feature **désactivée** par défaut — rien ne part aux clients.

Quand le lien est prêt :

1. `NEXT_PUBLIC_FF_GOOGLE_REVIEW=true` (Vercel / `.env.local`)
2. Espace société → panneau **Avis Google** → activer le toggle
3. Coller le **Place ID** ou l’**URL** `https://search.google.com/local/writereview?placeid=…`
4. Sauvegarde auto au blur du champ

Comportement par défaut (anti-spam) : 1 email, 48 h après paiement, opt-out client respecté.
Code : `src/features/notifications/googleReviewRequest.ts` · cron `/api/cron/google-review-requests`.

## Tests

```bash
npm run test:native-infra
npx jest src/features/company --no-coverage
```
