# quotes

Devis société, acceptation portail.

## Points d'entrée

| Fichier                                  | Rôle                                                                |
| ---------------------------------------- | ------------------------------------------------------------------- |
| \`index.ts\`                             | **Barrel public** — imports cross-feature via \`@/features/quotes\` |
| `components/QuoteListPanel.tsx`          | Liste devis liés à une intervention                                 |
| `components/QuoteEditorPanel.tsx`        | Orchestrateur éditeur (~70 lignes)                                  |
| `hooks/useQuoteEditorPanelController.ts` | État lignes + save / send email                                     |
| `components/QuoteEditorClientFields.tsx` | Nom + email client                                                  |
| `components/QuoteEditorLinesTable.tsx`   | Grille lignes devis                                                 |
| `components/QuoteEditorTotals.tsx`       | Totaux HT / TVA / TTC                                               |
| `components/QuoteEditorMetaFields.tsx`   | Validité + notes                                                    |
| `components/QuoteEditorActions.tsx`      | Boutons enregistrer / envoyer                                       |
| `quoteEditorPanelTypes.ts`               | Props panel éditeur                                                 |
| `quoteEditorPanelUtils.ts`               | Format EUR + calcul totaux                                          |
| `quoteFirestore.ts`                      | CRUD Firestore devis                                                |

## Données

- companies/{id}/quotes

## Dépendances

- billing, interventions

## Pièges

- Accept via routes admin

## Tests

```bash
npx jest src/features/quotes --no-coverage
```
