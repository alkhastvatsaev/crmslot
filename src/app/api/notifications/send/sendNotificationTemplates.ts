export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function interpolateTemplate(key: string, vars: Record<string, string>): string {
  const templates: Record<string, string> = {
    // Emails existants
    "notifications.email.assigned.subject": "Votre intervention est confirmée — {{clientName}}",
    "notifications.email.en_route.subject": "Votre technicien est en route — {{technicianName}}",
    "notifications.email.done.subject": "Intervention terminée — {{title}}",
    "notifications.email.invoiced.subject": "Votre facture est disponible — {{title}}",
    "notifications.email.waiting_material.subject":
      "Intervention en attente de matériel — {{title}}",
    "notifications.email.cancelled.subject": "Intervention annulée — {{title}}",
    "notifications.email.report_rejected.subject":
      "Rapport refusé — veuillez compléter l'intervention {{title}}",
    // Emails nouveaux
    "notifications.email.pending.subject": "Nouveau dossier reçu — {{title}}",
    "notifications.email.needs_address.subject": "Adresse manquante — {{title}}",
    "notifications.email.done_dispatcher.subject":
      "Rapport à valider — {{title}} ({{technicianName}})",
    // Push (titres courts)
    "notifications.push.assigned.subject": "Nouvelle mission",
    "notifications.push.in_progress.subject": "Intervention démarrée",
    "notifications.push.waiting_material.subject": "Matériel à commander",
    "notifications.push.material_received.subject": "Matériel reçu — on reprend",
    "notifications.push.cancelled_staff.subject": "Dossier annulé",
    "notifications.push.needs_address_dispatcher.subject": "Adresse manquante",
    // Divers
    weekly_digest: "Résumé hebdomadaire facturation — société {{companyId}}",
    appointment_reminder: "{{subject}}",
  };

  let text = templates[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
  }
  return text;
}

export function buildEmailHtml(bodyKey: string, vars: Record<string, string>): string {
  const bodyTemplates: Record<string, string> = {
    // ── Push (texte court, mis directement dans `body` FCM) ──
    "notifications.push.assigned.body": `{{title}} — {{address}}`,
    "notifications.push.in_progress.body": `Votre technicien {{technicianName}} a commencé.`,
    "notifications.push.waiting_material.body": `{{title}} — pièce à commander`,
    "notifications.push.material_received.body": `Matériel reçu pour {{title}} — on reprend`,
    "notifications.push.cancelled_staff.body": `Dossier {{title}} annulé`,
    "notifications.push.needs_address_dispatcher.body": `{{title}} — adresse à compléter`,
    // ── Emails nouveaux ──
    "notifications.email.pending.body": `
      <p>Nouveau dossier reçu :</p>
      <ul>
        <li><strong>Titre :</strong> {{title}}</li>
        <li><strong>Adresse :</strong> {{address}}</li>
        <li><strong>Client :</strong> {{clientName}} ({{clientPhone}})</li>
      </ul>
      <p>À traiter depuis le dispatcher.</p>`,
    "notifications.email.needs_address.body": `
      <p>L'adresse du dossier <strong>{{title}}</strong> est manquante.</p>
      <p>Le dossier ne peut pas être assigné tant que l'adresse n'est pas renseignée.</p>`,
    "notifications.email.done_dispatcher.body": `
      <p>Le technicien <strong>{{technicianName}}</strong> a terminé l'intervention <strong>{{title}}</strong>.</p>
      <p>Le rapport est à valider dans le dispatcher.</p>`,
    // ── Emails existants ──
    "notifications.email.assigned.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Un technicien a été assigné à votre demande d'intervention.</p>
      <ul>
        <li><strong>Intervention :</strong> {{title}}</li>
        <li><strong>Adresse :</strong> {{address}}</li>
        <li><strong>Date prévue :</strong> {{scheduledDate}} à {{scheduledTime}}</li>
        <li><strong>Technicien :</strong> {{technicianName}}</li>
      </ul>
      <p>Vous recevrez une notification dès que le technicien sera en route.</p>`,
    "notifications.email.en_route.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Bonne nouvelle ! Votre technicien <strong>{{technicianName}}</strong> est en route vers :</p>
      <p><strong>{{address}}</strong></p>
      <p>Il devrait arriver sous peu. Merci de vous assurer que l'accès est possible.</p>`,
    "notifications.email.done.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Votre intervention <strong>{{title}}</strong> a été clôturée avec succès.</p>
      <p>Vous recevrez votre facture par email dans les plus brefs délais.</p>`,
    "notifications.email.invoiced.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Votre facture pour l'intervention <strong>{{title}}</strong> est maintenant disponible.</p>
      <p>Vous pouvez la consulter et la télécharger depuis votre espace client.</p>`,
    "notifications.email.waiting_material.body": `
      <p>Bonjour,</p>
      <p>L'intervention <strong>{{title}}</strong> à l'adresse <strong>{{address}}</strong> est en attente de matériel.</p>
      <p>Le technicien {{technicianName}} a fait une commande. Vous serez recontacté dès réception.</p>`,
    "notifications.email.cancelled.body": `
      <p>Bonjour <strong>{{clientName}}</strong>,</p>
      <p>Nous vous informons que votre intervention <strong>{{title}}</strong> a été annulée.</p>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>`,
    "notifications.email.report_rejected.body": `
      <p>Bonjour,</p>
      <p>Le dispatcher a refusé votre rapport pour l'intervention <strong>{{title}}</strong>.</p>
      <p><strong>Motif :</strong> {{rejectionReason}}</p>
      <p>Merci de rouvrir la mission et de compléter ou corriger le rapport avant de le soumettre à nouveau.</p>`,
    weekly_digest_body: `
      <p>Résumé hebdomadaire facturation (société {{companyId}})</p>
      <ul>
        <li>Factures payées : {{paidCount}}</li>
        <li>Impayés : {{unpaidCount}}</li>
        <li>CA facturé HT : {{revenueEur}} €</li>
      </ul>`,
    appointment_reminder_body: `<pre>{{body}}</pre>`,
  };

  let body = bodyTemplates[bodyKey] || `<p>${bodyKey}</p>`;
  for (const [k, v] of Object.entries(vars)) {
    body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
  }

  return `
    <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 20px; margin: 0;">MAP BELGIQUE</h1>
        <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">Expertise & Sécurité Mobile</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        ${body}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">L'équipe MAP BELGIQUE</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">Serrurerie · Alarme · Contrôle d'accès | Bruxelles</p>
      </div>
    </div>
  `;
}
