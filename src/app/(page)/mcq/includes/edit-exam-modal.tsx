"use client";

import { useState } from "react";
import { X, Save, AlertTriangle, Clock } from "lucide-react";
import { useUpdateExamMutation, type Exam } from "@/redux/api/examsApi";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import { combineDateTime, addMinutes, formatTimeOfDay, isoToTimeInput } from "@/lib/exam-datetime";

export default function EditExamModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const [title, setTitle] = useState(exam.title);
  const [course, setCourse] = useState(String(exam.course));
  const [subject, setSubject] = useState(exam.subject != null ? String(exam.subject) : "");
  const [duration, setDuration] = useState(exam.duration_minutes);
  const [passMark, setPassMark] = useState(exam.pass_mark_percentage);
  const [negativeMark, setNegativeMark] = useState(exam.negative_mark_per_wrong);
  const [examDate, setExamDate] = useState(exam.exam_date);
  const [startTime, setStartTime] = useState(isoToTimeInput(exam.start_time));
  const [instructions, setInstructions] = useState(exam.instructions);

  const { data: coursesData } = useGetCoursesQuery();
  const courses = coursesData?.results ?? [];

  const { data: courseSubjectsData } = useGetCourseSubjectsQuery({ course: Number(course) }, { skip: !course });
  const courseSubjects = courseSubjectsData?.results ?? [];

  const [updateExam, { isLoading, isError }] = useUpdateExamMutation();

  const endTimePreview = formatTimeOfDay(addMinutes(combineDateTime(examDate, startTime), Number(duration) || 0));

  const handleSave = async () => {
    const startDateTime = combineDateTime(examDate, startTime);
    const endDateTime = addMinutes(startDateTime, Number(duration) || 0);

    try {
      await updateExam({
        id: exam.id,
        data: {
          title,
          course: Number(course),
          subject: subject ? Number(subject) : null,
          duration_minutes: Number(duration),
          pass_mark_percentage: passMark,
          negative_mark_per_wrong: negativeMark,
          exam_date: examDate,
          start_time: startDateTime,
          end_time: endDateTime,
          instructions,
        },
      }).unwrap();
      onClose();
    } catch {
      // error state shown inline below
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/95 p-4">
      <div className="w-full max-w-[560px] rounded-[20px] border border-white/5 bg-gray-900/75 p-7 shadow-[0px_15px_30px_0px_rgba(59,130,246,0.46)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-50">পরীক্ষা সম্পাদনা করুন</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pt-6">
          {isError && (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/5 p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">পরীক্ষা সংরক্ষণ করা যায়নি। API সার্ভার সংযোগ পরীক্ষা করুন।</p>
            </div>
          )}

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">পরীক্ষার নাম</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: বাংলা মডেল টেস্ট - ১"
              className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">কোর্স</label>
              <select
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setSubject("");
                }}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-800 text-slate-200">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">বিষয়</label>
              <select
                value={subject}
                disabled={!course}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" className="bg-slate-800 text-slate-200">
                  নির্বাচন করুন
                </option>
                {courseSubjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-800 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">সময় (মিনিট)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পাস মার্ক (%)</label>
              <input
                type="text"
                value={passMark}
                onChange={(e) => setPassMark(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">নেগেটিভ মার্ক</label>
              <input
                type="text"
                value={negativeMark}
                onChange={(e) => setNegativeMark(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">পরীক্ষার তারিখ</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">শুরু সময়</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>

            <div>
              <label className="block pb-1.5 text-xs font-semibold text-slate-400">শেষ সময় (স্বয়ংক্রিয়)</label>
              <div className="flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-400">
                <Clock size={14} />
                {endTimePreview}
              </div>
            </div>
          </div>

          <div>
            <label className="block pb-1.5 text-xs font-semibold text-slate-400">নির্দেশনা</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="শিক্ষার্থীদের জন্য সংক্ষিপ্ত নির্দেশনা..."
              rows={3}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-200/50 focus:outline-none"
            />
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
