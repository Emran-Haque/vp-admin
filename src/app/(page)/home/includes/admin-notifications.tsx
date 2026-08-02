"use client";

import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminNotifications() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  const notifications = data?.notifications ?? [];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
            <Bell size={19} />
          </span>
          <div>
            <h2 className="text-xl font-bold leading-8 text-blue-50">অ্যাডমিন নোটিফিকেশন</h2>
            <p className="text-sm text-slate-400">
              {data?.unread_notifications ?? 0}টি অপঠিত আপডেট আছে
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isLoading ? (
          <p className="rounded-2xl border border-slate-800 bg-gray-900/40 p-5 text-center text-sm text-slate-400">
            নোটিফিকেশন লোড হচ্ছে...
          </p>
        ) : isError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-400">
            নোটিফিকেশন আনা যায়নি।
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-400">
            এখন কোনো নতুন নোটিফিকেশন নেই।
          </p>
        ) : (
          notifications.map((notification) => {
            const courseHref =
              notification.related_object_type === "course" && notification.related_object_id
                ? `/courses/${notification.related_object_id}?tab=students`
                : null;
            return (
              <div
                key={notification.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
              >
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!notification.is_read && (
                      <span className="size-2 rounded-full bg-amber-400" />
                    )}
                    <p className="text-sm font-bold text-blue-50">{notification.title}</p>
                    <span className="text-xs text-slate-500">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {notification.message}
                  </p>
                </div>
                {courseHref && (
                  <Link
                    href={courseHref}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-bold text-blue-100 no-underline"
                  >
                    ভর্তি তালিকা
                    <ExternalLink size={14} />
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
