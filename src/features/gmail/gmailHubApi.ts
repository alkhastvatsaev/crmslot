import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { GMAIL_HUB_PAGE_SIZE } from "@/features/gmail/gmailHubConstants";
import type {
  GmailHubAttachment,
  GmailHubLabel,
  GmailHubMessageDetail,
  GmailHubMessageSummary,
  GmailHubStatus,
} from "@/features/gmail/gmailHubTypes";

export async function fetchGmailHubStatus(): Promise<GmailHubStatus> {
  const res = await fetchWithAuth("/api/integrations/gmail/status");
  const data = (await res.json()) as GmailHubStatus & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Statut Gmail indisponible.");
  return data;
}

export async function fetchGmailHubLabels(): Promise<GmailHubLabel[]> {
  const res = await fetchWithAuth("/api/integrations/gmail/labels");
  const data = (await res.json()) as { labels?: GmailHubLabel[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Libellés indisponibles.");
  return data.labels ?? [];
}

export async function fetchGmailHubMessages(opts: {
  labelId?: string;
  q?: string;
  pageToken?: string;
}): Promise<{ messages: GmailHubMessageSummary[]; nextPageToken: string | null }> {
  const params = new URLSearchParams();
  params.set("maxResults", String(GMAIL_HUB_PAGE_SIZE));
  if (opts.labelId) params.set("labelId", opts.labelId);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  const res = await fetchWithAuth(`/api/integrations/gmail/messages?${params.toString()}`);
  const data = (await res.json()) as {
    messages?: GmailHubMessageSummary[];
    nextPageToken?: string | null;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Boîte indisponible.");
  return {
    messages: data.messages ?? [],
    nextPageToken: data.nextPageToken ?? null,
  };
}

export async function modifyGmailHubMessage(
  messageId: string,
  addLabelIds: string[],
  removeLabelIds: string[]
): Promise<{ ok?: boolean; labelIds?: string[] }> {
  const res = await fetchWithAuth(
    `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/modify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );
  const data = (await res.json()) as { ok?: boolean; labelIds?: string[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Modification impossible.");
  return data;
}

export async function fetchGmailHubThread(threadId: string): Promise<GmailHubMessageDetail[]> {
  const res = await fetchWithAuth(
    `/api/integrations/gmail/threads/${encodeURIComponent(threadId)}`
  );
  const data = (await res.json()) as {
    messages?: GmailHubMessageDetail[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Conversation indisponible.");
  return data.messages ?? [];
}

export async function sendGmailHubMessage(input: {
  to: string;
  subject: string;
  bodyText: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}): Promise<{ ok?: boolean }> {
  const res = await fetchWithAuth("/api/integrations/gmail/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Envoi impossible.");
  return data;
}

export async function fetchGmailHubAttachment(
  messageId: string,
  attachment: GmailHubAttachment
): Promise<{ dataBase64: string; mimeType: string; filename: string }> {
  const params = new URLSearchParams({
    filename: attachment.filename,
    mimeType: attachment.mimeType,
  });
  const res = await fetchWithAuth(
    `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.attachmentId)}?${params.toString()}`
  );
  const data = (await res.json()) as {
    dataBase64?: string;
    mimeType?: string;
    filename?: string;
    error?: string;
  };
  if (!res.ok || !data.dataBase64) {
    throw new Error(data.error ?? "Pièce jointe indisponible.");
  }
  return {
    dataBase64: data.dataBase64,
    mimeType: data.mimeType ?? attachment.mimeType,
    filename: data.filename ?? attachment.filename,
  };
}

export async function disconnectGmailHubAccount(): Promise<void> {
  const res = await fetchWithAuth("/api/integrations/gmail/disconnect", { method: "POST" });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Déconnexion impossible.");
}

export async function trashGmailHubMessage(messageId: string): Promise<{ ok?: boolean }> {
  const res = await fetchWithAuth(
    `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/trash`,
    { method: "POST" }
  );
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Corbeille impossible.");
  return data;
}
