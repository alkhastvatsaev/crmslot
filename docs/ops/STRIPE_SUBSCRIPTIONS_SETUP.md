# Abonnements SaaS — mise en place Stripe

Guide pas-à-pas pour vendre les abonnements CRMSLOT (49 € / 89 € / 149 €) avant la prospection clients.

## Vue d'ensemble

| Étape                           | Où                                 | Durée  |
| ------------------------------- | ---------------------------------- | ------ |
| 1. Compte Stripe                | dashboard.stripe.com               | 15 min |
| 2. Produits & prix              | Stripe Dashboard                   | 20 min |
| 3. Webhook                      | Stripe + Vercel                    | 10 min |
| 4. Variables d'environnement    | `.env.local` + Vercel              | 10 min |
| 5. Portail client Stripe        | Stripe Dashboard                   | 5 min  |
| 6. Test bout en bout            | `/pricing` → Checkout              | 15 min |
| 7. (Optionnel) Bloquer sans abo | `NEXT_PUBLIC_SUBSCRIPTION_ENFORCE` | 2 min  |

**Pages app :**

- Tarifs publics : `/pricing`
- Landing : `/landing` (liens vers tarifs)
- Checkout : bouton admin dans l'app ou page tarifs

---

## Étape 1 — Compte Stripe

1. Créer ou ouvrir un compte sur https://dashboard.stripe.com
2. Activer le **mode Test** (interrupteur en haut à droite)
3. Compléter les infos société (obligatoire avant passage Live)

---

## Étape 2 — Créer les 3 produits récurrents

Dans **Produits → + Ajouter un produit** :

| Produit        | Prix mensuel        | Metadata sur le **Price** |
| -------------- | ------------------- | ------------------------- |
| CRMSLOT Solo   | **49,00 €** / mois  | `planId` = `solo`         |
| CRMSLOT Équipe | **89,00 €** / mois  | `planId` = `team`         |
| CRMSLOT Pro    | **149,00 €** / mois | `planId` = `pro`          |

Pour chaque price : copier l'ID `price_…` dans les variables d'environnement.

### Coupon fondateur (-30 %)

1. **Produits → Coupons → + Nouveau**
2. Nom : `FONDATEUR30` · Remise **30 %** · **Pour toujours**
3. Limite : **10** utilisations (optionnel)

---

## Étape 3 — Webhook

1. **Developers → Webhooks → + Add endpoint**
2. URL : `https://VOTRE-DOMAINE.vercel.app/api/webhooks/stripe`
3. Événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`

En local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Étape 4 — Variables d'environnement

```bash
STRIPE_SECRET_KEY=sk_test_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_SUBSCRIPTION_PRICE_SOLO=price_…
STRIPE_SUBSCRIPTION_PRICE_TEAM=price_…
STRIPE_SUBSCRIPTION_PRICE_PRO=price_…
SUBSCRIPTION_TRIAL_DAYS=14
PUBLIC_APP_URL=https://votre-app.vercel.app
# NEXT_PUBLIC_SUBSCRIPTION_ENFORCE=true
```

---

## Étape 6 — Test (checklist)

- [ ] `/pricing` — 3 plans
- [ ] Compte admin + société créée
- [ ] Checkout Stripe (carte `4242 4242 4242 4242`)
- [ ] Firestore `companies/{id}.saasSubscription.status` = `trialing` ou `active`

---

## Sociétés existantes (grandfather)

```json
"saasSubscription": { "planId": "pro", "status": "active", "grandfathered": true }
```

Module : `src/features/subscriptions/`
