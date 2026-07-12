# subscriptions

Abonnements SaaS plateforme CRMSLOT (≠ facturation interventions dans `billing/`).

## Parcours

1. **Inscription** → checkout Stripe auto → app (avec `NEXT_PUBLIC_SUBSCRIPTION_ENFORCE=true`)
2. **Compte sans abo** → paywall in-app (1 CTA → Stripe)
3. `/pricing` → landing publique (prix + liens auth), pas de checkout direct
4. Retour Stripe → toast succès sur `/`
5. **Mon compte** → statut + activer / portail Stripe

## Points d'entrée

| Fichier                                     | Rôle                                  |
| ------------------------------------------- | ------------------------------------- |
| `subscriptionPlans.ts`                      | Tarif unique 50 € HT / technicien     |
| `startSubscriptionCheckoutClient.ts`        | Checkout Stripe (+ provision société) |
| `pendingSubscriptionPlan.ts`                | Flag checkout après inscription       |
| `components/SubscriptionSignupEffects.tsx`  | Lance checkout auto après auth        |
| `components/SubscriptionAccessGate.tsx`     | Paywall in-app si abo inactif         |
| `components/SubscriptionPaywall.tsx`        | UI paywall (1 bouton)                 |
| `components/PricingLanding.tsx`             | Landing `/pricing`                    |
| `server/createSubscriptionCheckoutAdmin.ts` | Stripe Checkout session               |
| `index.server.ts`                           | Routes API uniquement                 |

## Env

```bash
NEXT_PUBLIC_SUBSCRIPTION_ENFORCE=true   # paywall + checkout auto
STRIPE_SUBSCRIPTION_PRICE_TEAM=price_…  # 50 € unitaire / technicien
```

## Tests

```bash
npx jest src/features/subscriptions --no-coverage
```
