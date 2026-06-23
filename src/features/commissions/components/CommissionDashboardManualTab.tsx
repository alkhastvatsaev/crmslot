"use client";

import CommissionTechnicianSelect from "@/features/commissions/components/CommissionTechnicianSelect";
import type { useCommissionDashboardController } from "@/features/commissions/hooks/useCommissionDashboardController";

type View = ReturnType<typeof useCommissionDashboardController>;

export default function CommissionDashboardManualTab({ view }: { view: View }) {
  const {
    t,
    companyId,
    manualEntries,
    savingManual,
    manualTechUid,
    setManualTechUid,
    manualAmount,
    setManualAmount,
    manualReason,
    setManualReason,
    manualDate,
    setManualDate,
    handleAddManual,
  } = view;

  return (
    <>
      <form
        onSubmit={(e) => void handleAddManual(e)}
        data-testid="manual-commission-form"
        className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4"
      >
        <h3 className="mb-4 font-semibold text-slate-700">
          {t("commissions.dashboard.manual_title")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("commissions.dashboard.manual_tech_uid")}
            </label>
            <CommissionTechnicianSelect
              value={manualTechUid}
              onChange={setManualTechUid}
              testId="manual-commission-tech-uid"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("commissions.dashboard.manual_amount")}
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              data-testid="manual-commission-amount"
              value={manualAmount}
              onChange={(e) => setManualAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("commissions.dashboard.manual_reason")}
            </label>
            <input
              type="text"
              required
              data-testid="manual-commission-reason"
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder={String(t("commissions.dashboard.manual_reason_placeholder"))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("commissions.dashboard.manual_date")}
            </label>
            <input
              type="date"
              required
              data-testid="manual-commission-date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            data-testid="manual-commission-submit"
            disabled={savingManual || !companyId}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {savingManual
              ? t("commissions.dashboard.manual_saving")
              : t("commissions.dashboard.manual_save")}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                {t("commissions.dashboard.col_tech")}
              </th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                {t("commissions.dashboard.col_amount")}
              </th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                {t("commissions.dashboard.col_reason")}
              </th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                {t("commissions.dashboard.col_date")}
              </th>
            </tr>
          </thead>
          <tbody>
            {manualEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  {t("commissions.dashboard.empty")}
                </td>
              </tr>
            ) : (
              manualEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">
                    {entry.technicianUid}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-amber-700">
                    {entry.amountEuros.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.reason}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{entry.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
