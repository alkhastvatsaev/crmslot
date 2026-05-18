export interface InterventionEvent {
  id: string;
  interventionId: string;
  type: 'status_change' | 'comment' | 'email' | 'material_order' | 'commission' | 'portal_chat';
  createdAt: string;
  createdByUid: string;
  content?: string;
  oldStatus?: string;
  newStatus?: string;
  /** Notes internes vs visibles client (portail). */
  visibility?: 'internal' | 'client';
  actorRole?: string;
}

export interface Intervention {
  id: string;
  title: string;
  address: string;
  time: string;
  status:
    | 'pending'
    | 'assigned'
    | 'en_route'
    | 'in_progress'
    | 'done'
    | 'pending_needs_address'
    | 'invoiced'
    | 'waiting_material'
    | 'cancelled';
  location: {
    lat: number;
    lng: number;
  };
  phone?: string | null;
  clientName?: string | null;
  /** Demande société (wizard) — contact séparé. */
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompanyName?: string | null;
  clientPhone?: string | null;
  urgency?: boolean;
  category?: 'serrurerie' | 'autre';
  problem?: string | null;
  date?: string | null;
  hour?: string | null;
  transcription?: string;
  audioUrl?: string;
  /** Chemin objet Storage relatif au bucket (ex. intervention-audios/{id}/... ). */
  audioStoragePath?: string | null;
  /** MIME type du message vocal (audio/mp4, audio/webm, etc). */
  audioMimeType?: string | null;
  createdAt?: string;
  /** Multi-tenant : isolation par société (voir Firestore rules). */
  companyId?: string | null;
  /** Créateur de la demande (Firebase Auth uid). */
  createdByUid?: string | null;
  /** Responsable actuel du dossier (dénormalisé à chaque transition). */
  currentOwnerUid?: string | null;
  currentOwnerRole?: 'dispatcher' | 'technician' | 'client' | 'system' | null;
  statusUpdatedAt?: string | null;
  /** Technicien désigné — filtre sécurité + dashboard Prompt 4. */
  assignedTechnicianUid?: string | null;
  /** Horodatage acceptation terrain (passage `assigned` → `en_route`). */
  technicianAcceptedAt?: string | null;
  technicianDeclinedAt?: string | null;
  technicianDeclinedByUid?: string | null;
  /** Planification optionnelle (AAAA-MM-JJ + HH:mm), sinon repli sur createdAt. */
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  /** Souhaits du client lors de la demande. */
  requestedDate?: string | null;
  requestedTime?: string | null;
  /** Miniatures JPEG compressées (data URLs), usage interne / prévisualisation. */
  attachmentThumbnails?: string[];
  /** Fin d’intervention — URLs Storage (JPEG) avec catégorisation par type. */
  completionPhotos?: { url: string; category: 'panne' | 'materiel' | 'preuve' | 'autre' }[];
  /** Legacy field, conservé pour la rétrocompatibilité (temporaire) */
  completionPhotoUrls?: string[];
  completionSignatureUrl?: string | null;
  /** URL HTTPS Firebase Storage (PDF), renseignée par Cloud Function après facturation auto. */
  invoicePdfUrl?: string | null;
  /** Chemin objet Storage relatif au bucket (ex. invoices/{id}.pdf). */
  invoicePdfStoragePath?: string | null;
  invoicedAt?: string | null;
  /** Montant facturé en centimes (base commission + paiement client). */
  invoiceAmountCents?: number | null;
  /** Lignes facturables saisies par le technicien avant clôture. */
  billingLines?: { description: string; quantity: number; unitPriceCents: number; reference?: string }[];
  /** Commission technicien calculée en centimes (dénormalisé). */
  commissionAmountCents?: number | null;
  paymentStatus?: "unpaid" | "pending" | "paid" | "refunded" | null;
  stripePaymentLinkUrl?: string | null;
  stripePaymentIntentId?: string | null;
  paidAt?: string | null;
  completedAt?: string | null;
  completedByUid?: string | null;
  /** Validation Ivana (back-office). */
  ivanaVerified?: boolean;
  /** Durée prévue de l'intervention (minutes). Améliore la précision des conflits de planning. */
  estimatedDurationMinutes?: number | null;
  /** Durée réelle calculée à la clôture (completedAt − technicianAcceptedAt). */
  actualDurationMinutes?: number | null;
  /** Token UUID d'accès portail client (lecture anonyme via API route). */
  portalAccessToken?: string | null;
  /** CRM — référence client société. */
  clientId?: string | null;
  /** CRM — site d'intervention lié au client. */
  siteId?: string | null;
  /** SAV / garantie — intervention parente. */
  parentInterventionId?: string | null;
  /** Devis lié (Phase 11). */
  quoteId?: string | null;
  /** Priorité SLA (Phase 16). */
  priority?: "low" | "medium" | "high" | "urgent" | null;
  /** Compétences requises (Phase 13). */
  requiredSkills?: string[] | null;
  /** Géofencing — arrivée auto détectée (Phase 17). */
  autoArrivedAt?: string | null;
  /** WhatsApp client (Phase 19). */
  clientWhatsapp?: string | null;
  /** Satisfaction client post-intervention (1–5 étoiles). */
  clientRating?: number | null;
  clientComment?: string | null;
  clientRatedAt?: string | null;
}
