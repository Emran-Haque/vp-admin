"use client";

import { GraduationCap, Mail, Phone, BookMarked, Calendar, Trash2, UserCheck, UserX } from "lucide-react";
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
  useDeactivateStudentMutation,
  useReactivateStudentMutation,
} from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { statusOf, studentStatusStyles } from "@/lib/student-status";
import type { StatusFilter } from "./toolbar";
import StudentDetailModal from "./student-detail-modal";
import { useState } from "react";
import ErrorState from "@/components/error-state";

const STATUS_PARAMS: Record<Exclude<StatusFilter, "">, { is_active?: boolean; is_verified?: boolean }> = {
  active: { is_active: true, is_verified: true },
  inactive: { is_active: false },
  pending: { is_active: true, is_verified: false },
};

export default function StudentList({
  search,
  batch,
  status,
}: {
  search: string;
  batch: string;
  status: StatusFilter;
}) {
  const { data, isLoading, isError, error } = useGetStudentsQuery({
    search: search || undefined,
    ...(status ? STATUS_PARAMS[status] : {}),
  });
  const [deleteStudent] = useDeleteStudentMutation();
  const [deactivateStudent] = useDeactivateStudentMutation();
  const [reactivateStudent] = useReactivateStudentMutation();
  const { hasPermission } = usePermissions();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">শিক্ষার্থীদের তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <ErrorState message="শিক্ষার্থীদের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />
    );
  }

  const students = (data?.results ?? []).filter(
    (student) => !batch || student.student_profile?.batch === batch
  );

  return (
    <section className="flex flex-col gap-6">
      {students.map((student) => {
        const status = studentStatusStyles[statusOf(student)];
        return (
          <div
            key={student.id}
            onClick={() => setSelectedStudentId(student.id)}
            className="flex cursor-pointer flex-wrap items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] transition-colors hover:border-slate-700"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500">
              <GraduationCap size={28} className="text-white" strokeWidth={2} />
            </span>

            <div className="min-w-64 flex-1">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-blue-50">{student.full_name}</p>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {student.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {student.phone || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <BookMarked size={14} />
                  {student.student_profile?.batch || student.student_profile?.institution || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  যোগদান: {new Date(student.created_at).toLocaleDateString("bn-BD")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {hasPermission("can_edit_student") &&
                (student.is_active ? (
                  <button
                    type="button"
                    onClick={() => deactivateStudent(student.id)}
                    title="নিষ্ক্রিয় করুন"
                    className="flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500"
                  >
                    <UserX size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => reactivateStudent(student.id)}
                    title="সক্রিয় করুন"
                    className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                  >
                    <UserCheck size={16} />
                  </button>
                ))}
              {hasPermission("can_delete_student") && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`${student.full_name}-কে মুছে ফেলতে চান?`)) deleteStudent(student.id);
                  }}
                  className="flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {students.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো শিক্ষার্থী পাওয়া যায়নি।
        </p>
      )}

      {selectedStudentId !== null && (
        <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
      )}
    </section>
  );
}
