/** Reporte une mise à jour d’état après l’effet (évite react-hooks/set-state-in-effect sur les gardes Firestore). */
export function scheduleEffectUpdate(fn: () => void): void {
  queueMicrotask(fn);
}
