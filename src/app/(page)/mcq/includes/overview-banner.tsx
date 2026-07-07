import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";

export default function OverviewBanner() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-red-600/20">
            <ClipboardList size={32} className="text-red-600" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">MCQ ও পরীক্ষা ম্যানেজমেন্ট</h1>
            <p className="mt-1 text-base text-slate-400">সকল পরীক্ষা তৈরি, সম্পাদনা ও প্রকাশ করুন</p>
          </div>
        </div>

        <Link
          href="/mcq/create"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3.5 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
        >
          <Plus size={16} />
          নতুন পরীক্ষা যোগ করুন
        </Link>
      </div>
    </section>
  );
}
