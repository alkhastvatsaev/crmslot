# billing

Domaine facturation : PDF devis/facture, numérotation, UBL/Peppol, Stripe, export comptable.

**Ne pas confondre avec `billingHub/`** — ce dossier = logique métier pure ; `billingHub/` = slot pager UI + agent IA.

## Points d'entrée

| Fichier                                       | Rôle                                         |
| --------------------------------------------- | -------------------------------------------- |
| `components/InvoiceBillingPanel.tsx`          | Orchestrateur panel facturation (~55 lignes) |
| `hooks/useInvoiceBillingPanelController.ts`   | État paiement, templates, Firestore          |
| `components/InvoiceBillingPanelHeader.tsx`    | Toggle accordéon + badge statut              |
| `components/InvoiceBillingLinesTable.tsx`     | Lignes HT / TVA / TTC                        |
| `components/InvoiceBillingTemplateSelect.tsx` | Quick-fill modèle terrain                    |
| `components/InvoiceBillingPaymentSection.tsx` | Dates + sélecteur statut paiement            |
| `components/InvoiceBillingLinksSection.tsx`   | Peppol, portail, PDF, devis, Stripe          |
| `invoiceBillingPanelTypes.ts`                 | Types statut paiement                        |
| `invoiceBillingPanelUtils.ts`                 | Format EUR / dates                           |
| `generateQuotePdf.ts`                         | `generateInterventionDocumentPdf` — PDF PWA  |
| `invoicePreviewFromIntervention.ts`           | Aperçu facture depuis dossier                |
| `exportAccountingCsv.ts`                      | Export CSV comptable                         |
| `invoiceNumbering.ts`                         | Numéros FAC-YYYY-NNNN                        |
| `ubl/buildUblInvoiceXml.ts`                   | Facture électronique UBL                     |
| `server/*`                                    | Admin Firebase (paiement Stripe, Peppol)     |
| `index.ts`                                    | **Barrel public** — imports cross-feature    |

## Données

- Firestore : champs billing sur `interventions/{id}` (lignes, numéro facture, statut paiement)
- Storage : PDF générés côté client (jsPDF), pas serveur

## Dépendances autorisées

- `interventions/types` — structure dossier
- `core/services/email` — pièces jointes PDF

**Interdit depuis billing** : importer composants UI d'autres hubs.

## Voir aussi

- `src/features/billingHub/README.md` — UI slot 6 du DashboardPager

## Tests

```bash
npx jest src/features/billing --no-coverage
```
