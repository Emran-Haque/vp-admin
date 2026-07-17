"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useGetCourseCategoriesQuery, type Course } from "@/redux/api/coursesApi";

const levelLabels: Record<string, string> = {
  beginner: "শুরুর স্তর",
  intermediate: "মধ্যম স্তর",
  advanced: "উচ্চ স্তর",
};

export default function CourseDetailsHeader({ course }: { course: Course }) {
  const { data: categoriesData } = useGetCourseCategoriesQuery();
  const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData?.results ?? [];
  const categoryName = categories.find((c) => c.id === course.category)?.name;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
      >
        <ArrowLeft size={16} />
        কোর্সসমূহ
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {categoryName && (
          <span className="rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-slate-900">
            {categoryName}
          </span>
        )}
        {course.level && (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            {levelLabels[course.level] ?? course.level}
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{course.title}</h1>
      {course.short_description && (
        <p className="mt-1 text-sm text-slate-300">{course.short_description}</p>
      )}
    </section>
  );
}
