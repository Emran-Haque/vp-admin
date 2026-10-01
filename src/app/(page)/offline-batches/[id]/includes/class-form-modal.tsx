"use client";

import { useState } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import {
  useCreateClassMutation,
  useUpdateClassMutation,
  type CourseClass,
} from "@/redux/api/classesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { extractErrorMessage } from "@/lib/api-error";

const inputClass =
  "w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none";
const dateInputClass = `${inputClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70`;

/** Add or edit one class on an offline batch's routine. */
export default function ClassFormModal({
  courseId,
  editItem,
  onClose,
}: {
  courseId: number;
  editItem?: CourseClass;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [subjectId, setSubjectId] = useState(editItem?.subject ? String(editItem.subject) : "");
  const [classDate, setClassDate] = useState(editItem?.class_date ?? "");
  const [startTime, setStartTime] = useState(editItem?.start_time?.slice(0, 5) ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: subjectsData } = useGetCourseSubjectsQuery({ course: courseId });
  const subjects = subjectsData?.results ?? [];
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();
  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    setError(null);
    const data = {
      course: courseId,
      title: title.trim(),
      // "" clears the subject; the API treats an empty relation as none.
      subject: subjectId,
      class_date: classDate || undefined,
      start_time: startTime || undefined,
    };
    try {
      if (editItem) {
        await updateClass({ id: editItem.id, data }).unwrap();
      } else {
        await createClass(data).unwrap();
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[520px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">
            {editItem ? "ক্লাস এডিট" : "নতুন ক্লাস"}
          </h2>
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
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">ক্লাসের নাম</label>
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ক্লাস ১২ — বাংলা ১ম পত্র"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয় (ঐচ্ছিক)</label>
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

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">তারিখ</label>
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className={dateInputClass}
              />
            </div>
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">সময় (ঐচ্ছিক)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={dateInputClass}
              />
            </div>
          </div>

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
              disabled={isSaving || !title.trim()}
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
