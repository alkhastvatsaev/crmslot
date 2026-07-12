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
STRIPE_SUBSCRIPTION_PRICE=price_…      # 50 € HT / technicien / mois (produit Stripe unique)
# STRIPE_SUBSCRIPTION_PRICE_TEAM=price_… # alias legacy accepté
```

## Produit Stripe (un seul)

1. [Dashboard → Products](https://dashboard.stripe.com/products) → **Add product**
2. Nom : `CRMSLOT` · Prix : **50,00 €** · **Recurring** · **Monthly**
3. Billing : **Per unit** (la quantité = nombre de techniciens au checkout)
4. Copier le **Price ID** (`price_…`) → Vercel env `STRIPE_SUBSCRIPTION_PRICE` (Production)
5. Supprimer les anciennes vars `STRIPE_SUBSCRIPTION_PRICE_SOLO|TEAM|PRO` sur Vercel si encore présentes

Les 3 anciens produits archivés ne cassent rien tant que le nouveau `price_…` est dans l’env.

## Apple Pay (Stripe Checkout)

Fichier hébergé : `public/.well-known/apple-developer-merchantid-domain-association` (fichier Stripe standard).

Après déploiement, enregistrer le domaine prod dans Stripe (clé **live**) — Dashboard :
[Settings → Payment methods → Apple Pay](https://dashboard.stripe.com/settings/payment_methods/apple_pay) → **Add domain** → `crmslot.vercel.app` → **Verify**.

Ou en CLI :

```bash
curl https://api.stripe.com/v1/payment_method_domains \
  -u "$STRIPE_SECRET_KEY:" \
  -d domain_name=crmslot.vercel.app
```

Tester en **Safari** sur Mac avec une carte dans Wallet. Vérifier : `curl -I https://crmslot.vercel.app/.well-known/apple-developer-merchantid-domain-association`

## Tests

```bash
npx jest src/features/subscriptions --no-coverage
```
