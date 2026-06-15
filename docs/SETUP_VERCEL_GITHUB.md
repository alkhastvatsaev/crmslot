# Déploiement Vercel + secrets GitHub (MAP BELGIQUE)

Guide pas à pas — une fois configuré, le déploiement se fait en **1 clic** dans GitHub Actions.

---

## Prérequis

- Compte [Vercel](https://vercel.com) (gratuit pour commencer)
- Dépôt GitHub avec ce projet poussé sur `main`
- Fichier `.env.local` rempli localement (copie de `.env.example`)

---

## Étape 1 — Projet Vercel

1. Va sur [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → choisis le repo `CRMSLOT` (ou le nom de ton fork).
3. Framework : **Next.js** (détecté automatiquement).
4. **Root Directory** : laisse vide (racine du repo).
5. **Build Command** : `npm run build` (déjà dans `vercel.json`).
6. **Install Command** : `npm ci`.
7. Ne clique pas encore sur Deploy si tu veux d’abord les variables — sinon le premier build peut échouer (normal).

---

## Étape 2 — Variables d’environnement Vercel

Dans le projet Vercel : **Settings → Environment Variables**.

Ajoute **chaque** variable pour **Production** et **Preview** (recommandé).

### Obligatoires (app fonctionnelle)

| Variable                                   | Où la trouver                                             |
| ------------------------------------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase Console → Project settings → General             |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | idem (`xxx.firebaseapp.com`)                              |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | idem                                                      |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | idem                                                      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | idem                                                      |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | idem                                                      |
| `NEXT_PUBLIC_MAPBOX_TOKEN`                 | [mapbox.com](https://account.mapbox.com/) → Access tokens |

### Staging / démo (recommandé sur preview)

| Variable                      | Valeur |
| ----------------------------- | ------ |
| `NEXT_PUBLIC_STAGING_PREVIEW` | `true` |

Puis dans **Firebase Console → Authentication → Sign-in method** : activer **Anonymous**.

### Production (sécurité + audio + Twilio)

| Variable                     | Usage                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `UPLOAD_AUTO_PROCESS_SECRET` | Chaîne aléatoire longue (uploads bureau)                         |
| `AUDIO_DISPATCH_SECRET`      | Chaîne aléatoire (MacroDroid → header `x-audio-dispatch-secret`) |
| `TWILIO_ACCOUNT_SID`         | Console Twilio                                                   |
| `TWILIO_AUTH_TOKEN`          | Console Twilio                                                   |
| `TWILIO_PHONE_NUMBER`        | Numéro Twilio (+32…)                                             |
| `TWILIO_WEBHOOK_PUBLIC_URL`  | `https://TON-DOMAINE.vercel.app` (sans slash final)              |
| `OPENAI_API_KEY`             | Transcription / suggestions                                      |
| `FIREBASE_ADMIN` via JSON    | Voir étape 2b                                                    |

Générer des secrets :

```bash
openssl rand -hex 32
```

### 2b — Firebase Admin (serveur)

1. Firebase Console → **Project settings → Service accounts**.
2. **Generate new private key** → télécharge le JSON.
3. Sur Vercel, ajoute **une variable par champ** OU la méthode recommandée par ton `firebase-admin` :

Variables exactes attendues par le code (`src/core/config/firebase-admin.ts`) :

| Variable Vercel         | Source dans le JSON service account                       |
| ----------------------- | --------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`   | `project_id`                                              |
| `FIREBASE_CLIENT_EMAIL` | `client_email`                                            |
| `FIREBASE_PRIVATE_KEY`  | `private_key` (coller telle quelle ; les `\n` sont gérés) |

Tu peux aussi définir `FIREBASE_PROJECT_ID` = même valeur que `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.

### Optionnelles

| Variable                                      | Usage                     |
| --------------------------------------------- | ------------------------- |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD`           | Envoi devis par email     |
| `STRIPE_SECRET_KEY`                           | Paiements                 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`             | Autocomplete adresses     |
| `NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID` | UID technicien par défaut |

Vérifier localement avant deploy :

```bash
npm run verify:env:prod
```

---

## Étape 3 — Premier déploiement Vercel

1. **Deployments → Redeploy** (ou push sur `main` si Git connecté).
2. Note l’URL : `https://crmslot-xxx.vercel.app` (ou domaine custom).
3. Mets à jour `TWILIO_WEBHOOK_PUBLIC_URL` avec cette URL exacte, puis **redéploie**.

### PWA (service worker + « Ajouter à l’écran d’accueil »)

Le domaine public **doit répondre en HTTP 200** sur `/`, `/manifest.json` et `/sw.js` **sans redirection 307/308** vers un autre hôte. Sinon le navigateur refuse d’enregistrer le service worker (origine différente).

Vérification après déploiement :

```bash
npm run smoke:url -- https://VOTRE-DOMAINE.vercel.app
```

Dans Vercel → **Settings → Domains** : attache le domaine au **même projet** que le déploiement CRMSLOT ; supprime toute règle de redirect domaine → autre projet.

Variables utiles :

| Variable                         | Usage                                          |
| -------------------------------- | ---------------------------------------------- |
| `PUBLIC_APP_URL`                 | Même URL que le domaine PWA (push FCM, Stripe) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Notifications push Web                         |

Les fichiers `public/sw.js` et `public/workbox-*.js` sont **générés au build** (`next-pwa`) — ne pas les committer.

### Twilio (webhooks vocaux)

Dans [Twilio Console](https://console.twilio.com/) → Phone Numbers → ton numéro :

- **Voice & Fax → A CALL COMES IN** : Webhook `POST`  
  `https://TON-DOMAINE.vercel.app/api/webhooks/twilio/incoming`

Les enregistrements utilisent automatiquement  
`/api/webhooks/twilio/recording`.

---

## Étape 4 — Récupérer les IDs Vercel (pour GitHub)

### Option A — Interface web

1. Vercel → **Settings → General** du projet.
2. **Project ID** → copie (commence souvent par `prj_`).
3. Vercel → **Settings → General** du compte/équipe.
4. **Team ID** ou **User ID** → c’est le `VERCEL_ORG_ID`.

### Option B — CLI (recommandé)

```bash
npm i -g vercel@latest
cd "/chemin/vers/CRMSLOT_ULTRA_CLEAN 2"
vercel login
vercel link
```

Puis :

```bash
npm run vercel:ids
```

Le script affiche `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID`.

### Token Vercel

1. [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. **Create** → nom `github-actions-crmslot` → scope Full Account (ou projet limité).
3. Copie le token (affiché une seule fois).

---

## Étape 5 — Secrets GitHub

Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

| Nom du secret       | Valeur                                         |
| ------------------- | ---------------------------------------------- |
| `VERCEL_TOKEN`      | Token de l’étape 4                             |
| `VERCEL_ORG_ID`     | Team / User ID                                 |
| `VERCEL_PROJECT_ID` | Project ID                                     |
| `PRODUCTION_URL`    | `https://ton-domaine.vercel.app` (smoke hebdo) |

---

## Étape 6 — Déployer depuis GitHub (automatique)

1. GitHub → **Actions** → workflow **Release pipeline**.
2. **Run workflow** (branche `main`).
3. Cocher **Deploy** = `true`.
4. Optionnel : **smoke_url** = ton URL Vercel.
5. Run → attendre les jobs verts.

Le job **Deploy Vercel** pousse en production après lint + tests + E2E.

---

## Étape 7 — Vérifications après deploy

```bash
npm run smoke:url https://ton-domaine.vercel.app
```

Manuel :

- Ouvrir `/` → carte + carrousel.
- Hub société → formulaire.
- Hub technicien → liste missions (mode staging).
- Appeler le numéro Twilio (prod) → audio sur la carte sous ~1 min.

---

## Dépannage rapide

| Problème            | Piste                                                          |
| ------------------- | -------------------------------------------------------------- |
| Build Vercel échoue | Logs deploy ; lancer `npm run ci` en local                     |
| API 503             | Firebase Admin manquant sur Vercel                             |
| API 401 partout     | Normal sans login ; l’app utilise Firebase Auth                |
| Twilio 403          | `TWILIO_WEBHOOK_PUBLIC_URL` doit matcher l’URL publique exacte |
| MacroDroid 403      | Header `x-audio-dispatch-secret` = `AUDIO_DISPATCH_SECRET`     |
| E2E OK mais prod KO | Variables seulement en Preview, pas Production                 |

---

## Commandes utiles

```bash
npm run verify:env          # staging
npm run verify:env:prod     # production
npm run release:check       # env + ci + e2e
npm run smoke:url https://…
```
