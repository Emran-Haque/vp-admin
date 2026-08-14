"use client";

import { HelpCircle, Plus, Eye, BookOpen, Layers } from "lucide-react";
import { useGetFaqsQuery } from "@/redux/api/contentApi";
import { usePermissions } from "@/hooks/use-permissions";

export default function OverviewBanner({ onAddClick }: { onAddClick: () => void }) {
  const { data } = useGetFaqsQuery();
  const { hasPermission } = usePermissions();

  const faqs = data?.results ?? [];
  const totalFaqs = data?.count ?? faqs.length;
  const activeFaqs = faqs.filter((f) => f.is_active).length;
  const courseFaqs = faqs.filter((f) => f.related_course != null).length;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0px_4px_20px_0px_rgba(99,102,241,0.30)]">
          <HelpCircle size={28} className="text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-8 text-blue-50">FAQ ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-slate-400">
            সাধারণ প্রশ্ন ও উত্তর (FAQ), কোর্স সম্পর্কিত FAQ এবং বইয়ের FAQ সমূহের ম্যানেজ করুন
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-800 bg-gray-900/60 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Layers size={12} className="text-slate-400" />
              <p className="text-[11px] font-medium text-slate-400">মোট FAQ</p>
            </div>
            <p className="mt-0.5 text-base font-bold text-blue-50">{totalFaqs}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Eye size={12} className="text-emerald-400" />
              <p className="text-[11px] font-medium text-emerald-400">সক্রিয়</p>
            </div>
            <p className="mt-0.5 text-base font-bold text-emerald-400">{activeFaqs}</p>
          </div>
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <BookOpen size={12} className="text-indigo-400" />
              <p className="text-[11px] font-medium text-indigo-400">কোর্স/বই FAQ</p>
            </div>
            <p className="mt-0.5 text-base font-bold text-indigo-400">{courseFaqs}</p>
          </div>
        </div>

        {hasPermission("can_manage_faq") && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-[0px_4px_16px_0px_rgba(99,102,241,0.35)] transition-all hover:brightness-110"
          >
            <Plus size={18} />
            নতুন FAQ যোগ করুন
          </button>
        )}
      </div>
    </section>
  );
}
