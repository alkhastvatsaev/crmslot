"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import { storage, firestore } from "@/core/config/firebase";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useInterventionLiveSource } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";
import QuickCameraUploader from "./QuickCameraUploader";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function TechnicianDashboardImagesPanel({
  caseId,
  liveIntervention,
}: {
  caseId: string | null;
  liveIntervention?: Intervention | null;
}) {
  const liveIv = useInterventionLiveSource(caseId, liveIntervention);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !caseId || !storage || !firestore) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `interventions/${caseId}/terrain/${generateId()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(firestore, "interventions", caseId), {
        attachmentThumbnails: arrayUnion(url),
        updatedAt: new Date().toISOString(),
      });
      toast.success(String(t("technician_hub.dashboard.images.upload_success")));
    } catch {
      toast.error(String(t("technician_hub.dashboard.images.upload_error")));
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoTaken = async (file: File) => {
    if (!caseId || !storage || !firestore) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `interventions/${caseId}/terrain/${generateId()}.${ext}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(firestore, "interventions", caseId), {
        attachmentThumbnails: arrayUnion(url),
        updatedAt: new Date().toISOString(),
      });
      toast.success(String(t("technician_hub.dashboard.images.upload_success")));
    } catch {
      toast.error(String(t("technician_hub.dashboard.images.upload_error")));
    } finally {
      setUploading(false);
    }
  };

  if (!caseId) {
    return (
      <div
        data-testid="technician-dashboard-images-empty"
        className="flex h-full w-full flex-col items-center justify-center rounded-[inherit] px-5 py-8 text-center"
      >
        <ImageIcon className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
        <p className="text-[14px] font-medium text-slate-400">
          {String(t("technician_hub.dashboard.images.no_mission_selected"))}
        </p>
      </div>
    );
  }

  if (!liveIv) {
    return (
      <div
        data-testid="technician-dashboard-images-loading"
        className="flex h-full w-full flex-col p-4"
      >
        <div className="mb-4 h-6 w-1/2 animate-pulse rounded-md bg-slate-200/60" />
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-[16px] bg-slate-200/60" />
          ))}
        </div>
      </div>
    );
  }

  const isClosed = liveIv.status === "done" || liveIv.status === "invoiced";
  if (isClosed) {
    return (
      <div
        data-testid="technician-dashboard-images-closed"
        className="flex h-full w-full flex-col items-center justify-center rounded-[inherit] px-5 py-8 text-center"
      >
        <ImageIcon className="mb-3 h-10 w-10 text-slate-300" aria-hidden />
        <p className="text-[14px] font-medium text-slate-400">
          {String(t("technician_hub.dashboard.images.hidden_after_closure"))}
        </p>
      </div>
    );
  }

  const images = liveIv.attachmentThumbnails ?? [];

  return (
    <div
      data-testid="technician-dashboard-images"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />

      <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-4 px-4 py-4`}>
        {images.length === 0 ? (
          <div
            data-testid="technician-dashboard-images-empty-photos"
            className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white/50 px-6 py-10 text-center"
          >
            <ImageIcon className="mb-3 h-8 w-8 text-slate-300" aria-hidden />
            <p className="text-[14px] font-medium text-slate-500">
              {String(t("technician_hub.dashboard.images.no_photos"))}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="flex flex-col gap-4"
          >
            {images.map((url, idx) => (
              <motion.div
                key={idx}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="group relative overflow-hidden rounded-[16px] bg-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]"
              >
                <Image
                  src={url}
                  alt={`${String(t("technician_hub.dashboard.images.photo_alt"))} ${idx + 1}`}
                  width={400}
                  height={300}
                  className="w-full object-cover"
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        <QuickCameraUploader
          onPhotoTaken={(file) => void handlePhotoTaken(file)}
          label={String(t("technician_hub.dashboard.images.upload_btn"))}
          isUploading={uploading}
        />
      </div>
    </div>
  );
}
