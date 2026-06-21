/** Prompt agent matériel — commande liée à un dossier intervention. */
export function buildInterventionMaterialOrderPrompt(params: {
  quantity: number;
  description: string;
  reference?: string | null;
  interventionId: string;
  clientName: string;
}): string {
  const ref = params.reference?.trim();
  const refBit = ref ? ` (réf. ${ref})` : "";
  return `Commander ${params.quantity}× "${params.description}"${refBit} — dossier ${params.interventionId} — client : ${params.clientName}`;
}

const INTERVENTION_ORDER_RE =
  /^commander\s+(\d+)[×x]\s+"([^"]+)"(?:\s+\(réf\.\s*([^)]+)\))?\s*[—–-]\s*dossier\s+(\S+)\s*[—–-]\s*client\s*:\s*(.+)$/i;

export type InterventionMaterialOrderIntent = {
  quantity: number;
  description: string;
  reference: string | null;
  interventionId: string;
  clientName: string;
};

export function parseInterventionMaterialOrderIntent(
  text: string
): InterventionMaterialOrderIntent | null {
  const m = INTERVENTION_ORDER_RE.exec(text.trim());
  if (!m) return null;
  return {
    quantity: Math.max(1, Number(m[1]) || 1),
    description: m[2].trim(),
    reference: m[3]?.trim() || null,
    interventionId: m[4].trim(),
    clientName: m[5].trim(),
  };
}

export function isInterventionMaterialOrderPrompt(text: string): boolean {
  return INTERVENTION_ORDER_RE.test(text.trim());
}
