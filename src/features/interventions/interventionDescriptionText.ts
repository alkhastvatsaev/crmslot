import type { Intervention } from "@/features/interventions/types";

const GENERIC_TITLES = new Set([
  "demande d'intervention",
  "intervention request",
  "service request",
]);

/** Texte descriptif terrain : problème saisi, sinon titre si informatif. */
export function interventionDescriptionText(
  iv: Pick<Intervention, "problem" | "title">,
): string | null {
  const problem = (iv.problem ?? "").trim();
  if (problem) return problem;
  const title = (iv.title ?? "").trim();
  if (!title || GENERIC_TITLES.has(title.toLowerCase())) return null;
  return title;
}
