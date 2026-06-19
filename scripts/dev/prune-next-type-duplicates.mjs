#!/usr/bin/env node
/**
 * Supprime les doublons macOS dans `.next/types` (ex. `routes.d 2.ts`) qui cassent `tsc`.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), ".next", "types");
if (!fs.existsSync(dir)) process.exit(0);

for (const name of fs.readdirSync(dir)) {
  if (/\s\d+\.(ts|json)$/.test(name)) {
    fs.unlinkSync(path.join(dir, name));
    console.log("[prune-next-types] removed", name);
  }
}
