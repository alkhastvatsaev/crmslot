import { encodeEquipmentQrPayload, decodeEquipmentQrPayload } from "../equipmentQr";

describe("encodeEquipmentQrPayload", () => {
  it("encodes valid JSON with type=equipment", () => {
    const payload = encodeEquipmentQrPayload("company1", "eq123");
    const parsed = JSON.parse(payload) as { type: string; companyId: string; equipmentId: string };
    expect(parsed.type).toBe("equipment");
    expect(parsed.companyId).toBe("company1");
    expect(parsed.equipmentId).toBe("eq123");
  });
});

describe("decodeEquipmentQrPayload", () => {
  it("decodes valid payload", () => {
    const raw = encodeEquipmentQrPayload("c1", "e1");
    const result = decodeEquipmentQrPayload(raw);
    expect(result).not.toBeNull();
    expect(result?.companyId).toBe("c1");
    expect(result?.equipmentId).toBe("e1");
  });

  it("returns null for invalid JSON", () => {
    expect(decodeEquipmentQrPayload("not-json")).toBeNull();
  });

  it("returns null when type is not 'equipment'", () => {
    expect(decodeEquipmentQrPayload(JSON.stringify({ type: "other", companyId: "c", equipmentId: "e" }))).toBeNull();
  });

  it("returns null when required fields missing", () => {
    expect(decodeEquipmentQrPayload(JSON.stringify({ type: "equipment", companyId: "c" }))).toBeNull();
  });

  it("roundtrip encode → decode", () => {
    const original = { companyId: "acme", equipmentId: "door-lock-42" };
    const decoded = decodeEquipmentQrPayload(encodeEquipmentQrPayload(original.companyId, original.equipmentId));
    expect(decoded?.companyId).toBe(original.companyId);
    expect(decoded?.equipmentId).toBe(original.equipmentId);
  });
});
