/**
 * Mode paiement simulé : actif uniquement si aucune clé Stripe n'est configurée
 * ET que l'on est hors production (ou que STRIPE_MOCK_MODE=1 est explicite).
 * Permet de tester tout le parcours « facture → payer → payé » sans compte Stripe.
 */
export function stripeMockPaymentsEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  const hasKey = Boolean(env.STRIPE_SECRET_KEY?.trim());
  if (hasKey) return false;
  if (env.STRIPE_MOCK_MODE?.trim() === "1") return true;
  return env.NODE_ENV !== "production";
}
