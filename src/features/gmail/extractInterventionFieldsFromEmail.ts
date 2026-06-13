/** Extrait adresse et téléphone depuis le corps d'un e-mail client. */
export function extractInterventionFieldsFromEmail(text: string): {
  address: string | null;
  phone: string | null;
} {
  const normalized = text.replace(/\r\n/g, "\n");
  const phoneMatch =
    normalized.match(/(?:\+32|0)\s?[1-9](?:[\s./-]?\d{2}){4}/) ??
    normalized.match(/\+32\s?\d{8,9}/);
  const phone = phoneMatch?.[0]?.replace(/\s+/g, " ").trim() ?? null;

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 8 && l.length < 160);

  const streetRe =
    /(?:rue|avenue|av\.|boulevard|bd\.|chaussée|chemin|place|square|straat|laan|weg)\b/i;
  const postalRe = /\b[1-9]\d{3}\b/;

  for (const line of lines) {
    if (streetRe.test(line) && /\d/.test(line)) {
      return { address: line, phone };
    }
  }

  for (const line of lines) {
    if (postalRe.test(line) && /[A-Za-zÀ-ÿ]/.test(line)) {
      return { address: line, phone };
    }
  }

  return { address: null, phone };
}
