import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
import { interventionSearchHaystack } from "@/features/chatbot/chatbot-workspace-search";
import { assertGmailReady, parseSenderEmail } from "@/features/chatbot/chatbot-gmail-shared";
import { getGmailMessageForChatbot } from "@/features/chatbot/chatbot-gmail-inbox";
import { getAdminDb } from "@/core/config/firebase-admin";

/** Propose des dossiers intervention à lier à un mail (lecture seule). */
export async function suggestGmailInterventionLinksForChatbot(
  companyId: string,
  input: { messageId: string }
): Promise<{
  messageId: string;
  from: string;
  subject: string;
  senderEmail: string | null;
  candidates: Array<{
    interventionId: string;
    clientName: string;
    status: string | null;
    score: number;
    reasons: string[];
  }>;
  hint: string;
}> {
  await assertGmailReady();
  const msg = await getGmailMessageForChatbot(input.messageId);
  const haystack = `${msg.from} ${msg.subject} ${msg.bodyText} ${msg.snippet}`.toLowerCase();
  const senderEmail = parseSenderEmail(msg.from);

  const interventions = await fetchInterventionsForCompany(getAdminDb(), companyId, 250);
  const scored: Array<{
    interventionId: string;
    clientName: string;
    status: string | null;
    score: number;
    reasons: string[];
  }> = [];

  for (const row of interventions) {
    const id = String(row.id || "");
    if (!id) continue;
    const clientName =
      String(row.clientName || "").trim() ||
      [row.clientFirstName, row.clientLastName].filter(Boolean).join(" ").trim() ||
      String(row.clientCompanyName || "").trim() ||
      "Client";
    const ivHaystack = interventionSearchHaystack(row).toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    const ivEmail = String(row.clientEmail || row.email || "")
      .trim()
      .toLowerCase();
    if (senderEmail && ivEmail && senderEmail === ivEmail) {
      score += 40;
      reasons.push("email expéditeur = email dossier");
    }

    const nameLower = clientName.toLowerCase();
    if (nameLower.length >= 3 && haystack.includes(nameLower)) {
      score += 25;
      reasons.push(`nom « ${clientName} » dans le mail`);
    }

    const tokens = nameLower.split(/\s+/).filter((t) => t.length >= 4);
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 8;
        reasons.push(`mot « ${token} »`);
      }
    }

    if (ivHaystack && haystack.split(/\s+/).some((w) => w.length >= 5 && ivHaystack.includes(w))) {
      score += 5;
    }

    if (score > 0) {
      scored.push({
        interventionId: id,
        clientName,
        status: row.status != null ? String(row.status) : null,
        score,
        reasons: [...new Set(reasons)].slice(0, 4),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 5);

  return {
    messageId: msg.id,
    from: msg.from,
    subject: msg.subject,
    senderEmail: senderEmail || null,
    candidates,
    hint:
      candidates.length > 0
        ? "Proposez link_gmail_to_intervention avec interventionId du candidat le plus pertinent (après confirmation utilisateur)."
        : "Aucun dossier évident — utilisez search_workspace avec le nom du client puis link_gmail_to_intervention.",
  };
}
