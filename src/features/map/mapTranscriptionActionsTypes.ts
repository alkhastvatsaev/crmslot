import {
  DASHBOARD_PANEL_CHROME_BLUR,
  DASHBOARD_PANEL_CHROME_BORDER,
  DASHBOARD_PANEL_CHROME_ROUNDED,
  DASHBOARD_PANEL_SHADOW_CLASS,
} from "@/core/ui/glassPanelChrome";
import type { AudioUploadSidecar } from "@/core/services/audio/transcription.types";

export type MapTranscriptionDecisionStatus = "none" | "refused" | "created";

export type MapTranscriptionLatestAudioResponse = {
  audio: null | {
    name: string;
    url: string;
    createdAt: string;
    transcript: string | null;
    meta?: AudioUploadSidecar;
  };
  decision: { status: MapTranscriptionDecisionStatus; updatedAt: string | null };
};

export type MapTranscriptionFormState = {
  address: string;
  clientName: string;
  phone: string;
  problem: string;
  urgency: boolean;
  date: string;
  time: string;
};

export type MapTranscriptionCreatedMission = {
  id: number;
  key: string;
  clientName: string;
  coordinates: [number, number];
  time: string;
  status: string;
  source?: "live";
  date?: string;
};

export const MAP_TRANSCRIPTION_PANEL_SHELL = `pointer-events-auto absolute top-1/2 z-[9999] flex h-[min(70dvh,720px)] min-h-0 -translate-y-1/2 flex-col ${DASHBOARD_PANEL_CHROME_ROUNDED} ${DASHBOARD_PANEL_CHROME_BORDER} bg-white/85 ${DASHBOARD_PANEL_SHADOW_CLASS} ${DASHBOARD_PANEL_CHROME_BLUR}`;

export function formatMapTranscriptionClientName(raw: string): string {
  const name = raw.trim();
  if (!name) return "";
  const hasCivility = /^m(\.|me)\s+/i.test(name);
  const base = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return hasCivility ? base : `M. ${base}`;
}

export function normalizeMapTranscriptionTime(raw: string): string {
  const t = raw.trim();
  const parts = t.split(/\s+/);
  const maybe = parts[parts.length - 1] || "";
  return /^\d{2}:\d{2}$/.test(maybe) ? maybe : t;
}

export function isMapTranscriptionFormValid(form: MapTranscriptionFormState): boolean {
  return (
    form.address.trim().length > 0 &&
    form.clientName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.problem.trim().length > 0 &&
    form.date.trim().length > 0 &&
    form.time.trim().length > 0
  );
}

export const EMPTY_MAP_TRANSCRIPTION_FORM: MapTranscriptionFormState = {
  address: "",
  clientName: "",
  phone: "",
  problem: "",
  urgency: false,
  date: "",
  time: "",
};
