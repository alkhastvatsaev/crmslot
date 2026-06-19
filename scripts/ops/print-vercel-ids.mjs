#!/usr/bin/env node
/**
 * Affiche les IDs pour les secrets GitHub après `vercel link`.
 * Usage: npm run vercel:ids
 */
import fs from "node:fs";
import path from "node:path";

const projectPath = path.join(process.cwd(), ".vercel", "project.json");

if (!fs.existsSync(projectPath)) {
  console.error(`
❌ Fichier .vercel/project.json introuvable.

Exécute d'abord :
  npm i -g vercel@latest
  vercel login
  vercel link
`);
  process.exit(1);
}

const project = JSON.parse(fs.readFileSync(projectPath, "utf8"));
const orgId = project.orgId ?? project.org ?? "(voir vercel link output)";
const projectId = project.projectId ?? project.id ?? "(manquant)";

console.log(`
✅ Copie ces valeurs dans GitHub → Settings → Secrets → Actions :

  VERCEL_ORG_ID      = ${orgId}
  VERCEL_PROJECT_ID  = ${projectId}

  VERCEL_TOKEN       → https://vercel.com/account/tokens (créer un token)
  PRODUCTION_URL     → https://votre-app.vercel.app (URL après 1er deploy)
`);
