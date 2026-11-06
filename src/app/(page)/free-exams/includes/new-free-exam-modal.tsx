"use client";

import { useState } from "react";
import { AlertTriangle, Gift, X } from "lucide-react";
import {
  useCreateExamBatchMutation,
  useImportRoutineMutation,
  useLazyGetExamBatchQuery,
  usePublishExamResultMutation,
  type ExamBatch,
} from "@/redux/api/examsApi";
import { localDateTimeToIso } from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";
import { ResultTimingFields, resultTimingPayload, type ResultTiming } from "./result-timing";

/** The one hidden-from-admin batch every "নতুন ফ্রি পরীক্ষা" goes into.
 *  Students are joined to it automatically, so its exams simply appear. */
export const FREE_EXAMS_BATCH_TITLE = "ফ্রি পরীক্ষা";

const fieldClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
const dateClass = `${fieldClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70`;

/**
 * Step 1 of the free-exam flow: name + time + marks. Saving creates a draft
 * exam (0 questions) and hands off to the question editor (step 2), whose
 * "সংরক্ষণ করে প্রকাশ করুন" button is step 3.
 */
export default function NewFreeExamModal({
  freeBatch,
  onClose,
  onCreated,
}: {
  /** The existing ফ্রি পরীক্ষা batch, or null to create it on first use. */
  freeBatch: ExamBatch | null;
  onClose: () => void;
  onCreated: (exam: { id: number; title: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [mark, setMark] = useState("1");
  const [negativeMark, setNegativeMark] = useState("0");
  const [resultTiming, setResultTiming] = useState<ResultTiming>("instant");
  const [resultAt, setResultAt] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createBatch] = useCreateExamBatchMutation();
  const [importRoutine] = useImportRoutineMutation();
  const [loadBatch] = useLazyGetExamBatchQuery();
  const [publishResult] = usePublishExamResultMutation();

  const save = async () => {
    if (!title.trim() || busy) return;
    if (start && end && new Date(end) <= new Date(start)) {
      setError("পরীক্ষা শেষের সময় শুরুর পরে হতে হবে।");
      return;
    }
    if (resultTiming === "scheduled" && !resultAt) {
      setError("রেজাল্ট প্রকাশের তারিখ ও সময় দিন।");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const batch =
        freeBatch ??
        (await createBatch({
          title: FREE_EXAMS_BATCH_TITLE,
          short_description: "সবার জন্য ফ্রি MCQ পরীক্ষা",
          price: "0.00",
          is_published: true,
        }).unwrap());
      const startIso = start ? localDateTimeToIso(start) ?? null : null;
      const before = new Set(batch.exams?.map((row) => row.exam) ?? []);
      await importRoutine({
        batchId: batch.id,
        publish: false,
        exams: [
          {
            title: title.trim(),
            subject_label: "",
            exam_date: startIso ? start.slice(0, 10) : null,
            start_time: startIso,
            end_time: end ? localDateTimeToIso(end) ?? null : null,
            duration_minutes: Number(duration) || 30,
            marks_per_question: mark || "1",
            planned_questions: 0,
            negative_mark_per_wrong: negativeMark || "0",
            questions: [],
          },
        ],
      }).unwrap();
      // The import's reply lists the batch's exams as they were *before* the
      // import, so read the batch again to find the new one.
      const updated = await loadBatch(batch.id, false).unwrap();
      const created = [...(updated.exams ?? [])]
        .filter((row) => !before.has(row.exam))
        .sort((a, b) => b.exam - a.exam)[0];
      if (!created) throw new Error("পরীক্ষা তৈরি হয়েছে, কিন্তু তালিকায় পাওয়া যায়নি। পেজ রিফ্রেশ করুন।");
      const resultPayload = resultTimingPayload(resultTiming, resultAt);
      if (resultPayload?.result_publish_at) {
        await publishResult({ id: created.exam, data: resultPayload }).unwrap();
      }
      onCreated({ id: created.exam, title: created.exam_title });
    } catch (err) {
      setError(extractErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-blue-50">
            <Gift size={18} className="text-emerald-400" /> নতুন ফ্রি পরীক্ষা
          </h3>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">পরীক্ষার নাম *</label>
            <input className={fieldClass} placeholder="যেমন: ফ্রি মডেল টেস্ট - ১" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-2 max-[480px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">সময় (মিনিট)</label>
              <input className={fieldClass} type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">প্রতি প্রশ্নের নম্বর</label>
              <input className={fieldClass} type="number" step="0.01" value={mark} onChange={(e) => setMark(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">নেগেটিভ মার্ক</label>
              <input className={fieldClass} type="number" step="0.01" value={negativeMark} onChange={(e) => setNegativeMark(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 max-[480px]:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">পরীক্ষা শুরু (ঐচ্ছিক)</label>
                <input className={dateClass} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">পরীক্ষা শেষ (ঐচ্ছিক)</label>
                <input className={dateClass} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">খালি রাখলে প্রকাশের পর যেকোনো সময় পরীক্ষা দেওয়া যাবে।</p>
          </div>

          <ResultTimingFields timing={resultTiming} at={resultAt} onTiming={setResultTiming} onAt={setResultAt} />
          {(start || end) && resultTiming === "instant" ? (
            <p className="text-xs text-amber-300">
              লাইভ পরীক্ষায় সাথে সাথে রেজাল্ট দেখালে আগে শেষ করা শিক্ষার্থী সঠিক উত্তর অন্যদের জানিয়ে দিতে পারে।
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-800">
            বাতিল
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!title.trim() || busy}
            className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "তৈরি হচ্ছে…" : "সেভ করে প্রশ্ন যোগ করুন ›"}
          </button>
        </div>
      </div>
    </div>
  );
}
