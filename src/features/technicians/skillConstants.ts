export const INTERVENTION_SKILLS = [
  "serrurerie",
  "electricite",
  "plomberie",
  "vitrerie",
  "menuiserie",
  "depannage_volet",
  "alarme_securite",
  "climatisation",
  "gaz",
  "toiture",
  "peinture",
  "carrelage",
] as const;

export type InterventionSkill = (typeof INTERVENTION_SKILLS)[number];

export const SKILL_LABELS: Record<InterventionSkill, string> = {
  serrurerie: "Serrurerie",
  electricite: "Électricité",
  plomberie: "Plomberie",
  vitrerie: "Vitrerie",
  menuiserie: "Menuiserie",
  depannage_volet: "Dépannage volet",
  alarme_securite: "Alarme / Sécurité",
  climatisation: "Climatisation",
  gaz: "Gaz",
  toiture: "Toiture",
  peinture: "Peinture",
  carrelage: "Carrelage",
};

export function technicianHasRequiredSkills(
  techSkills: string[] | null | undefined,
  required: string[] | null | undefined,
): boolean {
  if (!required || required.length === 0) return true;
  if (!techSkills || techSkills.length === 0) return false;
  return required.every((s) => techSkills.includes(s));
}

export function missingSkills(
  techSkills: string[] | null | undefined,
  required: string[] | null | undefined,
): string[] {
  if (!required || required.length === 0) return [];
  if (!techSkills || techSkills.length === 0) return required;
  return required.filter((s) => !techSkills.includes(s));
}
