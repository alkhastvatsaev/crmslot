const SESSION_KEY = "crm_staff_push_onboarding_pending";

/** Marque qu’un compte staff vient d’être créé — déclenche l’activation push au dashboard. */
export function markStaffPushOnboardingPending(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* quota / mode privé */
  }
}

export function peekStaffPushOnboardingPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Lit et efface le marqueur (une seule tentative d’onboarding push par inscription). */
export function consumeStaffPushOnboardingPending(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    const pending = sessionStorage.getItem(SESSION_KEY) === "1";
    if (pending) sessionStorage.removeItem(SESSION_KEY);
    return pending;
  } catch {
    return false;
  }
}
