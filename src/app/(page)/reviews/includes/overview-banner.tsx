"use client";

import { Star, Clock, Eye, XCircle } from "lucide-react";
import { useGetReviewCountsQuery } from "@/redux/api/contentApi";

export default function OverviewBanner() {
  // Counts come from the server so they reflect every review, not just the
  // page of results currently on screen.
  const { data } = useGetReviewCountsQuery();

  const pending = data?.pending ?? 0;
  const approved = data?.approved ?? 0;
  const rejected = data?.rejected ?? 0;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-[0px_4px_20px_0px_rgba(245,158,11,0.30)]">
          <Star size={28} className="fill-white text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-8 text-blue-50">শিক্ষার্থী রিভিউ ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-slate-400">
            অনুমোদনের পরই রিভিউ ওয়েবসাইটে প্রকাশ পাবে
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
        <Stat
          className="border-amber-500/30 bg-amber-500/10 text-amber-400"
          Icon={Clock}
          label="অপেক্ষমাণ"
          value={pending}
        />
        <Stat
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          Icon={Eye}
          label="প্রকাশিত"
          value={approved}
        />
        <Stat
          className="border-slate-700 bg-gray-900/60 text-slate-400"
          Icon={XCircle}
          label="বাতিল"
          value={rejected}
        />
      </div>
    </section>
  );
}

/** One count tile. Three across on mobile, inline from sm up. */
function Stat({
  Icon,
  label,
  value,
  className,
}: {
  Icon: typeof Clock;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border px-3 py-2.5 text-center sm:px-4 ${className}`}>
      <div className="flex items-center justify-center gap-1">
        <Icon size={12} />
        <p className="text-[11px] font-medium">{label}</p>
      </div>
      <p className="mt-0.5 text-base font-bold">{value}</p>
    </div>
  );
}
