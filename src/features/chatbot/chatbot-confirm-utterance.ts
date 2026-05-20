const CONFIRM_RE =
  /^(oui|yes|ok|valide|valider|confirme|confirmer|go|c'est bon|c est bon|vas-y|vas y|lance|lancer|procède|procede|d'accord|d accord)\.?$/i;

/** « oui » / « valide » — déclenche la confirmation du modal outil en attente. */
export function isChatbotConfirmationUtterance(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 40) return false;
  return CONFIRM_RE.test(t);
}
