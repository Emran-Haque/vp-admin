import { ReceiptText } from "lucide-react";

export default function OverviewBanner() {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex flex-wrap items-center gap-4 p-7">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-cyan-500/20">
          <ReceiptText size={32} className="text-cyan-500" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-9 text-blue-50">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-base text-slate-400">সকল অর্ডারের পেমেন্ট ও ডেলিভারি স্ট্যাটাস পরিচালনা করুন</p>
        </div>
      </div>
    </section>
  );
}
