"use client";

import { Users, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export default function OverviewBanner({ onAddClick }: { onAddClick: () => void }) {
  const { hasPermission } = usePermissions();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-7">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 sm:size-16 sm:rounded-3xl">
            <Users className="size-6 text-cyan-500 sm:size-8" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-7 text-blue-50 sm:text-2xl sm:leading-9">শিক্ষার্থী ম্যানেজমেন্ট</h1>
            <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-base">
              সকল শিক্ষার্থীর তথ্য ও অগ্রগতি এক জায়গায় দেখুন
            </p>
          </div>
        </div>

        {hasPermission("can_create_student") && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold sm:w-auto sm:rounded-2xl sm:px-6 sm:py-3.5 sm:text-lg text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
          >
            <Plus size={16} />
            নতুন শিক্ষার্থী
          </button>
        )}
      </div>
    </section>
  );
}
