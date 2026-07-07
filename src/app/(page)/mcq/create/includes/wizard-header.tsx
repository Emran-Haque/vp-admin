import Link from "next/link";
import { ArrowLeft, ClipboardList, ListChecks, Eye, Check } from "lucide-react";
import type { ExamStatus } from "./types";

const steps = [
  { step: 1, label: "মৌলিক তথ্য", icon: ClipboardList },
  { step: 2, label: "প্রশ্ন যোগ করুন", icon: ListChecks },
  { step: 3, label: "রিভিউ ও প্রকাশ", icon: Eye },
] as const;

const statusLabel: Record<ExamStatus, string> = {
  draft: "ড্রাফট",
  scheduled: "নির্ধারিত",
  published: "প্রকাশিত",
};

export default function WizardHeader({ step, status }: { step: 1 | 2 | 3; status: ExamStatus }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex items-start justify-between gap-4 p-7 pb-0">
        <div className="flex items-start gap-4">
          <Link
            href="/mcq"
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 text-blue-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">নতুন পরীক্ষা যোগ করুন</h1>
            <p className="mt-1 text-base text-slate-400">
              ধাপে ধাপে MCQ পরীক্ষার বিস্তারিত, প্রশ্ন এবং প্রকাশনার সেটিংস তৈরি করুন
            </p>
          </div>
        </div>

        <span className="rounded-full border border-slate-400/30 bg-gray-800/30 px-3.5 py-1.5 text-sm font-semibold text-slate-400">
          {statusLabel[status]}
        </span>
      </div>

      <div className="flex items-center gap-2 p-7">
        {steps.map(({ step: s, label, icon: Icon }, index) => {
          const isActive = s === step;
          const isCompleted = s < step;
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex flex-1 items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${
                  isActive
                    ? "border-blue-500 bg-cyan-500/10"
                    : isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? "bg-blue-500" : isCompleted ? "bg-emerald-500" : "bg-gray-800"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-gray-950" />
                  ) : (
                    <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  )}
                </span>
                <div>
                  <p
                    className={`text-xs uppercase tracking-wide opacity-70 ${
                      isActive ? "text-white" : isCompleted ? "text-emerald-500" : "text-slate-400"
                    }`}
                  >
                    ধাপ {s}
                  </p>
                  <p
                    className={`text-base font-semibold ${
                      isActive ? "text-white" : isCompleted ? "text-emerald-500" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && <div className="h-px w-6 shrink-0 bg-slate-800" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
