export type NoteVisibility = "private" | "team" | "client";

export interface QuickNote {
  id: string;
  companyId: string;
  interventionId: string;
  authorUid: string;
  authorName?: string | null;
  content: string;
  visibility: NoteVisibility;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  private: "Privée",
  team: "Équipe",
  client: "Client",
};

export const NOTE_VISIBILITY_STYLES: Record<NoteVisibility, string> = {
  private: "bg-slate-100 text-slate-600",
  team: "bg-blue-100 text-blue-700",
  client: "bg-emerald-100 text-emerald-700",
};
