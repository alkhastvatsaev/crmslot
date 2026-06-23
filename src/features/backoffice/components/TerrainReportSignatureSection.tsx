"use client";

type Props = {
  signaturePngDataUrl: string;
  signatureLabel: string;
  signatureAlt: string;
};

export default function TerrainReportSignatureSection({
  signaturePngDataUrl,
  signatureLabel,
  signatureAlt,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {signatureLabel}
      </p>
      <div className="rounded-[16px] bg-slate-50 p-4 border border-slate-100 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signaturePngDataUrl} alt={signatureAlt} className="max-h-32 object-contain" />
      </div>
    </div>
  );
}
