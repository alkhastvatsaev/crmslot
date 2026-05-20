"use client";

import { useEffect } from "react";

type Options = {
  enabled: boolean;
  onReply: () => void;
  onArchive: () => void;
  onTrash: () => void;
  onNext: () => void;
  onPrev: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Raccourcis Gmail hub : r répondre, e archiver, # corbeille, j/k navigation. */
export function useGmailHubKeyboard({
  enabled,
  onReply,
  onArchive,
  onTrash,
  onNext,
  onPrev,
}: Options): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "r") {
        e.preventDefault();
        onReply();
        return;
      }
      if (key === "e") {
        e.preventDefault();
        onArchive();
        return;
      }
      if (key === "#" || (e.shiftKey && key === "3")) {
        e.preventDefault();
        onTrash();
        return;
      }
      if (key === "j") {
        e.preventDefault();
        onNext();
        return;
      }
      if (key === "k") {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onReply, onArchive, onTrash, onNext, onPrev]);
}
