# subscriptions

Abonnements SaaS plateforme CRMSLOT (≠ facturation interventions dans `billing/`).

## Parcours

1. `/pricing` → choix du plan (sessionStorage)
2. Connexion / inscription (plan affiché sur l'écran auth)
3. **Mon compte** (dock profil) → plan sous la société → **Activer** → Stripe Checkout
4. Inscription SaaS → société dédiée créée (pas la société démo par défaut)

## Points d'entrée

| Fichier                                     | Rôle                                       |
| ------------------------------------------- | ------------------------------------------ |
| `subscriptionPlans.ts`                      | Grille 49 / 89 / 149 € + env price IDs     |
| `pendingSubscriptionPlan.ts`                | Plan choisi avant auth (sessionStorage)    |
| `provisionSaasCompanyClient.ts`             | Crée `companies/{id}` à l'inscription SaaS |
| `hooks/useCompanySubscription.ts`           | Listener `companies/{id}.saasSubscription` |
| `components/PricingPlansGrid.tsx`           | Grille `/pricing`                          |
| `components/AccountSubscriptionRow.tsx`     | Plan + Activer dans Mon compte             |
| `components/SubscriptionSignupEffects.tsx`  | Ouvre Mon compte après auth                |
| `server/createSubscriptionCheckoutAdmin.ts` | Stripe Checkout session                    |
| `index.server.ts`                           | Routes API uniquement                      |

## Setup Stripe

Guide complet → [`docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md`](../../docs/ops/STRIPE_SUBSCRIPTIONS_SETUP.md)

## Tests

```bash
npx jest src/features/subscriptions --no-coverage
```
