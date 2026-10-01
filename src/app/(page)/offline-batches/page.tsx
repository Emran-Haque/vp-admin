"use client";

import Link from "next/link";
import { CalendarClock, MapPin, Plus, School, Users } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useGetCoursesQuery } from "@/redux/api/coursesApi";
import ErrorState from "@/components/error-state";

/**
 * অফলাইন ব্যাচ — classroom courses.
 *
 * An offline batch is an ordinary course with `delivery_mode = "offline"`, so
 * it is created and sold exactly like any other course. This screen only lists
 * those courses and leads into the batch's students, classes and exam marks.
 */
export default function Page() {
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError, error } = useGetCoursesQuery({
    delivery_mode: "offline",
    page_size: 100,
  });
  const batches = data?.results ?? [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
            <School size={20} className="text-white" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-50">অফলাইন ব্যাচ</h1>
            <p className="text-xs text-slate-400">
              ক্লাসরুমের ব্যাচ — শিক্ষার্থী, ক্লাস রুটিন ও পরীক্ষার নম্বর
            </p>
          </div>
        </div>
        {hasPermission("can_create_course") && (
          <Link
            href="/courses/create?mode=offline"
            className="flex items-center gap-1.5 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <Plus size={14} />
            নতুন ব্যাচ
          </Link>
        )}
      </header>

      {isLoading && <p className="text-center text-sm text-slate-400">ব্যাচ লোড হচ্ছে…</p>}
      {isError && (
        <ErrorState message="অফলাইন ব্যাচের তালিকা আনা যায়নি।" error={error} />
      )}

      {!isLoading && !isError && batches.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center">
          <p className="text-sm font-semibold text-blue-50">এখনো কোনো অফলাইন ব্যাচ নেই</p>
          <p className="mt-1 text-xs text-slate-400">
            “নতুন ব্যাচ” চাপুন — কোর্স তৈরির ফর্মে ধরন “অফলাইন ব্যাচ” আগে থেকেই বাছাই করা থাকবে।
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((course) => (
          <Link
            key={course.id}
            href={`/offline-batches/${course.id}`}
            className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold leading-6 text-blue-50">{course.title}</h2>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  course.is_published
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                }`}
              >
                {course.is_published ? "প্রকাশিত" : "খসড়া"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {course.enrollment_count} জন শিক্ষার্থী
              </span>
              {course.venue ? (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {course.venue}
                </span>
              ) : null}
              {course.schedule_text ? (
                <span className="flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  {course.schedule_text}
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
