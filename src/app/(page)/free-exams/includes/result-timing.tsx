"use client";

import { useState } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";
import { usePublishExamResultMutation } from "@/redux/api/examsApi";
import { isoToLocalDateTimeInput, localDateTimeToIso } from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";

export type ResultTiming = "instant" | "scheduled" | "manual";

const dateClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70";

/** The publish-result body for a choice (null = leave the result hidden). */
export function resultTimingPayload(timing: ResultTiming, at: string): { result_publish_at: string | null } | null {
  // A publish time of "now" opens each result the moment it is submitted,
  // without the immediate-publish side effects (notification, SMS draft).
  if (timing === "instant") return { result_publish_at: new Date().toISOString() };
  if (timing === "scheduled") return { result_publish_at: localDateTimeToIso(at) ?? null };
  return { result_publish_at: null };
}

/** Human label for a free exam's current result setting. */
export function resultTimingLabel(row: {
  result_status: string;
  result_publish_at: string | null;
  is_result_published: boolean;
}): { text: string; open: boolean } {
  if (row.result_status === "published") return { text: "রেজাল্ট প্রকাশিত", open: true };
  if (row.result_publish_at) {
    const at = new Date(row.result_publish_at);
    if (at.getTime() <= Date.now()) return { text: "রেজাল্ট: সাবমিটের সাথে সাথে", open: true };
    return {
      text: `রেজাল্ট: ${at.toLocaleString("bn-BD", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}`,
      open: false,
    };
  }
  return { text: "রেজাল্ট লুকানো — সময় দেওয়া নেই", open: false };
}

/** Three-way choice: instantly / at a time / later by hand. */
export function ResultTimingFields({
  timing,
  at,
  onTiming,
  onAt,
}: {
  timing: ResultTiming;
  at: string;
  onTiming: (value: ResultTiming) => void;
  onAt: (value: string) => void;
}) {
  const options: { value: ResultTiming; title: string; hint: string }[] = [
    { value: "instant", title: "সাবমিটের সাথে সাথে", hint: "জমা দিলেই নম্বর, সঠিক-ভুল উত্তর ও পজিশন দেখবে" },
    { value: "scheduled", title: "নির্দিষ্ট সময়ে", hint: "যেমন পরীক্ষা শেষ হওয়ার পরে — সবাই একসাথে দেখবে" },
    { value: "manual", title: "পরে আমি নিজে প্রকাশ করব", hint: "তালিকা থেকে \"রেজাল্ট প্রকাশ\" চাপলে দেখা যাবে" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-400">শিক্ষার্থী রেজাল্ট কখন দেখবে?</p>
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
            timing === option.value ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800 bg-slate-950/40"
          }`}
        >
          <input
            type="radio"
            name="result-timing"
            className="mt-0.5 size-4 accent-emerald-500"
            checked={timing === option.value}
            onChange={() => onTiming(option.value)}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-blue-50">{option.title}</span>
            <span className="mt-0.5 block text-xs text-slate-400">{option.hint}</span>
            {option.value === "scheduled" && timing === "scheduled" ? (
              <input className={`${dateClass} mt-2`} type="datetime-local" value={at} onChange={(e) => onAt(e.target.value)} />
            ) : null}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Which of the three choices an exam's saved result setting matches. */
function currentTiming(exam: { result_status: string; result_publish_at: string | null }): ResultTiming {
  if (exam.result_status === "published") return "instant";
  if (!exam.result_publish_at) return "manual";
  return new Date(exam.result_publish_at).getTime() <= Date.now() ? "instant" : "scheduled";
}

/** Change an existing free exam's result time from the list. */
export function ResultTimingModal({
  exam,
  onClose,
  onSaved,
}: {
  exam: { id: number; title: string; result_status: string; result_publish_at: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [timing, setTiming] = useState<ResultTiming>(() => currentTiming(exam));
  const [at, setAt] = useState(() =>
    currentTiming(exam) === "scheduled" ? isoToLocalDateTimeInput(exam.result_publish_at) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [publishResult, { isLoading }] = usePublishExamResultMutation();

  const save = async () => {
    if (timing === "scheduled" && !at) {
      setError("রেজাল্ট প্রকাশের তারিখ ও সময় দিন।");
      return;
    }
    setError(null);
    try {
      const payload = resultTimingPayload(timing, at);
      if (payload) await publishResult({ id: exam.id, data: payload }).unwrap();
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="flex min-w-0 items-center gap-2 text-base font-bold text-blue-50">
            <Clock size={18} className="shrink-0 text-emerald-400" />
            <span className="truncate">রেজাল্টের সময় — {exam.title}</span>
          </h3>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : null}
          <ResultTimingFields timing={timing} at={at} onTiming={setTiming} onAt={setAt} />
          {exam.result_status === "published" && timing === "scheduled" ? (
            <p className="text-xs text-amber-300">রেজাল্ট এখন খোলা আছে — সেভ করলে ওই সময় পর্যন্ত আবার লুকিয়ে যাবে।</p>
          ) : null}
          {exam.result_status === "published" && timing === "manual" ? (
            <p className="text-xs text-amber-300">রেজাল্ট আগেই প্রকাশ করা হয়েছে, তাই এটা আর লুকাবে না।</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-800">
            বাতিল
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isLoading}
            className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isLoading ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
