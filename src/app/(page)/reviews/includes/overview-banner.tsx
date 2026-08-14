"use client";

import { Star, Plus, Eye, Award } from "lucide-react";
import { useGetReviewsQuery } from "@/redux/api/contentApi";
import { usePermissions } from "@/hooks/use-permissions";

export default function OverviewBanner({ onAddClick }: { onAddClick: () => void }) {
  const { data } = useGetReviewsQuery();
  const { hasPermission } = usePermissions();

  const reviews = data?.results ?? [];
  const totalReviews = data?.count ?? reviews.length;
  const featuredReviews = reviews.filter((r) => r.is_featured).length;
  const visibleReviews = reviews.filter((r) => r.is_visible).length;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-[0px_4px_20px_0px_rgba(245,158,11,0.30)]">
          <Star size={28} className="fill-white text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-8 text-blue-50">শিক্ষার্থী রিভিউ ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-slate-400">
            শিক্ষার্থীদের মতামত, রেটিং ও স্থান অর্জনের রিভিউ সমূহের তালিকা নিয়ন্ত্রণ করুন
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-800 bg-gray-900/60 px-4 py-2.5 text-center">
            <p className="text-[11px] font-medium text-slate-400">মোট রিভিউ</p>
            <p className="mt-0.5 text-base font-bold text-blue-50">{totalReviews}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Award size={12} className="text-amber-400" />
              <p className="text-[11px] font-medium text-amber-400">ফিচার্ড</p>
            </div>
            <p className="mt-0.5 text-base font-bold text-amber-400">{featuredReviews}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Eye size={12} className="text-emerald-400" />
              <p className="text-[11px] font-medium text-emerald-400">দৃশ্যমান</p>
            </div>
            <p className="mt-0.5 text-base font-bold text-emerald-400">{visibleReviews}</p>
          </div>
        </div>

        {hasPermission("can_manage_reviews") && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 px-5 py-3 text-sm font-semibold text-white shadow-[0px_4px_16px_0px_rgba(245,158,11,0.35)] transition-all hover:brightness-110"
          >
            <Plus size={18} />
            নতুন রিভিউ যোগ করুন
          </button>
        )}
      </div>
    </section>
  );
}
