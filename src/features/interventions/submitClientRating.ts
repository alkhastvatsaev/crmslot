import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

export async function submitClientRating(
  interventionId: string,
  rating: number,
  comment: string,
): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5");

  await updateDoc(doc(firestore, "interventions", interventionId), {
    clientRating: rating,
    clientComment: comment.trim() || null,
    clientRatedAt: new Date().toISOString(),
  });
}
