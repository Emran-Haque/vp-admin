"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CheckCircle2, Gift, Link2, ListChecks, Plus, Trash2 } from "lucide-react";
import ErrorState from "@/components/error-state";
import { PageLoader } from "@/components/loaders";
import { usePermissions } from "@/hooks/use-permissions";
import { copyText } from "@/lib/share-links";
import {
  useDeleteExamMutation,
  useGetAllExamsQuery,
  useGetExamBatchesQuery,
  usePublishExamResultMutation,
  type ExamBatchExam,
} from "@/redux/api/examsApi";
import RoutineMcqEditor from "../exam-batches/includes/routine-mcq-editor";
import NewFreeExamModal, { FREE_EXAMS_BATCH_TITLE } from "./includes/new-free-exam-modal";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const STUDENT_SITE = (process.env.NEXT_PUBLIC_STUDENT_SITE_URL ?? "https://www.vaiyaderpathshala.com").replace(/\/$/, "");
/** Login first, then straight into the exam (a free batch is joined on the way). */
const examLink = (examId: number) =>
  `${STUDENT_SITE}/auth/login?next=${encodeURIComponent(`/mcq-exams?exam=${examId}`)}`;

type Row = ExamBatchExam & { batchTitle: string };

/**
 * The simple free-exam flow: ১) নতুন ফ্রি পরীক্ষা → ২) প্রশ্ন যোগ → ৩) প্রকাশ.
 * Exams live in one free batch behind the scenes, so students are joined
 * automatically and get saved results and rank — no batch or routine to set up.
 */
