# Scripts CRMSLOT

Scripts utilitaires hors runtime Next.js. Invoqués via `npm run …` dans `package.json`.

| Dossier    | Rôle                                                          |
| ---------- | ------------------------------------------------------------- |
| `ci/`      | Couverture, routes API protégées, modules non testés          |
| `dev/`     | Nettoyage `.next`, build Mapbox worker, E2E gate, restart dev |
| `lecot/`   | Catalogue Lecot — images, index, probes                       |
| `chatbot/` | Export données d'entraînement                                 |
| `mobile/`  | Gradle Android, SHA1 debug                                    |
| `ops/`     | Env Vercel, smoke URL, techniciens UID, démo                  |

Ne pas déplacer sans mettre à jour `package.json`, `playwright.config.ts` et `.github/workflows/`.
