"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, X, Bell, CheckCheck } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  type AdminNotification,
} from "@/redux/api/notificationsApi";
import { PageLoader } from "./loaders";
import { getNotificationHref, getNotificationVisual } from "./notification-visuals";

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
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[350px] max-w-full flex-col border-l border-white/10 bg-gray-950 shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <Bell size={16} className="text-sky-400" />
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

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <PageLoader label="নোটিফিকেশন লোড হচ্ছে…" />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Bell size={28} />
              <p className="text-sm font-semibold">এখন কোনো নোটিফিকেশন নেই।</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {items.map((n) => {
                const visual = getNotificationVisual(n.notification_type);
                const Icon = visual.icon;
                const href = getNotificationHref(n);
                return (
                  <div
                    key={n.id}
                    className={`flex gap-2.5 rounded-lg border p-2.5 ${
                      n.is_read
                        ? "border-white/5 bg-white/[0.02]"
                        : visual.unreadClass
                    }`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${visual.iconClass}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold leading-5 text-white">{n.title}</p>
                        {!n.is_read ? (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />
                        ) : null}
                      </div>
                      {n.message ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.55] text-slate-400">{n.message}</p>
                      ) : null}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600">{visual.label}</span>
                        <span className="text-[10px] font-semibold text-slate-600">{formatWhen(n.created_at)}</span>
                        {href ? (
                          <Link href={href} onClick={onClose} className="ml-auto grid size-6 place-items-center rounded-md text-slate-500 hover:bg-white/5 hover:text-white" aria-label="সম্পর্কিত অংশ খুলুন" title="সম্পর্কিত অংশ খুলুন">
                            <ArrowUpRight size={13} />
                          </Link>
                        ) : null}
                      </div>
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
