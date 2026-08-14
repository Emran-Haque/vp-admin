import { GraduationCap, Plus } from "lucide-react";

export default function OverviewBanner({ onAddClick }: { onAddClick: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center justify-between gap-4 p-7">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-500/20">
            <GraduationCap size={32} className="text-cyan-500" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">শিক্ষক ম্যানেজমেন্ট</h1>
            <p className="mt-1 text-base text-slate-400">শিক্ষকদের প্রোফাইল, বিষয় ও সামাজিক যোগাযোগ পরিচালনা করুন</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-3.5 text-lg font-semibold text-white shadow-[0px_0px_40px_-10px_rgba(0,229,200,0.50)]"
        >
          <Plus size={16} />
          নতুন শিক্ষক
        </button>
      </div>
    </section>
  );
}
