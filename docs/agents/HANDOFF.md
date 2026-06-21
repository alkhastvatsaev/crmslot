# HANDOFF — i18n 4 langues

Branche : `cursor/i18n-ru-4langues`

## Progression RU (`ru.json`)

| Lot                                          | Clés | Traduit       | Reste `[RU]`     |
| -------------------------------------------- | ---- | ------------- | ---------------- |
| A — hubs patron + matériel                   | 509  | 41            | 468 → **Claude** |
| B — billing, CRM, chatbot, gmail, backoffice | 481  | 29            | 452 → **Claude** |
| C — terrain, auth, portal                    | ~400 | 0             | Claude après A/B |
| D — mobile, spotlight, common                | ~300 | ~33 chrome    | Claude           |
| **Total**                                    | 2181 | **~103 (5%)** | **~2078**        |

## Cursor (fait)

- ✅ Infra RU (sélecteur, I18nContext, locales audio)
- ✅ Lot A EN/NL (rails, ruptures NL)
- ✅ Lot B EN/NL (patches ciblés)
- ✅ Lot D chrome RU (onglets mobile, spotlight, common)

## Claude — priorité

1. **Lot A RU complet** (namespaces caseHub … materials)
2. **Lot B RU complet**
3. Lots C + D

Fichier **uniquement** : `src/core/i18n/locales/ru.json`

Ne pas écraser les ~103 clés déjà en russe.

```bash
npm run test:i18n
git add src/core/i18n/locales/ru.json
git commit -m "i18n ru : lots A+B"
```

## Cursor — suite

- Lot C EN/NL
- Lot D EN/NL
- `dashboardCarouselRegistry` → clés i18n

## Tests

```bash
npm run test:i18n
npm run i18n:parity
```
