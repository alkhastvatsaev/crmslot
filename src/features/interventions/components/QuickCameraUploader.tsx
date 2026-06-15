"use client";

import { logger } from "@/core/logger";

import React, { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { captureNativePhotoFile } from "@/core/native/photoCapture";

interface QuickCameraUploaderProps {
  onPhotoTaken: (file: File, compressedDataUrl: string) => void;
  label?: string;
  category?: "panne" | "materiel" | "preuve" | "autre";
  isUploading?: boolean;
}

/**
 * QuickCameraUploader
 * Permet au technicien de prendre une photo rapidement depuis son téléphone,
 * avec compression locale basique via canvas.
 */
export default function QuickCameraUploader({
  onPhotoTaken,
  label = "Prendre une photo",
  category = "preuve",
  isUploading = false,
}: QuickCameraUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const compressFile = async (file: File): Promise<{ file: File; dataUrl: string }> => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1200;
    let width = bitmap.width;
    let height = bitmap.height;
    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else if (height > MAX_HEIGHT) {
      width *= MAX_HEIGHT / height;
      height = MAX_HEIGHT;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const compressed = new File([blob], file.name || "photo.jpg", { type: "image/jpeg" });
    return { file: compressed, dataUrl };
  };

  const handleCaptureClick = async () => {
    if (isCapacitorNative()) {
      const photo = await captureNativePhotoFile("camera");
      if (!photo) return;
      setIsCompressing(true);
      try {
        const compressed = await compressFile(photo.file);
        setPreview(compressed.dataUrl);
        onPhotoTaken(compressed.file, compressed.dataUrl);
      } catch (err) {
        logger.error("Erreur de compression native :", {
          error: err instanceof Error ? err.message : String(err),
        });
        setPreview(photo.dataUrl);
        onPhotoTaken(photo.file, photo.dataUrl);
      } finally {
        setIsCompressing(false);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    try {
      const compressed = await compressFile(file);
      setPreview(compressed.dataUrl);
      onPhotoTaken(compressed.file, compressed.dataUrl);
    } catch (err) {
      logger.error("Erreur de compression :", {
        error: err instanceof Error ? err.message : String(err),
      });
      const fallbackUrl = URL.createObjectURL(file);
      setPreview(fallbackUrl);
      onPhotoTaken(file, fallbackUrl);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearPreview = () => setPreview(null);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Input caché, capture="environment" force la caméra arrière sur mobile */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <Button
          onClick={handleCaptureClick}
          variant="outline"
          className="w-full h-24 border-dashed border-2 flex flex-col items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          disabled={isCompressing || isUploading}
        >
          {isCompressing ? (
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
          ) : (
            <Camera className="w-6 h-6 mb-2" />
          )}
          <span>{isCompressing ? "Optimisation..." : label}</span>
        </Button>
      ) : (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border bg-slate-100">
          <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>

          {isUploading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <span className="text-sm font-medium text-slate-800">Envoi en cours...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
