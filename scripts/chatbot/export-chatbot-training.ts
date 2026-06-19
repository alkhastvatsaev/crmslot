import * as fs from "fs";
import * as path from "path";
import { loadEnvConfig } from "@next/env";

// Load environment variables for Firebase Admin
loadEnvConfig(process.cwd());

import { getAdminDb, isFirebaseAdminReady } from "../src/core/config/firebase-admin";

type TrainingExportMessage = {
  role: string;
  content?: string;
  tool_calls?: unknown;
  tool_call_id?: string;
  name?: string;
};

async function runExport() {
  if (!isFirebaseAdminReady()) {
    console.error(
      "Firebase Admin is not configured. Please ensure .env.local has required credentials."
    );
    process.exit(1);
  }

  const db = getAdminDb();
  console.log("Fetching logs from Firestore collection 'chatbot_training_logs'...");

  const snapshot = await db.collection("chatbot_training_logs").get();
  if (snapshot.empty) {
    console.log("No logs found in the collection.");
    process.exit(0);
  }

  const outputDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "chatbot-training.jsonl");
  const stream = fs.createWriteStream(outputFile, { flags: "w" });

  let count = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();

    // Construct the OpenAI fine-tuning format
    // {"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}

    const messages: TrainingExportMessage[] = [];
    if (data.systemPrompt) {
      messages.push({ role: "system", content: String(data.systemPrompt) });
    }

    // append apiMessages which contains the entire conversation up to the assistant's final response
    if (Array.isArray(data.apiMessages)) {
      data.apiMessages.forEach((msg: Record<string, unknown>) => {
        if (msg.role && (msg.content !== undefined || msg.tool_calls)) {
          // Keep only necessary fields for fine-tuning
          const cleanMsg: TrainingExportMessage = { role: String(msg.role) };
          if (msg.content !== undefined) cleanMsg.content = String(msg.content);
          if (msg.tool_calls !== undefined) cleanMsg.tool_calls = msg.tool_calls;
          if (msg.tool_call_id !== undefined) cleanMsg.tool_call_id = String(msg.tool_call_id);
          if (msg.name !== undefined) cleanMsg.name = String(msg.name);
          messages.push(cleanMsg);
        }
      });
    }

    if (messages.length > 0) {
      stream.write(JSON.stringify({ messages }) + "\n");
      count++;
    }
  });

  stream.end();
  console.log(`Successfully exported ${count} conversations to ${outputFile}`);
}

runExport().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
