/** Gabarit client (`SMART_FORM_TEMPLATES`) → modèle facturation (`BILLING_TEMPLATES`). */
export const PROBLEM_TEMPLATE_TO_BILLING_TEMPLATE: Readonly<Record<string, string>> = {
  "locked-out": "bill-ouverture-claquee",
  blocked: "bill-ouverture-claquee",
  armored: "bill-ouverture-forcee",
  "broken-key": "bill-cylindre-simple",
  cylinder: "bill-cylindre-simple",
  safe: "bill-installation-coffre",
  "roller-shutter": "bill-depannage-general",
  digicode: "bill-depannage-general",
  "key-copy": "bill-depannage-general",
};

export function billingTemplateIdForProblemTemplate(problemTemplateId: string): string | null {
  const id = problemTemplateId.trim();
  if (!id) return null;
  return PROBLEM_TEMPLATE_TO_BILLING_TEMPLATE[id] ?? null;
}
