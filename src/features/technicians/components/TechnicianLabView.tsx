"use client";

import { useState } from "react";
import { Truck, MapPin, CheckCircle, CreditCard, ChevronLeft, ScanFace } from "lucide-react";
import Link from "next/link";
import ARScanner from "@/features/technicians/components/ARScanner";
import TapToPayModal from "@/features/technicians/components/TapToPayModal";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  /** Intégré dans le carrousel dashboard (pas de lien retour plein écran). */
  embedInCarousel?: boolean;
};

export default function TechnicianLabView({ embedInCarousel = false }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("available");
  const [showScanner, setShowScanner] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    alert(`${t("technician_lab.status_updated")}: ${newStatus}`);
  };

  return (
    <div
      className={
        embedInCarousel
          ? "flex h-full min-h-0 flex-col gap-4 overflow-y-auto overflow-x-hidden bg-slate-50 p-4"
          : "flex min-h-screen flex-col gap-6 bg-slate-50 p-6"
      }
      style={{ fontFamily: "'Outfit', sans-serif" }}
      data-testid="technician-lab-view"
    >
      <p
        className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
        data-testid="technician-lab-banner"
      >
        {embedInCarousel ? t("technician_lab.banner_carousel") : t("technician_lab.banner_standalone")}
      </p>

      {showScanner ? <ARScanner onClose={() => setShowScanner(false)} /> : null}
      {showPayment ? <TapToPayModal onClose={() => setShowPayment(false)} amount="149,00" /> : null}

      <header className="flex shrink-0 items-center justify-between">
        {embedInCarousel ? (
          <div className="w-12" aria-hidden />
        ) : (
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition-colors hover:text-slate-900"
            data-testid="technician-lab-back-home"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Alexandre V.</h1>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            {t("technician_lab.van_label")}
          </span>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-lg shadow-blue-500/30">
          A
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[40px] border border-white bg-white/80 p-0 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="absolute right-4 top-4 z-10 rounded-full border border-emerald-100 bg-emerald-50 p-4 text-emerald-600 shadow-sm transition-transform active:scale-95"
          aria-label={t("technician_lab.scan_aria")}
        >
          <ScanFace className="h-6 w-6" />
        </button>

        <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-0 flex-1 flex-col gap-4`}>
          <div className="flex items-start justify-between pr-14">
            <div>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                {t("technician_lab.urgent_label")}
              </h2>
              <h3 className="text-2xl font-black text-slate-900">{t("technician_lab.sample_mission_title")}</h3>
            </div>
          </div>

          <p className="mb-4 flex items-start gap-3 text-lg font-medium text-slate-600">
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-slate-400" />
            {t("technician_lab.sample_address")}
          </p>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => handleStatusChange("en_route")}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl border py-4 text-lg font-bold transition-all ${
                status === "en_route"
                  ? "border-transparent bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Truck className="h-6 w-6" />
              {t("technician_lab.en_route")}
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange("on_site")}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl border py-4 text-lg font-bold transition-all ${
                status === "on_site"
                  ? "border-transparent bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MapPin className="h-6 w-6" />
              {t("technician_lab.on_site")}
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange("available")}
              className="mt-2 flex w-full items-center justify-center gap-3 rounded-[24px] bg-emerald-600 py-5 text-xl font-bold text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500"
            >
              <CheckCircle className="h-7 w-7" />
              {t("technician_lab.mission_done")}
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setShowPayment(true)}
          className="flex w-full items-center justify-between rounded-[40px] bg-slate-900 p-6 shadow-2xl transition-transform active:scale-95 sm:p-8"
        >
          <div className="text-left">
            <h3 className="mb-1 text-2xl font-bold text-white">{t("technician_lab.collect")}</h3>
            <p className="text-sm font-medium uppercase tracking-widest text-slate-400">
              {t("technician_lab.tap_to_pay")}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-md">
            <CreditCard className="h-7 w-7 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}
