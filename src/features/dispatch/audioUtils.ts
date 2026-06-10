import { fetchWithAuth } from "@/core/api/fetchWithAuth";

export const LS_UPLOAD_LAST_SEEN = "ai_upload_last_seen_mtime";

export type QueuedClip = {
  url: string;
  createdAt: string;
  source: "disk" | "firestore";
  firestoreUpdatedAt?: string;
};

export function uploadAudioBasenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const seg = pathname.split("/").filter(Boolean);
    return (seg[seg.length - 1] ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export function queueFindIndexByBasename(q: QueuedClip[], url: string): number {
  const b = uploadAudioBasenameFromUrl(url);
  if (!b) return -1;
  return q.findIndex((c) => uploadAudioBasenameFromUrl(c.url) === b);
}

export function isPollableDiskAudioName(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(".m4a") || n.endsWith(".mp3") || n.endsWith(".wav") || n.endsWith(".amr");
}

export function serializeFirestoreUpdatedAt(v: unknown): string {
  if (typeof v === "string") return v;
  if (
    v &&
    typeof v === "object" &&
    "toDate" in v &&
    typeof (v as { toDate: () => Date }).toDate === "function"
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return String(v);
}

export function isRecoverablePlaybackError(err: unknown): boolean {
  const name =
    err instanceof DOMException
      ? err.name
      : typeof err === "object" && err !== null && "name" in err
        ? String((err as { name: unknown }).name)
        : "";
  return name === "NotAllowedError" || name === "NotSupportedError";
}

export function mimeFromAudioUrl(url: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".m4a") || path.endsWith(".mp4") || path.endsWith(".aac")) return "audio/mp4";
  if (path.endsWith(".mp3") || path.endsWith(".mpeg")) return "audio/mpeg";
  if (path.endsWith(".ogg")) return "audio/ogg";
  if (path.endsWith(".wav")) return "audio/wav";
  return "audio/mp4";
}

export function waitForCanPlay(el: HTMLAudioElement, timeoutMs: number): Promise<void> {
  if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t);
      el.removeEventListener("canplay", onOk);
      el.removeEventListener("canplaythrough", onOk);
      el.removeEventListener("loadeddata", onOk);
      el.removeEventListener("error", onErr);
      resolve();
    };
    const onOk = () => done();
    const onErr = () => done();
    const t = setTimeout(done, timeoutMs);
    el.addEventListener("canplay", onOk, { once: true });
    el.addEventListener("canplaythrough", onOk, { once: true });
    el.addEventListener("loadeddata", onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

export async function probeMediaUrlOk(href: string): Promise<boolean> {
  try {
    const h = await fetch(href, { method: "HEAD", cache: "no-store" });
    if (h.ok) return true;
    if (h.status === 405 || h.status === 501) {
      const g = await fetch(href, {
        method: "GET",
        cache: "no-store",
        headers: { Range: "bytes=0-0" },
      });
      return g.ok || g.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

export function uploadPathCandidatesFromUrl(clipUrl: string, origin: string): string[] {
  try {
    const parsed = new URL(clipUrl, origin);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const ui = pathParts.indexOf("uploads");
    const relAfterUploads = ui >= 0 ? pathParts.slice(ui + 1).join("/") : "";
    const baseOnly = pathParts[pathParts.length - 1] ?? "";
    return [...new Set([relAfterUploads, baseOnly].filter(Boolean))];
  } catch {
    return [];
  }
}

export async function resolveClipPublicUrl(clipUrl: string): Promise<string> {
  if (typeof window === "undefined") return clipUrl;
  const parsed = new URL(clipUrl, window.location.origin);
  if (parsed.origin !== window.location.origin) return clipUrl;
  if (await probeMediaUrlOk(parsed.href)) return clipUrl;

  for (const name of uploadPathCandidatesFromUrl(clipUrl, window.location.origin)) {
    try {
      const r = await fetchWithAuth(`/api/ai/resolve-audio-url?name=${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      if (!r.ok) continue;
      const j = (await r.json()) as { url?: string };
      if (j.url && typeof j.url === "string") return j.url;
    } catch {
      /* suivant */
    }
  }
  return clipUrl;
}
