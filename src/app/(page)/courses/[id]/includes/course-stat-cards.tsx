"use client";

import { Video, HelpCircle, ClipboardList, GraduationCap, type LucideIcon } from "lucide-react";
import type { Course } from "@/redux/api/coursesApi";

export default function CourseStatCards({ course, subjectCount }: { course: Course; subjectCount: number }) {
  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "ক্লাস", value: course.total_classes, icon: Video },
    { label: "কুইজ", value: course.total_quizzes, icon: HelpCircle },
    { label: "অ্যাসাইনমেন্ট", value: course.total_assignments, icon: ClipboardList },
    { label: "বিষয়", value: subjectCount, icon: GraduationCap },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Icon size={14} />
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-50">{value}</div>
        </div>
      ))}
    </section>
  );
}
