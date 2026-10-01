"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  MapPin,
  Pencil,
  Users,
  type LucideIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useGetCourseQuery } from "@/redux/api/coursesApi";
import ErrorState from "@/components/error-state";
import CourseEnrolledStudents from "../../courses/[id]/includes/course-enrolled-students";
import ClassesExamsTab from "./includes/classes-exams-tab";

type Tab = "classes" | "students";

const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "classes", label: "ক্লাস ও পরীক্ষা", icon: ClipboardList },
  { key: "students", label: "শিক্ষার্থী", icon: Users },
];

export default function Page() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const [tab, setTab] = useState<Tab>("classes");
  const { hasPermission } = usePermissions();
  const { data: course, isLoading, isError, error } = useGetCourseQuery(courseId, {
    skip: !courseId,
  });

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">ব্যাচের তথ্য লোড হচ্ছে…</p>;
  }
  if (isError || !course) {
    return <ErrorState message="ব্যাচটি খুঁজে পাওয়া যায়নি।" error={isError ? error : undefined} />;
  }

  const isOffline = course.delivery_mode === "offline";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/offline-batches"
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-50"
      >
        <ArrowLeft size={14} />
        সব অফলাইন ব্যাচ
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h1 className="text-xl font-bold leading-8 text-blue-50">{course.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
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
        </div>
        {hasPermission("can_edit_course") && (
          <Link
            href={`/courses/${course.id}/edit`}
            className="flex items-center gap-1.5 rounded-[10px] border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/5"
          >
            <Pencil size={13} />
            ব্যাচের তথ্য এডিট
          </Link>
        )}
      </section>

      {!isOffline && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          এই কোর্সটি অনলাইন হিসেবে সেট করা আছে। অফলাইন পরীক্ষা যোগ করতে আগে কোর্সের ধরন
          “অফলাইন ব্যাচ” করুন।
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? "border-blue-500 bg-blue-500/10 text-blue-50"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-blue-50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "classes" ? (
        <ClassesExamsTab courseId={course.id} canAddExams={isOffline} />
      ) : (
        <CourseEnrolledStudents
          courseId={course.id}
          courseTitle={course.title}
          verificationRequired={course.verification_required}
        />
      )}
    </div>
  );
}
