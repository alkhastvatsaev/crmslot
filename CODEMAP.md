# CODEMAP

> Auto-généré par `scripts/ci/generate-codemap.mjs` — ne PAS éditer à la main.
> Régénérer : `npm run map`.
>
> Carte rapide pour Claude/Cursor. Pour les règles : voir `CLAUDE.md`, `AGENTS.md`, `docs/agents/`.

## Stats globales

- Fichiers code : **2180**
- Lignes code : **173 865**
- Tests : **510**

## Carrousel — slots (DashboardPager)

Source de vérité : `*Constants.ts` du feature.

| Constante                            | Valeur                           | Fichier                                                      |
| ------------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| `AI_ASSISTANT_SLOT_INDEX`            | -1                               | src/features/ai/aiAssistantConstants.ts                      |
| `AUTO_INVOICE_SLOT_INDEX`            | TECHNICIAN_MOBILE_APP_SLOT_INDEX | src/features/interventions/invoiceConstants.ts               |
| `BACKOFFICE_HUB_SLOT_INDEX`          | 0                                | src/features/backoffice/backofficeHubConstants.ts            |
| `BILLING_HUB_SLOT_INDEX`             | 3                                | src/features/billingHub/billingHubConstants.ts               |
| `CALENDAR_INTEGRATION_SLOT_INDEX`    | 0                                | src/features/calendar/calendarConstants.ts                   |
| `CASE_HUB_SLOT_INDEX`                | 6                                | src/features/caseHub/caseHubConstants.ts                     |
| `CLIENT_MOBILE_APP_SLOT_INDEX`       | 0                                | src/features/company/clientMobileAppConstants.ts             |
| `CLIENT_PORTAL_AUTH_SLOT_INDEX`      | COMPANY_HUB_PAGE_INDEX           | src/features/auth/clientPortalConstants.ts                   |
| `COMMISSIONS_HUB_SLOT_INDEX`         | 7                                | src/features/commissionsHub/commissionsHubConstants.ts       |
| `CRM_HISTORY_SLOT_INDEX`             | 2                                | src/features/crmHistory/crmHistoryConstants.ts               |
| `DUPLICATE_ALERTS_SLOT_INDEX`        | 0                                | src/features/interventions/interventionDuplicateConstants.ts |
| `FEATURE_HUB_SLOT_INDEX`             | 1                                | src/features/featureHub/featureHubConstants.ts               |
| `FINISH_JOB_SLOT_INDEX`              | TECHNICIAN_MOBILE_APP_SLOT_INDEX | src/features/interventions/finishJobConstants.ts             |
| `GMAIL_HUB_SLOT_INDEX`               | 4                                | src/features/gmail/gmailHubConstants.ts                      |
| `OFFLINE_HUB_SLOT_INDEX`             | 5                                | src/features/offline/offlineHubConstants.ts                  |
| `OFFLINE_SYNC_SLOT_INDEX`            | OFFLINE_HUB_SLOT_INDEX           | src/features/offline/offlineSyncConstants.ts                 |
| `PLANNING_HUB_SLOT_INDEX`            | 8                                | src/features/planningHub/planningHubConstants.ts             |
| `PUSH_NOTIFICATIONS_SLOT_INDEX`      | TECHNICIAN_MOBILE_APP_SLOT_INDEX | src/features/notifications/notificationConstants.ts          |
| `SMART_INTERVENTION_FORM_SLOT_INDEX` | COMPANY_HUB_PAGE_INDEX           | src/features/interventions/smartInterventionConstants.ts     |
| `TEAM_HUB_SLOT_INDEX`                | 5                                | src/features/teamHub/teamHubConstants.ts                     |
| `TECHNICIAN_HUB_SLOT_INDEX`          | -1                               | src/features/interventions/technicianDashboardConstants.ts   |
| `TECHNICIAN_LAB_SLOT_INDEX`          | 5                                | src/features/technicians/technicianLabConstants.ts           |
| `TECHNICIAN_MOBILE_APP_SLOT_INDEX`   | 0                                | src/features/interventions/technicianMobileAppConstants.ts   |

## Features (`src/features/`)

Tri par taille. `index.ts` = barrel public. `README.md` = doc feature (5 lignes : but, slot, entry, intent, tests).

