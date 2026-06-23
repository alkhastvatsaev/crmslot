# emails

Emails liés intervention.

## Points d'entrée

| Fichier                                         | Rôle                             |
| ----------------------------------------------- | -------------------------------- |
| `components/InterventionEmailPanel.tsx`         | Orchestrateur panel (~95 lignes) |
| `hooks/useInterventionEmailPanelController.ts`  | État + envoi / reply / lecture   |
| `components/InterventionEmailBubble.tsx`        | Bulle message inbound/outbound   |
| `components/InterventionEmailThreadList.tsx`    | Liste fil scrollable             |
| `components/InterventionEmailComposeForm.tsx`   | Formulaire rédaction             |
| `components/InterventionEmailPatronMenu.tsx`    | Menu onglets variant patron      |
| `components/InterventionEmailDefaultHeader.tsx` | Toggle accordéon variant default |
| `interventionEmailPanelTypes.ts`                | Types compose / variant          |
| `formatInterventionEmailTime.ts`                | Format date affichage            |
| `interventionEmailFirestore.ts`                 | CRUD Firestore                   |
| `useInterventionEmails.ts`                      | Abonnement emails intervention   |

## Données

- intervention_emails

## Dépendances

- interventions, crmHistory

## Tests

```bash
npx jest src/features/emails --no-coverage
```
