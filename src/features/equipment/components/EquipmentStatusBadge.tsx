"use client";

import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_STYLES, type EquipmentStatus } from "../types";

export default function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${EQUIPMENT_STATUS_STYLES[status]}`}>
      {EQUIPMENT_STATUS_LABELS[status]}
    </span>
  );
}
