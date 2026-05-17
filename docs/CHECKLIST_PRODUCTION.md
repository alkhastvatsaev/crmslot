# Checklist production BELGMAP

Cocher avant d’ouvrir l’app aux vrais clients / techniciens. Détail : [PLAN_STRATEGIQUE.md](./PLAN_STRATEGIQUE.md).

---

## A — Firebase & Vercel

- [ ] Projet Firebase prod créé (Auth, Firestore, Storage, rules déployées)
- [ ] Variables Vercel **Production** renseignées (voir `.env.example`, `docs/SETUP_VERCEL_GITHUB.md`)
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

| Rôle | Nom | Date |
|------|-----|------|
| Dev | | |
| Métier | | |
