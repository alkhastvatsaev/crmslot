"use client";

import { HubCard } from "@/core/ui/hub";

type Props = {
  displayName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  problemPrefix: string;
};

export default function TerrainReportClientCard({
  displayName,
  phone,
  email,
  address,
  description,
  problemPrefix,
}: Props) {
  return (
    <HubCard tone="muted" padding="md" className="space-y-2">
      <p className="text-[14px] !font-extrabold text-slate-900">{displayName}</p>
      {phone ? <p className="text-[12px] !font-bold text-slate-700">{phone}</p> : null}
      {email ? (
        <p className="text-[12px] !font-bold text-slate-700 break-all">
          <a href={`mailto:${email}`} className="hover:underline">
            {email}
          </a>
        </p>
      ) : null}
      {address ? <p className="text-[12px] !font-bold text-slate-700">{address}</p> : null}
      {description ? (
        <p className="text-[13px] !font-bold text-slate-800 leading-relaxed">
          {problemPrefix} · {description}
        </p>
      ) : null}
    </HubCard>
  );
}
