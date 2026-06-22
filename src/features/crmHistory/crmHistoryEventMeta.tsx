import {
  FilePlus,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  Truck,
  Mail,
  MailOpen,
  Coins,
  UserX,
  RotateCcw,
  Trash2,
  FileCheck,
  MessageCircle,
  CalendarClock,
  Clock,
  CreditCard,
  Ban,
  XCircle,
  Navigation,
  Eye,
  MousePointer,
  LogIn,
  Archive,
  ClipboardList,
} from "lucide-react";
import type { CrmEventType } from "@/features/crmHistory/crmActivityTypes";

export type CrmHistoryEventMeta = {
  Icon: React.FC<{ className?: string }>;
  colorClass: string;
  dotClass: string;
};

export const CRM_HISTORY_EVENT_META: Record<CrmEventType, CrmHistoryEventMeta> = {
  intervention_created: { Icon: FilePlus, colorClass: "text-blue-600", dotClass: "bg-blue-500" },
  intervention_assigned: {
    Icon: UserCheck,
    colorClass: "text-violet-600",
    dotClass: "bg-violet-500",
  },
  intervention_status: { Icon: ArrowRight, colorClass: "text-amber-600", dotClass: "bg-amber-400" },
  time_entry_recorded: { Icon: Clock, colorClass: "text-sky-600", dotClass: "bg-sky-400" },
  intervention_completed: {
    Icon: CheckCircle2,
    colorClass: "text-emerald-600",
    dotClass: "bg-emerald-500",
  },
  intervention_invoiced: { Icon: FileText, colorClass: "text-teal-600", dotClass: "bg-teal-500" },
  material_ordered: { Icon: Package, colorClass: "text-orange-600", dotClass: "bg-orange-400" },
  supplier_ordered: { Icon: Truck, colorClass: "text-rose-600", dotClass: "bg-rose-500" },
  email_sent: { Icon: Mail, colorClass: "text-blue-600", dotClass: "bg-blue-400" },
  email_received: { Icon: MailOpen, colorClass: "text-cyan-600", dotClass: "bg-cyan-400" },
  commission_calculated: { Icon: Coins, colorClass: "text-yellow-600", dotClass: "bg-yellow-400" },
  intervention_technician_declined: {
    Icon: UserX,
    colorClass: "text-rose-600",
    dotClass: "bg-rose-500",
  },
  intervention_returned_to_requests: {
    Icon: RotateCcw,
    colorClass: "text-orange-600",
    dotClass: "bg-orange-400",
  },
  intervention_deleted: { Icon: Trash2, colorClass: "text-red-700", dotClass: "bg-red-600" },
  intervention_report_validated: {
    Icon: FileCheck,
    colorClass: "text-teal-700",
    dotClass: "bg-teal-500",
  },
  intervention_report_rejected: {
    Icon: RotateCcw,
    colorClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  intervention_report_archived: {
    Icon: Archive,
    colorClass: "text-slate-600",
    dotClass: "bg-slate-400",
  },
  intervention_cancelled: { Icon: Ban, colorClass: "text-red-600", dotClass: "bg-red-500" },
  intervention_schedule_updated: {
    Icon: CalendarClock,
    colorClass: "text-indigo-600",
    dotClass: "bg-indigo-400",
  },
  intervention_billing_updated: {
    Icon: FileText,
    colorClass: "text-slate-700",
    dotClass: "bg-slate-500",
  },
  intervention_payment_updated: {
    Icon: CreditCard,
    colorClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  intervention_terrain_report_received: {
    Icon: ClipboardList,
    colorClass: "text-violet-600",
    dotClass: "bg-violet-500",
  },
  bridged_report_dismissed: {
    Icon: XCircle,
    colorClass: "text-slate-600",
    dotClass: "bg-slate-400",
  },
  ivana_chat_message: { Icon: MessageCircle, colorClass: "text-sky-600", dotClass: "bg-sky-400" },
  material_order_status_changed: {
    Icon: Package,
    colorClass: "text-orange-700",
    dotClass: "bg-orange-500",
  },
  supplier_order_lecot: { Icon: Truck, colorClass: "text-amber-700", dotClass: "bg-amber-500" },
  chatbot_intervention_status: {
    Icon: ArrowRight,
    colorClass: "text-purple-600",
    dotClass: "bg-purple-400",
  },
  chatbot_timeline_comment: {
    Icon: MessageCircle,
    colorClass: "text-purple-700",
    dotClass: "bg-purple-500",
  },
  chatbot_email_sent: { Icon: Mail, colorClass: "text-blue-700", dotClass: "bg-blue-500" },
  chatbot_gmail_action: { Icon: MailOpen, colorClass: "text-blue-600", dotClass: "bg-blue-400" },
  chatbot_write_action: {
    Icon: ClipboardList,
    colorClass: "text-purple-800",
    dotClass: "bg-purple-600",
  },
  quote_created: { Icon: ClipboardList, colorClass: "text-sky-600", dotClass: "bg-sky-500" },
  quote_status_changed: {
    Icon: FileCheck,
    colorClass: "text-emerald-600",
    dotClass: "bg-emerald-500",
  },
  page_navigated: { Icon: Navigation, colorClass: "text-slate-400", dotClass: "bg-slate-300" },
  intervention_viewed: { Icon: Eye, colorClass: "text-slate-500", dotClass: "bg-slate-400" },
  email_viewed: { Icon: MousePointer, colorClass: "text-slate-500", dotClass: "bg-slate-400" },
  user_session_start: { Icon: LogIn, colorClass: "text-green-600", dotClass: "bg-green-500" },
};
