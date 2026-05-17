export interface TerrainTemplateLine {
  description: string;
  quantity: number;
  reference?: string;
  /** Prix unitaire en centimes (optionnel, pré-rempli si connu). */
  unitPriceCents?: number;
}

export interface TerrainTemplate {
  id: string;
  name: string;
  /** Catégorie pour regrouper les templates dans l'UI. */
  category: "serrurerie" | "vitrerie" | "plomberie" | "general";
  lines: TerrainTemplateLine[];
}

// ---------------------------------------------------------------------------
// Templates matériel (commandes fournisseur) — utilisés dans MaterialOrderForm
// ---------------------------------------------------------------------------

export const TERRAIN_TEMPLATES: TerrainTemplate[] = [
  {
    id: "multipoint-standard",
    name: "Serrure Multipoint Standard",
    category: "serrurerie",
    lines: [
      { description: "Serrure multipoint à encastrer", quantity: 1, reference: "MP-STD-01" },
      { description: "Cylindre de sécurité 30×30", quantity: 1, reference: "CYL-3030-SEC" },
      { description: "Garniture de sécurité sur plaque", quantity: 1, reference: "GARN-SEC-01" },
      { description: "Main d'œuvre (Heure)", quantity: 2 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
  {
    id: "multipoint-92-40",
    name: "Multipoint 92/40 (Litto / Nemef)",
    category: "serrurerie",
    lines: [
      { description: "Serrure multipoint 92/40 à encastrer", quantity: 1, reference: "92/40" },
      { description: "Cylindre profilé 30×30", quantity: 1, reference: "CYL-3030" },
      { description: "Gâches pour multipoint", quantity: 3, reference: "GACHE-MP" },
      { description: "Garniture sécurité inox", quantity: 1, reference: "GARN-INOX" },
      { description: "Main d'œuvre (Heure)", quantity: 2 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
  {
    id: "ouverture-porte",
    name: "Ouverture de porte (claquée)",
    category: "serrurerie",
    lines: [
      { description: "Forfait ouverture de porte claquée", quantity: 1 },
      { description: "Déplacement urgent", quantity: 1 },
    ],
  },
  {
    id: "ouverture-forcee",
    name: "Ouverture de porte (forcée / effractive)",
    category: "serrurerie",
    lines: [
      { description: "Forfait ouverture de porte forcée", quantity: 1 },
      { description: "Remplacement cylindre après effraction", quantity: 1, reference: "CYL-REPL" },
      { description: "Remplacement garniture endommagée", quantity: 1 },
      { description: "Main d'œuvre (Heure)", quantity: 1.5 },
      { description: "Déplacement urgent", quantity: 1 },
    ],
  },
  {
    id: "remplacement-cylindre",
    name: "Remplacement Cylindre Simple",
    category: "serrurerie",
    lines: [
      { description: "Cylindre européen standard", quantity: 1, reference: "CYL-STD" },
      { description: "Main d'œuvre (Heure)", quantity: 1 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
  {
    id: "remplacement-serrure-complete",
    name: "Remplacement Serrure Complète",
    category: "serrurerie",
    lines: [
      { description: "Serrure à encastrer standard", quantity: 1, reference: "SER-ENC-STD" },
      { description: "Cylindre de sécurité", quantity: 1, reference: "CYL-SEC" },
      { description: "Garniture (poignée + plaque)", quantity: 1 },
      { description: "Gâche de porte", quantity: 1 },
      { description: "Main d'œuvre (Heure)", quantity: 1.5 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
  {
    id: "vitre-simple",
    name: "Remplacement Vitre Simple",
    category: "vitrerie",
    lines: [
      { description: "Vitrage simple 4mm (sur mesure)", quantity: 1 },
      { description: "Joint silicone / mastic", quantity: 1 },
      { description: "Main d'œuvre (Heure)", quantity: 1 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
  {
    id: "depannage-general",
    name: "Dépannage Général",
    category: "general",
    lines: [
      { description: "Diagnostic et dépannage", quantity: 1 },
      { description: "Main d'œuvre (Heure)", quantity: 1 },
      { description: "Déplacement forfaitaire", quantity: 1 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Templates facturation — lignes facturables pré-remplies
// ---------------------------------------------------------------------------

export interface BillingTemplateLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BillingTemplate {
  id: string;
  name: string;
  category: "serrurerie" | "vitrerie" | "plomberie" | "general";
  lines: BillingTemplateLine[];
}

export const BILLING_TEMPLATES: BillingTemplate[] = [
  {
    id: "bill-ouverture-claquee",
    name: "Facturation — Ouverture porte claquée",
    category: "serrurerie",
    lines: [
      { description: "Forfait ouverture de porte claquée", quantity: 1, unitPriceCents: 12500 },
      { description: "Déplacement urgent", quantity: 1, unitPriceCents: 4500 },
    ],
  },
  {
    id: "bill-ouverture-forcee",
    name: "Facturation — Ouverture porte forcée",
    category: "serrurerie",
    lines: [
      { description: "Forfait ouverture forcée / effractive", quantity: 1, unitPriceCents: 18000 },
      { description: "Cylindre de remplacement", quantity: 1, unitPriceCents: 4500 },
      { description: "Garniture de remplacement", quantity: 1, unitPriceCents: 3500 },
      { description: "Main d'œuvre (Heure)", quantity: 1.5, unitPriceCents: 5500 },
      { description: "Déplacement urgent", quantity: 1, unitPriceCents: 4500 },
    ],
  },
  {
    id: "bill-multipoint",
    name: "Facturation — Serrure Multipoint",
    category: "serrurerie",
    lines: [
      { description: "Serrure multipoint à encastrer", quantity: 1, unitPriceCents: 25000 },
      { description: "Cylindre de sécurité 30×30", quantity: 1, unitPriceCents: 4500 },
      { description: "Garniture de sécurité sur plaque", quantity: 1, unitPriceCents: 6000 },
      { description: "Main d'œuvre (Heure)", quantity: 2, unitPriceCents: 5500 },
      { description: "Déplacement forfaitaire", quantity: 1, unitPriceCents: 3500 },
    ],
  },
  {
    id: "bill-cylindre-simple",
    name: "Facturation — Remplacement Cylindre",
    category: "serrurerie",
    lines: [
      { description: "Cylindre européen standard", quantity: 1, unitPriceCents: 4500 },
      { description: "Main d'œuvre (Heure)", quantity: 1, unitPriceCents: 5500 },
      { description: "Déplacement forfaitaire", quantity: 1, unitPriceCents: 3500 },
    ],
  },
  {
    id: "bill-depannage-general",
    name: "Facturation — Dépannage Général",
    category: "general",
    lines: [
      { description: "Diagnostic et dépannage", quantity: 1, unitPriceCents: 7500 },
      { description: "Main d'œuvre (Heure)", quantity: 1, unitPriceCents: 5500 },
      { description: "Déplacement forfaitaire", quantity: 1, unitPriceCents: 3500 },
    ],
  },
];
