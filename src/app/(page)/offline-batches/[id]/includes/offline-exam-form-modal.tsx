"use client";

import { useState } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import {
  useCreateOfflineExamMutation,
  useUpdateOfflineExamMutation,
  type ClassQuiz,
} from "@/redux/api/examsApi";
import type { CourseClass } from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { extractErrorMessage } from "@/lib/api-error";

const inputClass =
  "w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none";
const dateInputClass = `${inputClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70`;

/** Strip trailing zeros: "30.00" → "30", "0.25" stays. */
function plain(value: string | undefined | null, fallback: string) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : fallback;
}

/**
 * Add or edit a paper exam under one class.
 *
 * Full marks are typed here (there are no questions to add them up), and the
 * negative mark is what one wrong answer costs: final = obtained − wrong × it.
 */
export default function OfflineExamFormModal({
  courseId,
  courseClass,
  editItem,
  onClose,
}: {
  courseId: number;
  courseClass: CourseClass;
  editItem?: ClassQuiz;
  onClose: () => void;
}) {
  const classSubject = courseClass.subject ? String(courseClass.subject) : "";
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [subjectId, setSubjectId] = useState(
    editItem ? (editItem.subject ? String(editItem.subject) : "") : classSubject,
  );
  const [examDate, setExamDate] = useState(editItem?.exam_date ?? courseClass.class_date ?? "");
  const [totalMarks, setTotalMarks] = useState(plain(editItem?.total_marks, ""));
  const [negative, setNegative] = useState(plain(editItem?.negative_mark_per_wrong, "0"));
  const [passMark, setPassMark] = useState(plain(editItem?.pass_mark_percentage, "33"));
  const [error, setError] = useState<string | null>(null);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];
  const [createExam, { isLoading: isCreating }] = useCreateOfflineExamMutation();
  const [updateExam, { isLoading: isUpdating }] = useUpdateOfflineExamMutation();
  const isSaving = isCreating || isUpdating;

  const total = Number(totalMarks);
  const negativeValue = Number(negative || "0");
  const pass = Number(passMark || "0");
  const formError = !title.trim()
    ? "পরীক্ষার নাম দিন।"
    : !(total > 0)
      ? "পূর্ণমান ০-এর বেশি দিন।"
      : !(negativeValue >= 0)
        ? "ভুলে কাটা নম্বর ০ বা তার বেশি দিন।"
        : !(pass >= 0 && pass <= 100)
          ? "পাস নম্বর ০ থেকে ১০০% এর মধ্যে দিন।"
          : null;

  const handleSave = async () => {
    setError(null);
    if (formError) {
      setError(formError);
      return;
    }
    const data = {
      title: title.trim(),
      subject: subjectId ? Number(subjectId) : null,
      exam_date: examDate || null,
      total_marks: String(total),
      negative_mark_per_wrong: String(negativeValue),
      pass_mark_percentage: String(pass),
      course_class: courseClass.id,
    };
    try {
      if (editItem) {
        await updateExam({ id: editItem.id, data }).unwrap();
      } else {
        await createExam({ ...data, course: courseId, mode: "offline" }).unwrap();
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-50">
              {editItem ? "পরীক্ষা এডিট" : "নতুন অফলাইন পরীক্ষা"}
            </h2>
            <p className="pt-0.5 text-xs text-slate-400">{courseClass.title}</p>
          </div>
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
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: বাংলা ডেইলি টেস্ট ১২"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={inputClass}
              >
                <option value="">বিষয় ছাড়া</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">তারিখ</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={dateInputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পূর্ণমান</label>
              <input
                type="number"
                min={0}
                step="any"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="৩০"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">প্রতি ভুলে কাটা</label>
              <input
                type="number"
                min={0}
                step="any"
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পাস (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="any"
                value={passMark}
                onChange={(e) => setPassMark(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            চূড়ান্ত নম্বর = প্রাপ্ত নম্বর − (ভুল উত্তর × প্রতি ভুলে কাটা)। ভুলে কাটা ০ রাখলে ভুল উত্তর
            শুধু দেখানো হবে, নম্বর কাটবে না।
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
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
