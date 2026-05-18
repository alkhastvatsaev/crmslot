"use client";

import { useState } from "react";
import { QrCode, Download, X } from "lucide-react";
import { toast } from "sonner";
import { generateEquipmentQrDataUrl } from "../equipmentQr";
import type { ClientEquipment } from "../types";

interface Props {
  equipment: ClientEquipment;
}

export default function EquipmentQrButton({ equipment }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const url = await generateEquipmentQrDataUrl(equipment.companyId, equipment.id);
      setDataUrl(url);
    } catch {
      toast.error("Erreur génération QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${equipment.id}.png`;
    a.click();
  };

  if (dataUrl) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <img src={dataUrl} alt={`QR ${equipment.label}`} className="w-32 h-32 rounded-lg border border-slate-200" />
          <button
            type="button"
            onClick={() => setDataUrl(null)}
            className="absolute -top-2 -right-2 rounded-full bg-white border border-slate-200 p-0.5 hover:bg-slate-50"
          >
            <X className="h-3 w-3 text-slate-500" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" /> Télécharger
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleGenerate()}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <QrCode className="h-3.5 w-3.5" />
      {loading ? "Génération…" : "QR Code"}
    </button>
  );
}
