export function parseSenderName(from: string): string {
  const named = from.match(/^([^<]+)</);
  if (named) return named[1].trim().replace(/^"|"$/g, "");
  const email = from.match(/<([^>]+)>/);
  if (email) return email[1].split("@")[0] ?? from;
  return from.split("@")[0] ?? from;
}

export function parseSenderEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1] ?? from;
}
