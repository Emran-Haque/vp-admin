"use client";

import { useState } from "react";
import {
  BookMarked,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Mail,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useGetCourseEnrollmentsQuery } from "@/redux/api/coursesApi";
import { useGetStudentQuery } from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { statusOf, studentStatusStyles } from "@/lib/student-status";
import StudentDetailModal from "../../../students/includes/student-detail-modal";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sourceLabel(value: string) {
  if (value === "admin") return "Admin";
  if (value === "free") return "Free";
  if (value === "order") return "Order";
  return value || "Manual";
}

export default function CourseEnrolledStudents({ courseId }: { courseId: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError } = useGetCourseEnrollmentsQuery({
    id: courseId,
    page,
  });

  if (!hasPermission("can_view_course_enrollments")) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
        <ShieldCheck size={28} className="mx-auto text-slate-500" />
        <p className="mt-3 text-sm font-semibold text-blue-50">
          ভর্তি শিক্ষার্থী দেখার অনুমতি নেই
        </p>
      </section>
    );
  }

  const enrollments = data?.results ?? [];
  const trimmedSearch = search.trim().toLowerCase();

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-8 text-blue-50">
            ভর্তি শিক্ষার্থী
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            এই কোর্সে মোট {data?.count ?? 0} জন শিক্ষার্থী ভর্তি আছে
          </p>
        </div>
        <label className="flex min-w-[260px] items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/35 px-3.5 py-2.5">
          <Search size={15} className="text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="নাম, ইমেইল বা ফোন খুঁজুন"
            className="w-full bg-transparent text-sm text-blue-50 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isLoading ? (
          <p className="rounded-2xl border border-slate-800 bg-gray-900/40 p-6 text-center text-sm text-slate-400">
            শিক্ষার্থী তালিকা লোড হচ্ছে...
          </p>
        ) : isError ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-sm text-red-400">
            ভর্তি শিক্ষার্থীর তালিকা আনা যায়নি।
          </p>
        ) : enrollments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
            এই কোর্সে এখনো কোনো শিক্ষার্থী ভর্তি হয়নি।
          </p>
        ) : (
          enrollments.map((enrollment) => (
            <EnrollmentStudentRow
              enrollment={enrollment}
              key={enrollment.id}
              onSelect={() => setSelectedStudentId(enrollment.student)}
              search={trimmedSearch}
            />
          ))
        )}
      </div>

      {data && (data.previous || data.next) ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!data.previous}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
            আগের পেজ
          </button>
          <span className="text-xs font-semibold text-slate-400">পেজ {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!data.next}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            পরের পেজ
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}

      {selectedStudentId !== null ? (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      ) : null}
    </section>
  );
}

function EnrollmentStudentRow({
  enrollment,
  onSelect,
  search,
}: {
  enrollment: {
    id: number;
    student: number;
    source: string;
    enrolled_at: string;
    is_active: boolean;
  };
  onSelect: () => void;
  search: string;
}) {
  const { data: student, isLoading } = useGetStudentQuery(enrollment.student);
  const haystack = [
    student?.full_name,
    student?.email,
    student?.phone,
    student?.student_profile?.batch,
    student?.student_profile?.institution,
    String(enrollment.student),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (search && student && !haystack.includes(search)) return null;

  const status = student
    ? studentStatusStyles[statusOf(student)]
    : {
        label: enrollment.is_active ? "সক্রিয়" : "নিষ্ক্রিয়",
        className: enrollment.is_active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
          : "border-slate-500/30 bg-slate-500/10 text-slate-400",
      };

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-gray-900/40 p-4 text-left transition hover:border-slate-700"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500">
        <GraduationCap size={24} className="text-white" />
      </span>

      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-blue-50">
            {isLoading
              ? "লোড হচ্ছে..."
              : student?.full_name || `শিক্ষার্থী #${enrollment.student}`}
          </p>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}>
            {status.label}
          </span>
          <span className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
            {sourceLabel(enrollment.source)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Mail size={13} />
            {student?.email || "-"}
          </span>
          <span className="flex items-center gap-1">
            <Phone size={13} />
            {student?.phone || "-"}
          </span>
          <span className="flex items-center gap-1">
            <BookMarked size={13} />
            {student?.student_profile?.batch ||
              student?.student_profile?.institution ||
              "-"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            ভর্তি: {formatDate(enrollment.enrolled_at)}
          </span>
        </div>
      </div>
    </button>
  );
}
