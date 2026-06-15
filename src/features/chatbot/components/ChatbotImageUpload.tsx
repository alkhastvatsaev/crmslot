"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { captureNativePhotoFile } from "@/core/native/photoCapture";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

type Props = {
  onImageSelected: (dataUrl: string, mimeType: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function ChatbotImageUpload({ onImageSelected, disabled, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert("Image trop grande (max 2 Mo).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") onImageSelected(result, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
        aria-label="Joindre une image"
      />
      <button
        type="button"
        data-testid="chatbot-image-upload"
        disabled={disabled}
        onClick={async (e) => {
          e.stopPropagation();
          if (isCapacitorNative()) {
            const photo = await captureNativePhotoFile("prompt");
            if (photo && photo.file.size <= MAX_BYTES) {
              onImageSelected(photo.dataUrl, photo.mimeType);
            } else if (photo) {
              alert("Image trop grande (max 2 Mo).");
            }
            return;
          }
          inputRef.current?.click();
        }}
        aria-label="Joindre une image"
        className={cn(
          "chatbot-galaxy-composer-action chatbot-galaxy-composer-action--new",
          disabled && "chatbot-galaxy-composer-action--muted",
          className
        )}
      >
        <ImageIcon className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />
      </button>
    </>
  );
}
