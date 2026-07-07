"use client";

import { ClipboardList, Clock } from "lucide-react";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import type { ExamBasicInfo, ExamStatus } from "./types";

type Props = {
  value: ExamBasicInfo;
  onChange: (value: ExamBasicInfo) => void;
};

const subjects = ["বাংলা", "ইংরেজি", "গণিত", "সাধারণ জ্ঞান", "বিজ্ঞান"];

const statusOptions: { value: ExamStatus; label: string }[] = [
  { value: "draft", label: "ড্রাফট" },
  { value: "scheduled", label: "নির্ধারিত" },
  { value: "published", label: "প্রকাশিত" },
];

export default function StepBasicInfo({ value, onChange }: Props) {
  const { data: coursesData } = useGetCoursesQuery();
  const courses = coursesData?.results ?? [];

  const set = <K extends keyof ExamBasicInfo>(key: K, val: ExamBasicInfo[K]) => {
    onChange({ ...value, [key]: val });
  };

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
          onChange={(e) => set("course", e.target.value)}
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
            onChange={(e) => set("subject", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3.5 text-base text-blue-50 focus:outline-none"
          >
            <option value="">নির্বাচন করুন</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
            className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-6">
        <label className="block pb-2 text-base font-medium text-blue-50">শুরু সময়</label>
        <input
          type="time"
          value={value.startTime}
          onChange={(e) => set("startTime", e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-gray-800 px-4 py-3 text-base text-blue-50 focus:outline-none sm:w-1/2"
        />
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
