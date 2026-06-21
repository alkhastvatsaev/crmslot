import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function flatten(obj: Record<string, unknown>, prefix = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [ck, cv] of flatten(v as Record<string, unknown>, key)) out.set(ck, cv);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

const localesDir = join(process.cwd(), "src/core/i18n/locales");
const fr = flatten(JSON.parse(readFileSync(join(localesDir, "fr.json"), "utf8")));

describe("locale parity", () => {
  it.each(["en", "nl", "ru"])("%s.json has the same leaf keys as fr.json", (code) => {
    const dict = flatten(JSON.parse(readFileSync(join(localesDir, `${code}.json`), "utf8")));
    const missing = [...fr.keys()].filter((k) => !dict.has(k));
    const extra = [...dict.keys()].filter((k) => !fr.has(k));
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it("parity-check.mjs exits 0 with ru required", () => {
    execSync("node scripts/i18n/parity-check.mjs --require ru", {
      cwd: process.cwd(),
      stdio: "pipe",
    });
  });
});
