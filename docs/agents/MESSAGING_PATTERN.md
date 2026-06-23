# Convention features messaging (CRMSLOT)

Cinq features traitent de la communication entrante/sortante. Frontières floues à clarifier pour qu'un agent ne disperse pas une modification dans la mauvaise feature.

## Tableau de répartition

| Feature           | Canal                                   | Direction              | Stockage / API                                | Imports cross-feature |
| ----------------- | --------------------------------------- | ---------------------- | --------------------------------------------- | --------------------- |
| `gmail/`          | Email Gmail (OAuth)                     | Bidirectionnel         | Tokens OAuth + Gmail API                      | **112**               |
| `emails/`         | Email transactionnel sortant            | Sortant — intervention | Templates rapport / facture / suivi           | 36                    |
| `communications/` | Timeline commentaires + WhatsApp Twilio | Bidirectionnel         | `interventions/{id}/timeline`                 | 5                     |
| `notifications/`  | Push FCM + rappels RDV                  | Sortant — temps réel   | Firestore prefs + `expo-notifications`        | **98**                |
| `inbox/`          | Cloche in-app                           | Entrant — UI agrégée   | (consomme les autres, pas de stockage propre) | 3                     |

> Note : `inbox/` = **cloche app** (notifications agrégées), **pas** la file IVANA. La file IVANA back-office vit dans `backoffice/BackOfficeInboxPanel.tsx`.

## Qui fait quoi ?

- **Email entrant client** → `gmail/` (OAuth + lecture boîte société)
- **Email sortant transactionnel** (rapport, facture, lien portail) → `emails/`
- **Commentaire interne / WhatsApp client** sur un dossier → `communications/`
- **Push mobile** (assignation tech, RDV J-1, paiement) → `notifications/`
- **Bandeau cloche dans l'app** → `inbox/`

## Frontière import

- `gmail/` peut importer `chatbot/` (outil `gmail_search`) — inverse interdit.
- `emails/` peut importer `interventions/` (types, contexte facture) — pas l'inverse.
- `notifications/` est consommée par presque tout (98 imports) — ne **pas** l'importer en sens inverse depuis le feature destinataire ; déclencher via API ou helper.
- `communications/` reste minimal (5 imports) — laisser cette feature comme couche d'écriture sur la timeline. Pour lire la timeline, `crmHistory/` est la couche UI.

## Pour un agent

1. Ajouter un canal de message → choisir la feature ci-dessus selon **direction + canal**.
2. Modifier le template d'un email transactionnel → `emails/` (pas `gmail/`).
3. Ajouter un push → `notifications/` + déclencheur côté feature source.
4. Cloche d'app à modifier → `inbox/` seulement ; les sources de notifications restent côté feature productrice.
5. Confusion `inbox/` ↔ inbox IVANA back-office : voir `backoffice/README.md`.

---

_Convention documentée juin 2026. Mettre à jour si un 6ᵉ canal arrive (Slack, Teams, etc.)._
