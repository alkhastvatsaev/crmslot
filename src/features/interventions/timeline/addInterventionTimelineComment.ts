import { collection, doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import type { AddTimelineCommentParams } from "@/features/interventions/timeline/interventionTimelineTypes";

export async function addInterventionTimelineComment(
  params: AddTimelineCommentParams,
): Promise<string> {
  const db = firestore;
  const uid = auth?.currentUser?.uid?.trim();
  if (!db || !uid) throw new Error("Firebase ou utilisateur indisponible");

  const interventionId = params.interventionId.trim();
  const content = params.content.trim();
  if (!interventionId || !content) throw new Error("Dossier ou note vide");

  const ref = doc(collection(db, "interventions", interventionId, "timeline_events"));
  const createdAt = new Date().toISOString();
  const visibility = params.visibility ?? "internal";

  await setDoc(ref, {
    interventionId,
    type: "comment" as const,
    content,
    visibility,
    createdAt,
    createdByUid: uid,
    companyId: params.companyId ?? null,
  });

  return ref.id;
}
