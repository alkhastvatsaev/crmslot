import { parseBackofficeChatNotificationData } from "@/features/notifications/backofficeChatNotificationUrls";
import { dispatchBackofficeChatNotificationIntent } from "@/features/notifications/backofficeChatNotificationIntent";
import {
  dispatchClientNotificationIntent,
  parseClientNotificationData,
} from "@/features/notifications/clientNotificationIntent";
import {
  dispatchTechnicianNotificationIntent,
  parseTechnicianNotificationData,
} from "@/features/notifications/technicianNotificationIntent";
import { dispatchMaterialOrderNotificationIntent } from "@/features/notifications/materialOrderNotificationIntent";
import { parseMaterialOrderNotificationData } from "@/features/notifications/materialOrderNotificationUrls";
import {
  MATERIAL_ORDER_PUSH_TYPE,
  MATERIAL_ORDER_STATUS_PUSH_TYPE,
} from "@/features/notifications/materialOrderNotificationUrls";

/** Route un clic notif FCM (Capacitor / data payload) vers le bon intent DOM. */
export function routePushNotificationClick(data: Record<string, string | undefined>): void {
  const pushType = data.type?.trim() ?? "";
  const audience = data.audience?.trim() ?? "";

  if (pushType === "portal_chat" && audience === "staff") {
    const intent = parseBackofficeChatNotificationData(data);
    if (intent.kind !== "none") dispatchBackofficeChatNotificationIntent(intent);
    return;
  }

  if (pushType === "portal_chat" && audience === "client") {
    const intent = parseClientNotificationData(data);
    if (intent.kind !== "none") dispatchClientNotificationIntent(intent);
    return;
  }

  if (pushType === MATERIAL_ORDER_PUSH_TYPE || pushType === MATERIAL_ORDER_STATUS_PUSH_TYPE) {
    const intent = parseMaterialOrderNotificationData(data);
    if (intent.kind !== "none") dispatchMaterialOrderNotificationIntent(intent);
    return;
  }

  const clientIntent = parseClientNotificationData(data);
  if (clientIntent.kind !== "none") {
    dispatchClientNotificationIntent(clientIntent);
    return;
  }

  const materialIntent = parseMaterialOrderNotificationData(data);
  if (materialIntent.kind !== "none") {
    dispatchMaterialOrderNotificationIntent(materialIntent);
    return;
  }

  const techIntent = parseTechnicianNotificationData(data);
  if (techIntent.kind !== "none") dispatchTechnicianNotificationIntent(techIntent);
}
