/** Résumé court pour la confirmation utilisateur avant écriture Firestore. */
export function chatbotPendingToolSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "update_intervention_status":
      return `Passer l'intervention ${input.interventionId} au statut « ${input.status} »`;
    case "assign_technician":
      return `Assigner le technicien ${input.technicianUid} sur ${input.interventionId}`;
    case "update_intervention_schedule":
      return `Planifier ${input.interventionId} le ${input.scheduledDate} à ${input.scheduledTime}`;
    case "add_timeline_comment":
      return `Ajouter une note interne sur ${input.interventionId}`;
    case "send_intervention_email":
      return `Envoyer un email à ${input.to} — objet : « ${String(input.subject || "").slice(0, 80)} » (dossier ${input.interventionId})`;
    case "patch_intervention_billing": {
      const eur =
        input.unitPriceEur ??
        (input.unitPriceCents != null ? Number(input.unitPriceCents) / 100 : null);
      const bits = [
        eur != null ? `prix ${eur} €` : null,
        input.clientName ? `client « ${String(input.clientName).slice(0, 40)} »` : null,
      ].filter(Boolean);
      return `Facture ${input.interventionId}${bits.length ? ` — ${bits.join(", ")}` : ""}`;
    }
    case "update_intervention_billing":
      return `Mettre à jour les lignes de facturation du dossier ${input.interventionId}`;
    case "order_lecot_parts": {
      const parts = Array.isArray(input.lines) ? input.lines : [];
      const count = parts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      return `Commander ${count} pièce(s) chez Lecot`;
    }
    case "send_gmail_reply":
      return `Répondre au mail ${input.messageId} : « ${String(input.bodyText || "").slice(0, 80)} »`;
    case "link_gmail_to_intervention":
      return `Lier le mail ${input.messageId} au dossier ${input.interventionId}`;
    default:
      return `Action : ${name}`;
  }
}
