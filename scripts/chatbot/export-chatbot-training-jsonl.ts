/* eslint-disable no-console */
/**
 * Exporte les logs `companies/{companyId}/chatbot_training_logs` vers un fichier JSONL
 * au format OpenAI fine-tuning : system + user + assistant par ligne.
 *
 * Usage :
 *   npm run export:chatbot-training -- --companyId=co-xxx
 *   npm run export:chatbot-training -- --companyId=co-xxx --limit=5000 --out=./data/out.jsonl
 *   npm run export:chatbot-training -- --companyId=co-xxx --openai-format   # prêt à uploader
 *
 * Prérequis :
 *   CHATBOT_TRAINING_LOG_ENABLED=true dans .env.local (pour remplir la collection)
 *   FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY dans l'env
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { getAdminDb, isFirebaseAdminReady } from "../src/core/config/firebase-admin";

function arg(name: string): string | null {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return null;
  return p.slice(`--${name}=`.length).trim() || null;
}

function numArg(name: string, def: number): number {
  const raw = arg(name);
  if (!raw) return def;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : def;
}

const OPENAI_FORMAT = process.argv.includes("--openai-format");

const SYSTEM_PROMPT_DEFAULT =
  "Tu es un assistant IA pour MAP BELGIQUE, une entreprise de services techniques en Belgique. " +
  "Tu aides les techniciens et l'équipe back-office à gérer les interventions, la facturation, " +
  "les commandes fournisseurs et les communications clients. " +
  "Réponds en français, de manière concise et professionnelle.";

type TrainingDoc = {
  userMessage?: string;
  assistantMessage?: string;
  modelName?: string;
  conversationId?: string | null;
  hadToolRounds?: boolean;
  createdAt?: { toDate?: () => Date };
};

async function main() {
  const companyId = arg("companyId");
  if (!companyId) {
    console.error(
      "Usage: npm run export:chatbot-training -- --companyId=VOTRE_ID [--limit=20000] [--out=...]"
    );
    process.exit(1);
  }

  if (!isFirebaseAdminReady()) {
    console.error("Firebase Admin non initialisé. Configurez FIREBASE_* dans l’environnement.");
    process.exit(1);
  }

  const limit = numArg("limit", 20_000);
  const defaultOut = path.join(
    process.cwd(),
    "data",
    "chatbot-training",
    "exports",
    `chatbot-training-${companyId}.jsonl`
  );
  const outPath = arg("out") ?? defaultOut;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const db = getAdminDb();
  const snap = await db
    .collection("companies")
    .doc(companyId)
    .collection("chatbot_training_logs")
    .orderBy("createdAt", "asc")
    .limit(limit)
    .get();

  let n = 0;
  const lines: string[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as TrainingDoc;
    const u = String(d.userMessage ?? "").trim();
    const a = String(d.assistantMessage ?? "").trim();
    if (!u || !a) continue;

    const created =
      d.createdAt && typeof d.createdAt.toDate === "function"
        ? d.createdAt.toDate()!.toISOString()
        : null;

    const messages = OPENAI_FORMAT
      ? [
          { role: "system" as const, content: SYSTEM_PROMPT_DEFAULT },
          { role: "user" as const, content: u },
          { role: "assistant" as const, content: a },
        ]
      : [
          { role: "user" as const, content: u },
          { role: "assistant" as const, content: a },
        ];

    const row = {
      ...(OPENAI_FORMAT
        ? {}
        : {
            id: doc.id,
            companyId,
            createdAt: created,
            model: d.modelName ?? null,
            conversationId: d.conversationId ?? null,
            hadToolRounds: Boolean(d.hadToolRounds),
          }),
      messages,
    };
    lines.push(JSON.stringify(row));
    n += 1;
  }

  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf-8");
  const toolCount = snap.docs.filter((d) =>
    Boolean((d.data() as TrainingDoc).hadToolRounds)
  ).length;
  console.log(`✅ ${n} exemples exportés → ${outPath}`);
  if (!OPENAI_FORMAT) {
    console.log(`   ${toolCount} avec outil sur ${n} total`);
    console.log(`\n💡 Pour le format fine-tuning OpenAI, ajoutez --openai-format`);
  } else {
    console.log(`\n📤 Upload vers OpenAI :`);
    console.log(
      `   openai api fine_tuning.jobs.create --training-file "${outPath}" --model gpt-4o-mini`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
