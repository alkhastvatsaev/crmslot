"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  subscribeInbox,
  markNotificationRead,
  markAllRead,
} from "../inboxFirestore";
import { INBOX_TYPE_ICONS, type InboxNotification } from "../types";

export default function InboxBell() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const uid = workspace?.firebaseUid ?? "";

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!firestore || !companyId || !uid) return;
    return subscribeInbox(firestore, companyId, uid, setNotifications);
  }, [companyId, uid]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRead = async (n: InboxNotification) => {
    if (!firestore || n.read) return;
    await markNotificationRead(firestore, companyId, n.id).catch(() => null);
  };

  const handleMarkAll = async () => {
    if (!firestore || !companyId || !uid) return;
    await markAllRead(firestore, companyId, uid).catch(() => null);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-slate-100 text-slate-600"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAll()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400">
                Aucune notification
              </li>
            )}
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => void handleRead(n)}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
              >
                <span className="text-lg shrink-0 leading-tight">{INBOX_TYPE_ICONS[n.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${!n.read ? "text-slate-900" : "text-slate-600"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(n.createdAt).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
