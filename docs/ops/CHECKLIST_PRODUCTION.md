# Checklist production CRMSLOT

Cocher avant d’ouvrir l’app aux vrais clients / techniciens. Détail : [PLAN_STRATEGIQUE.md](./PLAN_STRATEGIQUE.md).

---

## A — Firebase & Vercel

- [ ] Projet Firebase prod créé (Auth, Firestore, Storage, rules déployées)
- [ ] Variables Vercel **Production** renseignées (voir `.env.example`, `docs/ops/SETUP_VERCEL_GITHUB.md`)
- [ ] `NEXT_PUBLIC_REAL_INTERVENTIONS_ONLY=true` en Production
- [ ] `NEXT_PUBLIC_PRESENTATION_PRIVACY_MODE=false` en Production
- [ ] `NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID` = UID Auth du technicien principal
- [ ] Firebase Admin : `FIREBASE_SERVICE_ACCOUNT` (ou équivalent) sur Vercel
- [ ] `npm run verify:env -- --tier=production` OK en local avec `.env` prod-like

---

## B — Multi-tenant

- [ ] Société créée, admin avec `company_memberships`
- [ ] `sync-claims` exécuté après login (token `bmTenants` visible)
- [ ] Collaborateur invité + `accept-invite` testé
- [ ] Intervention créée avec `companyId` — visible uniquement pour cette société
- [ ] Techniciens Firestore : champ `authUid` = UID Firebase de chaque technicien
- [ ] Assignation via picker → `assignedTechnicianUid` correct
- [ ] Technicien voit la mission, accepte, passe `en_route`

---

## C — Sécurité

- [ ] Rules Firestore durcies (voir [FIRESTORE_PRODUCTION_MIGRATION.md](./FIRESTORE_PRODUCTION_MIGRATION.md))
- [ ] Routes `/api/*` sensibles : 401 sans Bearer (smoke `tests/e2e/api-security.spec.ts`)
- [ ] `AUDIO_DISPATCH_SECRET` / Twilio secrets en prod uniquement
- [ ] `/api/demo/*` retourne 404 en production
- [ ] `CRON_SECRET` configuré (Vercel + workflows GitHub) — `/api/cron/*` répond 401 sans header
- [ ] Middleware sécurité actif (`src/middleware.ts`) — CSP report-only, basculer `CSP_ENFORCE=true` après audit
- [ ] Firebase App Check activé (reCAPTCHA v3) + enforcement — **tutoriel complet** : [SECURITE_MAX_CHECKLIST.md](./SECURITE_MAX_CHECKLIST.md)

---

## C.bis — Sauvegardes & continuité

- [ ] **PITR Firestore** activé (Console Firebase → Firestore → Backups → Point-in-Time Recovery, 7 jours)
- [ ] Bucket GCS `gs://<projet>-firestore-backups` créé, classe Coldline ou Archive, rétention >= 35 jours
- [ ] Compte de service `firestore-backup@…` avec rôles `datastore.importExportAdmin` + `storage.objectAdmin`
- [ ] Workload Identity Federation configuré pour GitHub Actions (provider OIDC)
- [ ] Secrets GitHub renseignés : `GCP_PROJECT_ID`, `GCP_BACKUP_BUCKET`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`
- [ ] Workflow `firestore-backup.yml` vert au moins une fois — vérifier dossier daté dans le bucket
- [ ] Test restauration ponctuel documenté (1× / trimestre minimum)

---

## D — Terrain & offline

- [ ] Clôture avec photos + signature en ligne OK
- [ ] Test mode avion : file locale → sync au reconnect
- [ ] Conflit serveur plus récent : message utilisateur compris
- [ ] `NEXT_PUBLIC_ALLOW_MOBILE` : activé seulement si hub technicien validé sur téléphone

---

## E — CI / release

- [ ] `npm run release:check` vert sur la branche à merger
- [ ] GitHub Actions `test.yml` + `e2e.yml` verts
- [ ] Smoke URL post-deploy : `npm run smoke:url https://votre-app.vercel.app`
- [ ] Webhook Twilio recording pointe vers `/api/webhooks/twilio/recording`

---

## F — Facturation (optionnel phase 1)

- [ ] Cloud Function `invoiceAutomation` déployée
- [ ] Dossier `done` + photos + signature → `invoiced` + PDF Storage
- [ ] Back-office peut valider `done` → `invoiced` (collaborateur selon rules)

---

## Sign-off

| Rôle   | Nom | Date |
| ------ | --- | ---- |
| Dev    |     |      |
| Métier |     |      |
