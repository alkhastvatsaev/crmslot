# Audit i18n — 21 juin 2026

Branche : `cursor/i18n-ru-4langues`  
Source de vérité : `src/core/i18n/locales/fr.json`

## Résumé exécutif

| Métrique                 | fr   | en   | nl   | ru         |
| ------------------------ | ---- | ---- | ---- | ---------- |
| Clés feuilles            | 2179 | 2179 | 2179 | **absent** |
| Manquantes vs fr         | —    | 0    | 0    | 2179       |
| Identiques à fr (string) | —    | 140  | 84   | —          |

**Parité structurelle** : fr / en / nl sont **alignés** (0 clé manquante).

**Qualité** : ~140 clés EN et ~84 clés NL sont encore **mot pour mot identiques** à fr — souvent noms propres (WhatsApp, Lecot, CRM) ou anglicismes volontaires, mais aussi des libellés à retraduire (ex. nl `caseHub.selected_label: Dossier`).

**RU** : fichier et infra **à créer** (Phase 1).

**Hors JSON** : `dashboardCarouselRegistry.ts` — `guideTitle`, `guideHint`, `profileName` en dur (9 pages).

---

## Script de parity

```bash
node scripts/i18n/parity-check.mjs
node scripts/i18n/parity-check.mjs --same-as fr en nl
node scripts/i18n/parity-check.mjs --require ru   # après création ru.json
```

---

## Lots de traduction (priorité)

### Lot A — features récentes (Cursor EN/NL · Claude RU)

Namespaces : `caseHub`, `commissionsHub`, `planningHub`, `teamHub`, `companyStock`, `materials`

| Locale | Clés identiques à fr (Lot A) |
| ------ | ---------------------------- |
| en     | 28                           |
| nl     | 24                           |

Exemples à revoir (nl encore en français) :

- `caseHub.mobile.rail_center`, `caseHub.selected_label`, `companyStock.*rupture*`
- `planningHub.detail.fields.email` → E-mail (ok) mais contexte nl-BE

### Lot B

`billingHub`, `crmHistory`, `chatbot`, `gmail`, `backoffice`  
EN identiques : 36 · NL : 17

### Lot C

`technician_hub`, `requester`, `tracking`, `smart_form`, `auth`, `portal`  
EN identiques : 24 · NL : 9

### Lot D

Tout le reste (~55 namespaces) : `common`, `mobile`, `spotlight`, `status`, `map`, etc.

---

## Chaînes hardcodées (hors `t()`)

| Fichier                                               | Problème                                           | Action                                                        |
| ----------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| `src/features/dashboard/dashboardCarouselRegistry.ts` | `guideTitle`, `guideHint`, `profileName` FR en dur | Migrer vers clés `spotlight.guide_*` ou `profiles.carousel_*` |
| `src/features/planningHub/planningHubDraftData.ts`    | Données démo (noms, statuts)                       | OK démo · pas bloquant prod                                   |
| Hubs récents (`caseHub`, `commissionsHub`, …)         | Composants utilisent `t()`                         | ✅ Pas de gros hardcode UI détecté                            |

---

## Infra à étendre pour RU (Phase 1 — Cursor)

| Fichier                         | Changement                              |
| ------------------------------- | --------------------------------------- |
| `src/core/i18n/locales/ru.json` | Créer (structure fr, traduction Claude) |
| `src/core/i18n/I18nContext.tsx` | `Language` + import `ru`                |
| `DashboardLanguageSelector.tsx` | Bouton RU                               |
| `technicianSchedule.ts`         | `mapI18nLanguageToLocale` → `ru-RU`     |
| `useAudioRecorder.ts`           | `UiLanguage` + locale                   |

---

## Coordination Claude Code

| Propriétaire | Fichiers                                      |
| ------------ | --------------------------------------------- |
| **Cursor**   | `en.json`, `nl.json`, infra TS, script parity |
| **Claude**   | `ru.json` uniquement (lots A→D)               |

Voir `docs/agents/HANDOFF.md` (à créer) pour le lot en cours.

---

## Prochaines étapes

1. ✅ Phase 0 audit (ce document)
2. ☐ Phase 1 infra RU + `ru.json` squelette + test Jest parity
3. ☐ Lot A EN/NL (Cursor) + Lot A RU (Claude) — commits séparés
4. ☐ Lots B, C, D
5. ☐ Migrer `dashboardCarouselRegistry` vers i18n
6. ☐ Test manuel 4 langues sur Vercel (Android)
