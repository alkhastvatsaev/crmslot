# Travail autonome (agent / nuit / longue session)

## Ce qui est possible

| Mode | Réalité |
|------|---------|
| **Agent Cursor dans le chat** | Enchaîne tâches (code, tests, docs) tant que la conversation est active. Pas de garantie « 8 h CPU » continues. |
| **CI GitHub Actions** | Tourne sans toi après `git push` (`test.yml`, `e2e.yml`). |
| **Vercel deploy** | Automatisable via workflow ; secrets à configurer une fois ([SETUP_VERCEL_GITHUB.md](./SETUP_VERCEL_GITHUB.md)). |

## Ce qui ne l’est pas (sans toi)

- Créer le projet Firebase / Vercel (comptes, cartes, clics Console).
- Déployer des **rules Firestore strictes** sans projet staging de test.
- Valider un iPhone réel en camionnette.

## Comment demander une grosse session

Copier-coller dans le chat :

```
Travaille en autonome sur la Phase X du PLAN_STRATEGIQUE.md.
Ne commit pas sauf si je le demande.
À la fin : résumé + commandes npm à lancer + prochaine phase.
```

## Ordre recommandé (répétable)

1. `npm run ci` — baseline verte  
2. Lire [PLAN_STRATEGIQUE.md](./PLAN_STRATEGIQUE.md) — phase en cours  
3. Implémenter **un** chantier (pas trois en parallèle)  
4. Tests colocalisés (`AGENTS.md`)  
5. `npm run ci` — validation  
6. Mettre à jour le tableau « Historique des sessions » dans le plan  

## Phases et effort indicatif

| Phase | Durée humaine estimée | Automatisable par agent |
|-------|----------------------|-------------------------|
| 0 Prérequis | ½ j | Partiel (scripts `verify:env`) |
| 1 Multi-tenant | 2–3 sem | Oui (code + tests + docs rules) |
| 2 E2E | 1 sem | Oui (Playwright smoke) |
| 3 Offline | 1–2 sem | Oui (tests + UI) |
| 4 Mobile | 2–3 sem | Partiel (gate, pas refonte totale) |
| 5 Portail client | 2 sem | Partiel |
| 6 Ops | continu | Docs + workflows |

## Reprise après une nuit

1. `git status` / `git diff` — voir ce qui a changé  
2. `npm run test:ci`  
3. Lire le dernier message résumé de l’agent  
4. Cocher [CHECKLIST_PRODUCTION.md](./CHECKLIST_PRODUCTION.md) pour ce qui est validé manuellement  

## Sessions enregistrées

| Date | Focus | Tests |
|------|-------|-------|
| 2026-05 | Plan stratégique, offline UI, mobile gate, E2E offline | 84 Jest |
| 2026-05 | Doc travail autonome, tests completionSync + TechnicianHub | — |

*Mettre à jour après chaque session.*
