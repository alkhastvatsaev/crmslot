/** Taille du prénom dans le dock profil terrain — évite le débordement. */
export function technicianFirstNameTextClass(firstName: string): string {
  const length = firstName.trim().length;
  if (length <= 5) return "text-[15px]";
  if (length <= 10) return "text-sm";
  if (length <= 16) return "text-xs";
  return "text-[10px] leading-tight";
}

export function resolveTechnicianProfileFirstName(
  firstName: string,
  email: string,
  fallback: string
): string {
  const fromFirst = firstName.trim();
  if (fromFirst) return fromFirst;
  const local = email.trim().split("@")[0]?.trim();
  if (local) return local;
  return fallback;
}
