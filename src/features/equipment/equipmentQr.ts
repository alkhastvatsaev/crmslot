import QRCode from "qrcode";

export interface EquipmentQrData {
  type: "equipment";
  companyId: string;
  equipmentId: string;
}

export function encodeEquipmentQrPayload(companyId: string, equipmentId: string): string {
  const payload: EquipmentQrData = { type: "equipment", companyId, equipmentId };
  return JSON.stringify(payload);
}

export function decodeEquipmentQrPayload(raw: string): EquipmentQrData | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as EquipmentQrData).type === "equipment" &&
      typeof (parsed as EquipmentQrData).companyId === "string" &&
      typeof (parsed as EquipmentQrData).equipmentId === "string"
    ) {
      return parsed as EquipmentQrData;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateEquipmentQrDataUrl(
  companyId: string,
  equipmentId: string,
): Promise<string> {
  const payload = encodeEquipmentQrPayload(companyId, equipmentId);
  return QRCode.toDataURL(payload, { width: 256, margin: 2 });
}
