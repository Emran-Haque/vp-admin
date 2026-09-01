import Link from "next/link";
import { ArrowLeft, ClipboardList, ListChecks, Eye, Check } from "lucide-react";
import type { ExamStatus } from "./types";

const steps = [
  { step: 1, label: "বেসিক ইনফো", icon: ClipboardList },
  { step: 2, label: "প্রশ্ন অ্যাড", icon: ListChecks },
  { step: 3, label: "রিভিউ ও পাবলিশ", icon: Eye },
] as const;

const statusLabel: Record<ExamStatus, string> = {
  draft: "ড্রাফট",
  scheduled: "শিডিউলড",
  published: "পাবলিশড",
};

type Props = {
  step: 1 | 2 | 3;
  status: ExamStatus;
  title?: string;
  subtitle?: string;
  backHref?: string;
  /** Pass this to make the three step cards clickable. Left out, they stay
   *  read-only indicators — which is what a wizard with required steps wants. */
  onStepChange?: (step: 1 | 2 | 3) => void;
};

export default function WizardHeader({
  step,
  status,
  title = "নতুন পরীক্ষা অ্যাড করুন",
  subtitle = "ধাপে ধাপে পরীক্ষার ইনফো, প্রশ্ন আর পাবলিশ সেটিংস ঠিক করুন",
  backHref = "/mcq",
  onStepChange,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />

      <div className="flex items-start justify-between gap-4 p-7 pb-0">
        <div className="flex items-start gap-4">
          <Link
            href={backHref}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 text-blue-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold leading-9 text-blue-50">{title}</h1>
            <p className="mt-1 text-base text-slate-400">{subtitle}</p>
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
          // A button only when it does something — a non-interactive <button>
          // would still take keyboard focus and read as clickable.
          const Card = onStepChange ? "button" : "div";
          return (
            <div key={s} className="flex flex-1 items-center gap-2">
              <Card
                aria-current={isActive ? "step" : undefined}
                className={`flex flex-1 items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition ${
                  isActive
                    ? "border-blue-500 bg-cyan-500/10"
                    : isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900"
                } ${onStepChange ? "cursor-pointer hover:border-blue-500/60 hover:bg-white/[0.04]" : ""}`}
                {...(onStepChange
                  ? { onClick: () => onStepChange(s), type: "button" as const }
                  : {})}
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
              </Card>
              {index < steps.length - 1 && <div className="h-px w-6 shrink-0 bg-slate-800" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
