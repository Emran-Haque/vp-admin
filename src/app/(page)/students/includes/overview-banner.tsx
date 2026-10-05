"use client";

import { Users, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import Stats from "./stats";

/**
 * Title, "new student" and the two counts in one short card. Phones: title +
 * button on one row, the counts on the next. Desktop: all on a single row.
 */
export default function OverviewBanner({ onAddClick }: { onAddClick: () => void }) {
  const { hasPermission } = usePermissions();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:rounded-3xl">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-x-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 sm:size-12 sm:rounded-2xl">
            <Users className="size-5 text-cyan-500 sm:size-6" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-6 text-blue-50 sm:text-xl sm:leading-8">
              শিক্ষার্থী ম্যানেজমেন্ট
            </h1>
            <p className="hidden truncate text-sm text-slate-400 sm:block">
              সকল শিক্ষার্থীর তথ্য ও অগ্রগতি এক জায়গায় দেখুন
            </p>
          </div>
        </div>

        {hasPermission("can_create_student") && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)] sm:px-5 sm:py-2.5 lg:order-3"
          >
            <Plus size={16} />
            <span className="sm:hidden">নতুন</span>
            <span className="hidden sm:inline">নতুন শিক্ষার্থী</span>
          </button>
        )}

        <div className="col-span-2 lg:order-2 lg:col-span-1">
          <Stats />
        </div>
      </div>
    </section>
  );
}