export default function FreeExamsPage() {
  const { hasPermission } = usePermissions();
  const canBatches = hasPermission("can_manage_exam_batches");
  const canExams = hasPermission("can_view_exams");
  const batchesQuery = useGetExamBatchesQuery(undefined, { skip: !canBatches });
  const examsQuery = useGetAllExamsQuery({ free_material: true }, { skip: !canExams });
  const [deleteExam] = useDeleteExamMutation();
  const [publishResult] = usePublishExamResultMutation();
  const [showNew, setShowNew] = useState(false);
  const [editor, setEditor] = useState<{ id: number; title: string } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  if (editor) {
    return (
      <RoutineMcqEditor
        examId={editor.id}
        examTitle={editor.title}
        onBack={() => {
          setEditor(null);
          void batchesQuery.refetch();
        }}
      />
    );
  }

  if (batchesQuery.isLoading || examsQuery.isLoading) return <PageLoader label="ফ্রি পরীক্ষা লোড হচ্ছে..." />;
  if (batchesQuery.isError) return <ErrorState message="ফ্রি পরীক্ষা আনতে সমস্যা হচ্ছে।" error={batchesQuery.error} />;
  if (examsQuery.isError) return <ErrorState message="ফ্রি MCQ আনতে সমস্যা হচ্ছে।" error={examsQuery.error} />;

  const freeBatches = (batchesQuery.data?.results ?? []).filter((batch) => !(Number(batch.price) > 0));
  const freeBatch = freeBatches.find((batch) => batch.title === FREE_EXAMS_BATCH_TITLE) ?? null;
  const rows: Row[] = freeBatches
    .flatMap((batch) => (batch.exams ?? []).map((row) => ({ ...row, batchTitle: batch.title })))
    .sort((a, b) => b.exam - a.exam);
  const courseMcqs = examsQuery.data?.results ?? [];

  const onCopy = async (examId: number) => {
    if (await copyText(examLink(examId))) {
      setCopied(examId);
      window.setTimeout(() => setCopied((current) => (current === examId ? null : current)), 2000);
    }
  };

  const onDelete = async (row: Row) => {
    if (!window.confirm(`"${row.exam_title}" মুছে ফেলবেন? প্রশ্ন ও শিক্ষার্থীদের ফলাফলও মুছে যাবে।`)) return;
    setBusyId(row.exam);
    try {
      await deleteExam(row.exam).unwrap();
      await batchesQuery.refetch();
    } finally {
      setBusyId(null);
    }
  };

  const onPublishResult = async (row: Row) => {
    setBusyId(row.exam);
    try {
      await publishResult({ id: row.exam }).unwrap();
      await batchesQuery.refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <Gift size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-blue-50">ফ্রি পরীক্ষা</h1>
              <p className="mt-1 text-sm text-slate-400">
                ১) নতুন ফ্রি পরীক্ষা → ২) প্রশ্ন যোগ করুন → ৩) প্রকাশ করুন। সব শিক্ষার্থী নিজে থেকেই দেখতে পাবে।
              </p>
            </div>
          </div>
          {canBatches ? (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
            >
              <Plus size={16} /> নতুন ফ্রি পরীক্ষা
            </button>
          ) : null}
        </div>
      </section>

      {canBatches ? (
        rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-10 text-center text-sm text-slate-400">
            এখনো কোনো ফ্রি পরীক্ষা নেই। উপরের &quot;নতুন ফ্রি পরীক্ষা&quot; চাপুন।
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {rows.map((row, index) => {
              const published = row.exam_status === "published";
              const resultOpen = row.is_result_published || row.result_status === "published";
              const busy = busyId === row.exam;
              return (
                <div
                  key={row.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${index ? "border-t border-slate-800" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-blue-50">{row.exam_title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {bn(row.total_questions)} প্রশ্ন · {bn(row.duration_minutes)} মিনিট
                      {row.batchTitle !== FREE_EXAMS_BATCH_TITLE ? ` · ব্যাচ: ${row.batchTitle}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={published ? "green" : "slate"}>{published ? "প্রকাশিত" : "ড্রাফট — শিক্ষার্থীরা দেখছে না"}</Badge>
                      <Badge tone={resultOpen ? "green" : "amber"}>{resultOpen ? "রেজাল্ট খোলা" : "রেজাল্ট লুকানো"}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditor({ id: row.exam, title: row.exam_title })}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
                        published ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                    >
                      <ListChecks size={14} /> {row.total_questions ? "প্রশ্ন এডিট" : "প্রশ্ন যোগ করুন"}
                    </button>
                    {published ? (
                      <button
                        type="button"
                        onClick={() => onCopy(row.exam)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-slate-800 px-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        <Link2 size={14} /> {copied === row.exam ? "কপি হয়েছে ✓" : "লিংক কপি"}
                      </button>
                    ) : null}
                    {published && !resultOpen && hasPermission("can_publish_result") ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onPublishResult(row)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-semibold text-blue-600 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> রেজাল্ট প্রকাশ
                      </button>
                    ) : null}
                    {hasPermission("can_delete_exam") ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDelete(row)}
                        aria-label="মুছে ফেলুন"
                        className="grid size-9 place-items-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {canExams && courseMcqs.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold text-blue-50">কোর্সের ফ্রি MCQ</h2>
            <p className="mt-0.5 text-sm text-slate-400">কোর্সের ম্যাটেরিয়ালে যোগ করা ফ্রি MCQ — এগুলোও শিক্ষার্থীর ফ্রি পরীক্ষায় দেখা যায়।</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {courseMcqs.map((exam, index) => (
              <Link
                key={exam.id}
                href={`/mcq/${exam.id}/edit`}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-800/60 ${index ? "border-t border-slate-800" : ""}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-blue-50">{exam.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {exam.course_title || "কোর্স নেই"} · {bn(exam.total_questions)} প্রশ্ন
                  </p>
                </div>
                <Badge tone={exam.status === "published" ? "green" : "slate"}>
                  {exam.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {showNew ? (
        <NewFreeExamModal
          freeBatch={freeBatch}
          onClose={() => setShowNew(false)}
          onCreated={(exam) => {
            setShowNew(false);
            void batchesQuery.refetch();
            setEditor(exam);
          }}
        />
      ) : null}
    </div>
  );
}

function Badge({ tone, children }: { tone: "green" | "amber" | "slate"; children: ReactNode }) {
  const styles = {
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    slate: "bg-slate-800 text-slate-300",
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles}`}>{children}</span>;
}
