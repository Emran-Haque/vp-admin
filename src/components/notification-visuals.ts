import {
  Award,
  Bell,
  ClipboardList,
  FileText,
  Megaphone,
  Package,
  Radio,
  type LucideIcon,
} from "lucide-react";

export type NotificationVisual = {
  icon: LucideIcon;
  label: string;
  iconClass: string;
  unreadClass: string;
};

const visuals: Record<string, NotificationVisual> = {
  order: {
    icon: Package,
    label: "অর্ডার",
    iconClass: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    unreadClass: "border-amber-400/20 bg-amber-400/[0.06]",
  },
  live_class: {
    icon: Radio,
    label: "লাইভ ক্লাস",
    iconClass: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    unreadClass: "border-emerald-400/20 bg-emerald-400/[0.06]",
  },
  result: {
    icon: Award,
    label: "ফলাফল",
    iconClass: "border-violet-400/20 bg-violet-400/10 text-violet-300",
    unreadClass: "border-violet-400/20 bg-violet-400/[0.06]",
  },
  resource: {
    icon: FileText,
    label: "রিসোর্স",
    iconClass: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    unreadClass: "border-cyan-400/20 bg-cyan-400/[0.06]",
  },
  assignment: {
    icon: ClipboardList,
    label: "অ্যাসাইনমেন্ট",
    iconClass: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    unreadClass: "border-orange-400/20 bg-orange-400/[0.06]",
  },
  notice: {
    icon: Megaphone,
    label: "নোটিশ",
    iconClass: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    unreadClass: "border-rose-400/20 bg-rose-400/[0.06]",
  },
  general: {
    icon: Bell,
    label: "আপডেট",
    iconClass: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    unreadClass: "border-sky-400/20 bg-sky-400/[0.06]",
  },
};

export function getNotificationVisual(type: string): NotificationVisual {
  return visuals[type] ?? visuals.general;
}

export function getNotificationHref(notification: {
  notification_type: string;
  related_object_type: string;
  related_object_id: number | null;
}) {
  const id = notification.related_object_id;
  switch (notification.related_object_type) {
    case "order":
      return "/orders";
    case "course":
    case "book":
    case "exam_batch":
      return notification.notification_type === "general" ? "/reviews" : notification.related_object_type === "course" && id ? `/courses/${id}?tab=students` : notification.related_object_type === "book" ? "/books" : "/exam-batches";
    case "exam":
      return id ? `/mcq/${id}/edit` : "/mcq";
    case "notice":
      return "/notice";
    case "inactivity":
      return "/students";
    default:
      return null;
  }
}
