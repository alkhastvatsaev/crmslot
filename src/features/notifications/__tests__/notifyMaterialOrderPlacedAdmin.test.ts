import {
  buildMaterialOrderPushData,
  buildMaterialOrderPushTitle,
  isMaterialOrderPushRecipient,
} from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";
import { MATERIAL_ORDER_PUSH_TYPE } from "@/features/notifications/materialOrderNotificationUrls";
import { BM_MATERIAL_ORDER_PARAM } from "@/features/notifications/notificationConstants";
import { resolvePushNotificationOpenUrl } from "@/features/notifications/resolvePushNotificationOpenUrl";

describe("material order push helpers", () => {
  it("builds title with client name", () => {
    expect(buildMaterialOrderPushTitle("M. Dupont")).toBe("Commande matériel — M. Dupont");
    expect(buildMaterialOrderPushTitle("  ")).toBe("Commande matériel");
  });

  it("builds FCM data payload", () => {
    expect(
      buildMaterialOrderPushData({
        companyId: "co-1",
        supplierOrderId: "sup-1",
        materialOrderId: "mat-1",
        interventionId: "iv-1",
      })
    ).toEqual({
      type: MATERIAL_ORDER_PUSH_TYPE,
      companyId: "co-1",
      supplierOrderId: "sup-1",
      materialOrderId: "mat-1",
      interventionId: "iv-1",
      [BM_MATERIAL_ORDER_PARAM]: "sup-1",
    });
  });

  it("accepts admins and technicians only", () => {
    expect(
      isMaterialOrderPushRecipient({
        active: true,
        role: "admin",
        hasTechnicianProfile: false,
      })
    ).toBe(true);
    expect(
      isMaterialOrderPushRecipient({
        active: true,
        role: "collaborateur",
        hasTechnicianProfile: true,
      })
    ).toBe(true);
    expect(
      isMaterialOrderPushRecipient({
        active: false,
        role: "admin",
        hasTechnicianProfile: true,
      })
    ).toBe(false);
    expect(
      isMaterialOrderPushRecipient({
        active: true,
        role: "collaborateur",
        hasTechnicianProfile: false,
      })
    ).toBe(false);
  });

  it("opens feature hub from push click url", () => {
    const url = resolvePushNotificationOpenUrl("https://crmslot.vercel.app", {
      type: MATERIAL_ORDER_PUSH_TYPE,
      supplierOrderId: "sup-abc",
      companyId: "co-1",
    });
    expect(url).toBe("https://crmslot.vercel.app/?bmMaterialOrder=sup-abc");
  });
});

import {
  buildOrderStatusPushBody,
  buildOrderStatusPushData,
} from "@/features/notifications/materialOrderStatusPush";
import { MATERIAL_ORDER_STATUS_PUSH_TYPE } from "@/features/notifications/materialOrderNotificationUrls";
import {
  buildSupplierOrderProgressCandidate,
  resolveSupplierOrderAutoAdvanceTarget,
} from "@/features/notifications/supplierOrderProgressTick";

describe("material order status push", () => {
  it("builds status change body", () => {
    expect(buildOrderStatusPushBody("supplier", "confirmed", "sent")).toBe(
      "Préparation → Expédiée"
    );
    expect(buildOrderStatusPushBody("material", "ordered", null)).toBe("Étape : Commandée");
  });

  it("builds status FCM data", () => {
    expect(
      buildOrderStatusPushData({
        companyId: "co-1",
        kind: "supplier",
        fromStatus: "sent",
        toStatus: "confirmed",
        supplierOrderId: "sup-9",
      }).type
    ).toBe(MATERIAL_ORDER_STATUS_PUSH_TYPE);
  });
});

describe("supplier order progress tick", () => {
  const base = {
    status: "sent" as const,
    createdAt: "2026-01-01T10:00:00.000Z",
    sentAt: "2026-01-01T10:00:00.000Z",
  };

  it("advances after ~12h to confirmed", () => {
    const now = Date.parse("2026-01-02T12:00:00.000Z");
    expect(resolveSupplierOrderAutoAdvanceTarget(base, now)).toBe("confirmed");
  });

  it("builds candidate when advance needed", () => {
    const now = Date.parse("2026-01-03T04:00:00.000Z");
    const candidate = buildSupplierOrderProgressCandidate(
      "co-1",
      "ord-1",
      {
        status: "sent",
        createdAt: "2026-01-01T10:00:00.000Z",
        sentAt: "2026-01-01T10:00:00.000Z",
        clientName: "M. Test",
      },
      now
    );
    expect(candidate?.toStatus).toBe("delivered");
  });
});