| Feature        | Fichiers | Tests | Barrel | README |
| -------------- | -------: | ----: | :----: | :----: |
| interventions  |      342 |    86 |   OK   |   OK   |
| chatbot        |      232 |    62 |   OK   |   OK   |
| backoffice     |      137 |    29 |   OK   |   OK   |
| dashboard      |       85 |    31 |   OK   |   OK   |
| auth           |       71 |    19 |   OK   |   OK   |
| crmHistory     |       63 |    15 |   OK   |   OK   |
| featureHub     |       61 |    22 |   OK   |   OK   |
| catalog        |       59 |    18 |   OK   |   OK   |
| map            |       58 |    10 |   OK   |   OK   |
| company        |       52 |    13 |   OK   |   OK   |
| billing        |       51 |    17 |   OK   |   OK   |
| gmail          |       50 |     5 |   OK   |   OK   |
| dispatch       |       41 |     8 |   OK   |   OK   |
| notifications  |       39 |     9 |   OK   |   OK   |
| commissions    |       35 |     9 |   OK   |   OK   |
| quotes         |       34 |     9 |   OK   |   OK   |
| clients        |       33 |    11 |   OK   |   OK   |
| caseHub        |       27 |     3 |   OK   |   OK   |
| materials      |       25 |     7 |   OK   |   OK   |
| technicians    |       24 |     5 |   OK   |   OK   |
| billingHub     |       23 |     4 |   OK   |   OK   |
| offline        |       21 |     6 |   OK   |   OK   |
| commissionsHub |       20 |     3 |   OK   |   OK   |
| scheduling     |       18 |     6 |   OK   |   OK   |
| planningHub    |       16 |     3 |   OK   |   OK   |
| teamHub        |       16 |     3 |   OK   |   OK   |
| timetracking   |       16 |     6 |   OK   |   OK   |
| calendar       |       15 |     1 |   OK   |   OK   |
| emails         |       14 |     1 |   OK   |   OK   |
| mobile         |       13 |     7 |   OK   |   OK   |
| stock          |       12 |     2 |   OK   |   OK   |
| equipment      |       10 |     3 |   OK   |   OK   |
| geofence       |       10 |     3 |   OK   |   OK   |
| maintenance    |       10 |     2 |   OK   |   OK   |
| copilot        |        9 |     1 |   OK   |   OK   |
| hubAgents      |        9 |     2 |   OK   |   OK   |
| suppliers      |        8 |     2 |   OK   |   OK   |
| analytics      |        7 |     2 |   OK   |   OK   |
| esign          |        7 |     2 |   OK   |   OK   |
| integrations   |        7 |     1 |   OK   |   OK   |
| checklist      |        5 |     1 |   OK   |   OK   |
| claims         |        5 |     1 |   OK   |   OK   |
| communications |        5 |     2 |   OK   |   OK   |
| inbox          |        5 |     1 |   OK   |   OK   |
| notes          |        5 |     1 |   OK   |   OK   |
| reminders      |        5 |     1 |   OK   |   OK   |
| sla            |        5 |     1 |   OK   |   OK   |
| dev            |        4 |     1 |   OK   |   OK   |
| ai             |        3 |     1 |   OK   |   OK   |
| app            |        3 |     1 |   OK   |   OK   |
| draftHubs      |        3 |     1 |   OK   |   OK   |

## Core (`src/core/`)

| Module     | Fichiers | Tests |
| ---------- | -------: | ----: |
| services   |       43 |     7 |
| ui         |       33 |     6 |
| native     |       19 |     5 |
| config     |       15 |     5 |
| api        |       13 |     6 |
| perf       |       13 |     3 |
| pwa        |       11 |     3 |
| analytics  |        6 |     2 |
| i18n       |        3 |     2 |
| firestore  |        2 |     1 |
| monitoring |        2 |     1 |
| time       |        2 |     1 |
| **tests**  |        1 |     1 |
| logger     |        1 |     0 |
| maps       |        1 |     0 |

## API routes (`src/app/api/`)

