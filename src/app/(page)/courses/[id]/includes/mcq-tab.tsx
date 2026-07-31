"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { useGetExamsQuery, useDeleteExamMutation } from "@/redux/api/examsApi";
import { usePermissions } from "@/hooks/use-permissions";
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
  const { data, isLoading } = useGetExamsQuery({ course: courseId });
  const [deleteExam] = useDeleteExamMutation();
  const { hasPermission } = usePermissions();

  const exams = data?.results ?? [];

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
                        {exam.total_questions} প্রশ্ন • {exam.duration_minutes} মিনিট
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
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${exam.title}" মুছে ফেলতে চান?`)) deleteExam(exam.id);
                        }}
                        className="flex size-9 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
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
