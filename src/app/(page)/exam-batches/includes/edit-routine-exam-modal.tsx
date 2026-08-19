"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, X } from "lucide-react";
import {
  useUpdateExamMutation,
  useUpdateBatchExamMutation,
  type ExamBatchExam,
} from "@/redux/api/examsApi";
import {
  combineDateTime,
  localDateTimeToIso,
  isoToTimeInput,
  isoToLocalDateTimeInput,
} from "@/lib/exam-datetime";
import { extractErrorMessage } from "@/lib/api-error";

const fieldClass =
  "w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40";

const dateClass = `${fieldClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70`;

/** Edit a routine tile: updates the exam schedule + the routine row metadata
 *  (subject label, planned questions). Questions stay in the MCQ editor. */
export default function EditRoutineExamModal({
  item,
  onClose,
  onSaved,
}: {
  item: ExamBatchExam;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(item.exam_title);
  const [subject, setSubject] = useState(item.subject_label);
  const [date, setDate] = useState(item.exam_date ?? "");
  const [startTime, setStartTime] = useState(isoToTimeInput(item.start_time));
  const [deadline, setDeadline] = useState(isoToLocalDateTimeInput(item.end_time));
  const [duration, setDuration] = useState(String(item.duration_minutes));
  const [mark, setMark] = useState(item.marks_per_question);
  const [numQuestions, setNumQuestions] = useState(String(item.planned_questions));
  const [negativeMark, setNegativeMark] = useState(item.negative_mark_per_wrong);
  const [error, setError] = useState<string | null>(null);
  const [updateExam, { isLoading: savingExam }] = useUpdateExamMutation();
  const [updateBatchExam, { isLoading: savingLink }] = useUpdateBatchExamMutation();
  const isLoading = savingExam || savingLink;

  const save = async () => {
    if (!title.trim()) return;
    setError(null);
    try {
      await updateExam({
        id: item.exam,
        data: {
          title: title.trim(),
          exam_date: date || null,
          start_time: date && startTime ? combineDateTime(date, startTime) ?? null : null,
          end_time: deadline ? localDateTimeToIso(deadline) ?? null : null,
          duration_minutes: Number(duration) || 30,
          marks_per_question: mark || "1",
          negative_mark_per_wrong: negativeMark || "0",
        },
      }).unwrap();
      await updateBatchExam({
        id: item.id,
        batch: item.batch,
        data: { subject_label: subject.trim(), planned_questions: Number(numQuestions) || 0 },
      }).unwrap();
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-blue-50">
            <CalendarClock size={18} className="text-cyan-400" /> রুটিন সম্পাদনা করুন
          </h3>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">পরীক্ষার নাম *</label>
            <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">বিষয়</label>
            <input className={fieldClass} placeholder="যেমন: পদার্থবিজ্ঞান" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">তারিখ</label>
              <input className={dateClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">শুরু সময়</label>
              <input className={dateClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">শেষ সময় / ডেডলাইন</label>
              <input className={dateClass} type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">সময় (মিনিট)</label>
              <input className={fieldClass} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">প্রশ্ন সংখ্যা</label>
              <input className={fieldClass} type="number" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} />
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
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-800 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5">
            বাতিল
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isLoading || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
