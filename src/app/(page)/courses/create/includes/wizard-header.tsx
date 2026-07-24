import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";

const steps = [
  { step: 1, label: "মৌলিক তথ্য" },
  { step: 2, label: "কোর্স ম্যাটেরিয়াল" },
  { step: 3, label: "সাবজেক্ট ও FAQ" },
  { step: 4, label: "রিভিউ ও প্রকাশ" },
] as const;

type Props = {
  step: 1 | 2 | 3 | 4;
  title?: string;
  subtitle?: string;
  backHref?: string;
};

export default function WizardHeader({
  step,
  title = "নতুন কোর্স তৈরি করুন",
  subtitle = "ভিডিও, ফাইল ও কুইজসহ পূর্ণাঙ্গ কোর্স ৩ ধাপে সেট আপ করুন",
  backHref = "/courses",
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex items-center gap-4 p-7 pb-0">
        <Link
          href={backHref}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 text-blue-50"
        >
          <ArrowLeft size={16} />
        </Link>

        <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-white/10">
          <BookOpen size={32} className="text-white" strokeWidth={2} />
        </span>

        <div>
          <h1 className="text-2xl font-bold leading-9 text-blue-50">{title}</h1>
          <p className="mt-1 text-base text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-7">
        {steps.map(({ step: s, label }, index) => {
          const isActive = s === step;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex flex-1 items-center gap-2 rounded-xl border px-3.5 py-2 ${
                  isActive ? "border-blue-500 bg-white/10" : "border-slate-800 bg-slate-900"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive ? "bg-blue-500 text-white" : "bg-gray-800 text-slate-400"
                  }`}
                >
                  {s}
                </span>
                <span className={`text-base font-semibold ${isActive ? "text-white" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {index < steps.length - 1 && <ChevronRight size={16} className="shrink-0 text-slate-400" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
