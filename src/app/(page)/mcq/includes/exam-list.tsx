"use client";

import { ClipboardList, HelpCircle, Clock, Calendar, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import {
  useGetExamsQuery,
  useDeleteExamMutation,
  usePublishExamResultMutation,
  type Exam,
} from "@/redux/api/examsApi";
import { usePermissions } from "@/hooks/use-permissions";

const resultStatusStyles: Record<string, { label: string; className: string }> = {
  published: { label: "ফলাফল প্রকাশিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" },
  pending: { label: "ফলাফল বাকি", className: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
  hidden: { label: "নির্ধারিত", className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-500" },
};

function resultStatusOf(exam: Exam) {
  return resultStatusStyles[exam.result_status] ?? resultStatusStyles.hidden;
}

export default function ExamList({ onEdit }: { onEdit: (exam: Exam) => void }) {
  const { data, isLoading, isError } = useGetExamsQuery();
  const [deleteExam] = useDeleteExamMutation();
  const [publishResult] = usePublishExamResultMutation();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return <p className="text-center text-sm text-slate-400">পরীক্ষার তালিকা লোড হচ্ছে…</p>;
  }

  if (isError) {
    return (
      <p className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center text-sm text-red-500">
        পরীক্ষার তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।
      </p>
    );
  }

  const exams = data?.results ?? [];

  return (
    <section className="flex flex-col gap-3.5">
      {exams.map((exam) => {
        const status = resultStatusOf(exam);
        const negativeMarking = Number(exam.negative_mark_per_wrong) > 0;
        return (
          <div
            key={exam.id}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
              <ClipboardList size={28} className="text-white" strokeWidth={2} />
            </span>

            <div className="min-w-64 flex-1">
              <p className="text-lg font-semibold text-blue-50">{exam.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <HelpCircle size={14} className="text-red-600" />
                  {exam.total_questions}টি প্রশ্ন
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {exam.duration_minutes} মিনিট
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {exam.exam_date || "—"}
                </span>
                <span className={negativeMarking ? "text-red-600" : "text-emerald-500"}>
                  নেগেটিভ: {negativeMarking ? "আছে" : "নেই"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${status.className}`}>
                {status.label}
              </span>

              {exam.result_status === "pending" && hasPermission("can_publish_result") && (
                <button
                  type="button"
                  onClick={() => publishResult({ id: exam.id })}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-blue-500"
                >
                  <CheckCircle2 size={14} />
                  ফলাফল প্রকাশ করুন
                </button>
              )}

              {hasPermission("can_edit_exam") && (
                <button
                  type="button"
                  onClick={() => onEdit(exam)}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-slate-800 text-blue-50 transition-colors duration-200 hover:bg-white/5"
                >
                  <Pencil size={16} />
                </button>
              )}
              {hasPermission("can_delete_exam") && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`"${exam.title}" পরীক্ষাটি মুছে ফেলতে চান?`)) deleteExam(exam.id);
                  }}
                  className="flex size-10 items-center justify-center rounded-xl border border-red-600/40 bg-red-600/10 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {exams.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
          কোনো পরীক্ষা পাওয়া যায়নি।
        </p>
      )}
    </section>
  );
}
