/** Erreur Firestore client (onSnapshot, getDoc, etc.). */
export function isFirestorePermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "permission-denied") return true;
  const message = (error as { message?: string }).message;
  return typeof message === "string" && /insufficient permissions/i.test(message);
}
