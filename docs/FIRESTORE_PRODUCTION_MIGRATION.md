# Migration Firestore rules — production

> **Attention** : durcir les rules sans staging dédié peut **casser le dev local** et les comptes anonymes. Toujours tester sur un projet Firebase de préproduction d’abord.

---

## Problème actuel

Dans `firestore.rules`, les utilisateurs **non portail société** (`!isCompanyPortalUser()`) peuvent encore lire **toutes** les interventions :

```
allow read: if isAuthed() && !isCompanyPortalUser();
```

C’est pratique pour le prototype (carte globale, auth anonyme) mais **inacceptable en prod multi-tenant**.

---

## Cible production

Lecture `interventions` uniquement si :

1. **Portail société** : `tenantClaimsIncludeCompany(resource.data.companyId)`
2. **Technicien terrain** : `resource.data.assignedTechnicianUid == request.auth.uid`
3. **Créateur** : `resource.data.createdByUid == request.auth.uid` (demandes personnelles)
4. **Legacy dev** (optionnel, staging only) : UID démo explicites — à retirer en prod

Écriture : conserver la logique actuelle portail + technicien assigné + admin.

---

## Étapes de migration

### 1. Préparer un projet Firebase `belgmap-staging`

```bash
firebase use staging
firebase deploy --only firestore:rules
```

### 2. Remplacer le bloc `match /interventions/{docId}` read

**Avant** (2 règles `allow read` en OU) :

- `isAuthed() && !isCompanyPortalUser()` → **supprimer en prod**
- `isCompanyPortalUser() && tenantClaimsIncludeCompany(...)` → **garder**

**Après** (exemple à adapter) :

```javascript
function canReadIntervention() {
  return isAuthed() && (
    (
      isCompanyPortalUser()
      && interventionHasTenantScope(resource.data)
      && tenantClaimsIncludeCompany(resource.data.companyId)
    )
    || (
      resource.data.keys().hasAny(['assignedTechnicianUid'])
      && resource.data.assignedTechnicianUid == request.auth.uid
    )
    || (
      resource.data.keys().hasAny(['createdByUid'])
      && resource.data.createdByUid == request.auth.uid
    )
  );
}

allow read: if canReadIntervention();
```

### 3. Vérifier les requêtes client

| Hook / composant | Requête | Doit matcher index |
|------------------|---------|-------------------|
| `useBackOfficeInterventions` | `where("companyId", "==", cid)` | Oui + rules tenant |
| `useTechnicianAssignments` | `where("assignedTechnicianUid", "==", uid)` | Oui + rules technicien |
| Carte globale (legacy) | collection sans filtre | **À retirer ou filtrer par tenant** |

### 4. Index composites

Si nouvelles combinaisons `where`, créer les index dans Firebase Console (lien dans les erreurs Firestore).

### 5. Déployer prod

```bash
firebase use production
firebase deploy --only firestore:rules
```

### 6. Rollback

Garder une copie git taguée des rules précédentes ; `firebase deploy` avec l’ancien fichier en cas d’incident.

---

## Comptes de test à valider après migration

| Persona | Attendu |
|---------|---------|
| Admin société A | Lit/écrit interventions `companyId=A` |
| Collaborateur A | Lit tenant A ; écrit ses créations + validation rapport |
| Technicien (uid T) | Lit missions `assignedTechnicianUid=T` |
| Client portail | Lit ses demandes + chat société liée |
| Anonyme dev | **Refusé** en prod (pas de lecture globale) |

---

## Lien avec l’app

- `NEXT_PUBLIC_REAL_INTERVENTIONS_ONLY=true` — masque les mocks UI
- `NEXT_PUBLIC_STAGING_PREVIEW` — **ne pas** activer en prod
- Techniciens : `technicians.authUid` obligatoire pour assignation correcte

Voir [PLAN_STRATEGIQUE.md](./PLAN_STRATEGIQUE.md) Phase 1, semaine 3.
