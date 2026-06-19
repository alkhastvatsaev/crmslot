"use client";

type Props = {
  title: string;
  hint: string;
  testId?: string;
};

/** Bandeau visuel — pages concept non finalisées. */
export default function DraftHubBanner({ title, hint, testId = "draft-hub-banner" }: Props) {
  return (
    <div
      data-testid={testId}
      className="shrink-0 border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        Brouillon · {title}
      </p>
      <p className="mt-0.5 text-[12px] text-amber-900/80">{hint}</p>
    </div>
  );
}
