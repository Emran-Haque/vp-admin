import type {
  DeviceEvent,
  DeviceEventKind,
  DeviceRequestStatus,
} from "@/redux/api/deviceLockApi";

export const requestStatusStyles: Record<DeviceRequestStatus, { label: string; className: string }> = {
  pending: { label: "অপেক্ষমাণ", className: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  approved: { label: "অনুমোদিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  rejected: { label: "বাতিল", className: "border-red-500/40 bg-red-500/10 text-red-400" },
  closed: { label: "বন্ধ", className: "border-slate-600 bg-slate-500/10 text-slate-400" },
};

export const eventStyles: Record<DeviceEventKind, { label: string; dot: string }> = {
  device_bound: { label: "প্রথম ডিভাইস হিসেবে যুক্ত হয়েছে", dot: "bg-sky-400" },
  login_blocked: { label: "অন্য ডিভাইস থেকে লগইনের চেষ্টা", dot: "bg-amber-400" },
  request_sent: { label: "লগইন রিকোয়েস্ট পাঠিয়েছে", dot: "bg-cyan-400" },
  request_approved: { label: "রিকোয়েস্ট অনুমোদিত — অ্যাক্সেস নতুন ডিভাইসে", dot: "bg-emerald-400" },
  request_rejected: { label: "রিকোয়েস্ট বাতিল", dot: "bg-red-400" },
  logout_all: { label: "সব ডিভাইস থেকে লগআউট", dot: "bg-fuchsia-400" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "অ্যাডমিন",
  super_admin: "সুপার অ্যাডমিন",
  moderator: "মডারেটর",
};

/** "২৪ সেপ, ২০২৬, ১০:৪৫ PM" — date and time, in Bangla digits. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Who did it: the admin/moderator by name, else the student or the system. */
export function actorLabel(event: DeviceEvent): string {
  if (event.actor) {
    const role = ROLE_LABELS[event.actor.role] ?? event.actor.role;
    return `${event.actor.full_name} (${role})`;
  }
  if (event.kind === "request_sent" || event.kind === "login_blocked") return "শিক্ষার্থী";
  return "সিস্টেম";
}

/** 8801712345678 -> 01712345678, the form staff type and read. */
export function localPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return phone.startsWith("880") ? phone.slice(2) : phone;
}
