# subscriptions

Abonnements SaaS plateforme CRMSLOT (≠ facturation interventions dans `billing/`).

## Points d'entrée

| Fichier                                          | Rôle                                       |
| ------------------------------------------------ | ------------------------------------------ |
| `subscriptionPlans.ts`                           | Grille 49 / 89 / 149 € + env price IDs     |
| `subscriptionAccess.ts`                          | Active ? enforce ? parse Firestore         |
| `hooks/useCompanySubscription.ts`                | Listener `companies/{id}.saasSubscription` |
| `components/PricingPlansGrid.tsx`                | Grille tarifs `/pricing`                   |
| `components/SubscriptionAdminBanner.tsx`         | Bannière admin back-office                 |
| `server/createSubscriptionCheckoutAdmin.ts`      | Stripe Checkout session                    |
| `server/handleStripeSubscriptionWebhookAdmin.ts` | Sync webhook → Firestore                   |
| `index.server.ts`                                | Routes API uniquement                      |

## Setup Stripe

Guide complet → [`docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md`](../../docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md)

## Tests

```bash
npx jest src/features/subscriptions --no-coverage
```
