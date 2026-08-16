"use client";

import { ClipboardList, Clock, Megaphone, Trophy } from "lucide-react";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import { useGetCourseSubjectsQuery } from "@/redux/api/courseSubjectsApi";
import type { ExamBasicInfo, ExamStatus } from "./types";

type Props = {
  value: ExamBasicInfo;
  onChange: (value: ExamBasicInfo) => void;
};

const statusOptions: { value: ExamStatus; label: string }[] = [
  { value: "draft", label: "ড্রাফট" },
  { value: "scheduled", label: "নির্ধারিত" },
  { value: "published", label: "প্রকাশিত" },
];

export default function StepBasicInfo({ value, onChange }: Props) {
  const { data: coursesData } = useGetCoursesQuery();
  const courses = coursesData?.results ?? [];

  const { data: courseSubjectsData } = useGetCourseSubjectsQuery(
    { course: Number(value.course) },
    { skip: !value.course }
  );
  const courseSubjects = courseSubjectsData?.results ?? [];

  const set = <K extends keyof ExamBasicInfo>(key: K, val: ExamBasicInfo[K]) => {
    onChange({ ...value, [key]: val });
  };

  const hasStart = Boolean(value.examDate && value.startTime);
  const hasDeadline = Boolean(value.deadline);
  const toBn = (s: string) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
  const fmtDeadline = (dt: string) => (dt ? toBn(dt.replace("T", " · ")) : "");

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex items-start gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
          <ClipboardList size={24} className="text-blue-500" />
        </span>
        <div>
          <h2 className="text-xl font-bold leading-8 text-blue-50">পরীক্ষার মৌলিক তথ্য</h2>
          <p className="mt-0.5 text-base text-slate-400">পরীক্ষার নাম, বিষয় এবং সময়সূচি নির্ধারণ করুন</p>
        </div>
      </div>

      <div className="pt-7">
        <label className="block pb-2 text-base font-medium text-blue-50">
          পরীক্ষার নাম<span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="যেমন: বাংলা মডেল টেস্ট - ১"
          className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">
          কোর্স<span className="text-red-600">*</span>
        </label>
        <select
          value={value.course}
          onChange={(e) => onChange({ ...value, course: e.target.value, subject: "", subjectName: "" })}
          className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3.5 text-base text-blue-50 focus:outline-none"
        >
          <option value="">নির্বাচন করুন</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">
            বিষয়<span className="text-red-600">*</span>
          </label>
          <select
            value={value.subject}
            disabled={!value.course}
            onChange={(e) => {
              const id = e.target.value;
              const name = courseSubjects.find((s) => String(s.id) === id)?.name ?? "";
              onChange({ ...value, subject: id, subjectName: name });
            }}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3.5 text-base text-blue-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">নির্বাচন করুন</option>
            {courseSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-sm text-slate-400">
            {value.course ? "নির্বাচিত কোর্সের বিষয়সমূহ" : "প্রথমে কোর্স নির্বাচন করুন"}
          </p>
        </div>

        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">
            সময় (মিনিট)<span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <Clock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              value={value.duration}
              onChange={(e) => set("duration", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 py-3 pl-10 pr-4 text-base text-blue-50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">মোট প্রশ্ন</label>
          <input
            type="number"
            value={value.totalQuestions}
            onChange={(e) => set("totalQuestions", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">পাস মার্ক (%)</label>
          <input
            type="number"
            value={value.passMark}
            onChange={(e) => set("passMark", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">নেগেটিভ মার্ক (প্রতি ভুলে)</label>
          <input
            type="number"
            step="0.01"
            value={value.negativeMark}
            onChange={(e) => set("negativeMark", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          />
          <p className="mt-1.5 text-sm text-slate-400">0 দিলে নেগেটিভ মার্কিং থাকবে না</p>
        </div>

        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">পরীক্ষার তারিখ</label>
          <input
            type="date"
            value={value.examDate}
            onChange={(e) => set("examDate", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">শুরু সময়</label>
          <input
            type="time"
            value={value.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
        </div>

        <div>
          <label className="block pb-2 text-base font-medium text-blue-50">শেষ সময় / ডেডলাইন (ঐচ্ছিক)</label>
          <input
            type="datetime-local"
            value={value.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
          />
          <p className="mt-1.5 text-sm text-slate-400">এই সময়ে পরীক্ষা সবার জন্য বন্ধ হবে। খালি রাখলে ডেডলাইন থাকবে না।</p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
          hasDeadline || hasStart
            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
            : "border-slate-700 bg-gray-800/40 text-slate-300"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <Clock size={16} className="mt-0.5 shrink-0" />
          {hasDeadline || hasStart ? (
            <div className="leading-6">
              <p className="m-0">
                <span className="font-semibold">খোলা:</span>{" "}
                {hasStart ? `${toBn(value.examDate)} · ${toBn(value.startTime)}` : "প্রকাশের পর সাথে সাথে"}
                {"  ·  "}
                <span className="font-semibold">বন্ধ:</span>{" "}
                {hasDeadline ? fmtDeadline(value.deadline) : "ডেডলাইন নেই"}
              </p>
              <p className="m-0 mt-1 text-cyan-100/80">
                শিক্ষার্থী পরীক্ষা শুরুর পর {toBn(value.duration || "0")} মিনিট সময় পাবে — তবে ডেডলাইন পার হলে পরীক্ষা তখনই বন্ধ হয়ে যাবে (তখন কম সময় পাবে)।
              </p>
            </div>
          ) : (
            <p className="m-0 leading-6">
              <span className="font-semibold">সময় নির্ধারণ করা হয়নি।</span> প্রকাশের পর পরীক্ষাটি যেকোনো সময় খোলা থাকবে। নির্দিষ্ট সময়ে সীমাবদ্ধ করতে শুরু সময় বা ডেডলাইন দিন।
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-gray-800/40 p-5">
        <p className="text-base font-semibold text-blue-50">ফলাফল ও লিডারবোর্ড প্রকাশের সময়সূচি</p>
        <p className="mt-0.5 text-sm text-slate-400">কখন ফলাফল ও লিডারবোর্ড শিক্ষার্থীদের কাছে প্রকাশিত হবে তা নির্ধারণ করুন</p>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 pb-2 text-base font-medium text-blue-50">
              <Megaphone size={16} className="text-cyan-500" />
              ফলাফল প্রকাশের সময়
            </label>
            <input
              type="datetime-local"
              value={value.resultPublishAt}
              onChange={(e) => set("resultPublishAt", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            />
            <p className="mt-1.5 text-sm text-slate-400">খালি রাখলে ফলাফল ম্যানুয়ালি প্রকাশ করতে হবে</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 pb-2 text-base font-medium text-blue-50">
              <Trophy size={16} className="text-amber-500" />
              লিডারবোর্ড প্রকাশের সময়
            </label>
            <input
              type="datetime-local"
              value={value.leaderboardPublishAt}
              onChange={(e) => set("leaderboardPublishAt", e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
            />
            <p className="mt-1.5 text-sm text-slate-400">খালি রাখলে লিডারবোর্ড ম্যানুয়ালি প্রকাশ করতে হবে</p>
          </div>
        </div>
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">পরীক্ষার বিবরণ</label>
        <textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="শিক্ষার্থীদের জন্য সংক্ষিপ্ত নির্দেশনা..."
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">পরীক্ষার অবস্থা</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => set("status", v)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold ${
                value.status === v
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-slate-800 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
