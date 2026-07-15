"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export default function OverviewBanner() {
  const { hasPermission } = usePermissions();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-white/10">
            <BookOpen size={32} className="text-blue-500" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">কোর্স ম্যানেজমেন্ট</h1>
            <p className="mt-1 text-base text-white">
              ভিডিও, ফাইল ও কুইজসহ নতুন কোর্স তৈরি ও পরিচালনা করুন
            </p>
          </div>
        </div>

        {hasPermission("can_create_course") && (
          <Link
            href="/courses/create"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3.5 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
          >
            <Plus size={16} />
            নতুন কোর্স যোগ করুন
          </Link>
        )}
      </div>
    </section>
  );
}
