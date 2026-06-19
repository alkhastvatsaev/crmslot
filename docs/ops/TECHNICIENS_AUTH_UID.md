# Techniciens — champ `authUid`

## Pourquoi

`assignedTechnicianUid` sur une intervention doit être l’**UID Firebase Auth** du compte terrain. Le picker d’assignation utilise `Technician.authUid` (sinon repli sur `NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID`).

## En développement

Les mocks dans `useTechnicians` reçoivent automatiquement `authUid` via `withTechnicianAuthUid`. Au premier snapshot Firestore vide, les 3 techniciens démo sont seedés avec `authUid`.

## En production

1. Console Firebase → Authentication → copier l’UID du technicien Mansour (ou chaque technicien).
2. Vercel : `NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID=<uid>` (repli global).
3. Firestore : collection `technicians` — champ `authUid` par document.

### Script Admin (recommandé)

```bash
# .env.local avec FIREBASE_* Admin + optionnel NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID
npm run sync:technician-uids

# ou UID explicite pour tous les docs sans authUid
node scripts/sync-technician-auth-uids.mjs --uid=VOTRE_UID_FIREBASE
```

## Vérification

1. Assigner une demande depuis l’inbox (carte → panneau droit).
2. Firestore → `interventions/{id}` → `assignedTechnicianUid` = UID attendu.
3. Hub technicien (page 3 carrousel) → mission visible + carte d’offre si `assigned` sans acceptation.

## Tests

- Jest : `withTechnicianAuthUid.test.ts`, `technicianAssignUid.test.ts`
- E2E : `tests/e2e/backoffice-assign.spec.ts`
