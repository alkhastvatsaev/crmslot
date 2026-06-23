"use client";

/**
 * Compatibility barrel — la définition canonique de `RequesterHubContext`
 * vit désormais dans `@/context/RequesterHubContext`. Ce fichier conserve
 * l'ancien chemin pour préserver les 30+ imports historiques.
 *
 * Nouveaux imports : préférer `@/context/RequesterHubContext`.
 */
export { RequesterHubProvider, useRequesterHub } from "@/context/RequesterHubContext";
export type {
  RequesterType,
  RequesterProfile,
  InterventionRequestData,
} from "@/context/RequesterHubContext";
