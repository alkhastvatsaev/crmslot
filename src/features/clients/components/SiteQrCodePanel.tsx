"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Check } from "lucide-react";

interface Props {
  companyId: string;
  siteAddress?: string;
  siteName?: string;
}

export default function SiteQrCodePanel({ companyId, siteAddress, siteName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const widgetUrl = typeof window !== "undefined"
    ? `${window.location.origin}/widget/${companyId}?address=${encodeURIComponent(siteAddress ?? "")}`
    : "";

  useEffect(() => {
    if (!canvasRef.current || !widgetUrl) return;
    QRCode.toCanvas(canvasRef.current, widgetUrl, {
      width: 200,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  }, [widgetUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${(siteName ?? companyId).replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="site-qr-code-panel" className="flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center gap-2 self-start">
        <QrCode className="h-4 w-4 text-slate-500" />
        <span className="text-[13px] font-bold text-slate-800">
          QR Code {siteName ? `— ${siteName}` : "site"}
        </span>
      </div>

      <canvas ref={canvasRef} className="rounded-xl" />

      {siteAddress && (
        <p className="text-[11px] text-slate-500 text-center">{siteAddress}</p>
      )}

      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-black py-2 text-[12px] font-bold text-white hover:bg-black/80 transition"
        >
          <Download className="h-3.5 w-3.5" /> Télécharger
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-black/8 bg-slate-50 px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
