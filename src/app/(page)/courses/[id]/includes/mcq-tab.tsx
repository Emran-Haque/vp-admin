"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ClipboardCheck, Plus, Pencil, Save, Trash2 } from "lucide-react";
import { useGetExamsQuery, useDeleteExamMutation } from "@/redux/api/examsApi";
import {
  useGetCourseQuery,
  useUpdateCourseMcqAttemptLimitMutation,
} from "@/redux/api/coursesApi";
import { usePermissions } from "@/hooks/use-permissions";
import AdminDeleteButton from "@/components/admin-delete-button";
import { extractErrorMessage } from "@/lib/api-error";
import EmptyState from "./empty-state";
import AddExamModal from "./add-exam-modal";

const statusStyles: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-500 outline-amber-500/40",
  published: "bg-emerald-500/10 text-emerald-500 outline-emerald-500/40",
  closed: "bg-slate-500/10 text-slate-400 outline-slate-500/40",
};

const statusLabels: Record<string, string> = {
  draft: "ড্রাফট",
  published: "প্রকাশিত",
  closed: "সমাপ্ত",
};

export default function McqTab({ courseId }: { courseId: number }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [courseLimit, setCourseLimit] = useState<string | null>(null);
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const { data, isLoading } = useGetExamsQuery({ course: courseId, mode: "online" });
  const { data: course } = useGetCourseQuery(courseId);
  const [deleteExam] = useDeleteExamMutation();
  const [updateAttemptLimit, { isLoading: isSavingLimit }] =
    useUpdateCourseMcqAttemptLimitMutation();
  const { hasPermission } = usePermissions();

  const exams = data?.results ?? [];

  const saveCourseLimit = async () => {
    setLimitError(null);
    setLimitMessage(null);
    const maxAttempts = Number(courseLimit ?? course?.default_mcq_attempts ?? 1);
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
      setLimitError("১ থেকে ২০-এর মধ্যে একটি পূর্ণ সংখ্যা দিন।");
      return;
    }
    try {
      const result = await updateAttemptLimit({
        id: courseId,
        max_attempts: maxAttempts,
        apply_to_existing: applyToExisting,
      }).unwrap();
      setLimitMessage(
        applyToExisting
          ? `${result.updated_exams}টি পরীক্ষায় নতুন সীমা প্রয়োগ হয়েছে${result.notified ? " এবং শিক্ষার্থীদের নোটিফিকেশন পাঠানো হয়েছে" : ""}।`
          : "কোর্সের ডিফল্ট সুযোগ সংরক্ষণ হয়েছে। নতুন MCQ পরীক্ষায় এটি ব্যবহার হবে।",
      );
    } catch (error) {
      setLimitError(extractErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-blue-50">MCQ পরীক্ষা</h3>
        {hasPermission("can_create_exam") && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            পরীক্ষা যোগ করুন
          </button>
        )}
      </div>

      {hasPermission("can_edit_course") ? (
        <section className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-blue-100">কোর্সের MCQ পরীক্ষার সুযোগ</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                নতুন MCQ পরীক্ষা এই মান নেবে। চাইলে এই কোর্সের বর্তমান অনলাইন MCQ পরীক্ষাগুলোতেও একসাথে প্রয়োগ করুন। প্রথমবারের ফলই লিডারবোর্ডে থাকবে।
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-300">সর্বোচ্চ সুযোগ</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={courseLimit ?? String(course?.default_mcq_attempts ?? 1)}
                  onChange={(event) => setCourseLimit(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-700 bg-gray-900 px-3 text-sm text-blue-50 outline-none sm:w-28"
                />
              </label>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-gray-900 px-3 text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={applyToExisting}
                  onChange={(event) => setApplyToExisting(event.target.checked)}
                  className="size-4 accent-blue-500"
                />
                বর্তমান পরীক্ষায়ও দিন
              </label>
              <button
                type="button"
                onClick={saveCourseLimit}
                disabled={isSavingLimit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} />
                {isSavingLimit ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
          {limitError ? <p className="mt-3 text-xs font-semibold text-red-400">{limitError}</p> : null}
          {limitMessage ? (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Bell size={14} />
              {limitMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
        ) : exams.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="এখনো কোনো MCQ পরীক্ষা নেই"
            subtitle="এই কোর্সের MCQ পরীক্ষা যুক্ত হলে এখানে দেখা যাবে।"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {exams.map((exam) => {
              const status = statusStyles[exam.status] ?? statusStyles.draft;
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-gray-900/40 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <ClipboardCheck size={18} className="text-blue-500" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-blue-50">{exam.title}</p>
                      <p className="text-xs text-slate-400">
                        {exam.total_questions} প্রশ্ন • {exam.duration_minutes} মিনিট • সর্বোচ্চ {exam.max_attempts ?? 1} বার
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold outline outline-1 outline-offset-[-1px] ${status}`}
                    >
                      {statusLabels[exam.status] ?? exam.status}
                    </span>
                    {hasPermission("can_edit_exam") && (
                      <Link
                        href={`/mcq/${exam.id}/edit`}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 text-xs font-black text-blue-100 hover:bg-blue-500/20"
                      >
                        <Pencil size={14} />
                        প্রশ্ন এডিট
                      </Link>
                    )}
                    {hasPermission("can_delete_exam") && (
                      <AdminDeleteButton
                        itemName={exam.title}
                        itemType="MCQ পরীক্ষা"
                        impact="পরীক্ষা, প্রশ্ন এবং সংশ্লিষ্ট ফলাফল ডেটা মুছে যেতে পারে।"
                        onDelete={() => deleteExam(exam.id).unwrap()}
                        className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                      >
                        <Trash2 size={15} />
                      </AdminDeleteButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && <AddExamModal courseId={courseId} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
