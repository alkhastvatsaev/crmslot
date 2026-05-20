import type { LucideIcon } from "lucide-react";
import {
  Archive,
  FileText,
  Inbox,
  Mail,
  Send,
  Star,
  Trash2,
} from "lucide-react";

export const gmailHubFont = { fontFamily: "'Outfit', sans-serif" } as const;

export const gmailShell = "flex h-full min-h-0 flex-1 flex-col overflow-hidden";

export const gmailDivider = "border-black/[0.06]";

export const gmailFieldClass =
  "w-full rounded-xl border-0 bg-white/60 px-3.5 py-2.5 text-[13px] text-slate-800 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] placeholder:text-slate-400 outline-none transition-shadow focus:bg-white/80 focus:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)]";

export const gmailGhostBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-white/70 hover:text-slate-900 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

export const gmailToolbarBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-white/80 hover:text-slate-900";

export const gmailPrimaryBtn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[12px] font-medium tracking-wide text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.45)] transition-all hover:bg-slate-800 hover:shadow-[0_10px_28px_-6px_rgba(15,23,42,0.5)] disabled:opacity-40";

export const gmailEyebrow =
  "text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400";

export const LABEL_ICONS: Record<string, LucideIcon> = {
  INBOX: Inbox,
  STARRED: Star,
  SENT: Send,
  DRAFT: FileText,
  UNREAD: Mail,
  TRASH: Trash2,
};

const AVATAR_PALETTES = [
  "from-slate-600 to-slate-800",
  "from-stone-500 to-stone-700",
  "from-zinc-500 to-zinc-700",
  "from-neutral-500 to-neutral-700",
] as const;

export function initialsFromString(input: string, max = 2): string {
  const clean = input.replace(/[<>"']/g, " ").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return clean.slice(0, max).toUpperCase();
}

export function avatarPalette(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % 997;
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export function formatMailDateShort(raw: string): string {
  if (!raw.trim()) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 12);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short" });
}

export function formatMailDateLong(raw: string): string {
  if (!raw.trim()) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("fr-BE", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseSenderName(from: string): string {
  const named = from.match(/^([^<]+)</);
  if (named) return named[1].trim().replace(/^"|"$/g, "");
  const email = from.match(/<([^>]+)>/);
  if (email) return email[1].split("@")[0] ?? from;
  return from.split("@")[0] ?? from;
}

export function parseSenderEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1] ?? from;
}

const AVATAR_BG_TEXT: { bg: string; text: string }[] = [
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-blue-100",   text: "text-blue-700"   },
  { bg: "bg-emerald-100",text: "text-emerald-700" },
  { bg: "bg-amber-100",  text: "text-amber-700"   },
  { bg: "bg-rose-100",   text: "text-rose-700"    },
  { bg: "bg-cyan-100",   text: "text-cyan-700"    },
  { bg: "bg-pink-100",   text: "text-pink-700"    },
  { bg: "bg-indigo-100", text: "text-indigo-700"  },
];

export function senderAvatarColor(name: string): { bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_BG_TEXT[Math.abs(h) % AVATAR_BG_TEXT.length]!;
}

/** Aperçu survol liste (2 lignes max). */
export function snippetPreviewLines(snippet: string, maxLines = 2): string {
  const clean = snippet.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ");
  const approxChars = maxLines * 72;
  if (clean.length <= approxChars) return clean;
  let out = "";
  for (const w of words) {
    if ((out + w).length > approxChars) break;
    out = out ? `${out} ${w}` : w;
  }
  return `${out}…`;
}
