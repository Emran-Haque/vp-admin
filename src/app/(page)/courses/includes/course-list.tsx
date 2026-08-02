"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Video, HelpCircle, ClipboardList, Users, Clock, Pencil, Trash2, Sparkles, ShieldCheck, type LucideIcon } from "lucide-react";
import { useGetCoursesQuery, useDeleteCourseMutation, useUpdateCourseMutation, type Course } from "@/redux/api/coursesApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";

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

const API_ORIGIN = "https://api.vaiyaderpathshala.com";

function resolveMediaUrl(value: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value.startsWith("/") ? value : `/${value}`, API_ORIGIN).toString();
  } catch {
    return value;
  }
}

function priceLabel(course: Course) {
  if (course.is_free) return "ফ্রি";
  const price = Number(course.price);
  if (!Number.isFinite(price) || price <= 0) return "মূল্য নির্ধারিত নয়";
  return `৳${price.toLocaleString("bn-BD")}`;
}

export default function CourseList() {
  const { data, isLoading, isError, error } = useGetCoursesQuery();
  const [deleteCourse] = useDeleteCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">কোর্সের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return <ErrorState message="কোর্সের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
  }

  const courses = data?.results ?? [];

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {courses.map((course) => {
        const status = statusStyles[course.is_published ? "published" : "draft"];
        const imageUrl = resolveMediaUrl(course.thumbnail || course.cover_image);
        return (
          <Link
            key={course.id}
            href={`/courses/${course.id}`}
            className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_18px_44px_-16px_rgba(0,0,0,0.58)] transition duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0px_26px_70px_-22px_rgba(59,130,246,0.55)]"
          >
            <div className="relative min-h-[220px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.34),transparent_34%),linear-gradient(135deg,#0f172a,#111827_55%,#172554)]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={course.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex size-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 text-blue-100">
                    <BookOpen size={46} strokeWidth={1.8} />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/10" />

              <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-3.5 py-1.5 text-xs font-black outline outline-1 outline-offset-[-1px] backdrop-blur ${status.className}`}
                >
                  {status.label}
                </span>
                <span className="rounded-full border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs font-black text-white backdrop-blur">
                  {priceLabel(course)}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-100 backdrop-blur">
                  <Sparkles size={13} />
                  {course.duration || "সময় নির্ধারিত নয়"}
                </span>
                <h2 className="line-clamp-2 text-2xl font-black leading-tight text-white">
                  {course.title}
                </h2>
              </div>
            </div>

            <div className="p-5">
              <p className="line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-300">
                {course.short_description || course.full_description || "কোর্সের সংক্ষিপ্ত বিবরণ এখনো যোগ করা হয়নি।"}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span className="rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">
                  {course.level || "লেভেল নেই"}
                </span>
                {course.batch_start_date && (
                  <span className="rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">
                    ব্যাচ: {course.batch_start_date}
                  </span>
                )}
                {course.class_start_date && (
                  <span className="rounded-full border border-slate-800 bg-gray-900/60 px-3 py-1.5">
                    ক্লাস: {course.class_start_date}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 px-5">
              {statBoxes.map(({ key, label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border border-slate-800 bg-gray-900/50 p-2 text-center"
                >
                  <Icon size={16} className="text-blue-500" />
                  <span className="text-base font-bold text-blue-50">{course[key] as number}</span>
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 p-5">
              <span className="flex min-w-0 items-center gap-1.5 text-sm text-slate-300">
                <Clock size={16} />
                <span className="truncate">{course.duration || "—"}</span>
              </span>
              <div className="flex items-center gap-2">
                {hasPermission("can_view_course_enrollments") && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/courses/${course.id}?tab=students`);
                    }}
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-800 px-3 text-xs font-bold text-blue-50 transition-colors duration-200 hover:bg-white/5"
                  >
                    <Users size={15} />
                    ভর্তি তালিকা
                  </button>
                )}
                {hasPermission("can_edit_course") && (
                  <label
                    className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors duration-200 ${
                      course.verification_required
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : "border-slate-800 text-slate-300 hover:bg-white/5"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={course.verification_required}
                      onChange={(e) => {
                        void updateCourse({
                          id: course.id,
                          data: { verification_required: e.target.checked },
                        });
                      }}
                      className="sr-only"
                    />
                    <ShieldCheck size={15} />
                    {course.verification_required ? "ভেরিফাই লাগবে" : "সরাসরি অ্যাক্সেস"}
                  </label>
                )}
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
