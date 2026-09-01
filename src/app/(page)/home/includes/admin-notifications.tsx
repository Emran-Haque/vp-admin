"use client";

import Link from "next/link";
import { ArrowUpRight, Bell } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { getNotificationHref, getNotificationVisual } from "@/components/notification-visuals";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminNotifications() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  const notifications = (data?.notifications ?? []).slice(0, 3);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.32)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300">
            <Bell size={15} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-blue-50">সাম্প্রতিক নোটিফিকেশন</h2>
            <p className="text-[11px] text-slate-500">
              {data?.unread_notifications ?? 0}টি অপঠিত আপডেট আছে
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {isLoading ? (
          <p className="px-4 py-5 text-center text-xs text-slate-400">
            নোটিফিকেশন লোড হচ্ছে...
          </p>
        ) : isError ? (
          <p className="px-4 py-5 text-center text-xs text-red-400">
            নোটিফিকেশন আনা যায়নি।
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-5 text-center text-xs text-slate-400">
            এখন কোনো নতুন নোটিফিকেশন নেই।
          </p>
        ) : (
          notifications.map((notification) => {
            const href = getNotificationHref(notification);
            const visual = getNotificationVisual(notification.notification_type);
            const Icon = visual.icon;
            return (
              <div
                key={notification.id}
                className="flex min-w-0 items-center gap-3 px-4 py-2.5"
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${visual.iconClass}`}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {!notification.is_read && (
                      <span className="size-1.5 shrink-0 rounded-full bg-sky-400" />
                    )}
                    <p className="truncate text-xs font-bold text-blue-50">{notification.title}</p>
                    <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {notification.message}
                  </p>
                </div>
                {href && (
                  <Link
                    href={href}
                    aria-label="সম্পর্কিত অংশ খুলুন"
                    title="সম্পর্কিত অংশ খুলুন"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
