"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  useGetExamBatchQuery,
  useGetExamBatchEnrollmentsQuery,
  useDeleteExamMutation,
  type ExamBatch,
  type ExamBatchExam,
} from "@/redux/api/examsApi";
import { PageLoader } from "@/components/loaders";
import ErrorState from "@/components/error-state";
import AddRoutineExamModal from "./add-routine-exam-modal";
import RoutineCsvImport from "./routine-csv-import";
import RoutineMcqEditor from "./routine-mcq-editor";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

function formatSchedule(item: ExamBatchExam): string {
  if (!item.exam_date && !item.start_time) return "সময় নির্ধারিত নয়";
  const date = item.exam_date || (item.start_time ? item.start_time.slice(0, 10) : "");
  const time = item.start_time ? new Date(item.start_time).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "";
  return `${date}${time ? ` · ${time}` : ""}`;
}

function formatDeadline(item: ExamBatchExam): string {
  if (!item.end_time) return "";
  try {
    return new Date(item.end_time).toLocaleString("bn-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Full-screen manage view for one batch: routine table + CSV/manual add + students. */
export default function BatchManageView({
  batchId,
  onBack,
  onEditBatch,
}: {
  batchId: number;
  onBack: () => void;
  onEditBatch: (batch: ExamBatch) => void;
}) {
  const { data: batch, isLoading, isError, error, refetch } = useGetExamBatchQuery(batchId);
  const [deleteExam] = useDeleteExamMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [editingExam, setEditingExam] = useState<{ id: number; title: string } | null>(null);

  if (editingExam) {
    return (
      <RoutineMcqEditor
        examId={editingExam.id}
        examTitle={editingExam.title}
        onBack={() => {
          setEditingExam(null);
          void refetch();
        }}
      />
    );
  }

  if (isLoading) return <PageLoader label="ব্যাচ লোড হচ্ছে..." />;
  if (isError || !batch) return <ErrorState message="ব্যাচ আনতে সমস্যা হচ্ছে।" error={error} />;

  const rows = [...batch.exams].sort((a, b) => a.ordering - b.ordering);

  const removeRow = async (item: ExamBatchExam) => {
    if (!confirm(`"${item.exam_title}" রুটিন থেকে মুছে ফেলতে চান? পরীক্ষাটি ও এর প্রশ্নগুলো মুছে যাবে।`)) return;
    // Deleting the exam cascades its batch link + questions. deleteExam only
    // invalidates the exam list, so refetch this batch to update the routine.
    await deleteExam(item.exam).unwrap().catch(() => {});
    void refetch();
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={onBack} className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-800 text-blue-50 hover:bg-white/5">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-blue-50">{batch.title}</h1>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${batch.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
                  {batch.is_published ? "প্রকাশিত" : "ড্রাফট"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {bn(batch.exam_count)} টি পরীক্ষা · {bn(batch.enrolled_count)} শিক্ষার্থী · ৳{Number(batch.price).toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowStudents((s) => !s)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-500/30 px-4 text-sm font-bold text-cyan-100 hover:bg-white/5">
              <Users size={16} /> শিক্ষার্থী
            </button>
            <button type="button" onClick={() => onEditBatch(batch)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-bold text-blue-50 hover:bg-white/5">
              <Pencil size={16} /> ব্যাচ এডিট
            </button>
          </div>
        </div>
      </section>

      {showStudents ? <EnrollmentPanel batchId={batchId} /> : null}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-blue-50">
            <CalendarClock size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">রুটিন ও পরীক্ষা</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <RoutineCsvImport batchId={batchId} onImported={() => {}} />
            <button type="button" onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
              <Plus size={16} /> ম্যানুয়ালি যোগ করুন
            </button>
          </div>
        </div>

        <div className="mt-5">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
              এই ব্যাচে এখনো কোনো রুটিন/পরীক্ষা যোগ করা হয়নি। CSV দিয়ে বা ম্যানুয়ালি যোগ করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs text-slate-400">
                  <tr className="border-b border-slate-800">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">বিষয় ও পরীক্ষা</th>
                    <th className="px-3 py-3">সময়সূচি</th>
                    <th className="px-3 py-3">প্রশ্ন</th>
                    <th className="px-3 py-3">অবস্থা</th>
                    <th className="px-3 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, index) => {
                    const deadline = formatDeadline(item);
                    const published = item.exam_status === "published";
                    return (
                      <tr key={item.id} className="border-b border-slate-800/60">
                        <td className="px-3 py-3 font-bold text-slate-500">{bn(index + 1)}</td>
                        <td className="px-3 py-3">
                          <p className="font-bold text-slate-100">{item.exam_title}</p>
                          {item.subject_label ? <p className="mt-0.5 text-xs text-cyan-300/80">{item.subject_label}</p> : null}
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <p>{formatSchedule(item)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {bn(item.duration_minutes)} মিনিট{deadline ? ` · ডেডলাইন ${deadline}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <p>
                            {bn(item.total_questions)}
                            {item.planned_questions ? `/${bn(item.planned_questions)}` : ""} প্রশ্ন
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            প্রতি প্রশ্ন {bn(item.marks_per_question)} নম্বর
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${published ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-400"}`}>
                            {published ? <CheckCircle2 size={12} /> : null}
                            {published ? "প্রকাশিত" : "ড্রাফট"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingExam({ id: item.exam, title: item.exam_title })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-100 hover:bg-blue-500/20"
                            >
                              <ListChecks size={14} /> MCQ যোগ / এডিট
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRow(item)}
                              className="grid size-9 place-items-center rounded-lg border border-red-600/40 bg-red-600/10 text-red-500 hover:bg-red-600/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showAdd ? (
        <AddRoutineExamModal
          batchId={batchId}
          onClose={() => setShowAdd(false)}
          onAdded={() => setShowAdd(false)}
        />
      ) : null}
    </div>
  );
}

function EnrollmentPanel({ batchId }: { batchId: number }) {
  const { data, isFetching, isError, error } = useGetExamBatchEnrollmentsQuery(batchId);
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center gap-2 text-blue-50">
        <Users size={18} />
        <h2 className="text-lg font-bold">ক্রয়কৃত / নিবন্ধিত শিক্ষার্থী</h2>
      </div>
      {isFetching ? (
        <p className="text-sm text-slate-400">শিক্ষার্থীর তালিকা লোড হচ্ছে...</p>
      ) : isError ? (
        <ErrorState message="নিবন্ধিত শিক্ষার্থীর তালিকা আনতে সমস্যা হচ্ছে।" error={error} />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-sm text-slate-400">এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি।</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3">শিক্ষার্থী</th>
                <th className="px-4 py-3">ইমেইল</th>
                <th className="px-4 py-3">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/60">
                  <td className="px-4 py-3 font-bold text-slate-100">{item.student_name || item.student}</td>
                  <td className="px-4 py-3 text-slate-400">{item.student_email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
                      <CheckCircle2 size={13} /> {item.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
