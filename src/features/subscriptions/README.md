# subscriptions

Abonnements SaaS plateforme CRMSLOT (≠ facturation interventions dans `billing/`).

## Parcours

1. `/pricing` → choix du plan + **Stripe Checkout** (connecté) ou inscription (non connecté)
2. Inscription → société SaaS dédiée créée → redirection auto vers `/pricing?plan=…`
3. Retour Stripe → toast succès sur `/`
4. **Mon compte** → statut + lien « Voir les tarifs » ou portail Stripe (actif)

## Points d'entrée

| Fichier                                     | Rôle                                       |
| ------------------------------------------- | ------------------------------------------ |
| `subscriptionPlans.ts`                      | Tarif unique 50 € HT / technicien          |
| `startSubscriptionCheckoutClient.ts`        | Checkout Stripe (+ provision société)      |
| `pendingSubscriptionPlan.ts`                | Plan choisi avant auth (sessionStorage)    |
| `provisionSaasCompanyClient.ts`             | Crée `companies/{id}` à l'inscription SaaS |
| `hooks/useCompanySubscription.ts`           | Contexte `FeatureFlagsProvider`            |
| `components/PricingPlansGrid.tsx`           | Grille `/pricing`                          |
| `components/AccountSubscriptionRow.tsx`     | Statut dans Mon compte (sans « Activer »)  |
| `components/SubscriptionSignupEffects.tsx`  | Redirige vers `/pricing` après auth        |
| `server/createSubscriptionCheckoutAdmin.ts` | Stripe Checkout session                    |
| `index.server.ts`                           | Routes API uniquement                      |

## Setup Stripe

Guide complet → [`docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md`](../../docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md)

## Tests

```bash
npx jest src/features/subscriptions --no-coverage
```
