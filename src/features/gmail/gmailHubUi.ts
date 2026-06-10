import type { LucideIcon } from "lucide-react";
import { Archive, FileText, Inbox, Mail, Send, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HUB_FIELD_CLASS, HUB_FONT_OUTFIT, HUB_RADIUS, HUB_TYPE } from "@/core/ui/hub/hubTheme";
import { hubButtonClassName } from "@/core/ui/hub/HubButton";

export const gmailHubFont = HUB_FONT_OUTFIT;

/** Même contraintes que les rails Chatbot / Back-office (`flex-1 min-h-0` dans GlassPanel). */
export const gmailShell = "flex min-h-0 flex-1 flex-col overflow-hidden";

export const gmailDivider = "border-black/[0.06]";

export const gmailFieldClass = HUB_FIELD_CLASS;

export const gmailGhostBtn = cn(
  "inline-flex h-9 w-9 items-center justify-center text-slate-500 transition-all hover:bg-white/70 hover:text-slate-900 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
  HUB_RADIUS.control
);

export const gmailToolbarBtn = cn(
  "inline-flex h-9 w-9 items-center justify-center text-slate-600 transition-all hover:bg-white/80 hover:text-slate-900",
  HUB_RADIUS.control
);

export const gmailPrimaryBtn = hubButtonClassName({
  className: "h-10 px-4 text-[12px] font-medium tracking-wide",
});

export const gmailEyebrow = HUB_TYPE.eyebrow;

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
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
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
