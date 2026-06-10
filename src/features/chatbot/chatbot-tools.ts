export type ChatbotToolDefinition = {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
};

/** Outils Chatbot — exécution serveur (Firebase Admin) ; écriture avec confirmation UI. */
export const CHATBOT_TOOL_DEFINITIONS: ChatbotToolDefinition[] = [
  {
    name: "get_workspace_summary",
    description:
      "Vue d'ensemble : compteurs interventions par statut, CA estimé, urgences, stock bas, techniciens.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_interventions",
    description: "Liste les interventions de la société active avec filtres optionnels.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description:
            "pending | assigned | en_route | in_progress | done | invoiced | cancelled | waiting_material",
        },
        urgentOnly: { type: "boolean" },
        scheduledDate: { type: "string", description: "AAAA-MM-JJ" },
        search: { type: "string", description: "Recherche client, adresse, problème" },
        limit: { type: "number", description: "Max 50, défaut 20" },
      },
    },
  },
  {
    name: "get_intervention_detail",
    description: "Détail complet d'une intervention par son id.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "search_workspace",
    description:
      "Recherche transversale PWA par nom, téléphone, email ou adresse : clients CRM, interventions et devis. À utiliser en premier pour un nom de personne (ex. « Vatsaev »).",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texte à chercher (nom, tél., email…)" },
        limit: { type: "number", description: "Max par catégorie, défaut 25" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_clients",
    description:
      "Liste le carnet clients CRM. Pour un nom précis, préférer search_workspace (couvre aussi les clients présents uniquement sur des interventions).",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_client_detail",
    description:
      "Fiche client CRM par id : coordonnées, sites et interventions liées (clientId ou nom sur dossier).",
    input_schema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
      },
      required: ["clientId"],
    },
  },
  {
    name: "list_quotes",
    description: "Liste les devis (quotes) de la société.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "draft | sent | accepted | refused" },
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_technicians",
    description: "Liste les techniciens de la société (planning / assignation).",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_stock_alerts",
    description: "Articles de stock sous le seuil d'alerte.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_material_orders",
    description: "Commandes matériel liées à une intervention.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_inbox_notifications",
    description: "Notifications inbox de l'utilisateur connecté (alertes, assignations, SLA).",
    input_schema: {
      type: "object",
      properties: {
        unreadOnly: { type: "boolean" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "list_gmail_inbox",
    description:
      "Lit la boîte Gmail connectée (page 6 — même compte OAuth). Liste les mails récents avec extrait. Utilise pour colis (Bpost, Colissimo, DPD…), mails clients non encore dans un dossier, ou « quoi de neuf dans mes mails ». Paramètre q = syntaxe recherche Gmail (ex. « colis OR bpost », « from:client@be », « is:unread »). Enchaîne avec get_gmail_message pour le corps complet.",
    input_schema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Recherche Gmail (optionnel)" },
        labelId: { type: "string", description: "INBOX, STARRED, etc. (optionnel)" },
        unreadOnly: { type: "boolean", description: "Uniquement non lus" },
        limit: { type: "number", description: "Nombre max (défaut 12, max 20)" },
      },
    },
  },
  {
    name: "get_gmail_message",
    description:
      "Corps complet d'un mail Gmail (id retourné par list_gmail_inbox). Indispensable pour numéro de colis, adresse client, demande dans un email entrant.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID message Gmail" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "suggest_gmail_intervention_links",
    description:
      "Propose des dossiers intervention à lier à un mail Gmail (lecture seule, scoring email/nom/corps). Appelle avant link_gmail_to_intervention quand le dossier n'est pas évident.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID message Gmail" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "list_intervention_emails",
    description:
      "Emails liés à une intervention (fil Firestore / dossier — pas la boîte Gmail globale).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "get_intervention_billing",
    description:
      "Facturation d'une intervention : lignes, montants, statut paiement, PDF facture. Utilise search_workspace ou list_interventions pour trouver l'id dossier si l'utilisateur cite un nom (ex. Vatsaev).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "patch_intervention_billing",
    description:
      "Modifie une ligne de facturation (prix unitPriceEur, quantité, description, clientName). La PWA affiche le PDF facture à droite — tu ne génères jamais le PDF. Préférer pour changer un prix. workflow : search_workspace si besoin → get_intervention_billing → patch. userConfirmed=true obligatoire (ou confirmation UI si false).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        lineIndex: { type: "number", description: "Index ligne (défaut 0)" },
        unitPriceEur: { type: "number", description: "Prix unitaire en euros (ex. 500)" },
        unitPriceCents: { type: "number", description: "Alternative en centimes" },
        quantity: { type: "number" },
        description: { type: "string" },
        clientName: { type: "string", description: "Nom client sur la facture PDF" },
        previewDocumentType: { type: "string", enum: ["quote", "invoice"] },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "userConfirmed"],
    },
  },
  {
    name: "update_intervention_billing",
    description:
      "Remplace toutes les lignes de facturation (unitPriceCents en centimes). La PWA génère le PDF. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        clientName: { type: "string" },
        clientAddress: { type: "string" },
        billingLines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unitPriceCents: { type: "number" },
              reference: { type: "string" },
            },
            required: ["description", "quantity", "unitPriceCents"],
          },
        },
        previewDocumentType: { type: "string", enum: ["quote", "invoice"] },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "billingLines", "userConfirmed"],
    },
  },
  {
    name: "focus_intervention_document",
    description:
      "Affiche le PDF à droite (devis, facture, rapport) sans modifier Firestore. Après patch_intervention_billing le PDF s'affiche déjà — ne pas rappeler.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        documentType: {
          type: "string",
          enum: ["quote", "invoice", "report"],
        },
      },
      required: ["interventionId", "documentType"],
    },
  },
  {
    name: "list_portal_chat",
    description: "Messages chat portail client (Ivana) — société ou dossier précis.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string", description: "Optionnel — filtrer un dossier" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "statistiques_periode",
    description:
      "Statistiques chiffre d'affaires et volume d'interventions sur une période (mois, trimestre, année). Renvoie le CA facturé, les encaissements, le nombre de dossiers par statut.",
    input_schema: {
      type: "object",
      properties: {
        dateFrom: { type: "string", description: "Date début AAAA-MM-JJ" },
        dateTo: { type: "string", description: "Date fin AAAA-MM-JJ" },
        groupBy: { type: "string", description: "month | week | status (défaut : status)" },
      },
      required: ["dateFrom", "dateTo"],
    },
  },
  {
    name: "update_intervention_status",
    description:
      "Change le statut d'une intervention. Nécessite userConfirmed=true après accord explicite de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        status: {
          type: "string",
          enum: [
            "pending",
            "assigned",
            "en_route",
            "in_progress",
            "done",
            "invoiced",
            "cancelled",
            "waiting_material",
          ],
        },
        note: { type: "string", description: "Commentaire interne optionnel" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "status", "userConfirmed"],
    },
  },
  {
    name: "assign_technician",
    description:
      "Assigne un technicien à une intervention (statut assigned). userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        technicianUid: { type: "string" },
        scheduledDate: { type: "string" },
        scheduledTime: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "technicianUid", "userConfirmed"],
    },
  },
  {
    name: "update_intervention_schedule",
    description: "Met à jour la date/heure planifiée. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        scheduledDate: { type: "string" },
        scheduledTime: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "scheduledDate", "scheduledTime", "userConfirmed"],
    },
  },
  {
    name: "add_timeline_comment",
    description:
      "Ajoute une note interne sur la timeline du dossier. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        content: { type: "string" },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "content", "userConfirmed"],
    },
  },
  {
    name: "save_client_email",
    description:
      "Enregistre l'adresse email sur le dossier intervention et la fiche CRM (champ `em` du snapshot pour les prochains messages). Utilise quand l'utilisateur donne un mail dans le chat sans envoyer tout de suite, ou avant send_intervention_email.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        email: { type: "string", description: "Adresse email à mémoriser" },
      },
      required: ["interventionId", "email"],
    },
  },
  {
    name: "send_intervention_email",
    description:
      "Envoie un email au client lié à une intervention. Par défaut joint le PDF facture du dossier (attachDocumentType=invoice). Devis → quote. Omettre attachDocumentType ou invoice si l'utilisateur demande d'envoyer la facture / le PDF. none uniquement si envoi sans pièce jointe explicite. Utilise `em` du snapshot ou clientEmail si présent ; adresse citée dans le chat → `to`. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        to: { type: "string", description: "Adresse email du destinataire" },
        subject: { type: "string" },
        bodyText: { type: "string", description: "Corps du message en texte brut" },
        inReplyTo: {
          type: "string",
          description: "Message-ID d'un email existant pour répondre dans le fil (optionnel)",
        },
        attachDocumentType: {
          type: "string",
          enum: ["invoice", "quote", "none"],
          description:
            "PDF joint généré depuis le dossier : invoice=facture (défaut, à utiliser pour « envoyer la facture »), quote=devis, none=sans PJ",
        },
        userConfirmed: { type: "boolean" },
      },
      required: ["interventionId", "to", "subject", "bodyText", "userConfirmed"],
    },
  },
  {
    name: "search_lecot_products",
    description:
      "OBLIGATOIRE si l'utilisateur demande une pièce/outil ou demande des suggestions (ex. « perceuse », « 5 serrures »). Tu AS ACCÈS au catalogue via cet outil, ne dis jamais l'inverse. Recherche le catalogue Lecot (local + API) et renvoie des suggestions avec prix, sku. Ne renvoie pas l'utilisateur sur le site sans l'avoir appelé.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Terme de recherche en français (ex: perceuse, cylindre Yale, serrure multipoints)",
        },
        limit: {
          type: "number",
          description: "Nombre max de résultats (défaut 3 pour proposer un choix)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_supplier_orders",
    description:
      "Liste les commandes fournisseur (Lecot, etc.) de la société, avec statut et détail des lignes.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max 20, défaut 10" },
        interventionId: { type: "string", description: "Filtrer par dossier (optionnel)" },
      },
    },
  },
  {
    name: "order_lecot_parts",
    description:
      "Crée une commande fournisseur Lecot. IMPORTANT : reprendre sku + unitPriceEur (ou unitPriceCents) EXACTEMENT depuis search_lecot_products. Quantité : toujours 1 par défaut — ne jamais demander la quantité à l'utilisateur. NE PAS inclure userConfirmed : confirmation via l'interface.",
    input_schema: {
      type: "object",
      properties: {
        lines: {
          type: "array",
          description:
            "Lignes de commande — reprendre sku et unitPriceEur depuis search_lecot_products",
          items: {
            type: "object",
            properties: {
              sku: {
                type: "string",
                description:
                  "Référence SKU du catalogue (ex. LEC-SER-1001) — copier depuis search_lecot_products",
              },
              label: {
                type: "string",
                description: "Libellé exact du produit — copier depuis search_lecot_products",
              },
              quantity: {
                type: "number",
                description:
                  "Quantité (mets toujours 1 par défaut, ne demande jamais à l'utilisateur)",
              },
              unitPriceEur: {
                type: "number",
                description:
                  "OBLIGATOIRE — prix unitaire HT en euros depuis search_lecot_products (ex. 145.00)",
              },
              unitPriceCents: {
                type: "number",
                description: "Alternative : prix unitaire HT en centimes (ex. 14500 = 145 €)",
              },
              imageUrl: {
                type: "string",
                description:
                  "URL vignette produit — copier depuis search_lecot_products si disponible",
              },
            },
            required: ["label", "unitPriceEur"],
          },
        },
        interventionId: {
          type: "string",
          description:
            "ID dossier lié — crée bon matériel + enregistre commande PWA + ajoute lignes à la facture",
        },
        syncBilling: {
          type: "boolean",
          description: "Ajouter les lignes à la facture dossier (défaut true si interventionId)",
        },
        notes: { type: "string", description: "Notes internes (optionnel)" },
        clientName: {
          type: "string",
          description:
            "Nom du client affiché dans le panneau Commandes (obligatoire sur la page Matériel avant toute commande Lecot)",
        },
      },
      required: ["lines"],
    },
  },
  {
    name: "send_gmail_reply",
    description:
      "Compose et envoie une réponse Gmail à un mail spécifique. Utilise quand l'utilisateur demande de répondre à un mail (ex: 'Réponds au mail de client@example.com en disant que l'intervention est fixée lundi'). Requiert l'id du mail (obtenu via list_gmail_inbox ou get_gmail_message). Ne jamais envoyer sans confirmation explicite de l'utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        messageId: {
          type: "string",
          description: "ID du mail auquel répondre (obtenu via list_gmail_inbox)",
        },
        bodyText: { type: "string", description: "Corps de la réponse en texte plain" },
        to: {
          type: "string",
          description:
            "Adresse email du destinataire (optionnel, déduit du mail original si absent)",
        },
        subject: {
          type: "string",
          description: "Sujet (optionnel, 'Re: <sujet original>' par défaut)",
        },
      },
      required: ["messageId", "bodyText"],
    },
  },
  {
    name: "list_company_material_orders",
    description:
      "Liste les bons matériel de la société (tous dossiers). Filtre optionnel status=pending|ordered|delivered|… — idéal pour valider en masse.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "pending | approved | ordered | delivered | received | cancelled",
        },
        limit: { type: "number", description: "Max 40, défaut 20" },
      },
    },
  },
  {
    name: "approve_material_orders",
    description:
      "Valide des demandes matériel terrain (pending → ordered). orderIds OU approveAllPending=true. userConfirmed=true obligatoire.",
    input_schema: {
      type: "object",
      properties: {
        orderIds: {
          type: "array",
          items: { type: "string" },
          description: "IDs bons matériel à approuver",
        },
        approveAllPending: {
          type: "boolean",
          description: "Approuver toutes les demandes pending de la société (max 15)",
        },
        userConfirmed: { type: "boolean" },
      },
      required: ["userConfirmed"],
    },
  },
  {
    name: "focus_stock_item",
    description:
      "Met en avant un article stock dans l'UI Matériel (sélection + filtre optionnel low|orders|lecot).",
    input_schema: {
      type: "object",
      properties: {
        stockItemId: { type: "string" },
        filter: { type: "string", enum: ["all", "low", "orders", "lecot"] },
        searchQuery: { type: "string", description: "Pré-remplit la recherche inventaire" },
      },
    },
  },
  {
    name: "focus_billing_case",
    description:
      "Sélectionne un dossier dans la liste facturation et applique un filtre (unpaid, to_bill, paid, all).",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
        filter: { type: "string", enum: ["all", "unpaid", "pending", "paid", "to_bill"] },
      },
    },
  },
  {
    name: "open_crm_dossier",
    description:
      "Ouvre le dossier dans le back-office (hub interventions) pour suivi détaillé après analyse historique.",
    input_schema: {
      type: "object",
      properties: {
        interventionId: { type: "string" },
      },
      required: ["interventionId"],
    },
  },
  {
    name: "link_gmail_to_intervention",
    description:
      "Lie un mail Gmail à une intervention existante et sauvegarde les infos extraites (expéditeur, corps) dans le dossier. Utile quand un client envoie un mail avec des informations pertinentes pour un dossier (demande, adresse, update de colis…). Appelle get_gmail_message puis search_workspace avant d'appeler cet outil.",
    input_schema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "ID du mail Gmail" },
        interventionId: { type: "string", description: "ID de l'intervention à lier" },
        note: {
          type: "string",
          description: "Note optionnelle à ajouter à la timeline de l'intervention",
        },
      },
      required: ["messageId", "interventionId"],
    },
  },
];

export const CHATBOT_WRITE_TOOLS = new Set([
  "update_intervention_status",
  "assign_technician",
  "update_intervention_schedule",
  "add_timeline_comment",
  "send_intervention_email",
  "patch_intervention_billing",
  "update_intervention_billing",
  "order_lecot_parts",
  "approve_material_orders",
  "send_gmail_reply",
  "link_gmail_to_intervention",
]);

export function isChatbotWriteTool(name: string): boolean {
  return CHATBOT_WRITE_TOOLS.has(name);
}
