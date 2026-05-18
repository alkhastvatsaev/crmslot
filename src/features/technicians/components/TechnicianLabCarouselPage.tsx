"use client";

type Props = { slotIndex: number };

/** Page 6 — charge la route `/technician` telle quelle (même document que l’URL standalone). */
export default function TechnicianLabCarouselPage({ slotIndex }: Props) {
  return (
    <section
      className="relative h-full min-h-0 w-full overflow-hidden bg-slate-50"
      data-testid={`dashboard-pager-slot-${slotIndex}-technician-lab`}
      aria-label="/technician"
    >
      <iframe
        src="/technician"
        title="/technician"
        className="absolute inset-0 h-full w-full border-0"
        data-testid="technician-lab-iframe"
      />
    </section>
  );
}
