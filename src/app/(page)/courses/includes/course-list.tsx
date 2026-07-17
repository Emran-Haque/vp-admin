"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Video, HelpCircle, ClipboardList, Users, Clock, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { useGetCoursesQuery, useDeleteCourseMutation, type Course } from "@/redux/api/coursesApi";
import { usePermissions } from "@/hooks/use-permissions";

const statusStyles = {
  published: { label: "প্রকাশিত", className: "bg-white text-blue-500 outline-emerald-500/40" },
  draft: { label: "ড্রাফট", className: "bg-amber-500/10 text-amber-500 outline-amber-500/40" },
};

const statBoxes: { key: keyof Course; label: string; icon: LucideIcon }[] = [
  { key: "total_classes", label: "ক্লাস", icon: Video },
  { key: "total_quizzes", label: "কুইজ", icon: HelpCircle },
  { key: "total_assignments", label: "অ্যাসাইনমেন্ট", icon: ClipboardList },
  { key: "enrollment_count", label: "ছাত্র", icon: Users },
];

export default function CourseList() {
  const { data, isLoading, isError } = useGetCoursesQuery();
  const [deleteCourse] = useDeleteCourseMutation();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500">
        কোর্সের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
    );
  }

  const courses = data?.results ?? [];

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {courses.map((course) => {
        const status = statusStyles[course.is_published ? "published" : "draft"];
        return (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] transition-colors duration-200 hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
                <BookOpen size={28} className="text-blue-500" strokeWidth={2} />
              </span>
              <span
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold outline outline-1 outline-offset-[-1px] ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="pt-4">
              <p className="text-xl font-semibold leading-8 text-blue-50">{course.title}</p>
              <p className="mt-1 text-base text-white">{course.short_description}</p>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {statBoxes.map(({ key, label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-slate-800 bg-gray-900/50 p-2"
                >
                  <Icon size={16} className="text-blue-500" />
                  <span className="text-base font-bold text-blue-50">{course[key] as number}</span>
                  <span className="text-[10px] text-white">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm text-white">
                <Clock size={16} />
                {course.duration || "—"}
              </span>
              <div className="flex items-center gap-2">
                {hasPermission("can_edit_course") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/courses/${course.id}/edit`);
                    }}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors duration-200 hover:bg-white/5"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                {hasPermission("can_delete_course") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm(`"${course.title}" কোর্সটি মুছে ফেলতে চান?`)) deleteCourse(course.id);
                    }}
                    className="flex size-10 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </Link>
        );
      })}

      {courses.length === 0 && (
        <p className="col-span-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো কোর্স পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
