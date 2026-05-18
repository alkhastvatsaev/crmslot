"use client";

import { useEffect, useState } from "react";
import { StickyNote, Pin, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeNotesByIntervention,
  createNote,
  togglePinNote,
  deleteNote,
} from "../notesFirestore";
import {
  type QuickNote,
  type NoteVisibility,
  NOTE_VISIBILITY_LABELS,
  NOTE_VISIBILITY_STYLES,
} from "../types";

interface Props {
  interventionId: string;
}

const VISIBILITIES: NoteVisibility[] = ["private", "team", "client"];

export default function QuickNotesPanel({ interventionId }: Props) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("team");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firestore || !companyId) return;
    return subscribeNotesByIntervention(firestore, companyId, interventionId, setNotes);
  }, [companyId, interventionId]);

  const handleAdd = async () => {
    if (!firestore || !companyId || !uid || !content.trim()) return;
    setSaving(true);
    try {
      await createNote(firestore, companyId, {
        interventionId,
        authorUid: uid,
        content: content.trim(),
        visibility,
      });
      setContent("");
      toast.success("Note ajoutée");
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async (note: QuickNote) => {
    if (!firestore || !companyId) return;
    try {
      await togglePinNote(firestore, companyId, note.id, !note.pinned);
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!firestore || !companyId) return;
    try {
      await deleteNote(firestore, companyId, noteId);
      toast.success("Note supprimée");
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">Notes rapides</h3>
        {notes.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
            {notes.length}
          </span>
        )}
      </div>

      {/* Composer */}
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter une note…"
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <div className="flex items-center gap-2">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          >
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>{NOTE_VISIBILITY_LABELS[v]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {saving ? "…" : "Ajouter"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className={`rounded-xl border p-3 space-y-1.5 ${note.pinned ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handlePin(note)}
                    className={`p-1 rounded transition-colors ${note.pinned ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-amber-400"}`}
                    title={note.pinned ? "Désépingler" : "Épingler"}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(note.id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${NOTE_VISIBILITY_STYLES[note.visibility]}`}>
                  {NOTE_VISIBILITY_LABELS[note.visibility]}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(note.createdAt).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {notes.length === 0 && (
        <p className="text-sm text-slate-400">Aucune note pour cette intervention.</p>
      )}
    </section>
  );
}
