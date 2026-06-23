"use client";

import type { RefObject } from "react";
import { ArrowRight, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

type CompanyChatComposerProps = {
  draft: string;
  setDraft: (value: string) => void;
  pendingImages: string[];
  setPendingImages: (value: string[] | ((prev: string[]) => string[])) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handlePickImages: (files: FileList | null) => Promise<void>;
  send: () => Promise<void>;
  attachImagesBlocked: boolean;
  assistantTyping: boolean;
};

export default function CompanyChatComposer({
  draft,
  setDraft,
  pendingImages,
  setPendingImages,
  inputRef,
  fileInputRef,
  handlePickImages,
  send,
  attachImagesBlocked,
  assistantTyping,
}: CompanyChatComposerProps) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 border-t border-slate-200/80 bg-white/80 p-3 backdrop-blur-md">
      {pendingImages.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2" data-testid="company-chat-pending-images">
          {pendingImages.map((url, idx) => (
            <div
              key={`pending-${idx}`}
              className="group relative h-14 w-14 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100"
                aria-label={t("chat.remove_photo_aria")}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handlePickImages(e.target.files)}
        />
        <button
          type="button"
          data-testid="company-chat-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachImagesBlocked}
          title={attachImagesBlocked ? t("chat.attach_blocked_title") : undefined}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            "text-slate-500 transition",
            attachImagesBlocked
              ? "cursor-not-allowed opacity-35"
              : "hover:bg-slate-900/5 hover:text-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
            "active:scale-[0.98]"
          )}
          aria-label={t("chat.attach_aria")}
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <label htmlFor="company-chat-input" className="sr-only">
          {t("chat.input_label")}
        </label>
        <div className="flex min-w-0 flex-1 items-center rounded-[18px] border border-slate-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
          <textarea
            id="company-chat-input"
            data-testid="company-chat-input"
            rows={1}
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("chat.input_placeholder")}
            className="min-h-12 max-h-24 flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-[13px] leading-[18px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          data-testid="company-chat-send"
          onClick={() => void send()}
          disabled={(!draft.trim() && pendingImages.length === 0) || assistantTyping}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
            "active:scale-[0.98]",
            (!draft.trim() && pendingImages.length === 0) || assistantTyping
              ? "cursor-not-allowed text-slate-400 opacity-40"
              : "text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
          )}
          aria-label={t("chat.send_aria")}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
