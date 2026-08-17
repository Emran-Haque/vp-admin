"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  HelpCircle,
  ListChecks,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import {
  useGetExamsQuery,
  useDeleteExamMutation,
  usePublishExamResultMutation,
  useGetExamAttemptsQuery,
  type Exam,
  type ExamAttempt,
} from "@/redux/api/examsApi";
import { usePermissions } from "@/hooks/use-permissions";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";

const resultStatusStyles: Record<string, { label: string; className: string }> = {
  published: { label: "ফলাফল প্রকাশিত", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" },
  pending: { label: "ফলাফল নির্ধারিত", className: "border-amber-500/40 bg-amber-500/10 text-amber-500" },
  hidden: { label: "ফলাফল গোপন", className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-500" },
};

function resultStatusOf(exam: Exam) {
  if (exam.is_result_published) return resultStatusStyles.published;
  return resultStatusStyles[exam.result_status] ?? resultStatusStyles.hidden;
}

export default function ExamList() {
  const { data, isLoading, isError, error } = useGetExamsQuery();
  const [deleteExam] = useDeleteExamMutation();
  const [publishResult] = usePublishExamResultMutation();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return <PageLoader label="পরীক্ষার তালিকা লোড হচ্ছে…" />;
  }

  if (isError) {
    return <ErrorState message="পরীক্ষার তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।" error={error} />;
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

            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${status.className}`}>
                {status.label}
              </span>

              {!exam.is_result_published && exam.result_status !== "published" && hasPermission("can_publish_result") && (
                <button
                  type="button"
                  onClick={() => publishResult({ id: exam.id })}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-blue-500"
                >
                  <CheckCircle2 size={14} />
                  ফলাফল প্রকাশ করুন
                </button>
              )}

              {hasPermission("can_view_results") && <ExamAttemptsButton exam={exam} />}

              {hasPermission("can_edit_exam") && (
                <Link
                  href={`/mcq/${exam.id}/edit`}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 text-sm font-black text-blue-100 transition-colors duration-200 hover:bg-blue-500/20"
                >
                  <ListChecks size={16} />
                  প্রশ্ন/উত্তর এডিট
                  <span className="sr-only">Edit {exam.title}</span>
                  <Pencil size={16} />
                </Link>
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

function ExamAttemptsButton({ exam }: { exam: Exam }) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetExamAttemptsQuery(
    { exam: exam.id, completed: true, ordering: "-submitted_at", page, page_size: 10 },
    { skip: !isOpen },
  );
  const attempts = data?.results ?? [];

  return (
    <div className="w-full basis-full">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/20"
      >
        <Users size={16} />
        পরীক্ষার্থী তালিকা
        {data ? (
          <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs text-cyan-100">
            {toBn(data.count)}
          </span>
        ) : null}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-gray-950/45">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-blue-50">যারা পরীক্ষা দিয়েছে</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Submitted, auto-submitted এবং tab-change violation submit একসাথে দেখানো হচ্ছে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {isFetching && !data ? (
            <p className="p-5 text-center text-sm text-slate-400">পরীক্ষার্থীর তালিকা লোড হচ্ছে...</p>
          ) : isError ? (
            <ErrorState
              message="পরীক্ষার্থীর তালিকা আনতে সমস্যা হয়েছে। API সার্ভার সংযোগ পরীক্ষা করুন।"
              error={error}
            />
          ) : attempts.length === 0 ? (
            <p className="p-5 text-center text-sm text-slate-400">
              এখনো কোনো শিক্ষার্থী এই পরীক্ষা জমা দেয়নি।
            </p>
          ) : (
            <>
              <ExamAttemptsTable attempts={attempts} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
                <span>
                  মোট {toBn(data?.count ?? 0)} জন, এই পেজে {toBn(attempts.length)} জন
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!data?.previous}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="font-bold text-slate-200">Page {toBn(page)}</span>
                  <button
                    type="button"
                    disabled={!data?.next}
                    onClick={() => setPage((value) => value + 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ExamAttemptsTable({ attempts }: { attempts: ExamAttempt[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left">
        <thead>
          <tr className="bg-slate-950/60 text-xs font-semibold text-slate-400">
            <th className="px-4 py-3">শিক্ষার্থী</th>
            <th className="px-4 py-3">স্ট্যাটাস</th>
            <th className="px-4 py-3">স্কোর</th>
            <th className="px-4 py-3">সঠিক/ভুল/ফাঁকা</th>
            <th className="px-4 py-3">সময়</th>
            <th className="px-4 py-3">র‍্যাঙ্ক</th>
            <th className="px-4 py-3">জমা দিয়েছে</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id} className="border-t border-slate-800">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white">
                    {(attempt.student_name || "S").charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-blue-50">
                      {attempt.student_name || `Student #${attempt.student}`}
                    </p>
                    <p className="text-xs text-slate-500">ID #{attempt.student}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${attemptStatusClass(attempt.status)}`}>
                  {attemptStatusLabel(attempt.status)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm font-bold text-blue-50">
                {toBn(Number(attempt.final_marks || 0))}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {toBn(attempt.correct_count)} / {toBn(attempt.wrong_count)} / {toBn(attempt.unanswered_count)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {formatDuration(attempt.time_taken_seconds)}
              </td>
              <td className="px-4 py-3 text-sm text-slate-300">
                {attempt.rank ? `#${toBn(attempt.rank)}` : "—"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">
                {formatDateTime(attempt.submitted_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function attemptStatusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: "জমা দিয়েছে",
    auto_submitted: "Auto submit",
    violation_submitted: "Tab change submit",
    expired: "সময় শেষ",
    started: "চলমান",
  };
  return labels[status] ?? status;
}

function attemptStatusClass(status: string) {
  if (status === "submitted") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-400";
  if (status === "auto_submitted") return "border-amber-500/35 bg-amber-500/10 text-amber-400";
  if (status === "violation_submitted") return "border-red-500/35 bg-red-500/10 text-red-400";
  return "border-slate-600 bg-slate-800/70 text-slate-300";
}

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${toBn(minutes)}মি ${toBn(remainingSeconds)}সে`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toBn(value: number | string) {
  return new Intl.NumberFormat("bn-BD").format(Number(value) || 0);
}
