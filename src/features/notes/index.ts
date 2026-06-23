/**
 * API publique notes — notes rapides par intervention.
 */
export type { NoteVisibility, QuickNote } from "@/features/notes/types";
export { NOTE_VISIBILITY_LABELS, NOTE_VISIBILITY_STYLES } from "@/features/notes/types";
export {
  subscribeNotesByIntervention,
  createNote,
  togglePinNote,
  deleteNote,
} from "@/features/notes/notesFirestore";
