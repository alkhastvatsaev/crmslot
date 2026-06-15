import type { Intervention } from "@/features/interventions/types";

function icsDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function generateIcal(interventions: Intervention[], calName = "CRMSLOT"): void {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CRMSLOT//FR",
    `X-WR-CALNAME:${calName}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const iv of interventions) {
    const start = iv.scheduledDate
      ? `${iv.scheduledDate.replace(/-/g, "")}T${(iv.scheduledTime ?? "08:00").replace(":", "")}00`
      : iv.createdAt
        ? icsDate(iv.createdAt)
        : null;

    if (!start) continue;

    const durationMin = iv.estimatedDurationMinutes ?? 60;
    const end = new Date(
      new Date(`${iv.scheduledDate ?? iv.createdAt}T${iv.scheduledTime ?? "08:00"}:00`).getTime() +
        durationMin * 60_000
    )
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    const summary = icsEscape(iv.title || iv.problem || "Intervention");
    const location = icsEscape(iv.address ?? "");
    const desc = icsEscape(
      [
        iv.problem,
        iv.clientName ?? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(" — ")
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:crmslot-${iv.id}@crmslot`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : "",
      desc ? `DESCRIPTION:${desc}` : "",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.filter(Boolean).join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${calName.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
