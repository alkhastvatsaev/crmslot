"use client";

import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";

/** Firestore / polling actifs seulement si le gate métier ET l’onglet sont visibles. */
export function useFirestoreLiveEnabled(gate: boolean = true): boolean {
  const documentVisible = useDocumentPageVisible();
  return gate && documentVisible;
}
