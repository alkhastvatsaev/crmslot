"use client";

import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatIncomingRequestClientName } from "@/features/backoffice/incomingRequestClientDisplayName";
import type { useIncomingClientRequestsController } from "@/features/backoffice/hooks/useIncomingClientRequestsController";
import TechnicianAssignPicker from "@/features/dispatch/components/TechnicianAssignPicker";
import { formatAddress } from "@/utils/stringUtils";

type View = ReturnType<typeof useIncomingClientRequestsController>;

export default function IncomingClientRequestDetail({ view }: { view: View }) {
  const {
    t,
    interventions,
    selectedRequest,
    resolvedAudioUrl,
    isEditingDateTime,
    setIsEditingDateTime,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    assignPickerOpen,
    setAssignPickerOpen,
    isAssigning,
    closeDetail,
    handleDelete,
    handleAssignToTechnician,
    handleUpdateDateTime,
    startEditDateTime,
  } = view;

  if (!selectedRequest) return null;

  const anonymous = String(t("backoffice.inbox.anonymous_client"));
  const clientDisplayName = formatIncomingRequestClientName(selectedRequest, anonymous);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden rounded-[inherit] bg-white/95 shadow-2xl backdrop-blur-md"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100/50 p-4">
        <button
          onClick={closeDetail}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {assignPickerOpen
            ? String(t("dispatch.assign_picker.title"))
            : String(t("backoffice.incoming_requests.request_details"))}
        </span>
        <div className="w-8" />
      </div>

      {!assignPickerOpen ? (
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {String(t("backoffice.incoming_requests.client"))}
            </span>
            <p className="mt-1 text-[16px] font-bold text-black">{clientDisplayName}</p>
            {selectedRequest.clientPhone ? (
              <p className="mt-0.5 text-[14px] font-bold text-black">
                {selectedRequest.clientPhone}
              </p>
            ) : null}
            {selectedRequest.clientEmail ? (
              <p className="mt-0.5 break-all text-[14px] font-medium text-slate-600">
                <a href={`mailto:${selectedRequest.clientEmail}`} className="hover:underline">
                  {selectedRequest.clientEmail}
                </a>
              </p>
            ) : null}
          </div>

          {selectedRequest.address ? (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {String(t("backoffice.incoming_requests.address"))}
              </span>
              <p className="mt-1 text-[15px] font-bold text-slate-800">
                {formatAddress(selectedRequest.address)}
              </p>
            </div>
          ) : null}

          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {String(t("backoffice.incoming_requests.problem"))}
            </span>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">
              {selectedRequest.problem ||
                selectedRequest.title ||
                String(t("backoffice.inbox.no_description"))}
            </p>
          </div>

          {resolvedAudioUrl || selectedRequest.transcription ? (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {String(t("backoffice.incoming_requests.voice_message"))}
              </span>
              {resolvedAudioUrl ? (
                <audio controls src={resolvedAudioUrl} className="mt-2 h-10 w-full" />
              ) : null}
              {selectedRequest.transcription ? (
                <div className="mt-2 rounded-[12px] border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[14px] italic text-slate-700">
                    &quot;{selectedRequest.transcription}&quot;
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {String(t("backoffice.incoming_requests.desired_datetime"))}
              </span>
              {!isEditingDateTime ? (
                <button
                  onClick={startEditDateTime}
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
                >
                  {selectedRequest.requestedDate
                    ? String(t("backoffice.inbox.edit"))
                    : String(t("common.add"))}
                </button>
              ) : null}
            </div>

            {isEditingDateTime ? (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="flex-1 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="flex-1 rounded-[12px] border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingDateTime(false)}
                    className="rounded-[8px] bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    {String(t("backoffice.incoming_requests.cancel"))}
                  </button>
                  <button
                    onClick={() => void handleUpdateDateTime()}
                    className="rounded-[8px] bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    {String(t("backoffice.incoming_requests.save"))}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-[14px] font-semibold text-blue-900">
                {selectedRequest.requestedDate
                  ? `${selectedRequest.requestedDate} ${selectedRequest.requestedTime ? `à ${selectedRequest.requestedTime}` : ""}`
                  : String(t("backoffice.inbox.no_description"))}
              </p>
            )}
          </div>

          {selectedRequest.urgency ? (
            <div>
              <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-amber-800">
                {String(t("common.urgent"))}: {selectedRequest.urgency}
              </span>
            </div>
          ) : null}

          {selectedRequest.attachmentThumbnails &&
          selectedRequest.attachmentThumbnails.length > 0 ? (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Photos
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {selectedRequest.attachmentThumbnails.map((photo, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-[12px] border border-slate-100 bg-slate-50 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`${String(t("backoffice.inbox.photos"))} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "shrink-0 border-t border-slate-100/50 bg-white",
          assignPickerOpen ? "flex min-h-0 flex-1 flex-col p-3" : "p-4"
        )}
      >
        {assignPickerOpen ? (
          <TechnicianAssignPicker
            className="min-h-0 flex-1"
            intervention={selectedRequest}
            peerInterventions={interventions}
            isAssigning={isAssigning}
            techniciansOnly
            onCancel={() => setAssignPickerOpen(false)}
            onAssign={(technicianUid, schedule) =>
              void handleAssignToTechnician(selectedRequest.id, technicianUid, schedule)
            }
          />
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => void handleDelete(selectedRequest.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3.5 text-[14px] font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              {String(t("backoffice.incoming_requests.delete"))}
            </button>
            <button
              type="button"
              data-testid="incoming-request-assign"
              onClick={() => setAssignPickerOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[16px] bg-slate-900 px-4 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(15,23,42,0.2)] active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              {String(t("backoffice.incoming_requests.assign"))}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
