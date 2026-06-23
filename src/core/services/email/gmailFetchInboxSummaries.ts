import type { gmail_v1 } from "@googleapis/gmail";
import { mapGmailMessageSummary } from "@/features/gmail";
import type { GmailHubMessageSummary } from "@/features/gmail";

const METADATA_HEADERS = ["From", "To", "Subject", "Date"];

/** Exécute des promesses avec un plafond de concurrence (évite N×latence séquentielle). */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

/** Métadonnées inbox en parallèle (remplace la boucle await séquentielle ~1 min → ~1–3 s). */
export async function fetchGmailInboxSummaries(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
  concurrency = 10
): Promise<GmailHubMessageSummary[]> {
  const ids = messageIds.filter(Boolean);
  if (!ids.length) return [];

  return mapWithConcurrency(ids, concurrency, async (id) => {
    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: METADATA_HEADERS,
    });
    return mapGmailMessageSummary(msgRes.data);
  });
}
