"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Video,
  HelpCircle,
  ClipboardList,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useGetCourseCategoriesQuery, type Course } from "@/redux/api/coursesApi";

const levelLabels: Record<string, string> = {
  beginner: "শুরুর স্তর",
  intermediate: "মধ্যম স্তর",
  advanced: "উচ্চ স্তর",
};

function StatChip({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <Icon size={15} className="shrink-0 text-blue-300" />
      <div className="leading-none">
        <div className="text-base font-bold text-white">{value}</div>
        <div className="mt-0.5 text-[10px] text-slate-400">{label}</div>
      </div>
    </div>
  );
}

export default function CourseDetailsHeader({
  course,
  subjectCount,
}: {
  course: Course;
  subjectCount: number;
}) {
  const { data: categoriesData } = useGetCourseCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];
  const categoryName = categories.find((c) => c.id === course.category)?.name;

  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "ক্লাস", value: course.total_classes, icon: Video },
    { label: "কুইজ", value: course.total_quizzes, icon: HelpCircle },
    { label: "অ্যাসাইনমেন্ট", value: course.total_assignments, icon: ClipboardList },
    { label: "বিষয়", value: subjectCount, icon: GraduationCap },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            কোর্সসমূহ
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-slate-900">
                {categoryName}
              </span>
            )}
            {course.level && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-400">
                {levelLabels[course.level] ?? course.level}
              </span>
            )}
          </div>

          <h1 className="mt-2 text-xl font-bold leading-snug text-white sm:text-2xl">
            {course.title}
          </h1>
          {course.short_description && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-300">
              {course.short_description}
            </p>
          )}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          {stats.map((s) => (
            <StatChip key={s.label} icon={s.icon} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
