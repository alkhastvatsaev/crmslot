import { auth } from "@/core/config/firebase";
import type { TransitionActor } from "@/features/interventions/workflow/interventionWorkflowTypes";

/** Acteur technicien (hub terrain). */
export function technicianTransitionActor(uid: string): TransitionActor {
  return { uid, role: "technician" };
}

/** Acteur dispatch / back-office. */
export function dispatcherTransitionActor(uid: string): TransitionActor {
  return { uid, role: "dispatcher" };
}

export function requireAuthTransitionActor(
  role: TransitionActor["role"] = "technician",
): TransitionActor {
  const uid = auth?.currentUser?.uid?.trim();
  if (!uid) throw new Error("Utilisateur non connecté");
  return role === "dispatcher" ? dispatcherTransitionActor(uid) : technicianTransitionActor(uid);
}
