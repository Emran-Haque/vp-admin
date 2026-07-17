"use client";

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { useCreateExamMutation } from "@/redux/api/examsApi";
import { extractErrorMessage } from "@/lib/api-error";

export default function AddExamModal({ courseId, onClose }: { courseId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createExam, { isLoading }] = useCreateExamMutation();

  const handleSave = async () => {
    setError(null);
    try {
      await createExam({
        course: courseId,
        title,
        duration_minutes: Number(durationMinutes) || 0,
        exam_date: examDate,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">MCQ পরীক্ষা যোগ করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 pt-6">
          {error && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">পরীক্ষার নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: মডেল টেস্ট - ১"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">সময় (মিনিট)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">তারিখ</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            পরীক্ষা তৈরির পর প্রশ্ন যোগ করতে ও প্রকাশ করতে &quot;MCQ পরীক্ষা&quot; পেজে যান।
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[10px] border border-slate-400/20 bg-slate-400/5 px-4 py-2 text-xs font-bold text-slate-400"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || !title.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-[0px_4px_12px_0px_rgba(0,200,150,0.19)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isLoading ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
