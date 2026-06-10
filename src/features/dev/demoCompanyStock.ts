import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import type { StockItem } from "@/features/materials/stockFirestore";

const NOW = "2026-05-21T12:00:00.000Z";

/** Catalogue serrurerie réaliste — affiché si stock Firestore vide (démo / onboarding). */
export const DEMO_COMPANY_STOCK_CATALOG: StockItem[] = [
  {
    id: "demo-stock-cyl-sec",
    companyId: DEMO_COMPANY_ID,
    reference: "CYL-EURO-80",
    lecotSku: "LEC-CYL-2012",
    description: "Cylindre européen 80 mm sécurité",
    quantity: 0,
    alertThreshold: 4,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-cyl-70",
    companyId: DEMO_COMPANY_ID,
    reference: "CYL-EURO-70",
    lecotSku: "LEC-CYL-2008",
    description: "Cylindre européen 70 mm",
    quantity: 2,
    alertThreshold: 6,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-barillet",
    companyId: DEMO_COMPANY_ID,
    reference: "BAR-A2P",
    lecotSku: "LEC-CYL-2013",
    description: "Barillet A2P 5 goupilles",
    quantity: 0,
    alertThreshold: 3,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-cremone",
    companyId: DEMO_COMPANY_ID,
    reference: "CREM-3PT",
    lecotSku: "LEC-SER-1001",
    description: "Crémone multipoint 3 points",
    quantity: 1,
    alertThreshold: 4,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-gache",
    companyId: DEMO_COMPANY_ID,
    reference: "GACH-ELEC",
    lecotSku: "LEC-CTL-4003",
    description: "Gâche électrique réversible",
    quantity: 3,
    alertThreshold: 8,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-serrure",
    companyId: DEMO_COMPANY_ID,
    reference: "SERR-APL",
    lecotSku: "LEC-SER-1014",
    description: "Serrure applique A2P",
    quantity: 5,
    alertThreshold: 6,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-cle-badge",
    companyId: DEMO_COMPANY_ID,
    reference: "BADGE-125",
    lecotSku: "LEC-CTL-4024",
    description: "Badge RFID 125 kHz",
    quantity: 12,
    alertThreshold: 20,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-telecommande",
    companyId: DEMO_COMPANY_ID,
    reference: "TELE-4CH",
    lecotSku: "LEC-CTL-4048",
    description: "Télécommande portail 4 canaux",
    quantity: 0,
    alertThreshold: 5,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-vis",
    companyId: DEMO_COMPANY_ID,
    reference: "VIS-INOX-6",
    lecotSku: "LEC-CNS-6051",
    description: "Vis inox M6 × 40 (boîte 100)",
    quantity: 8,
    alertThreshold: 15,
    unit: "boîte",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-gond",
    companyId: DEMO_COMPANY_ID,
    reference: "GOND-REN",
    lecotSku: "LEC-QUI-3060",
    description: "Gond renforcé paumelle lourde",
    quantity: 14,
    alertThreshold: 10,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-joint",
    companyId: DEMO_COMPANY_ID,
    reference: "JOINT-EPDM",
    lecotSku: "LEC-QUI-3042",
    description: "Joint EPDM porte blindée",
    quantity: 4,
    alertThreshold: 12,
    unit: "m",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-lubrif",
    companyId: DEMO_COMPANY_ID,
    reference: "LUB-CYL",
    lecotSku: "LEC-CNS-6037",
    description: "Lubrifiant cylindre 400 ml",
    quantity: 6,
    alertThreshold: 8,
    unit: "pcs",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-gants",
    companyId: DEMO_COMPANY_ID,
    reference: "GANT-NIT",
    lecotSku: "LEC-OUT-7044",
    description: "Gants nitrile (boîte 100)",
    quantity: 22,
    alertThreshold: 10,
    unit: "boîte",
    updatedAt: NOW,
  },
  {
    id: "demo-stock-lecot",
    companyId: DEMO_COMPANY_ID,
    reference: "LECOT-POIG",
    lecotSku: "LEC-QUI-3001",
    description: "Poignée de porte Lecot inox",
    quantity: 7,
    alertThreshold: 10,
    unit: "pcs",
    updatedAt: NOW,
  },
];

export const DEMO_COMPANY_MATERIAL_ORDERS: MaterialOrderDoc[] = [
  {
    id: "demo-mo-1",
    companyId: DEMO_COMPANY_ID,
    interventionId: "INT-24051",
    clientName: "M. Dupont",
    technicianUid: "demo-tech-local",
    partsRequested: [
      { description: "Cylindre européen 80 mm sécurité", quantity: 2, reference: "CYL-EURO-80" },
      { description: "Gâche électrique réversible", quantity: 1, reference: "GACH-ELEC" },
    ],
    urgency: "high",
    status: "pending",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "demo-mo-2",
    companyId: DEMO_COMPANY_ID,
    interventionId: "INT-24048",
    clientName: "Martin SPRL",
    technicianUid: "demo-tech-local",
    partsRequested: [
      { description: "Barillet A2P 5 goupilles", quantity: 1, reference: "BAR-A2P" },
    ],
    urgency: "normal",
    status: "pending",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function isDemoStockItemId(id: string): boolean {
  return id.startsWith("demo-stock-");
}

export function isDemoMaterialOrderId(id: string): boolean {
  return id.startsWith("demo-mo-");
}

/** Catalogue pour toute société sans stock (aperçu métier). */
export function demoStockItemsForCompany(companyId: string): StockItem[] {
  return DEMO_COMPANY_STOCK_CATALOG.map((row) => ({ ...row, companyId }));
}

export function demoMaterialOrdersForCompany(companyId: string): MaterialOrderDoc[] {
  return DEMO_COMPANY_MATERIAL_ORDERS.map((row) => ({ ...row, companyId }));
}
