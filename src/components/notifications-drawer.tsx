"use client";

import { useMemo } from "react";
import {
  X,
  Bell,
  Package,
  Radio,
  Award,
  FileText,
  ClipboardList,
  Megaphone,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  type AdminNotification,
} from "@/redux/api/notificationsApi";
import { PageLoader } from "./loaders";

const TYPE_ICON: Record<string, LucideIcon> = {
  order: Package,
  live_class: Radio,
  result: Award,
  resource: FileText,
  assignment: ClipboardList,
  notice: Megaphone,
  general: Bell,
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetNotificationsQuery(undefined, { skip: !open });
  const [markAllRead, { isLoading: marking }] = useMarkAllNotificationsReadMutation();

  const items: AdminNotification[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results;
  }, [data]);
  const hasUnread = items.some((n) => !n.is_read);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-[90vw] flex-col border-l border-white/10 bg-gray-950 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Bell size={18} className="text-blue-400" />
            নোটিফিকেশন
          </h2>
          <div className="flex items-center gap-2">
            {hasUnread ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                disabled={marking}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
              >
                <CheckCheck size={13} />
                সব পঠিত
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-slate-400"
              aria-label="বন্ধ করুন"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <PageLoader label="নোটিফিকেশন লোড হচ্ছে…" />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Bell size={28} />
              <p className="text-sm font-semibold">এখন কোনো নোটিফিকেশন নেই।</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.notification_type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 rounded-xl border p-3 ${
                      n.is_read
                        ? "border-white/5 bg-white/[0.02]"
                        : "border-blue-500/25 bg-blue-500/[0.06]"
                    }`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-blue-300">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-white">{n.title}</p>
                        {!n.is_read ? (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-400" />
                        ) : null}
                      </div>
                      {n.message ? (
                        <p className="mt-0.5 text-xs leading-5 text-slate-400">{n.message}</p>
                      ) : null}
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {formatWhen(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
