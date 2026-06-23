"use client";

import { BILLING_TEMPLATES } from "@/features/interventions/config/terrainTemplates";

type Props = {
  label: string;
  placeholder: string;
  onSelect: (templateId: string) => void;
};

export default function InvoiceBillingTemplateSelect({ label, placeholder, onSelect }: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      <select
        defaultValue=""
        onChange={(e) => {
          onSelect(e.target.value);
          e.currentTarget.value = "";
        }}
        className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {BILLING_TEMPLATES.map((tpl) => (
          <option key={tpl.id} value={tpl.id}>
            {tpl.name}
          </option>
        ))}
      </select>
    </div>
  );
}