- `/ai/assistant`
- `/ai/audio-decision`
- `/ai/audio-dispatch`
- `/ai/audio-for-url`
- `/ai/audios`
- `/ai/billing-hub-agent`
- `/ai/chat`
- `/ai/chatbot`
- `/ai/chatbot/document-action`
- `/ai/crm-history-agent`
- `/ai/intervention-problem-suggestions`
- `/ai/latest-audio`
- `/ai/material-agent`
- `/ai/parse-billing`
- `/ai/process-uploads`
- `/ai/resolve-audio-url`
- `/ai/smart-dispatch`
- `/ai/transcribe`
- `/ai/transcribe-blob`
- `/ai/vehicle-stock-agent`
- `/ai/workspace-copilot`
- `/auth/ip`
- `/catalog/lecot-images`
- `/catalog/lecot-search`
- `/companies/[companyId]/commission-rules/technician`
- `/companies/[companyId]/pwa-registry`
- `/companies/[companyId]/quotes/[quoteId]/accept`
- `/companies/[companyId]/quotes/[quoteId]/send`
- `/companies/[companyId]/supplier-orders/[orderId]/pdf`
- `/companies/[companyId]/webhooks`
- `/company/accept-invite`
- `/company/join-default`
- `/company/staff`
- `/company/staff/[uid]`
- `/company/sync-claims`
- `/cron/appointment-reminders`
- `/cron/auto-agent`
- `/cron/keep-warm`
- `/cron/operations-tick`
- `/cron/weekly-digest`
- `/e2e/seed-assigned-intervention`
- `/e2e/seed-done-intervention`
- `/e2e/seed-portal-quote`
- `/email`
- `/email/send`
- `/esign/mock-complete`
- `/health`
- `/integrations/gmail/auth-url`
- `/integrations/gmail/callback`
- `/integrations/gmail/connect`
- `/integrations/gmail/disconnect`
- `/integrations/gmail/labels`
- `/integrations/gmail/messages`
- `/integrations/gmail/messages/[messageId]`
- `/integrations/gmail/messages/[messageId]/attachments/[attachmentId]`
- `/integrations/gmail/messages/[messageId]/create-intervention`
- `/integrations/gmail/messages/[messageId]/link-intervention`
- `/integrations/gmail/messages/[messageId]/link-suggestions`
- `/integrations/gmail/messages/[messageId]/modify`
- `/integrations/gmail/messages/[messageId]/trash`
- `/integrations/gmail/status`
- `/integrations/gmail/threads/[threadId]`
- `/interventions/[id]/assign`
- `/interventions/[id]/auto-assign`
- `/interventions/[id]/completion-amend`
- `/interventions/[id]/dispatch-status-webhook`
- `/interventions/[id]/document-pdf`
- `/interventions/[id]/e-invoice`
- `/interventions/[id]/issue-invoice`
- `/interventions/[id]/portal-access-notify`
- `/interventions/[id]/portal-token`
- `/interventions/[id]/prepare-draft-billing`
- `/interventions/[id]/quote-pdf`
- `/interventions/[id]/reject-report`
- `/interventions/[id]/request-invoice-review`
- `/interventions/[id]/request-signature`
- `/interventions/[id]/send-client-invoice`
- `/interventions/[id]/technician-response`
- `/interventions/[id]/transition`
- `/interventions/[id]/validate-report`
- `/interventions/from-audio`
- `/interventions/local`
- `/maintenance/generate-due`
- `/maps/distance`
- `/maps/geocode`
- `/mobile/config`
- `/notifications/send`
- `/notifications/whatsapp`
- `/portal-chat/notify-client`
- `/portal-chat/notify-staff`
- `/portal/[token]`
- `/portal/[token]/quotes/[quoteId]/accept`
- `/portal/[token]/quotes/[quoteId]/decline`
- `/portal/[token]/request-signature`
- `/portal/access/verify`
- `/portal/unsubscribe/[token]`
- `/sms`
- `/stripe/balance`
- `/stripe/create-payment-intent`
- `/stripe/create-payment-link`
- `/stripe/mock-pay`
- `/suppliers/order`
- `/webhooks/email/inbound`
- `/webhooks/esign`
- `/webhooks/inbound-email`
- `/webhooks/stripe`
- `/webhooks/twilio/incoming`
- `/webhooks/twilio/recording`

## Conventions clés

- 1 feature = 1 dossier sous `src/features/<nom>/`.
- Barrel `index.ts` exporte API publique uniquement.
- Slots définis dans `*Constants.ts` du feature, jamais ailleurs.
- Tests colocalisés dans `__tests__/`.
- Imports : `@features/*`, `@core/*`, `@context/*` — pas de deep imports hors barrel.

## Docs liées

- `CLAUDE.md` — règles agent
- `AGENTS.md` — règles tests
- `docs/agents/HUB_PATTERN.md` — convention hubs
- `docs/agents/PARALLEL_WORK.md` — zones Claude/Cursor
- `docs/agents/MESSAGING_PATTERN.md`, `MATERIEL_PATTERN.md`, `PLANNING_PATTERN.md` — frontières
