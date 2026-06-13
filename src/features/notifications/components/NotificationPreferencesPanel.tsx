"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  NOTIFICATION_CHANNELS,
  normalizeNotificationPreferences,
  type NotificationChannel,
  type NotificationPreferences,
} from "../notificationPreferences";

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  push: "Notifications push",
  whatsapp: "WhatsApp",
};

type Props = {
  /** `staff` → users/{uid} ; `client` → client_portal_profiles/{uid} */
  profileKind?: "staff" | "client";
};

export default function NotificationPreferencesPanel({ profileKind = "staff" }: Props) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  const uid = auth?.currentUser?.uid?.trim() ?? "";
  const collection = profileKind === "client" ? "client_portal_profiles" : "users";

  useEffect(() => {
    if (!firestore || !uid) return;
    void getDoc(doc(firestore, collection, uid)).then((snap) => {
      const raw = snap.exists() ? snap.data()?.notificationPreferences : null;
      setPrefs(normalizeNotificationPreferences(raw));
    });
  }, [uid, collection]);

  const handleToggle = async (channel: NotificationChannel) => {
    if (!firestore || !uid || !prefs) return;
    const next = { ...prefs, [channel]: !prefs[channel] };
    setPrefs(next);
    setSaving(true);
    try {
      await setDoc(
        doc(firestore, collection, uid),
        { notificationPreferences: next },
        { merge: true }
      );
      toast.success(String(t("notifications.prefs_saved")));
    } catch {
      setPrefs(prefs);
      toast.error(String(t("common.error")));
    } finally {
      setSaving(false);
    }
  };

  if (!uid || !prefs) return null;

  return (
    <section
      data-testid="notification-preferences-panel"
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("notifications.prefs_title")}</h3>
      </div>
      <ul className="space-y-2">
        {NOTIFICATION_CHANNELS.map((channel) => (
          <li key={channel} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-700">{CHANNEL_LABELS[channel]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[channel]}
              data-testid={`notif-pref-${channel}`}
              disabled={saving}
              onClick={() => void handleToggle(channel)}
              className={`relative h-6 w-11 rounded-full transition ${prefs[channel] ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${prefs[channel] ? "left-5" : "left-0.5"}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
