"use client";

import { IdCard, Phone, BookMarked, Calendar, Trash2, UserCheck, UserX } from "lucide-react";
import StudentAvatar from "@/components/student-avatar";
import {
  useDeleteStudentMutation,
  useDeactivateStudentMutation,
  useReactivateStudentMutation,
  type Student,
} from "@/redux/api/studentsApi";
import { usePermissions } from "@/hooks/use-permissions";
import { statusOf, studentStatusStyles } from "@/lib/student-status";
import StudentDetailModal from "./student-detail-modal";
import { useState } from "react";
import ErrorState from "@/components/error-state";
import AdminDeleteButton from "@/components/admin-delete-button";
import { PageLoader } from "@/components/loaders";

export default function StudentList({
  students,
  isLoading,
  isFetching,
  isError,
  error,
}: {
  students: Student[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
}) {
  const [deleteStudent] = useDeleteStudentMutation();
  const [deactivateStudent] = useDeactivateStudentMutation();
  const [reactivateStudent] = useReactivateStudentMutation();
  const { hasPermission } = usePermissions();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  if (isLoading) {
    return <PageLoader label="শিক্ষার্থীদের তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return (
      <ErrorState message="শিক্ষার্থীদের তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />
    );
  }

  return (
    <>
      {/* Keep the previous page on screen, dimmed, while the next one loads. */}
      <section
        aria-busy={isFetching}
        className={`flex flex-col gap-3 transition-opacity sm:gap-6 ${isFetching ? "opacity-50" : ""}`}
      >
        {students.map((student) => {
          const status = studentStatusStyles[statusOf(student)];
          return (
            <div
              key={student.id}
              onClick={() => setSelectedStudentId(student.id)}
              className="relative flex cursor-pointer flex-wrap items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-3.5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)] transition-colors hover:border-slate-700 sm:static sm:rounded-3xl sm:p-5"
            >
              <StudentAvatar
                name={student.full_name}
                image={student.profile_image}
                className="hidden size-14 rounded-2xl sm:flex"
              />

              <div className="w-full min-w-0 sm:w-auto sm:min-w-64 sm:flex-1">
                {/* Phones: right padding leaves room for the action buttons pinned top-right. */}
                <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 pr-[5.25rem] sm:min-h-0 sm:pr-0">
                  <p className="min-w-0 break-words text-base font-semibold text-blue-50 sm:text-lg">{student.full_name}</p>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                {/* Phones: ID + phone, then joined + institution — two short lines. */}
                <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:text-sm">
                  <span
                    className="flex min-w-0 items-center gap-1"
                    title={student.legacy_student_id ? `পুরনো আইডি: ${student.legacy_student_id}` : undefined}
                  >
                    <IdCard size={14} className="shrink-0 text-cyan-400" />
                    <span className="truncate font-mono font-semibold tracking-wide text-cyan-200">
                      {student.student_id || "—"}
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1">
                    <Phone size={14} className="shrink-0" />
                    <span className="truncate">{student.phone || "—"}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1">
                    <Calendar size={14} className="shrink-0" />
                    <span className="truncate">যোগদান: {new Date(student.created_at).toLocaleDateString("bn-BD")}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1">
                    <BookMarked size={14} className="shrink-0" />
                    <span className="truncate">{student.student_profile?.institution || "—"}</span>
                  </span>
                </div>
              </div>

              <div className="absolute right-3 top-3 flex items-center gap-1.5 sm:static sm:gap-2" onClick={(e) => e.stopPropagation()}>
                {hasPermission("can_edit_student") &&
                  (student.is_active ? (
                    <button
                      type="button"
                      onClick={() => deactivateStudent(student.id)}
                      title="নিষ্ক্রিয় করুন"
                      className="flex size-9 items-center justify-center rounded-xl border sm:size-10 border-amber-500/30 bg-amber-500/5 text-amber-500"
                    >
                      <UserX size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reactivateStudent(student.id)}
                      title="সক্রিয় করুন"
                      className="flex size-9 items-center justify-center rounded-xl border sm:size-10 border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                    >
                      <UserCheck size={16} />
                    </button>
                  ))}
                {hasPermission("can_delete_student") && (
                  <AdminDeleteButton
                    itemName={student.full_name}
                    itemType="শিক্ষার্থী"
                    impact="শিক্ষার্থীর অ্যাকাউন্ট ও সংশ্লিষ্ট অ্যাক্সেস স্থায়ীভাবে মুছে যেতে পারে।"
                    onDelete={() => deleteStudent(student.id).unwrap()}
                    className="flex size-9 items-center justify-center rounded-xl border sm:size-10 border-red-500/20 bg-red-500/5 text-red-500"
                  >
                    <Trash2 size={16} />
                  </AdminDeleteButton>
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
      </section>

      {selectedStudentId !== null && (
        <StudentDetailModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
      )}
    </>
  );
}
