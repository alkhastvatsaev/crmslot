# Sécurité maximale — à faire quand tu es prêt

> **Rappel agent / Cursor** : quand l’utilisateur demande de « renforcer au max la sécurité », « passer à 9/10 », ou « configurer App Check », lire ce fichier en priorité et guider étape par étape.

État actuel (juin 2026) : **~8/10** — règles Firestore/Storage déployées, API verrouillées, rate-limit portail, secrets cron/webhooks. Ce document couvre le **reste** pour viser **~9/10**.

---

## Sommaire

1. [Firebase App Check (reCAPTCHA v3)](#1-firebase-app-check-recaptcha-v3)
2. [CSP en mode enforcement](#2-csp-en-mode-enforcement)
3. [Backups & restauration](#3-backups--restauration)
4. [Déploiement règles Firebase (rappel)](#4-déploiement-règles-firebase-rappel)
5. [Checklist finale](#5-checklist-finale)

---

## 1. Firebase App Check (reCAPTCHA v3)

Le code est prêt : `src/core/config/firebase-app-check.ts` (CRM + portail client). Il manque la config Firebase + la variable Vercel.

**Projet** : `belgique-72708`  
**App Web** : `1:889606998232:web:0e91036e1d7192e82dafad`  
**Prod** : `https://crmslot.vercel.app`

### Phase 1 — Créer reCAPTCHA v3 (Google)

1. [Google reCAPTCHA Admin → Create](https://www.google.com/recaptcha/admin/create)
2. **Label** : `CRMSLOT prod`
3. **Type** : **reCAPTCHA v3**
4. **Domaines** :
   ```
   crmslot.vercel.app
   localhost
   127.0.0.1
   ```
   (+ domaine custom si applicable)
5. Copier la **Clé de site** (Site key, `6L...`) → `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`

### Phase 2 — Lier App Check (Firebase Console)

1. [Firebase → App Check](https://console.firebase.google.com/project/belgique-72708/appcheck)
2. **Apps** → app Web → **Register**
3. Provider : **reCAPTCHA v3**
4. Coller la **clé secrète** reCAPTCHA (pas la clé site)
5. **Save** — mode surveillance par défaut (requêtes sans token passent encore)

### Phase 3 — Variable Vercel + local

**Vercel** → Settings → Environment Variables :

| Variable                                  | Valeur             | Environnements                   |
| ----------------------------------------- | ------------------ | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` | clé site reCAPTCHA | Production, Preview, Development |

Redéployer après ajout.

**Local** (`.env.local`) :

```bash
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=6Lxxxxxxxx...
```

### Phase 4 — Vérifier (AVANT enforcement)

1. Ouvrir `https://crmslot.vercel.app`, se connecter
2. [App Check → Metrics](https://console.firebase.google.com/project/belgique-72708/appcheck) : voir des requêtes **verified**
3. Si 0 % : vérifier domaines reCAPTCHA, variable Vercel, DevTools → `[appCheck] init failed`

### Phase 5 — Enforcement (une brique à la fois)

[App Check → APIs](https://console.firebase.google.com/project/belgique-72708/appcheck/products) :

| Ordre | Service                    | Action                   |
| ----- | -------------------------- | ------------------------ |
| 1     | Cloud Firestore            | **Enforce**              |
| 2     | Attendre 24h, tester l’app |                          |
| 3     | Storage                    | **Enforce**              |
| 4     | Authentication             | **Enforce** (en dernier) |

### Phase 6 — Dev local (optionnel)

1. App Check → app Web → **Manage debug tokens** → Add
2. `.env.local` : `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=<uuid>`
3. Redémarrer `npm run dev`

---

## 2. CSP en mode enforcement

Par défaut : `Content-Security-Policy-Report-Only` (`src/middleware.ts`).

**Quand** : après App Check OK + quelques jours sans violation CSP en prod.

**Vercel** :

```bash
CSP_ENFORCE=true
```

Domaines reCAPTCHA déjà inclus dans le CSP (commit sécurité `ab72af1`).

---

## 3. Backups & restauration

### GitHub Actions (backup Firestore quotidien)

Workflow : `.github/workflows/firestore-backup.yml`

**Secrets GitHub** (Settings → Secrets → Actions) :

| Secret                           | Exemple                        |
| -------------------------------- | ------------------------------ |
| `GCP_PROJECT_ID`                 | `belgique-72708`               |
| `GCP_BACKUP_BUCKET`              | `gs://…-firestore-backups`     |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | OIDC WIF                       |
| `GCP_SERVICE_ACCOUNT`            | `sa@….iam.gserviceaccount.com` |

> Si billing GitHub en échec, les workflows ne démarrent pas — régulariser sur [github.com/settings/billing](https://github.com/settings/billing).

### PITR Firestore (restauration point-in-time)

1. [Firebase Console → Firestore → Disaster Recovery](https://console.firebase.google.com/project/belgique-72708/firestore/databases/-default-/disaster-recovery)
2. Activer **Point-in-time recovery** (7 jours)

### Storage

Pas de backup auto dans le repo — exporter manuellement ou planifier GCS lifecycle sur le bucket Firebase Storage.

---

## 4. Déploiement règles Firebase (rappel)

Après modification de `firestore.rules` ou `storage.rules` :

```bash
# Compte perso (recommandé pour Storage)
unset GOOGLE_APPLICATION_CREDENTIALS
npx --yes firebase-tools login
npx --yes firebase-tools deploy --only firestore:rules,storage --project belgique-72708
```

Ou script local (Firestore via service account ; Storage peut exiger login perso) :

```bash
node scripts/ops/deploy-firebase-rules.mjs
```

CI : `.github/workflows/firebase-rules-deploy.yml` (si secrets `FIREBASE_*` GitHub OK).

---

## 5. Checklist finale

- [ ] App Check : clé site Vercel + metrics verified
- [ ] App Check : enforcement Firestore → Storage → Auth (progressif)
- [ ] `CSP_ENFORCE=true` sur Vercel
- [ ] PITR Firestore activé
- [ ] Backup GitHub Actions opérationnel (billing OK)
- [ ] `EMAIL_INBOUND_SECRET` + `CRON_SECRET` présents (déjà fait juin 2026)
- [ ] Pas de `ALLOW_OPEN_STAFF_JOIN=true` en prod

**Niveau visé après tout coché** : ~**9/10**.

---

## Références code

| Sujet              | Fichier                                 |
| ------------------ | --------------------------------------- |
| App Check client   | `src/core/config/firebase-app-check.ts` |
| CSP / headers      | `src/middleware.ts`                     |
| Auth API           | `src/core/api/routeAuth.ts`             |
| Rate-limit portail | `src/core/api/rateLimit.ts`             |
| Deploy rules       | `scripts/ops/deploy-firebase-rules.mjs` |
| Variables          | `.env.example`                          |
